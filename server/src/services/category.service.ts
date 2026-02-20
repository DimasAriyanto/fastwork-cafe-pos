import { CategoryRepository } from '../repositories/category.repository';
import type { PaginationOptions } from '../types/index';
import type { CreateCategoryRequest, UpdateCategoryRequest } from '../types/category';

export class CategoryService {
  private repo: CategoryRepository;

  constructor() {
    this.repo = new CategoryRepository();
  }

  async getAllCategories(options: PaginationOptions) {
    return await this.repo.findAll(options);
  }

  async getCategoryById(id: number) {
    const category = await this.repo.findById(id);
    if (!category) throw new Error("Kategori tidak ditemukan");
    return category;
  }

  async createCategory(input: CreateCategoryRequest, userId: number) {
    // 1. Cek Duplikat Nama
    const existing = await this.repo.findByName(input.name);
    if (existing) {
      throw new Error(`Kategori dengan nama '${input.name}' sudah ada.`);
    }

    // 2. Create
    return await this.repo.create({
      name: input.name,
      type: input.type || 'menu',
      createdBy: userId
    });
  }

  async updateCategory(id: number, input: UpdateCategoryRequest) {
    const existingCategory = await this.repo.findById(id);
    if (!existingCategory) throw new Error("Kategori tidak ditemukan");

    // Jika ganti nama, cek duplikat nama lain
    if (input.name && input.name !== existingCategory.name) {
      const duplicate = await this.repo.findByName(input.name);
      if (duplicate) {
        throw new Error(`Nama kategori '${input.name}' sudah digunakan.`);
      }
    }

    return await this.repo.update(id, input);
  }

  async deleteCategory(id: number) {
    const existingCategory = await this.repo.findById(id);
    if (!existingCategory) throw new Error("Kategori tidak ditemukan");

    return await this.repo.delete(id);
  }
}