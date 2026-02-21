import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
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
   * Helper Simpan File
   */
  private async saveFile(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const uploadDir = join(process.cwd(), 'uploads');
    const uploadPath = join(uploadDir, fileName);
    
    // Pastikan folder 'uploads' ada
    await mkdir(uploadDir, { recursive: true });
    
    await writeFile(uploadPath, Buffer.from(buffer));
    return `/uploads/${fileName}`;
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

  async createMenu(data: CreateMenuRequest & { createdBy?: number; outletId?: number }, photo?: File) {
    let imagePath: string | undefined = undefined;
    
    if (photo) {
      imagePath = await this.saveFile(photo);
    }

    const input = {
      ...data,
      image: imagePath || data.image,
      outletId: data.outletId || 1, 
      createdBy: data.createdBy || 0 
    };
    return await this.menuRepo.create(input);
  }

  async updateMenu(id: number, data: UpdateMenuRequest, photo?: File) {
    const existingMenu = await this.menuRepo.findById(id);
    if (!existingMenu) throw new Error("Menu tidak ditemukan");

    let imagePath: string | undefined = existingMenu.image || undefined;

    if (photo) {
      // Logic hapus foto lama
      if (existingMenu.image) {
        try {
          await unlink(join(process.cwd(), existingMenu.image));
        } catch (e) {
          console.error("Gagal hapus file lama:", e);
        }
      }
      imagePath = await this.saveFile(photo);
    }

    const updateData = {
      ...data,
      image: imagePath
    };

    return await this.menuRepo.update(id, updateData);
  }

  async deleteMenu(id: number) {
    const menu = await this.menuRepo.findById(id);
    if (menu && menu.image) {
      try {
        await unlink(join(process.cwd(), menu.image));
      } catch (e) {
        console.error("Gagal hapus file menu saat delete:", e);
      }
    }
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