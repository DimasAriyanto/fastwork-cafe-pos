import { db } from "../db/index";
import {
  transactions,
  transactionItems,
  transactionItemToppings,
  payments,
  menuStockHistory,
  menus,
  toppings,
  users,
  menuVariants,
  employees,
} from "../db/schemas/index";
import { eq, sql, desc, inArray, and, gte, lte } from "drizzle-orm";

// Interface for creating a PENDING order (no payment yet)
export interface CreateOrderParams {
  outletId: number;
  cashierId: number; // employee id of cashier
  createdBy: number; // user id
  customerName?: string;
  notes?: string;
  orderType?: string;
  items: Array<{
    menuId: number;
    variantId?: number;
    qty: number;
    price: number;
    toppings?: { toppingId: number; price: number }[];
  }>;
}

// Interface Parameter (Sudah mencakup semua)
export interface CreateTransactionParams {
  outletId: number;
  cashierId: number;
  customerName?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: string;
  notes?: string;
  items: Array<{
    menuId: number;
    variantId?: number;
    qty: number;
    price: number;
    discount?: number;
    toppings?: { toppingId: number; price: number }[];
  }>;
}

export class TransactionRepository {

  async createTransaction(data: CreateTransactionParams) {
    return await db.transaction(async (tx) => {
      
      // 1. INSERT HEADER (transactions)
      const [trxResult] = await tx.insert(transactions).values({
        outletId: data.outletId,
        cashierId: data.cashierId,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        totalPrice: data.totalAmount,
        serviceChargeAmount: 0,
        discountAmount: 0,
        status: "completed",
        paymentStatus: "paid", // Status transaksi lunas
        totalItems: data.items.reduce((acc, curr) => acc + curr.qty, 0),
        orderType: (data as any).orderType || "dine_in",
        notes: data.notes,
        createdBy: data.cashierId,
      });

      const transactionId = trxResult.insertId;

      // 2. INSERT ITEMS & TOPPINGS (transaction_items)
      for (const item of data.items) {
        const lineTotal = item.price * item.qty;

        const [itemRes] = await tx.insert(transactionItems).values({
          transactionId: transactionId,
          menuId: item.menuId,
          variantId: item.variantId || null,
          qty: item.qty,
          originalPrice: item.price,
          subTotal: lineTotal,
          finalPrice: lineTotal,
          discountPercentage: 0,
        });

        const transactionItemId = itemRes.insertId;

        // Insert Toppings
        if (item.toppings && item.toppings.length > 0) {
          for (const topping of item.toppings) {
            await tx.insert(transactionItemToppings).values({
              transactionItemId: transactionItemId,
              toppingId: topping.toppingId,
              price: topping.price,
            });
          }
        }

        // 3. POTONG STOK & AUDIT LOG
        await tx.update(menus)
          .set({ currentStock: sql`${menus.currentStock} - ${item.qty}` })
          .where(eq(menus.id, item.menuId));

        await tx.insert(menuStockHistory).values({
          menuId: item.menuId,
          transactionId: transactionId,
          changeType: "sold",
          quantityChange: -item.qty,
          finalStock: 0, 
          notes: `Trx #${transactionId}`,
        });
      }

      // 4. INSERT PAYMENTS (Integrasi Baru) 👈
      // Menghitung kembalian: Uang diterima - Total Tagihan
      const changeAmount = data.paidAmount - data.totalAmount;

      await tx.insert(payments).values({
        transactionId: transactionId,
        paymentSequence: 1, // Pembayaran pertama (karena ini POS langsung lunas)
        paymentMethod: data.paymentMethod, // 'CASH', 'QRIS', dll
        amountPaid: data.paidAmount,
        changeAmount: changeAmount < 0 ? 0 : changeAmount, // Hindari negatif jika error logic
        status: "completed",
        notes: "Pembayaran Langsung",
        createdBy: data.cashierId,
      });

      return transactionId;
    });
  }

  // Create a PENDING order (belum dibayar)
  async createOrder(data: CreateOrderParams): Promise<number> {
    return await db.transaction(async (tx) => {
      // Calculate subtotal
      let subtotal = 0;
      const mappedItems = data.items.map((item) => {
        const toppingsTotal = item.toppings?.reduce((acc, t) => acc + Number(t.price), 0) || 0;
        const unitPrice = Number(item.price) + toppingsTotal;
        subtotal += unitPrice * item.qty;
        return { ...item, unitPrice };
      });

      const taxRate = 0.11;
      const taxAmount = Math.round(subtotal * taxRate);
      const totalPrice = subtotal + taxAmount;

      // 1. INSERT header
      const [trxResult] = await tx.insert(transactions).values({
        outletId: data.outletId,
        cashierId: data.cashierId,
        subtotal,
        taxAmount,
        totalPrice,
        serviceChargeAmount: 0,
        discountAmount: 0,
        status: 'pending',
        paymentStatus: 'unpaid',
        totalItems: data.items.reduce((acc, curr) => acc + curr.qty, 0),
        orderType: data.orderType || 'dine_in',
        notes: data.notes || data.customerName,
        createdBy: data.createdBy,
      });

      const transactionId = trxResult.insertId;

      // 2. INSERT items
      for (const item of mappedItems) {
        const lineTotal = Number(item.price) * item.qty;
        const [itemRes] = await tx.insert(transactionItems).values({
          transactionId,
          menuId: item.menuId,
          variantId: item.variantId || null,
          qty: item.qty,
          originalPrice: item.price,
          subTotal: lineTotal,
          finalPrice: lineTotal,
          discountPercentage: 0,
        });
        const transactionItemId = itemRes.insertId;
        if (item.toppings && item.toppings.length > 0) {
          for (const topping of item.toppings) {
            await tx.insert(transactionItemToppings).values({
              transactionItemId,
              toppingId: topping.toppingId,
              price: topping.price,
            });
          }
        }
      }

      return transactionId;
    });
  }

  // Pay a pending order (update status + insert payment record)
  async payOrder(transactionId: number, paymentMethod: string, paidAmount: number, userId: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Fetch current transaction to get totalPrice
      const [trx] = await tx.select().from(transactions).where(eq(transactions.id, transactionId));
      if (!trx) throw new Error('Transaksi tidak ditemukan');
      if (trx.paymentStatus === 'paid') throw new Error('Transaksi sudah dibayar');

      const changeAmount = paidAmount - trx.totalPrice;
      if (changeAmount < 0) throw new Error(`Pembayaran kurang. Total: ${trx.totalPrice}, Dibayar: ${paidAmount}`);

      // Update transaction status
      await tx.update(transactions)
        .set({ paymentStatus: 'paid', status: 'completed', updatedAt: new Date() })
        .where(eq(transactions.id, transactionId));

      // Insert payment record
      await tx.insert(payments).values({
        transactionId,
        paymentSequence: 1,
        paymentMethod,
        amountPaid: paidAmount,
        changeAmount: changeAmount < 0 ? 0 : changeAmount,
        status: 'completed',
        notes: 'Pembayaran Kasir',
        createdBy: userId,
      });

      // Deduct stock for each item
      const items = await tx.select().from(transactionItems).where(eq(transactionItems.transactionId, transactionId));
      for (const item of items) {
        await tx.update(menus)
          .set({ currentStock: sql`${menus.currentStock} - ${item.qty}` })
          .where(eq(menus.id, item.menuId));
        await tx.insert(menuStockHistory).values({
          menuId: item.menuId,
          transactionId,
          changeType: 'sold',
          quantityChange: -item.qty,
          finalStock: 0,
          notes: `Trx #${transactionId} - PAID`,
        });
      }
    });
  }

  // Get unpaid orders
  async getUnpaidOrders(outletId: number) {
    return await db.select({
      id: transactions.id,
      customerName: transactions.notes,
      subtotal: transactions.subtotal,
      taxAmount: transactions.taxAmount,
      totalPrice: transactions.totalPrice,
      totalItems: transactions.totalItems,
      orderType: transactions.orderType,
      paymentStatus: transactions.paymentStatus,
      status: transactions.status,
      createdAt: transactions.createdAt,
      cashierName: users.name,
      cashierId: transactions.cashierId,
      employeeName: employees.name,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.createdBy, users.id))
    .leftJoin(employees, eq(transactions.cashierId, employees.id))
    .where(and(
      eq(transactions.outletId, outletId),
      eq(transactions.paymentStatus, 'unpaid'),
    ))
    .orderBy(desc(transactions.createdAt));
  }

  async findAll(options: { outletId: number; limit?: number; page?: number; startDate?: Date; endDate?: Date }) {
    const { outletId, limit = 20, page = 1, startDate, endDate } = options;
    const offset = (Math.max(page, 1) - 1) * limit;

    const data = await db
      .select({
        id: transactions.id,
        customerName: transactions.notes, // Map notes to customerName for consistency
        totalPrice: transactions.totalPrice,
        totalItems: transactions.totalItems,
        subtotal: transactions.subtotal,
        taxAmount: transactions.taxAmount,
        paymentStatus: transactions.paymentStatus,
        status: transactions.status,
        createdAt: transactions.createdAt,
        employeeName: employees.name, // Match frontend property name
        paymentMethod: payments.paymentMethod,
        paidAmount: payments.amountPaid,
        changeAmount: payments.changeAmount,
      })
      .from(transactions)
      .leftJoin(employees, eq(transactions.cashierId, employees.id))
      .leftJoin(payments, eq(transactions.id, payments.transactionId))
      .where(and(
        eq(transactions.outletId, outletId),
        startDate ? gte(transactions.createdAt, startDate) : sql`1=1`,
        endDate ? lte(transactions.createdAt, endDate) : sql`1=1`
      ))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    return data;
  }

  async findById(id: number) {
    // 1. Ambil Header
    // 1. Ambil Header + Employee Name
    const [trx] = await db
      .select({
        id: transactions.id,
        outletId: transactions.outletId,
        tableId: transactions.tableId,
        cashierId: transactions.cashierId,
        subtotal: transactions.subtotal,
        taxAmount: transactions.taxAmount,
        serviceChargeAmount: transactions.serviceChargeAmount,
        discountAmount: transactions.discountAmount,
        totalPrice: transactions.totalPrice,
        status: transactions.status,
        paymentStatus: transactions.paymentStatus,
        totalItems: transactions.totalItems,
        orderType: transactions.orderType,
        notes: transactions.notes,
        customerId: transactions.customerId,
        createdBy: transactions.createdBy,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        employeeName: employees.name,
      })
      .from(transactions)
      .leftJoin(employees, eq(transactions.cashierId, employees.id))
      .where(eq(transactions.id, id));
    if (!trx) return null;

    // 2. Ambil Items & Toppings (Logic sama seperti sebelumnya)
    const items = await db.select({ /* ...field item... */ 
        id: transactionItems.id,
        menuId: transactionItems.menuId,
        qty: transactionItems.qty,
        price: transactionItems.finalPrice,
        subTotal: transactionItems.subTotal,
        name: menus.name,
        variantName: menuVariants.name,
    })
    .from(transactionItems)
    .leftJoin(menus, eq(transactionItems.menuId, menus.id))
    .leftJoin(menuVariants, eq(transactionItems.variantId, menuVariants.id))
    .where(eq(transactionItems.transactionId, id));

    const itemIds = items.map((i) => i.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let toppingsData: any[] = [];

    if (itemIds.length > 0) {
      toppingsData = await db
        .select({
          id: transactionItemToppings.id,
          transactionItemId: transactionItemToppings.transactionItemId,
          toppingId: transactionItemToppings.toppingId,
          name: toppings.name,
          price: transactionItemToppings.price,
        })
        .from(transactionItemToppings)
        .leftJoin(toppings, eq(transactionItemToppings.toppingId, toppings.id))
        .where(inArray(transactionItemToppings.transactionItemId, itemIds));
    }

    const itemsWithTopping = items.map((item) => {
      const myToppings = toppingsData.filter(
        (t) => t.transactionItemId === item.id
      );

      const displayName = item.variantName
        ? `${item.name} (${item.variantName})`
        : item.name;

      return {
        ...item,
        name: displayName,
        subTotal: item.subTotal,
        toppings: myToppings,
      };
    });
    
    // 3. AMBIL DETAIL PEMBAYARAN 👈
    const paymentInfo = await db
      .select()
      .from(payments)
      .where(eq(payments.transactionId, id));

    // Jika payment info ada, kita attach ke response
    // Biasanya ambil payment pertama untuk ditampilkan di struk sederhana
    const primaryPayment = paymentInfo[0] || {};

    return {
      ...trx,
      // Tambahkan info pembayaran ke root object return agar mudah diakses frontend
      paymentMethod: primaryPayment.paymentMethod, 
      paidAmount: primaryPayment.amountPaid,
      changeAmount: primaryPayment.changeAmount,
      
      items: itemsWithTopping, // (Anggap items sudah diproses dengan topping)
      payments: paymentInfo, // List lengkap history pembayaran
    };
  }
}