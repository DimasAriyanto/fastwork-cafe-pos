import { db } from '../db/index.ts';
import { roles } from '../db/schemas/index.ts';
import { eq, and, desc, asc, or, like } from 'drizzle-orm'; // 👈 Pake 'like', buang 'sql' kalo gak perlu
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

    // 1. SEARCH LOGIC (MySQL Friendly)
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          like(roles.name, pattern),       // MySQL 'like' udah case-insensitive
          like(roles.description, pattern)
        )
      );
    }

    // 2. FILTERS
    if (filters.name && typeof filters.name === 'string') {
      conditions.push(eq(roles.name, filters.name));
    }

    // 3. SORTING
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

    // 4. QUERY BUILDER
    const baseQuery = db
        .select()
        .from(roles)
        .limit(limit)
        .offset(offset)
        .orderBy(orderByClause);

    if (conditions.length > 0) {
      return await baseQuery.where(and(...conditions));
    } else {
      return await baseQuery;
    }
  }

  // ✅ Fix: Return object (single), bukan array
  async findById(id: number) {
    const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    return role;
  }

  // ✅ Fix: Return object (single)
  async findByName(name: string) {
    const [role] = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
    return role;
  }

  // ✅ Fix: MySQL Create Pattern (Insert -> Get ID -> Find)
  async create(data: CreateRoleInput) {
    // 1. Insert
    const [result] = await db.insert(roles).values(data);
    
    // 2. Ambil ID barunya
    const insertId = result.insertId;

    // 3. Return datanya
    return await this.findById(insertId);
  }

  // ✅ Fix: MySQL Update Pattern
  async update(id: number, data: UpdateRoleInput) {
    await db
      .update(roles)
      .set({ 
        ...data,
        updatedAt: new Date(), // Pastikan tanggal update berubah
      })
      .where(eq(roles.id, id));

    // Fetch ulang karena gak ada .returning()
    return await this.findById(id);
  }

  // ✅ Fix: MySQL Delete Pattern
  async delete(id: number) {
    // 1. Ambil dulu datanya buat direturn
    const roleToDelete = await this.findById(id);

    // 2. Hapus
    if (roleToDelete) {
        await db.delete(roles).where(eq(roles.id, id));
    }

    // 3. Return data yg dihapus (biar FE tau apa yg ilang)
    return roleToDelete;
  }
}