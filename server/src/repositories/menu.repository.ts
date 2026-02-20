/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '../db/index';
import { menus, menuVariants, categories } from '../db/schemas/index';
import { eq, and, like, desc, asc, sql } from 'drizzle-orm';
import type { 
  PaginationOptions 
} from '../types/index';
import type { 
  CreateMenuRepositoryInput, 
  MenuDetailResponse, 
  UpdateMenuRequest 
} from '../types/menu'; // 👈 Import tipe baru

export class MenuRepository {
  
  // ✅ 1. CREATE (Strict Typed)
  async create(data: CreateMenuRepositoryInput): Promise<MenuDetailResponse | null> {
    // Destructure variants biar gak ikut masuk ke tabel menus
    const { variants = [], ...menuData } = data;

    // A. Insert Menu Utama
    const [result] = await db.insert(menus).values({
        outletId: menuData.outletId,
        categoryId: menuData.categoryId,
        name: menuData.name,
        description: menuData.description,
        price: Number(menuData.price), // Sesuai schema menus.price yang bertipe int
        image: menuData.image,
        isAvailable: true,
        hasVariant: variants.length > 0,
        currentStock: menuData.currentStock || 0,
        createdBy: menuData.createdBy
    });
    
    const newMenuId = result.insertId;

    // B. Insert Variants (Strict Typed)
    if (variants.length > 0) {
        const variantsData = variants.map((v) => ({
            menuId: newMenuId,
            name: v.name,
            priceAdjustment: v.priceAdjustment.toString(), // Decimal conversion
            isAvailable: true
        }));
        await db.insert(menuVariants).values(variantsData);
    }

    return this.findById(newMenuId);
  }

  // ✅ 2. FIND BY ID (Return typed response)
  async findById(id: number): Promise<MenuDetailResponse | null> {
    const [menu] = await db.select().from(menus).where(eq(menus.id, id)).limit(1);
    
    if (!menu) return null;

    const variants = await db
        .select()
        .from(menuVariants)
        .where(eq(menuVariants.menuId, id));

    return {
        ...menu,
        variants: variants,
        // Konversi Decimal ke Number kalau perlu, tapi string aman buat currency
        price: menu.price, // Casting tipis buat compatibility
    };
  }

  // ✅ 3. FIND ALL (Typed Options)
  async findAll(options: PaginationOptions & { outletId: number, categoryId?: number }) {
    const {
      page = 1,
      limit = 10,
      search,
      filters = {},
      sortBy = 'createdAt',
      sortOrder = 'desc',
      outletId,
      categoryId
    } = options;

    const offset = (Math.max(page, 1) - 1) * limit; // Pastikan page minimal 1

    const conditions = [];

    // 1. Filter Wajib (Outlet)
    conditions.push(eq(menus.outletId, outletId));

    // 2. Filter Optional
    if (categoryId) {
      conditions.push(eq(menus.categoryId, categoryId));
    }

    if (search) {
      conditions.push(like(menus.name, `%${search}%`));
    }

    // Filter dinamis lainnya
    Object.entries(filters).forEach(([key, value]) => {
      // Pastikan key ada di table menus biar gak error query
      if (key in menus) {
        conditions.push(eq((menus as any)[key], value));
      }
    });

    const where = and(...conditions);

    // ---------------------------------------------------------
    // A. HITUNG TOTAL DATA (COUNT)
    // ---------------------------------------------------------
    const [countResult] = await db
      .select({ total: sql<number>`count(*)` })
      .from(menus)
      .where(where);
    
    const total = Number(countResult?.total || 0);

    // ---------------------------------------------------------
    // B. AMBIL DATA + JOIN KATEGORI
    // ---------------------------------------------------------
    const orderBy = sortOrder === 'desc' 
      ? desc((menus as any)[sortBy] || menus.createdAt) 
      : asc((menus as any)[sortBy] || menus.createdAt);

    const rows = await db
      .select({
        menu: menus,                 // Ambil semua kolom menu
        categoryName: categories.name // 🔥 AMBIL NAMA KATEGORI DISINI
      })
      .from(menus)
      .leftJoin(categories, eq(menus.categoryId, categories.id)) // 🔥 JOIN DISINI
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // ---------------------------------------------------------
    // C. MAPPING DATA (Flattening)
    // ---------------------------------------------------------
    const data = rows.map(row => ({
      ...row.menu,
      categoryName: row.categoryName || 'Uncategorized', // Handle jika kategori terhapus
      // Pastikan price jadi string sesuai Interface Frontend
      price: row.menu.price.toString(), 
    }));

    // Return format standard { data, meta }
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // ✅ 4. UPDATE
  async update(id: number, data: UpdateMenuRequest) {
    // Hapus field undefined biar gak update jadi NULL
    // (Helper function cleanObject bisa dipake disini kalo ada)
    const { createdAt, updatedAt, id: bodyId, ...cleanData } = data as any;

    // 2. Gunakan cleanData untuk update ke database
    //    Sekarang ORM tidak akan protes karena field timestamp yang string itu sudah hilang
    //    Dan database akan otomatis mengupdate 'updated_at' karena setting .onUpdateNow()
    await db.update(menus)
        .set(cleanData)
        .where(eq(menus.id, id));

    return this.findById(id);
  }

  // ✅ 5. DELETE
  async delete(id: number) {
    const dataToDelete = await this.findById(id);
    if (dataToDelete) {
        await db.delete(menus).where(eq(menus.id, id));
    }
    return dataToDelete;
  }
}