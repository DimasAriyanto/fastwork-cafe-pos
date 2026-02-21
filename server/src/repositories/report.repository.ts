import { db } from "../db/index";
import {
  transactions,
  transactionItems,
  payments,
  menus,
  categories,
} from "../db/schemas/index";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";

export class ReportRepository {
  /**
   * Get overall dashboard statistics for an outlet
   */
  async getDashboardStats(outletId: number) {
    // 1. Total Revenue (Paid Transactions)
    const revenueResult = await db
      .select({
        totalRevenue: sql<number>`sum(${transactions.totalPrice})`,
        count: sql<number>`count(${transactions.id})`,
      })
      .from(transactions)
      .where(and(
        eq(transactions.outletId, outletId),
        eq(transactions.paymentStatus, 'paid')
      ));

    // 2. Best Selling Menus
    const bestSelling = await db
      .select({
        menuName: menus.name,
        qty: sql<number>`sum(${transactionItems.qty})`,
        price: menus.price,
        image: menus.image,
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .innerJoin(menus, eq(transactionItems.menuId, menus.id))
      .where(and(
        eq(transactions.outletId, outletId),
        eq(transactions.paymentStatus, 'paid')
      ))
      .groupBy(menus.id)
      .orderBy(desc(sql`sum(${transactionItems.qty})`))
      .limit(5);

    return {
      totalRevenue: Number(revenueResult[0]?.totalRevenue || 0),
      totalTransactions: Number(revenueResult[0]?.count || 0),
      bestSelling,
    };
  }

  /**
   * Helper to format Date for MySQL (Local Time)
   */
  private formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Get revenue over time for charts
   */
  async getRevenueGraph(outletId: number, labelFormat: string, dateFormat: string, startDate: Date, endDate: Date) {
    const startStr = this.formatDate(startDate);
    const endStr = this.formatDate(endDate);

    const graphExpr = sql`DATE_FORMAT(${transactions.createdAt}, ${sql.raw(dateFormat)})`;

    const query = db
      .select({
        name: sql<string>`DATE_FORMAT(${transactions.createdAt}, ${sql.raw(labelFormat)})`,
        value: sql<number>`sum(${transactions.totalPrice})`,
        rawDate: graphExpr,
      })
      .from(transactions)
      .where(and(
        eq(transactions.outletId, outletId),
        eq(transactions.paymentStatus, 'paid'),
        gte(transactions.createdAt, sql`STR_TO_DATE(${startStr}, '%Y-%m-%d %H:%i:%s')`),
        lte(transactions.createdAt, sql`STR_TO_DATE(${endStr}, '%Y-%m-%d %H:%i:%s')`)
      ))
      .groupBy(graphExpr)
      .orderBy(graphExpr);

    return await query;
  }

  /**
   * Get financial summary (aggregated by day)
   */
  async getFinancialSummary(outletId: number, startDate: Date, endDate: Date) {
    const startStr = this.formatDate(startDate);
    const endStr = this.formatDate(endDate);

    return await db
      .select({
        tanggal: sql<string>`DATE_FORMAT(${transactions.createdAt}, '%d/%m/%y')`,
        totalTransaksi: sql<number>`count(${transactions.id})`,
        totalMenu: sql<number>`sum(${transactions.totalItems})`,
        pendapatan: sql<number>`sum(${transactions.totalPrice})`,
        laba: sql<number>`sum(${transactions.totalPrice}) * 0.6`,
      })
      .from(transactions)
      .where(and(
        eq(transactions.outletId, outletId),
        eq(transactions.paymentStatus, 'paid'),
        gte(transactions.createdAt, sql`STR_TO_DATE(${startStr}, '%Y-%m-%d %H:%i:%s')`),
        lte(transactions.createdAt, sql`STR_TO_DATE(${endStr}, '%Y-%m-%d %H:%i:%s')`)
      ))
      .groupBy(sql`DATE(${transactions.createdAt})`)
      .orderBy(desc(sql`DATE(${transactions.createdAt})`));
  }

  /**
   * Get sales grouped by category
   */
  async getSalesByCategory(outletId: number, startDate: Date, endDate: Date) {
    const startStr = this.formatDate(startDate);
    const endStr = this.formatDate(endDate);

    return await db
      .select({
        category: categories.name,
        sold: sql<number>`sum(${transactionItems.qty})`,
        gross: sql<number>`sum(${transactionItems.finalPrice} * ${transactionItems.qty})`,
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .innerJoin(menus, eq(transactionItems.menuId, menus.id))
      .innerJoin(categories, eq(menus.categoryId, categories.id))
      .where(and(
        eq(transactions.outletId, outletId),
        eq(transactions.paymentStatus, 'paid'),
        gte(transactions.createdAt, sql`STR_TO_DATE(${startStr}, '%Y-%m-%d %H:%i:%s')`),
        lte(transactions.createdAt, sql`STR_TO_DATE(${endStr}, '%Y-%m-%d %H:%i:%s')`)
      ))
      .groupBy(categories.id)
      .orderBy(desc(sql`sum(${transactionItems.qty})`));
  }

  /**
   * Get sales grouped by product
   */
  async getSalesByProduct(outletId: number, startDate: Date, endDate: Date) {
    const startStr = this.formatDate(startDate);
    const endStr = this.formatDate(endDate);

    return await db
      .select({
        product: menus.name,
        category: categories.name,
        sold: sql<number>`sum(${transactionItems.qty})`,
        gross: sql<number>`sum(${transactionItems.finalPrice} * ${transactionItems.qty})`,
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .innerJoin(menus, eq(transactionItems.menuId, menus.id))
      .innerJoin(categories, eq(menus.categoryId, categories.id))
      .where(and(
        eq(transactions.outletId, outletId),
        eq(transactions.paymentStatus, 'paid'),
        gte(transactions.createdAt, sql`STR_TO_DATE(${startStr}, '%Y-%m-%d %H:%i:%s')`),
        lte(transactions.createdAt, sql`STR_TO_DATE(${endStr}, '%Y-%m-%d %H:%i:%s')`)
      ))
      .groupBy(menus.id)
      .orderBy(desc(sql`sum(${transactionItems.qty})`));
  }
}
