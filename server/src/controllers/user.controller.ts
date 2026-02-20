import { UserService } from '../services/user.service.ts';
import type { Context } from 'hono';

export class UserController {
  private service: UserService;

  constructor() {
    this.service = new UserService();
  }

  async list(c: Context) {
    const items = await this.service.list();
    return c.json({ success: true, data: items });
  }

  async listPaginated(c: Context) {
    const params = c.req.query();
    const page = parseInt(params.page || '1', 10);
    const limit = parseInt(params.limit || '20', 10);
    const search = params.search || undefined;
    
    // Konfigurasi sorting default
    const sortBy = params.sortBy;
    const sortOrder = (params.sortOrder || 'asc') as 'asc' | 'desc';
    const filters = { ...params };
    
    delete filters.page;
    delete filters.limit;
    delete filters.search;
    delete filters.sortBy;
    delete filters.sortOrder;

    const items = await this.service.listWithPagination({
      page,
      limit,
      search,
      filters,
      sortBy,
      sortOrder,
    });
    return c.json({ success: true, data: items, meta: { page, limit } });
  }

  async get(c: Context) {
    const id = Number(c.req.param('id'));
    const user = await this.service.get(id);
    if (!user) return c.json({ error: 'User tidak ditemukan' }, 404);
    return c.json({ success: true, user });
  }

  async create(c: Context) {
    const body = await c.req.json();
    const user = await this.service.create(body);
    return c.json({ success: true, user }, 201);
  }

  async update(c: Context) {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const user = await this.service.update(id, body);
    return c.json({ success: true, user });
  }

  async remove(c: Context) {
    const id = Number(c.req.param('id'));
    await this.service.delete(id);
    return c.json({ success: true, message: "User berhasil dihapus" });
  }
}