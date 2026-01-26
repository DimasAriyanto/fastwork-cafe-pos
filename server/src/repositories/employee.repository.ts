import { db } from '../db/index.ts';
import { employees } from '../db/schemas/index.ts';
import { eq, sql, and, desc, asc, or } from 'drizzle-orm';
import type { CreateEmployeeInput, UpdateEmployeeInput, PaginationOptions } from '../types/index.ts';

export class EmployeeRepository {
  async findAll() {
    return await db.select().from(employees);
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
          sql`${employees.name} ILIKE ${pattern}`,
          sql`${employees.email} ILIKE ${pattern}`,
          sql`${employees.position} ILIKE ${pattern}`
        )
      );
    }

    if (filters.userId && typeof filters.userId === 'number') {
      conditions.push(eq(employees.userId, filters.userId));
    }
    if (filters.outletId && typeof filters.outletId === 'number') {
      conditions.push(eq(employees.outletId, filters.outletId));
    }
    if (filters.position && typeof filters.position === 'string') {
      conditions.push(eq(employees.position, filters.position));
    }
    if (filters.email && typeof filters.email === 'string') {
      conditions.push(eq(employees.email, filters.email));
    }

    const sortableColumns = {
      id: employees.id,
      userId: employees.userId,
      outletId: employees.outletId,
      name: employees.name,
      position: employees.position,
      email: employees.email,
      createdAt: employees.createdAt,
      updatedAt: employees.updatedAt,
    } as const;

    const orderByColumn = sortBy in sortableColumns
      ? sortableColumns[sortBy as keyof typeof sortableColumns]
      : employees.id;
    
    const orderByClause = sortOrder?.toLowerCase() === 'desc' 
      ? desc(orderByColumn) 
      : asc(orderByColumn);

    if (conditions.length > 0) {
      return await db
        .select()
        .from(employees)
        .where(and(...conditions))
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);
    } else {
      return await db
        .select()
        .from(employees)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);
    }
  }

  async findById(id: number) {
    return await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  }

  async findByUserId(userId: number) {
    return await db.select().from(employees).where(eq(employees.userId, userId)).limit(1);
  }

  async create(data: CreateEmployeeInput) {
    return await db.insert(employees).values(data).returning();
  }

  async update(id: number, data: UpdateEmployeeInput) {
    return await db
      .update(employees)
      .set({ ...data })
      .where(eq(employees.id, id))
      .returning();
  }

  async delete(id: number) {
    return await db.delete(employees).where(eq(employees.id, id)).returning();
  }
}
