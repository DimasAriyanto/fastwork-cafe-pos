import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { outlets } from './organization.ts';
import { rawMaterials } from './inventory.ts';
import { users } from './auth.ts';

export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    type: varchar('type', { length: 50 }).default('menu'), // 'menu' atau 'topping'
    createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      createdByIdx: index('idx_categories_created_by').on(table.createdBy),
    };
  },
);

export const subCategories = pgTable('sub_categories', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const menus = pgTable(
  'menus',
  {
    id: serial('id').primaryKey(),
    outletId: integer('outlet_id').references(() => outlets.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    description: text('description'),
    image: varchar('image', { length: 255 }),
    isAvailable: boolean('is_available').default(true),
    currentStock: integer('current_stock').default(0),
    preparationTime: integer('preparation_time'),
    createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      categoryIdx: index('idx_menus_category').on(table.categoryId),
      outletIdx: index('idx_menus_outlet').on(table.outletId),
      createdByIdx: index('idx_menus_created_by').on(table.createdBy),
      availableIdx: index('idx_menus_available').on(table.isAvailable),
    };
  },
);

export const menuRecipes = pgTable(
  'menu_recipes',
  {
    id: serial('id').primaryKey(),
    menuId: integer('menu_id')
      .notNull()
      .references(() => menus.id, { onDelete: 'cascade' }),
    rawMaterialId: integer('raw_material_id')
      .notNull()
      .references(() => rawMaterials.id, { onDelete: 'restrict' }),
    quantityNeeded: decimal('quantity_needed', { precision: 10, scale: 3 }).notNull(),
    unit: varchar('unit', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      menuIdx: index('idx_menu_recipes_menu').on(table.menuId),
      rawMaterialIdx: index('idx_menu_recipes_raw_material').on(table.rawMaterialId),
      uniqueMenuMaterial: unique('unique_menu_material').on(table.menuId, table.rawMaterialId),
    };
  },
);
