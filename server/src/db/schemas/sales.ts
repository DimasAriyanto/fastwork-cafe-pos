import { 
  mysqlTable, 
  int, 
  varchar, 
  timestamp, 
  decimal, 
  boolean, 
  index, 
  unique, 
  datetime
} from 'drizzle-orm/mysql-core';
import { menus } from './menu';

export const discounts = mysqlTable('discounts', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  startDate: datetime('start_date'),
  endDate: datetime('end_date'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const discountItems = mysqlTable('discount_items', {
  id: int('id').autoincrement().primaryKey(),
  discountId: int('discount_id')
    .notNull()
    .references(() => discounts.id, { onDelete: 'cascade' }),
  menuId: int('menu_id')
    .notNull()
    .references(() => menus.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  discountIdx: index('idx_discount_items_discount').on(table.discountId),
  menuIdx: index('idx_discount_items_menu').on(table.menuId),
  uniqueDiscountMenu: unique('unique_discount_menu').on(table.discountId, table.menuId),
}));

export const taxes = mysqlTable('taxes', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});