import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './auth.ts';
import { outlets } from './organization.ts';
import { tables } from './organization.ts';
import { employees } from './hr.ts';
import { menus } from './menu.ts';
import { discounts } from './sales.ts';

export const transactions = pgTable(
  'transactions',
  {
    id: serial('id').primaryKey(),
    outletId: integer('outlet_id')
      .notNull()
      .references(() => outlets.id, { onDelete: 'restrict' }),
    tableId: integer('table_id').references(() => tables.id, { onDelete: 'set null' }),
    cashierId: integer('cashier_id').references(() => employees.id, { onDelete: 'set null' }),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    serviceChargeAmount: decimal('service_charge_amount', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('unpaid'),
    totalItems: integer('total_items').notNull().default(0),
    orderType: varchar('order_type', { length: 50 }).default('dine_in'),
    notes: text('notes'),
    createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      outletIdx: index('idx_transactions_outlet').on(table.outletId),
      cashierIdx: index('idx_transactions_cashier').on(table.cashierId),
      tableIdx: index('idx_transactions_table').on(table.tableId),
      statusIdx: index('idx_transactions_status_date').on(table.status, table.createdAt),
      paymentStatusIdx: index('idx_transactions_payment_status').on(
        table.paymentStatus,
        table.createdAt,
      ),
      createdAtIdx: index('idx_transactions_created_at_desc').on(table.createdAt),
    };
  },
);

export const transactionItems = pgTable(
  'transaction_items',
  {
    id: serial('id').primaryKey(),
    transactionId: integer('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    menuId: integer('menu_id')
      .notNull()
      .references(() => menus.id, { onDelete: 'restrict' }),
    qty: integer('qty').notNull(),
    subTotal: decimal('sub_total', { precision: 10, scale: 2 }).notNull(),
    originalPrice: decimal('original_price', { precision: 10, scale: 2 }).notNull(),
    discountId: integer('discount_id').references(() => discounts.id, { onDelete: 'set null' }),
    discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }).default('0'),
    finalPrice: decimal('final_price', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      transactionIdx: index('idx_transaction_items_transaction').on(table.transactionId),
      menuIdx: index('idx_transaction_items_menu').on(table.menuId),
    };
  },
);

export const payments = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    transactionId: integer('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    paymentSequence: integer('payment_sequence').notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('cash'), // 'cash', 'card', 'qris', 'other'
    amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).notNull(),
    changeAmount: decimal('change_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    status: varchar('status', { length: 50 }).notNull().default('completed'),
    notes: text('notes'),
    createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      transactionIdx: index('idx_payments_transaction').on(table.transactionId),
      methodIdx: index('idx_payments_method_date').on(table.paymentMethod, table.createdAt),
      statusIdx: index('idx_payments_status').on(table.status),
    };
  },
);

export const menuStockHistory = pgTable('menu_stock_history', {
  id: serial('id').primaryKey(),
  menuId: integer('menu_id')
    .notNull()
    .references(() => menus.id, { onDelete: 'cascade' }),
  changeType: varchar('change_type', { length: 20 }).notNull(),
  quantityChange: integer('quantity_change').notNull(),
  finalStock: integer('final_stock').notNull(),
  transactionId: integer('transaction_id').references(() => transactions.id, {
    onDelete: 'set null',
  }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
