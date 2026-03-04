import { 
  mysqlTable, 
  int, 
  varchar, 
  text, 
  timestamp,
  boolean, 
  index, 
  unique 
} from 'drizzle-orm/mysql-core';
import { outlets } from './organization';
import { rawMaterials } from './inventory';
import { users } from './auth';

export const categories = mysqlTable('categories', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  type: varchar('type', { length: 50 }).default('menu'),
  createdBy: int('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  createdByIdx: index('idx_categories_created_by').on(table.createdBy),
}));

export const subCategories = mysqlTable('sub_categories', {
  id: int('id').autoincrement().primaryKey(),
  categoryId: int('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const menus = mysqlTable('menus', {
  id: int('id').autoincrement().primaryKey(),
  outletId: int('outlet_id').references(() => outlets.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  categoryId: int('category_id').notNull().references(() => categories.id),
  price: int('price').notNull(),
  description: text('description'),
  image: varchar('image', { length: 255 }),
  
  isAvailable: boolean('is_available').default(true),
  hasVariant: boolean('has_variant').default(false), // 👈 TAMBAHAN: Penanda kalau menu ini punya opsi
  currentStock: int('current_stock').default(0),
  
  createdBy: int('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  categoryIdx: index('idx_menus_category').on(table.categoryId),
  outletIdx: index('idx_menus_outlet').on(table.outletId),
  createdByIdx: index('idx_menus_created_by').on(table.createdBy),
  availableIdx: index('idx_menus_available').on(table.isAvailable),
}));

export const menuRecipes = mysqlTable('menu_recipes', {
  id: int('id').autoincrement().primaryKey(),
  menuId: int('menu_id')
    .notNull()
    .references(() => menus.id, { onDelete: 'cascade' }),
  rawMaterialId: int('raw_material_id')
    .notNull()
    .references(() => rawMaterials.id, { onDelete: 'restrict' }),
  quantityNeeded: int('quantity_needed').notNull().default(0),
  unit: varchar('unit', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  menuIdx: index('idx_menu_recipes_menu').on(table.menuId),
  rawMaterialIdx: index('idx_menu_recipes_raw_material').on(table.rawMaterialId),
  uniqueMenuMaterial: unique('unique_menu_material').on(table.menuId, table.rawMaterialId),
}));

// 👇 TAMBAHAN 1: TABEL VARIAN (Rasa/Size)
// Contoh: Menu "Ayam Geprek", Varian: "Level 1", "Level 5"
export const menuVariants = mysqlTable('menu_variants', {
  id: int('id').autoincrement().primaryKey(),
  menuId: int('menu_id').notNull().references(() => menus.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(), // "Large", "Pedas Manis"
  priceAdjustment: int('price_adjustment', ).default(0), // Tambah harga brp?
  sku: varchar('sku', { length: 100 }), // Opsional: Kalo varian punya kode stok beda
  isAvailable: boolean('is_available').default(true),
});

// 👇 TAMBAHAN 2: TABEL TOPPING (Add-ons)
// Topping biasanya nempel ke Outlet (bisa dipake semua menu di outlet itu)
export const toppings = mysqlTable('toppings', {
  id: int('id').autoincrement().primaryKey(),
  outletId: int('outlet_id').notNull().references(() => outlets.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(), // "Extra Keju", "Boba"
  price: int('price').notNull().default(0),
  isAvailable: boolean('is_available').default(true),
  stock: int('stock').default(0), // Opsional: Kalo topping mau dihitung stoknya
});

// 👇 TAMBAHAN 3: TABEL PENGHUBUNG MENU \u0026 TOPPING
// Ini supaya kita bisa atur topping A cuma muncul di Menu X
export const menuToppings = mysqlTable('menu_toppings', {
  id: int('id').autoincrement().primaryKey(),
  menuId: int('menu_id').notNull().references(() => menus.id, { onDelete: 'cascade' }),
  toppingId: int('topping_id').notNull().references(() => toppings.id, { onDelete: 'cascade' }),
}, (table) => ({
  menuIdx: index('idx_menu_toppings_menu').on(table.menuId),
  toppingIdx: index('idx_menu_toppings_topping').on(table.toppingId),
  uniqueMenuTopping: unique('unique_menu_topping').on(table.menuId, table.toppingId),
}));
