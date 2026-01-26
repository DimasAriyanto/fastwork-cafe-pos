import { db } from '../db/index.ts';
import { users } from '../db/schemas/index.ts';
import { eq, sql, and, desc, asc, or } from 'drizzle-orm';
import type { CreateUserInput, UpdateUserInput, PaginationOptions } from '../types/index.ts';

export class UserRepository {
  async findByUsername(username: string) {
    return await db.select().from(users).where(eq(users.username, username)).limit(1);
  }

  async findByEmail(email: string) {
    return await db.select().from(users).where(eq(users.email, email)).limit(1);
  }

  async findById(id: number) {
    return await db.select().from(users).where(eq(users.id, id)).limit(1);
  }

  async create(userData: CreateUserInput) {
    return await db.insert(users).values(userData).returning();
  }

  async update(id: number, userData: UpdateUserInput) {
    return await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
  }

  async findAll() {
    return await db.select().from(users);
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
          sql`${users.name} ILIKE ${pattern}`,
          sql`${users.email} ILIKE ${pattern}`
        )
      );
    }

    if (filters.username && typeof filters.username === 'string') {
      conditions.push(eq(users.username, filters.username));
    }
    if (filters.email && typeof filters.email === 'string') {
      conditions.push(eq(users.email, filters.email));
    }
    if (filters.roleId && typeof filters.roleId === 'number') {
      conditions.push(eq(users.roleId, filters.roleId));
    }

    const sortableColumns = {
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.name,
      roleId: users.roleId,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    } as const;

    const orderByColumn = sortBy in sortableColumns
      ? sortableColumns[sortBy as keyof typeof sortableColumns]
      : users.id;
    
    const orderByClause = sortOrder?.toLowerCase() === 'desc' 
      ? desc(orderByColumn) 
      : asc(orderByColumn);

    if (conditions.length > 0) {
      return await db
        .select()
        .from(users)
        .where(and(...conditions))
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);
    } else {
      return await db
        .select()
        .from(users)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);
    }
  }

  async delete(id: number) {
    return await db.delete(users).where(eq(users.id, id)).returning();
  }
}
