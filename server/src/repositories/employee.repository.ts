import { db } from '../db/index.ts';
import { employees, users } from '../db/schemas/index.ts';
import { eq, and, desc, asc, or, like } from 'drizzle-orm';
import type { CreateEmployeeRepoInput, UpdateEmployeeInput, PaginationOptions } from '../types/index';

export class EmployeeRepository {
  async findAll() {
    return await db
      .select({
        id: employees.id,
        userId: employees.userId,
        outletId: employees.outletId,
        name: employees.name,
        position: employees.position,
        imagePath: employees.imagePath,
        isActive: employees.isActive,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
        username: users.username,
        email: users.email,
      })
      .from(employees)
      .leftJoin(users, eq(employees.userId, users.id))
      .where(eq(employees.isActive, true));
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

    // MySQL Friendly Search
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          like(employees.name, pattern),
          like(employees.position, pattern)
        )
      );
    }

    if (filters.userId && typeof filters.userId === 'number') {
      conditions.push(eq(employees.id, filters.userId));
    }
    // ❌ SENSEI NOTE: Filter Outlet ID dihapus sesuai request (Single Outlet)
    
    if (filters.position && typeof filters.position === 'string') {
      conditions.push(eq(employees.position, filters.position));
    }

    const sortableColumns = {
      id: employees.id,
      outletId: employees.outletId,
      name: employees.name,
      position: employees.position,
      createdAt: employees.createdAt,
      updatedAt: employees.updatedAt,
    } as const;

    const orderByColumn = sortBy in sortableColumns
      ? sortableColumns[sortBy as keyof typeof sortableColumns]
      : employees.id;
    
    const orderByClause = sortOrder?.toLowerCase() === 'desc' 
      ? desc(orderByColumn) 
      : asc(orderByColumn);

    const baseQuery = db
        .select()
        .from(employees)
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
    const [employee] = await db
      .select({
        id: employees.id,
        userId: employees.userId,
        outletId: employees.outletId,
        name: employees.name,
        position: employees.position,
        imagePath: employees.imagePath,
        isActive: employees.isActive,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
        username: users.username,
        email: users.email,
      })
      .from(employees)
      .leftJoin(users, eq(employees.userId, users.id))
      .where(eq(employees.id, id))
      .limit(1);
    return employee;
  }

  async findByUserId(userId: number) {
    const [employee] = await db.select().from(employees).where(eq(employees.userId, userId)).limit(1);
    return employee;
  }

  // MySQL Create Pattern
  async create(data: CreateEmployeeRepoInput) {
    const [result] = await db.insert(employees).values(data);
    return await this.findById(result.insertId);
  }

  // MySQL Update Pattern
  async update(id: number, data: UpdateEmployeeInput) {
    await db
      .update(employees)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employees.id, id));
      
    return await this.findById(id);
  }

  // Soft Delete: set isActive = false
  async softDelete(id: number) {
    const dataToDelete = await this.findById(id);
    if (dataToDelete) {
      await db
        .update(employees)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(employees.id, id));
    }
    return dataToDelete;
  }

  // MySQL Delete Pattern (hard delete — tidak dipakai untuk pegawai)
  async delete(id: number) {
    const dataToDelete = await this.findById(id);
    if (dataToDelete) {
        await db.delete(employees).where(eq(employees.id, id));
    }
    return dataToDelete;
  }
}