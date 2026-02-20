import { MenuRepository } from '../repositories/menu.repository';
import type { CreateMenuRequest, UpdateMenuRequest } from '../types/menu';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class MenuService {
  private menuRepo: MenuRepository;

  constructor() {
    this.menuRepo = new MenuRepository();
  }

  /**
   * Get all menus with pagination and filters
   * @param options - Pagination options (page, limit, search, filters, sortBy, sortOrder)
   * @param categoryId - Optional category filter
   * @param outletId - Optional outlet filter (defaults to 1 for Outlet Pusat)
   */
  async getAllMenus(
    options: PaginationOptions, 
    categoryId?: number,
    outletId: number = 1 // Default ke Outlet 1 (Pusat)
  ) {
    return await this.menuRepo.findAll({
      ...options,
      outletId, 
      categoryId
    });
  }

  async getMenuById(id: number) {
    return await this.menuRepo.findById(id);
  }

  async createMenu(data: CreateMenuRequest & { createdBy?: number; outletId?: number }) {
    const input = {
      ...data,
      outletId: data.outletId || 1, // Ensure outletId is a number, default to 1
      createdBy: data.createdBy || 0 // Ensure createdBy is a number to match CreateMenuRepositoryInput
    };
    return await this.menuRepo.create(input);
  }

  async updateMenu(id: number, data: UpdateMenuRequest) {
    return await this.menuRepo.update(id, data);
  }

  async deleteMenu(id: number) {
    return await this.menuRepo.delete(id);
  }

  /**
   * Get menus by outlet
   */
  async getMenusByOutlet(outletId: number, options: PaginationOptions = {}) {
    return await this.getAllMenus(options, undefined, outletId);
  }

  /**
   * Get menus by category
   */
  async getMenusByCategory(categoryId: number, options: PaginationOptions = {}, outletId: number = 1) {
    return await this.getAllMenus(options, categoryId, outletId);
  }
}