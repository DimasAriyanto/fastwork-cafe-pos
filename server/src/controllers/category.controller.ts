import type { Context } from 'hono';
import { CategoryService } from '../services/category.service';
import type { CreateCategoryRequest, UpdateCategoryRequest } from '../types/category';
import type { UserContext } from '../types/index'; // Pastikan type UserContext ada (isi id, role, dll)

export class CategoryController {
  private service: CategoryService;

  constructor() {
    this.service = new CategoryService();
  }

  // GET /api/categories
  async index(c: Context) {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const search = query.search;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = (query.sortOrder || 'desc') as 'asc' | 'desc';

    const result = await this.service.getAllCategories({
      page,
      limit,
      search,
      sortBy,
      sortOrder
    });

    return c.json({ success: true, ...result });
  }

  // GET /api/categories/:id
  async show(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      const category = await this.service.getCategoryById(id);
      return c.json({ success: true, data: category });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
      return c.json({ success: false, message }, 404);
    }
  }

  // POST /api/categories
  async store(c: Context) {
    try {
      const user = c.get('user') as UserContext;
      const body = await c.req.json<CreateCategoryRequest>();

      if (!body.name) {
        return c.json({ success: false, message: "Nama kategori wajib diisi" }, 400);
      }

      const newCategory = await this.service.createCategory(body, user.id);
      return c.json({ success: true, message: "Kategori berhasil dibuat", data: newCategory }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
      return c.json({ success: false, message }, 400);
    }
  }

  // PUT /api/categories/:id
  async update(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json<UpdateCategoryRequest>();

      const updatedCategory = await this.service.updateCategory(id, body);
      return c.json({ success: true, message: "Kategori berhasil diupdate", data: updatedCategory });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
      return c.json({ success: false, message }, 400);
    }
  }

  // DELETE /api/categories/:id
  async destroy(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      await this.service.deleteCategory(id);
      return c.json({ success: true, message: "Kategori berhasil dihapus" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
      return c.json({ success: false, message }, 400);
    }
  }
}