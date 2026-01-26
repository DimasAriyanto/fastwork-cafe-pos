import {
  pgTable,
  serial,
  varchar,
  timestamp,
  decimal,
  integer,
  boolean,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { menus } from './menu.ts';

export const discounts = pgTable('discounts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const discountItems = pgTable(
  'discount_items',
  {
    id: serial('id').primaryKey(),
    discountId: integer('discount_id')
      .notNull()
      .references(() => discounts.id, { onDelete: 'cascade' }),
    menuId: integer('menu_id')
      .notNull()
      .references(() => menus.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      discountIdx: index('idx_discount_items_discount').on(table.discountId),
      menuIdx: index('idx_discount_items_menu').on(table.menuId),
      uniqueDiscountMenu: unique('unique_discount_menu').on(table.discountId, table.menuId),
    };
  },
);

export const taxes = pgTable('taxes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
