// src/types/category.ts

export interface Category {
  id: number;
  name: string;
  type: string | null;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryRequest {
  name: string;
  type?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  type?: string;
}

// Untuk Repository Input (Data bersih siap masuk DB)
export interface CreateCategoryRepoInput {
  name: string;
  type: string;
  createdBy: number;
}