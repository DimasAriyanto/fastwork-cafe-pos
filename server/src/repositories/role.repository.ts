import { db } from '../db/index.ts';
import { roles } from '../db/schemas/index.ts';
import { eq, sql, and, desc, asc, or } from 'drizzle-orm';
import type { CreateRoleInput, UpdateRoleInput, PaginationOptions } from '../types/index.ts';

export class RoleRepository {
  async findAll() {
    return await db.select().from(roles);
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
          sql`${roles.name} ILIKE ${pattern}`,
          sql`${roles.description} ILIKE ${pattern}`
        )
      );
    }

    if (filters.name && typeof filters.name === 'string') {
      conditions.push(eq(roles.name, filters.name));
    }

    const sortableColumns = {
      id: roles.id,
      name: roles.name,
      description: roles.description,
      createdAt: roles.createdAt,
      updatedAt: roles.updatedAt,
    } as const;

    const orderByColumn = sortBy in sortableColumns
      ? sortableColumns[sortBy as keyof typeof sortableColumns]
      : roles.id;
    
    const orderByClause = sortOrder?.toLowerCase() === 'desc' 
      ? desc(orderByColumn) 
      : asc(orderByColumn);

    if (conditions.length > 0) {
      return await db
        .select()
        .from(roles)
        .where(and(...conditions))
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);
    } else {
      return await db
        .select()
        .from(roles)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);
    }
  }

  async findById(id: number) {
    return await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  }

  async findByName(name: string) {
    return await db.select().from(roles).where(eq(roles.name, name)).limit(1);
  }

  async create(data: CreateRoleInput) {
    return await db.insert(roles).values(data).returning();
  }

  async update(id: number, data: UpdateRoleInput) {
    return await db
      .update(roles)
      .set({ ...data })
      .where(eq(roles.id, id))
      .returning();
  }

  async delete(id: number) {
    return await db.delete(roles).where(eq(roles.id, id)).returning();
  }
}
