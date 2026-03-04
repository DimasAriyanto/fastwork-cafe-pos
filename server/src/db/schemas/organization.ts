import { 
  mysqlTable, 
  int, 
  varchar, 
  text, 
  timestamp, 
  index,
  unique 
} from 'drizzle-orm/mysql-core';
import { users } from './auth';

export const outlets = mysqlTable('outlets', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  city: varchar('city', { length: 255 }),
  province: varchar('province', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 50 }),
  createdBy: int('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  createdByIdx: index('idx_outlets_created_by').on(table.createdBy),
}));

export const tables = mysqlTable('tables', {
  id: int('id').autoincrement().primaryKey(),
  outletId: int('outlet_id')
    .notNull()
    .references(() => outlets.id, { onDelete: 'cascade' }),
  tableNumber: varchar('table_number', { length: 50 }).notNull(),
  qrCode: text('qr_code'),
  seatsCapacity: int('seats_capacity'),
  status: varchar('status', { length: 50 }).default('available'),
  createdBy: int('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  outletIdx: index('idx_tables_outlet').on(table.outletId),
  createdByIdx: index('idx_tables_created_by').on(table.createdBy),
  uniqueOutletTable: unique('unique_outlet_table').on(table.outletId, table.tableNumber),
}));