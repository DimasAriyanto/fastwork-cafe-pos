import { db } from '../db';
import { transactions, transactionItems, transactionItemToppings, payments, menuStockHistory } from '../db/schemas/transactions';
import { eq, and, sql, desc, inArray, gte, lte } from 'drizzle-orm';
import { menus, toppings, menuVariants } from '../db/schemas/menu';
import { users } from '../db/schemas/auth';
import { employees } from '../db/schemas/hr';
import { taxes } from '../db/schemas/sales';

export interface CreateOrderParams {
  outletId: number;
  cashierId: number;
  customerName?: string;
  notes?: string;
  orderType?: string;
  createdBy: number;
  items: Array<{
    menuId: number;
    variantId?: number;
    qty: number;
    price: number;
    toppings?: { toppingId: number; price: number }[];
  }>;
  discountAmount?: number;
  manualDiscountType?: 'fixed' | 'percentage';
  manualDiscountValue?: number;
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
  manualDiscountType?: 'fixed' | 'percentage';
  manualDiscountValue?: number;
  discountAmount?: number;
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
        discountAmount: data.discountAmount || 0,
        manualDiscountType: data.manualDiscountType,
        manualDiscountValue: data.manualDiscountValue || 0,
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

      // 1. Calculate Discount (Moved up to calculate tax after discount)
      let discountAmount = data.discountAmount || 0;
      if (!data.discountAmount) {
        if (data.manualDiscountType === 'percentage') {
          discountAmount = Math.round(subtotal * ((data.manualDiscountValue || 0) / 100));
        } else if (data.manualDiscountType === 'fixed') {
          discountAmount = data.manualDiscountValue || 0;
        }
      }

      // 2. Calculate Total After Discount
      const totalAfterDiscount = subtotal - discountAmount;

      // 3. Dynamic Tax Logic (Calculated after discount)
      const activeTaxes = await tx.select().from(taxes).where(eq(taxes.isActive, true));
      
      const taxDetails = activeTaxes.map(t => ({
        name: t.name,
        percentage: parseFloat(t.percentage.toString()),
        amount: Math.round(totalAfterDiscount * (parseFloat(t.percentage.toString()) / 100))
      }));

      const taxAmount = taxDetails.reduce((sum, t) => sum + t.amount, 0);
      const finalTotalPrice = totalAfterDiscount + taxAmount;

      // 4. INSERT header
      const [trxResult] = await tx.insert(transactions).values({
        outletId: data.outletId,
        cashierId: data.cashierId,
        subtotal,
        taxAmount,
        totalPrice: finalTotalPrice,
        taxDetails: JSON.stringify(taxDetails),
        serviceChargeAmount: 0,
        discountAmount,
        manualDiscountType: data.manualDiscountType,
        manualDiscountValue: data.manualDiscountValue || 0,
        status: 'pending',
        paymentStatus: 'unpaid',
        totalItems: data.items.reduce((acc, curr) => acc + curr.qty, 0),
        orderType: data.orderType || 'dine_in',
        notes: data.notes || data.customerName,
        createdBy: data.createdBy,
      });

      const transactionId = trxResult.insertId;

      // 5. INSERT items
      for (const item of mappedItems) {
        // unitPriceIncludingToppings is (base price + toppings)
        const unitPrice = item.unitPrice; 
        const lineTotal = unitPrice * item.qty;
        
        const [itemRes] = await tx.insert(transactionItems).values({
          transactionId,
          menuId: item.menuId,
          variantId: item.variantId || null,
          qty: item.qty,
          originalPrice: item.price, // Base price
          subTotal: lineTotal,       // Line total (unit * qty)
          finalPrice: unitPrice,     // Unit price (base + toppings)
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

  // Update a PENDING order (belum dibayar)
  async updateOrder(transactionId: number, data: CreateOrderParams): Promise<void> {
    await db.transaction(async (tx) => {
      // 1. Verify existence and status
      const [existing] = await tx.select().from(transactions).where(eq(transactions.id, transactionId));
      if (!existing) throw new Error('Transaksi tidak ditemukan');
      if (existing.paymentStatus === 'paid') throw new Error('Tidak bisa mengubah transaksi yang sudah lunas');

      // 2. Calculate new subtotal
      let subtotal = 0;
      const mappedItems = data.items.map((item) => {
        const toppingsTotal = item.toppings?.reduce((acc, t) => acc + Number(t.price), 0) || 0;
        const unitPrice = Number(item.price) + toppingsTotal;
        subtotal += unitPrice * item.qty;
        return { ...item, unitPrice };
      });

      // 3. Calculate Discount
      let discountAmount = data.discountAmount || 0;
      if (!data.discountAmount) {
        if (data.manualDiscountType === 'percentage') {
          discountAmount = Math.round(subtotal * ((data.manualDiscountValue || 0) / 100));
        } else if (data.manualDiscountType === 'fixed') {
          discountAmount = data.manualDiscountValue || 0;
        }
      }

      // 4. Calculate Total After Discount
      const totalAfterDiscount = subtotal - discountAmount;

      // 5. Dynamic Tax Logic (Calculated after discount)
      const activeTaxes = await tx.select().from(taxes).where(eq(taxes.isActive, true));
      const taxDetails = activeTaxes.map(t => ({
        name: t.name,
        percentage: parseFloat(t.percentage.toString()),
        amount: Math.round(totalAfterDiscount * (parseFloat(t.percentage.toString()) / 100))
      }));
      const taxAmount = taxDetails.reduce((sum, t) => sum + t.amount, 0);
      const finalTotalPrice = totalAfterDiscount + taxAmount;

      // 4. Update Header
      await tx.update(transactions)
        .set({
          subtotal,
          taxAmount,
          totalPrice: finalTotalPrice,
          taxDetails: JSON.stringify(taxDetails),
          discountAmount,
          manualDiscountType: data.manualDiscountType,
          manualDiscountValue: data.manualDiscountValue || 0,
          totalItems: data.items.reduce((acc, curr) => acc + curr.qty, 0),
          orderType: data.orderType || existing.orderType,
          notes: data.notes || existing.notes,
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, transactionId));

      // 5. Clear old items and toppings
      const oldItems = await tx.select({ id: transactionItems.id }).from(transactionItems).where(eq(transactionItems.transactionId, transactionId));
      const oldItemIds = oldItems.map(i => i.id);
      
      if (oldItemIds.length > 0) {
        await tx.delete(transactionItemToppings).where(inArray(transactionItemToppings.transactionItemId, oldItemIds));
        await tx.delete(transactionItems).where(eq(transactionItems.transactionId, transactionId));
      }

      // 6. Insert new items
      for (const item of mappedItems) {
        const unitPrice = item.unitPrice;
        const lineTotal = unitPrice * item.qty;
        
        const [itemRes] = await tx.insert(transactionItems).values({
          transactionId,
          menuId: item.menuId,
          variantId: item.variantId || null,
          qty: item.qty,
          originalPrice: item.price,
          subTotal: lineTotal,
          finalPrice: unitPrice,
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
    });
  }

  // Delete a pending order
  async deleteTransaction(transactionId: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Toppings will be deleted via cascade on transaction_items
      // Transaction items will be deleted via cascade on transactions
      await tx.delete(transactions).where(eq(transactions.id, transactionId));
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
  async getUnpaidOrders(outletId: number, cashierId?: number) {
    const orders = await db.select({
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
      cashierId ? eq(transactions.cashierId, cashierId) : sql`1=1`,
    ))
    .orderBy(desc(transactions.createdAt));

    if (orders.length === 0) return [];

    const orderIds = orders.map(o => o.id);
    const allItems = await db.select({
      transactionId: transactionItems.transactionId,
      name: menus.name,
      qty: transactionItems.qty,
      price: transactionItems.finalPrice,
    })
    .from(transactionItems)
    .leftJoin(menus, eq(transactionItems.menuId, menus.id))
    .where(inArray(transactionItems.transactionId, orderIds));

    return orders.map(o => ({
      ...o,
      items: allItems.filter(i => i.transactionId === o.id)
    }));
  }

  async findAll(options: { 
    outletId: number; 
    cashierId?: number; 
    paymentStatus?: string;
    limit?: number; 
    page?: number; 
    startDate?: Date; 
    endDate?: Date 
  }) {
    const filters = [eq(transactions.outletId, options.outletId)];
    
    if (options.cashierId) filters.push(eq(transactions.cashierId, options.cashierId));
    if (options.paymentStatus) filters.push(eq(transactions.paymentStatus, options.paymentStatus));
    if (options.startDate) filters.push(gte(transactions.createdAt, options.startDate));
    if (options.endDate) filters.push(lte(transactions.createdAt, options.endDate));

    const query = db
      .select({
        id: transactions.id,
        subtotal: transactions.subtotal,
        taxAmount: transactions.taxAmount,
        discountAmount: transactions.discountAmount,
        totalPrice: transactions.totalPrice,
        paymentStatus: transactions.paymentStatus,
        status: transactions.status,
        createdAt: transactions.createdAt,
        notes: transactions.notes,
        totalItems: transactions.totalItems,
        orderType: transactions.orderType,
        cashierName: users.name,
        employeeName: employees.name,
        manualDiscountType: transactions.manualDiscountType,
        manualDiscountValue: transactions.manualDiscountValue,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.createdBy, users.id))
      .leftJoin(employees, eq(transactions.cashierId, employees.id))
      .where(and(...filters))
      .orderBy(desc(transactions.createdAt));

    if (options.limit && options.page) {
      query.limit(options.limit).offset((options.page - 1) * options.limit);
    }

    return await query;
  }

  async findById(id: number) {
    const [trx] = await db
      .select({
        id: transactions.id,
        subtotal: transactions.subtotal,
        taxAmount: transactions.taxAmount,
        discountAmount: transactions.discountAmount,
        totalPrice: transactions.totalPrice,
        status: transactions.status,
        paymentStatus: transactions.paymentStatus,
        totalItems: transactions.totalItems,
        orderType: transactions.orderType,
        notes: transactions.notes,
        createdAt: transactions.createdAt,
        taxDetails: transactions.taxDetails,
        manualDiscountType: transactions.manualDiscountType,
        manualDiscountValue: transactions.manualDiscountValue,
        cashierName: users.name,
        employeeName: employees.name,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.createdBy, users.id))
      .leftJoin(employees, eq(transactions.cashierId, employees.id))
      .where(eq(transactions.id, id));

    if (!trx) return null;

    // 2. AMBIL ITEMS DENGAN TOPPINGS
    const rawItems = await db
      .select({
        id: transactionItems.id,
        menuId: transactionItems.menuId,
        menuName: menus.name,
        qty: transactionItems.qty,
        originalPrice: transactionItems.originalPrice,
        finalPrice: transactionItems.finalPrice,
        subTotal: transactionItems.subTotal,
        variantName: menuVariants.name,
      })
      .from(transactionItems)
      .leftJoin(menus, eq(transactionItems.menuId, menus.id))
      .leftJoin(menuVariants, eq(transactionItems.variantId, menuVariants.id))
      .where(eq(transactionItems.transactionId, id));

    const itemIds = rawItems.map((i) => i.id);
    const allToppings = itemIds.length > 0 
      ? await db
          .select({
            transactionItemId: transactionItemToppings.transactionItemId,
            name: toppings.name,
            price: transactionItemToppings.price,
          })
          .from(transactionItemToppings)
          .leftJoin(toppings, eq(transactionItemToppings.toppingId, toppings.id))
          .where(inArray(transactionItemToppings.transactionItemId, itemIds))
      : [];

    const itemsWithTopping = rawItems.map((item) => {
      const myToppings = allToppings.filter((t) => t.transactionItemId === item.id);
      
      // Susun nama display: "Menu (Varian) + Topping1, Topping2"
      let displayName = item.menuName;
      if (item.variantName) displayName += ` (${item.variantName})`;

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

    let parsedTaxDetails = [];
    try {
      parsedTaxDetails = trx.taxDetails ? JSON.parse(trx.taxDetails) : [];
    } catch (e) {
      console.error("Failed to parse taxDetails:", e);
    }

    return {
      ...trx,
      taxDetails: parsedTaxDetails,
      paymentMethod: primaryPayment.paymentMethod, 
      paidAmount: primaryPayment.amountPaid,
      changeAmount: primaryPayment.changeAmount,
      
      items: itemsWithTopping, // (Anggap items sudah diproses dengan topping)
      payments: paymentInfo, // List lengkap history pembayaran
    };
  }
}