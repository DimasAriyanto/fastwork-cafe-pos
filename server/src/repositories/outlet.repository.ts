import { db } from '../db/index.ts';
import { outlets } from '../db/schemas/index.ts';
import { eq, and, desc, asc, or, like } from 'drizzle-orm'; // Pake 'like'
import type { CreateOutletInput, UpdateOutletInput, PaginationOptions } from '../types/index.ts';

export class OutletRepository {
  async findAll() {
    return await db.select().from(outlets);
  }

  async findAllWithPagination(options: PaginationOptions = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      filters = {},
      sortBy = 'id',
      sortOrder = 'asc',
    } = options;
    
    const offset = (Math.max(page, 1) - 1) * limit;
    const conditions = [];

    // 1. MySQL Search (Case Insensitive by default)
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          like(outlets.name, pattern),
          like(outlets.city, pattern),
          like(outlets.province, pattern)
        )
      );
    }

    if (filters.name && typeof filters.name === 'string') {
      conditions.push(eq(outlets.name, filters.name));
    }
    if (filters.city && typeof filters.city === 'string') {
      conditions.push(eq(outlets.city, filters.city));
    }
    if (filters.province && typeof filters.province === 'string') {
      conditions.push(eq(outlets.province, filters.province));
    }

    const sortableColumns = {
      id: outlets.id,
      name: outlets.name,
      address: outlets.address,
      city: outlets.city,
      province: outlets.province,
      phoneNumber: outlets.phoneNumber,
      createdAt: outlets.createdAt,
      updatedAt: outlets.updatedAt,
    } as const;

    const orderByColumn = sortBy in sortableColumns
      ? sortableColumns[sortBy as keyof typeof sortableColumns]
      : outlets.id;
    
    const orderByClause = sortOrder?.toLowerCase() === 'desc' 
      ? desc(orderByColumn) 
      : asc(orderByColumn);

    const baseQuery = db
        .select()
        .from(outlets)
        .limit(limit)
        .offset(offset)
        .orderBy(orderByClause);

    if (conditions.length > 0) {
      return await baseQuery.where(and(...conditions));
    } else {
      return await baseQuery;
    }
  }

  async findById(id: number) {
    const [outlet] = await db.select().from(outlets).where(eq(outlets.id, id)).limit(1);
    return outlet;
  }

  // MySQL Create Pattern
  async create(data: CreateOutletInput) {
    const [result] = await db.insert(outlets).values(data);
    return await this.findById(result.insertId);
  }

  // MySQL Update Pattern
  async update(id: number, data: UpdateOutletInput) {
    await db
      .update(outlets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(outlets.id, id));
    
    return await this.findById(id);
  }

  // MySQL Delete Pattern
  async delete(id: number) {
    const dataToDelete = await this.findById(id);
    if (dataToDelete) {
        await db.delete(outlets).where(eq(outlets.id, id));
    }
    return dataToDelete;
  }
}