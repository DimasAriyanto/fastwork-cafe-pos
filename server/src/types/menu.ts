import { InferSelectModel } from 'drizzle-orm';
import { menus, menuVariants, toppings } from '../db/schemas/index'; 

// 1. Tipe Data dari Database (Drizzle Inference)
export type Menu = InferSelectModel<typeof menus>;
export type MenuVariant = InferSelectModel<typeof menuVariants>;
export type Topping = InferSelectModel<typeof toppings>;

// 2. Tipe untuk INPUT dari Frontend (Request Body)
export interface MenuVariantInput {
  name: string;
  priceAdjustment: number;
  sku?: string;
}

export interface CreateMenuRequest {
  name: string;
  categoryId: number;
  price: number;
  description?: string;
  image?: string;
  currentStock?: number;
  // Varian itu optional, tapi kalau ada harus array
  variants?: MenuVariantInput[];
  toppingIds?: number[]; // 👈 TAMBAHAN: List ID Topping yang boleh dipake
}

export interface UpdateMenuRequest extends Partial<CreateMenuRequest> {
  isAvailable?: boolean;
}

// 3. Tipe untuk OUTPUT ke Frontend (Response)
export interface MenuDetailResponse extends Menu {
  variants: MenuVariant[];
  toppings?: Topping[]; // 👈 TAMBAHAN: Topping yang nempel ke menu ini
  categoryName?: string | null;
}

// 4. Tipe Internal untuk Repository (Biar strict pas insert)
export interface CreateMenuRepositoryInput extends CreateMenuRequest {
  outletId: number;
  createdBy: number;
}
