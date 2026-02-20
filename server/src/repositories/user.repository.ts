import { db } from '../db/index.ts';
import { users } from '../db/schemas/index.ts';
import { eq, and, desc, asc, or, like } from 'drizzle-orm'; // 👈 Tambah import 'like'
import type { CreateUserInput, UpdateUserInput, PaginationOptions } from '../types/index.ts';

export class UserRepository {
  // 🔍 Helper: Ambil satu user (return object atau undefined)
  async findByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async findById(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  // ➕ CREATE: Insert -> Ambil ID -> Select Ulang
  async create(userData: CreateUserInput) {
    // 1. Eksekusi Insert
    const [result] = await db.insert(users).values(userData);
    
    // 2. Ambil ID yang baru dibuat
    const insertId = result.insertId;

    // 3. Return data user lengkap
    return await this.findById(insertId);
  }

  // ✏️ UPDATE: Update -> Select Ulang
  async update(id: number, userData: UpdateUserInput) {
    await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(), // Pastikan tanggal update berubah
      })
      .where(eq(users.id, id));

    // MySQL gak bisa returning, jadi kita fetch ulang datanya
    return await this.findById(id);
  }

  async findAll() {
    return await db.select().from(users);
  }

  // 📄 PAGINATION: Ganti ILIKE jadi LIKE
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
      // ⚠️ MySQL Fix: Pakai 'like', bukan 'ILIKE'
      // MySQL default collation biasanya sudah case-insensitive
      conditions.push(
        or(
          like(users.name, pattern),
          like(users.email, pattern)
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

    // Query Builder Logic
    const baseQuery = db
        .select()
        .from(users)
        .limit(limit)
        .offset(offset)
        .orderBy(orderByClause);

    if (conditions.length > 0) {
      return await baseQuery.where(and(...conditions));
    } else {
      return await baseQuery;
    }
  }

  // 🗑️ DELETE: Select dulu -> Delete -> Return data yg dihapus
  async delete(id: number) {
    // 1. Cari dulu datanya (buat di-return nanti)
    const userToDelete = await this.findById(id);

    // 2. Kalau ada, hapus
    if (userToDelete) {
        await db.delete(users).where(eq(users.id, id));
    }

    // 3. Return data yang barusan dihapus (biar behavior mirip .returning())
    return userToDelete;
  }
}