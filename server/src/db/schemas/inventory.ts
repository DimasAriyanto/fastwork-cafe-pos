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
import { outlets } from './organization.ts';
import { users } from './auth.ts';

export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  contact: varchar('contact', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const rawMaterials = pgTable(
  'raw_materials',
  {
    id: serial('id').primaryKey(),
    outletId: integer('outlet_id').references(() => outlets.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 100 }).notNull(),
    stockIn: integer('stock_in').notNull().default(0),
    stockOut: integer('stock_out').notNull().default(0),
    unit: varchar('unit', { length: 50 }).notNull(),
    minStock: integer('min_stock').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      outletIdx: index('idx_raw_materials_outlet').on(table.outletId),
    };
  },
);

// Note: current_stock is a computed column in SQL: stock_in - stock_out

export const shipments = pgTable(
  'shipments',
  {
    id: serial('id').primaryKey(),
    supplierId: integer('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'restrict' }),
    rawMaterialId: integer('raw_material_id')
      .notNull()
      .references(() => rawMaterials.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    shipmentDate: timestamp('shipment_date').notNull(),
    receivedDate: timestamp('received_date'),
    status: varchar('status', { length: 50 }).default('pending'),
    notes: text('notes'),
    createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      supplierIdx: index('idx_shipments_supplier').on(table.supplierId),
      rawMaterialIdx: index('idx_shipments_raw_material').on(table.rawMaterialId),
    };
  },
);
