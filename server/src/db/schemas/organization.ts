import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  index,
  unique,
  text,
} from 'drizzle-orm/pg-core';
import { users } from './auth.ts';

export const outlets = pgTable(
  'outlets',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    address: varchar('address', { length: 255 }).notNull(),
    city: varchar('city', { length: 255 }),
    province: varchar('province', { length: 255 }),
    phoneNumber: varchar('phone_number', { length: 50 }),
    createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      createdByIdx: index('idx_outlets_created_by').on(table.createdBy),
    };
  },
);

export const tables = pgTable(
  'tables',
  {
    id: serial('id').primaryKey(),
    outletId: integer('outlet_id')
      .notNull()
      .references(() => outlets.id, { onDelete: 'cascade' }),
    tableNumber: varchar('table_number', { length: 50 }).notNull(),
    qrCode: text('qr_code'),
    seatsCapacity: integer('seats_capacity'),
    status: varchar('status', { length: 50 }).default('available'),
    createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      outletIdx: index('idx_tables_outlet').on(table.outletId),
      createdByIdx: index('idx_tables_created_by').on(table.createdBy),
      uniqueOutletTable: unique('unique_outlet_table').on(table.outletId, table.tableNumber),
    };
  },
);
