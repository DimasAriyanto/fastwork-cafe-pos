import { InferSelectModel } from 'drizzle-orm';
import { menus, menuVariants } from '../db/schemas/index'; // Sesuaikan path

// 1. Tipe Data dari Database (Drizzle Inference)
export type Menu = InferSelectModel<typeof menus>;
export type MenuVariant = InferSelectModel<typeof menuVariants>;

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
}

export interface UpdateMenuRequest extends Partial<CreateMenuRequest> {
  isAvailable?: boolean;
}

// 3. Tipe untuk OUTPUT ke Frontend (Response)
// Kita extend tipe Menu bawaan DB, lalu tambah property variants
export interface MenuDetailResponse extends Menu {
  variants: MenuVariant[];
  categoryName?: string | null; // Opsional karena leftJoin
}

// 4. Tipe Internal untuk Repository (Biar strict pas insert)
// Gabungan input user + data sistem (outletId, createdBy)
export interface CreateMenuRepositoryInput extends CreateMenuRequest {
  outletId: number;
  createdBy: number;
}
