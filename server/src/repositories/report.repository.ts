import { db } from "../db/index";
import {
  transactions,
  transactionItems,
  payments,
  menus,
  categories,
  employees,
} from "../db/schemas/index";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";

export interface ReportFilters {
  start?: Date;
  end?: Date;
  cashierName?: string;
  orderType?: string;
  paymentMethod?: string;
}

export class ReportRepository {
  /**
   * Get overall dashboard statistics for an outlet
   */
  async getDashboardStats(outletId: number) {
    // 1. Total Revenue (Paid Transactions)
    const revenueResult = await db
      .select({
        totalRevenue: sql<number>`sum(${transactions.totalPrice})`,
        totalTax: sql<number>`sum(${transactions.taxAmount})`,
        totalDiscount: sql<number>`sum(${transactions.discountAmount})`,
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
      totalTax: Number(revenueResult[0]?.totalTax || 0),
      totalDiscount: Number(revenueResult[0]?.totalDiscount || 0),
      totalTransactions: Number(revenueResult[0]?.count || 0),
      bestSelling,
    };
  }

  /**
   * Helper to build where clause with optional filters
   */
  private buildWhereClause(outletId: number, filters?: ReportFilters) {
    const conditions = [
      eq(transactions.outletId, outletId),
      eq(transactions.paymentStatus, 'paid')
    ];

    if (filters?.start) {
      const startStr = this.formatDate(filters.start);
      conditions.push(gte(transactions.createdAt, sql`STR_TO_DATE(${startStr}, '%Y-%m-%d %H:%i:%s')`));
    }

    if (filters?.end) {
      const endStr = this.formatDate(filters.end);
      conditions.push(lte(transactions.createdAt, sql`STR_TO_DATE(${endStr}, '%Y-%m-%d %H:%i:%s')`));
    }

    if (filters?.cashierName && filters.cashierName !== 'all') {
      conditions.push(eq(employees.name, filters.cashierName));
    }

    if (filters?.orderType && filters.orderType !== 'all') {
      conditions.push(eq(transactions.orderType, filters.orderType));
    }

    if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
      conditions.push(eq(payments.paymentMethod, filters.paymentMethod));
    }

    return and(...conditions);
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
  /**
   * Get revenue over time for charts
   */
  async getRevenueGraph(outletId: number, labelFormat: string, dateFormat: string, filters: ReportFilters) {
    const graphExpr = sql`DATE_FORMAT(${transactions.createdAt}, ${sql.raw(dateFormat)})`;

    let query = db
      .select({
        name: sql<string>`DATE_FORMAT(${transactions.createdAt}, ${sql.raw(labelFormat)})`,
        value: sql<number>`sum(${transactions.totalPrice})`,
        rawDate: graphExpr,
      })
      .from(transactions)
      .$dynamic();

    if (filters.cashierName && filters.cashierName !== 'all') {
      query = query.leftJoin(employees, eq(transactions.cashierId, employees.id)) as any;
    }
    
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      query = query.leftJoin(payments, eq(transactions.id, payments.transactionId)) as any;
    }

    return await query
      .where(this.buildWhereClause(outletId, filters))
      .groupBy(graphExpr)
      .orderBy(graphExpr);
  }

  /**
   * Get financial summary (aggregated by day)
   */
  async getFinancialSummary(outletId: number, filters: ReportFilters) {
    let query = db
      .select({
        tanggal: sql<string>`DATE_FORMAT(${transactions.createdAt}, '%d/%m/%y')`,
        totalTransaksi: sql<number>`count(${transactions.id})`,
        totalMenu: sql<number>`sum(${transactions.totalItems})`,
        pendapatan: sql<number>`sum(${transactions.totalPrice})`,
        diskon: sql<number>`sum(${transactions.discountAmount})`,
        pajak: sql<number>`sum(${transactions.taxAmount})`,
        laba: sql<number>`sum(${transactions.totalPrice}) * 0.6`,
      })
      .from(transactions)
      .$dynamic();

    if (filters.cashierName && filters.cashierName !== 'all') {
      query = query.leftJoin(employees, eq(transactions.cashierId, employees.id)) as any;
    }
    
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      query = query.leftJoin(payments, eq(transactions.id, payments.transactionId)) as any;
    }

    return await query
      .where(this.buildWhereClause(outletId, filters))
      .groupBy(sql`DATE(${transactions.createdAt})`)
      .orderBy(desc(sql`DATE(${transactions.createdAt})`));
  }

  /**
   * Get sales grouped by category
   */
  async getSalesByCategory(outletId: number, filters: ReportFilters) {
    let query = db
      .select({
        category: categories.name,
        sold: sql<number>`sum(${transactionItems.qty})`,
        gross: sql<number>`sum(${transactionItems.finalPrice} * ${transactionItems.qty})`,
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .innerJoin(menus, eq(transactionItems.menuId, menus.id))
      .innerJoin(categories, eq(menus.categoryId, categories.id))
      .$dynamic();

    if (filters.cashierName && filters.cashierName !== 'all') {
      query = query.leftJoin(employees, eq(transactions.cashierId, employees.id)) as any;
    }
    
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      query = query.leftJoin(payments, eq(transactions.id, payments.transactionId)) as any;
    }

    return await query
      .where(this.buildWhereClause(outletId, filters))
      .groupBy(categories.id)
      .orderBy(desc(sql`sum(${transactionItems.qty})`));
  }

  /**
   * Get sales grouped by product
   */
  async getSalesByProduct(outletId: number, filters: ReportFilters) {
    let query = db
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
      .$dynamic();

    if (filters.cashierName && filters.cashierName !== 'all') {
      query = query.leftJoin(employees, eq(transactions.cashierId, employees.id)) as any;
    }
    
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      query = query.leftJoin(payments, eq(transactions.id, payments.transactionId)) as any;
    }

    return await query
      .where(this.buildWhereClause(outletId, filters))
      .groupBy(menus.id)
      .orderBy(desc(sql`sum(${transactionItems.qty})`));
  }
}
