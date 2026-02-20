import { db } from '../db/index.ts';
import { discounts } from '../db/schemas/index.ts';
import { eq, and, desc, asc, or, like } from 'drizzle-orm';
import type { PaginationOptions } from '../types/index.ts';

export class DiscountRepository {
  async findById(id: number) {
    const [discount] = await db.select().from(discounts).where(eq(discounts.id, id)).limit(1);
    return discount;
  }

  async findByCode(code: string) {
    const [discount] = await db.select().from(discounts).where(eq(discounts.code, code)).limit(1);
    return discount;
  }

  async create(data: any) {
    const [result] = await db.insert(discounts).values(data);
    return await this.findById(result.insertId);
  }

  async update(id: number, data: any) {
    await db
      .update(discounts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(discounts.id, id));
    return await this.findById(id);
  }

  async delete(id: number) {
    const dataToDelete = await this.findById(id);
    if (dataToDelete) {
      await db.delete(discounts).where(eq(discounts.id, id));
    }
    return dataToDelete;
  }

  async findAll() {
    return await db.select().from(discounts).orderBy(desc(discounts.createdAt));
  }

  async findAllWithPagination(options: PaginationOptions = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'id',
      sortOrder = 'desc',
    } = options;
    
    const offset = (Math.max(page, 1) - 1) * limit;
    const conditions = [];

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          like(discounts.name, pattern),
          like(discounts.code, pattern)
        )
      );
    }

    const sortableColumns = {
      id: discounts.id,
      name: discounts.name,
      code: discounts.code,
      percentage: discounts.percentage,
      status: discounts.isActive,
      createdAt: discounts.createdAt,
    } as const;

    const orderByColumn = sortBy in sortableColumns
      ? sortableColumns[sortBy as keyof typeof sortableColumns]
      : discounts.id;
    
    const orderByClause = sortOrder?.toLowerCase() === 'asc' 
      ? asc(orderByColumn) 
      : desc(orderByColumn);

    const baseQuery = db
        .select()
        .from(discounts)
        .limit(limit)
        .offset(offset)
        .orderBy(orderByClause);

    if (conditions.length > 0) {
      return await baseQuery.where(and(...conditions));
    } else {
      return await baseQuery;
    }
  }
}
