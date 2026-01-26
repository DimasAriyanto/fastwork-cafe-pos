export type Role = 'OWNER' | 'CASHIER';

export interface User {
  id: string;
  username: string;
  role: Role;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

// Repository Types
export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUserInput {
  roleId: number;
  name: string;
  username: string;
  email: string;
  password: string;
  photo?: string;
  status?: string;
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

export interface CreateEmployeeInput {
  userId: number;
  outletId?: number;
  biographyData?: string;
  name: string;
  position: string;
  email: string;
  salary: string;
  imagePath?: string;
  createdBy?: number;
}

export interface UpdateEmployeeInput {
  userId?: number;
  outletId?: number;
  biographyData?: string;
  name?: string;
  position?: string;
  email?: string;
  salary?: string;
  imagePath?: string;
  createdBy?: number;
}

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
