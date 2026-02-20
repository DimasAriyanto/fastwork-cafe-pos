import { 
  mysqlTable, 
  int, 
  varchar, 
  text, 
  timestamp,
  index, 
  datetime
} from 'drizzle-orm/mysql-core';
import { outlets } from './organization';
import { users } from './auth';

export const suppliers = mysqlTable('suppliers', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  contact: varchar('contact', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  createdBy: int('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const rawMaterials = mysqlTable('raw_materials', {
  id: int('id').autoincrement().primaryKey(),
  outletId: int('outlet_id').references(() => outlets.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  stockIn: int('stock_in').notNull().default(0),
  stockOut: int('stock_out').notNull().default(0),
  unit: varchar('unit', { length: 50 }).notNull(),
  minStock: int('min_stock').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  outletIdx: index('idx_raw_materials_outlet').on(table.outletId),
}));

export const shipments = mysqlTable('shipments', {
  id: int('id').autoincrement().primaryKey(),
  supplierId: int('supplier_id')
    .notNull()
    .references(() => suppliers.id, { onDelete: 'restrict' }),
  rawMaterialId: int('raw_material_id')
    .notNull()
    .references(() => rawMaterials.id, { onDelete: 'restrict' }),
  quantity: int('quantity').notNull(),
  unitPrice: int('unit_price').notNull(),
  shipmentDate: datetime('shipment_date').notNull(),
  receivedDate: datetime('received_date'),
  status: varchar('status', { length: 50 }).default('pending'),
  notes: text('notes'),
  createdBy: int('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  supplierIdx: index('idx_shipments_supplier').on(table.supplierId),
  rawMaterialIdx: index('idx_shipments_raw_material').on(table.rawMaterialId),
}));