// =========================================
// 1. CORE AUTH TYPES (Update ID jadi number)
// =========================================
export type Role = 'OWNER' | 'ADMIN' | 'CASHIER' | 'KITCHEN'; // Sesuaikan sama seed

export interface User {
  id: number; // ⚠️ WAJIB NUMBER (sesuai DB MySQL)
  username: string;
  role: string; // Bisa string aja biar fleksibel
  outletId: number; // Tambahan biar middleware tau outlet mana
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

// Helper buat Context Hono (Biar middleware type-safe)
export interface UserContext {
  id: number;
  outletId: number;
  role: string;
  username: string;
}

// =========================================
// 2. REPOSITORY & COMMON TYPES
// =========================================
export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// =========================================
// 3. USER MANAGEMENT TYPES
// =========================================
export interface CreateUserInput {
  roleId: number;
  name: string;
  username: string;
  email: string;
  password: string;
  photo?: string;
  status?: string;
  outletId?: number; // Tambahan
}

export interface UpdateUserInput {
  roleId?: number;
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  photo?: string;
  status?: string;
  updatedAt?: Date;
}

// =========================================
// 4. ROLE & OUTLET TYPES
// =========================================
export interface CreateRoleInput {
  name: string;
  description?: string;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
}

export interface CreateOutletInput {
  name: string;
  address: string;
  city?: string;
  province?: string;
  phoneNumber?: string;
  createdBy?: number;
}

export interface UpdateOutletInput {
  name?: string;
  address?: string;
  city?: string;
  province?: string;
  phoneNumber?: string;
}

export interface RefreshTokenInput {
  userId: number;
  token: string;
  expiresAt: Date;
}

export * from './menu';
export * from './transaction';
export * from './employee';