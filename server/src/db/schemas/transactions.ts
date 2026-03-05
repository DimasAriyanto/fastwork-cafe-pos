import { 
  mysqlTable, 
  int, 
  varchar, 
  text, 
  timestamp,
  index, 
  foreignKey
} from 'drizzle-orm/mysql-core';
import { users } from './auth';
import { outlets, tables } from './organization';
import { employees } from './hr';
import { menus, menuVariants, toppings } from './menu';
import { discounts } from './sales';
import { customers } from './customers';

export const transactions = mysqlTable('transactions', {
  id: int('id').autoincrement().primaryKey(),
  outletId: int('outlet_id')
    .notNull()
    .references(() => outlets.id, { onDelete: 'restrict' }),
  tableId: int('table_id').references(() => tables.id, { onDelete: 'set null' }),
  cashierId: int('cashier_id').references(() => employees.id, { onDelete: 'set null' }),
  subtotal: int('subtotal').notNull(),
  taxAmount: int('tax_amount').notNull().default(0),
  serviceChargeAmount: int('service_charge_amount')
    .notNull()
    .default(0),
  discountAmount: int('discount_amount').notNull().default(0),
  totalPrice: int('total_price').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('unpaid'),
  totalItems: int('total_items').notNull().default(0),
  orderType: varchar('order_type', { length: 50 }).default('dine_in'),
  notes: text('notes'),
  customerId: int('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  customerName: varchar('customer_name', { length: 255 }),
  createdBy: int('created_by').references(() => users.id, { onDelete: 'set null' }),
  taxDetails: text('tax_details'), // Stores JSON string of tax breakdown
  manualDiscountType: varchar('manual_discount_type', { length: 20 }),
  manualDiscountValue: int('manual_discount_value').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  outletIdx: index('idx_transactions_outlet').on(table.outletId),
  cashierIdx: index('idx_transactions_cashier').on(table.cashierId),
  tableIdx: index('idx_transactions_table').on(table.tableId),
  statusIdx: index('idx_transactions_status_date').on(table.status, table.createdAt),
  customerIdx: index('idx_transactions_customer').on(table.customerId),
  paymentStatusIdx: index('idx_transactions_payment_status').on(table.paymentStatus, table.createdAt),
  createdAtIdx: index('idx_transactions_created_at_desc').on(table.createdAt),
}));

export const transactionItems = mysqlTable('transaction_items', {
  id: int('id').autoincrement().primaryKey(),
  transactionId: int('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  menuId: int('menu_id')
    .notNull()
    .references(() => menus.id, { onDelete: 'restrict' }),
  variantId: int('variant_id').references(() => menuVariants.id, { onDelete: 'set null' }),
  qty: int('qty').notNull(),
  subTotal: int('sub_total', ).notNull(),
  originalPrice: int('original_price', ).notNull(),
  discountId: int('discount_id').references(() => discounts.id, { onDelete: 'set null' }),
  discountPercentage: int('discount_percentage').default(0),
  finalPrice: int('final_price', ).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  transactionIdx: index('idx_transaction_items_transaction').on(table.transactionId),
  menuIdx: index('idx_transaction_items_menu').on(table.menuId),
}));

export const payments = mysqlTable('payments', {
  id: int('id').autoincrement().primaryKey(),
  transactionId: int('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  paymentSequence: int('payment_sequence').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('cash'),
  amountPaid: int('amount_paid').notNull(),
  changeAmount: int('change_amount').notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('completed'),
  notes: text('notes'),
  createdBy: int('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  transactionIdx: index('idx_payments_transaction').on(table.transactionId),
  methodIdx: index('idx_payments_method_date').on(table.paymentMethod, table.createdAt),
  statusIdx: index('idx_payments_status').on(table.status),
}));

export const menuStockHistory = mysqlTable('menu_stock_history', {
  id: int('id').autoincrement().primaryKey(),
  menuId: int('menu_id')
    .notNull()
    .references(() => menus.id, { onDelete: 'cascade' }),
  changeType: varchar('change_type', { length: 20 }).notNull(),
  quantityChange: int('quantity_change').notNull(),
  finalStock: int('final_stock').notNull(),
  transactionId: int('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const transactionItemToppings = mysqlTable('transaction_item_toppings', {
  id: int('id').autoincrement().primaryKey(),
  transactionItemId: int('transaction_item_id').notNull(),
  toppingId: int('topping_id').notNull(),
    
  price: int('price').notNull(),
}, (table) => ({
  trxItemFk: foreignKey({
    name: 'fk_ti_toppings_item',
    columns: [table.transactionItemId],
    foreignColumns: [transactionItems.id],
  }).onDelete('cascade'),

  toppingFk: foreignKey({
    name: 'fk_ti_toppings_ref_v2',
    columns: [table.toppingId],
    foreignColumns: [toppings.id],
  }).onDelete('restrict'),
}));