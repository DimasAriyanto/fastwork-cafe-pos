import { db } from '../db/index.ts';
import { outlets } from '../db/schemas/index.ts';
import { eq, sql, and, desc, asc, or } from 'drizzle-orm';
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

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          sql`${outlets.name} ILIKE ${pattern}`,
          sql`${outlets.city} ILIKE ${pattern}`,
          sql`${outlets.province} ILIKE ${pattern}`
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

    if (conditions.length > 0) {
      return await db
        .select()
        .from(outlets)
        .where(and(...conditions))
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);
    } else {
      return await db
        .select()
        .from(outlets)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);
    }
  }

  async findById(id: number) {
    return await db.select().from(outlets).where(eq(outlets.id, id)).limit(1);
  }

  async create(data: CreateOutletInput) {
    return await db.insert(outlets).values(data).returning();
  }

  async update(id: number, data: UpdateOutletInput) {
    return await db
      .update(outlets)
      .set({ ...data })
      .where(eq(outlets.id, id))
      .returning();
  }

  async delete(id: number) {
    return await db.delete(outlets).where(eq(outlets.id, id)).returning();
  }
}
