import { db } from '../db/index';
import { categories } from '../db/schemas/index';
import { eq, and, like, desc, asc, sql } from 'drizzle-orm';
import type { PaginationOptions } from '../types/index';
import type { CreateCategoryRepoInput, UpdateCategoryRequest } from '../types/category';

export class CategoryRepository {
  
  // ✅ FIND ALL (Pagination + Search)
  async findAll(options: PaginationOptions) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const offset = (Math.max(page, 1) - 1) * limit;
    const conditions = [];

    // Search by Name
    if (search) {
      conditions.push(like(categories.name, `%${search}%`));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Hitung Total Data
    const [countResult] = await db
      .select({ total: sql<number>`count(*)` })
      .from(categories)
      .where(where);
    
    const total = Number(countResult?.total || 0);

    // 2. Query Data
    const allowedSortFields = ['createdAt', 'name', 'id', 'type'] as const;
    type SortField = typeof allowedSortFields[number];
    const sortField: SortField = allowedSortFields.includes(sortBy as SortField) ? (sortBy as SortField) : 'createdAt';
    const orderByColumn = categories[sortField];
    const orderBy = sortOrder === 'desc' 
      ? desc(orderByColumn) 
      : asc(orderByColumn);

    const data = await db
      .select()
      .from(categories)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

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

  // ✅ FIND BY ID
  async findById(id: number) {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return category || null;
  }

  // ✅ FIND BY NAME (Untuk Cek Duplikat)
  async findByName(name: string) {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name))
      .limit(1);
    return category || null;
  }

  // ✅ CREATE
  async create(data: CreateCategoryRepoInput) {
    const [result] = await db.insert(categories).values({
      ...data,
      // Default type 'menu' sudah dihandle di schema, tapi bisa dipertegas disini
      type: data.type || 'menu', 
    });
    
    // Return data yang baru dibuat
    return this.findById(result.insertId);
  }

  // ✅ UPDATE
  async update(id: number, data: UpdateCategoryRequest) {
    await db
      .update(categories)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(categories.id, id));

    return this.findById(id);
  }

  // ✅ DELETE
  async delete(id: number) {
    await db.delete(categories).where(eq(categories.id, id));
    return { id };
  }
}