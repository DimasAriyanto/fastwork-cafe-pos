import { db } from "../db/index";
import {
  transactions,
  transactionItems,
  transactionItemToppings,
  payments, // 👈 Pastikan ini diimport
  menuStockHistory,
  menus,
  toppings,
  users,
  menuVariants,
} from "../db/schemas/index";
import { eq, sql, desc, inArray } from "drizzle-orm";

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
        orderType: "dine_in",
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

  // --- Find All & Find By ID (Diupdate untuk join payments) ---


  async findAll(options: { outletId: number; limit?: number; page?: number }) {
    const { outletId, limit = 20, page = 1 } = options;
    const offset = (Math.max(page, 1) - 1) * limit;

    const data = await db
      .select({
        id: transactions.id,
        customerInfo: transactions.notes,
        totalPrice: transactions.totalPrice,
        
        // 👇 TAMBAHKAN INI AGAR ITEM TERJUAL MUNCUL
        totalItems: transactions.totalItems, 
        
        // 👇 Tambahkan ini juga biar perhitungan profit di frontend akurat
        subtotal: transactions.subtotal, 
        taxAmount: transactions.taxAmount,

        paymentStatus: transactions.paymentStatus,
        status: transactions.status,
        createdAt: transactions.createdAt,
        cashierName: users.name,
        paymentMethod: sql<string>`(
            SELECT payment_method FROM payments 
            WHERE payments.transaction_id = transactions.id 
            LIMIT 1
        )`,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.cashierId, users.id))
      .where(eq(transactions.outletId, outletId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    return data;
  }

  async findById(id: number) {
    // 1. Ambil Header
    const [trx] = await db.select().from(transactions).where(eq(transactions.id, id));
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