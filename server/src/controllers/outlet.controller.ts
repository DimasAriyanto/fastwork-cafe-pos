import { OutletService } from '../services/outlet.service.ts';
import type { Context } from 'hono';
import { User } from '../types/index.ts';

export class OutletController {
  private service: OutletService;

  constructor() {
    this.service = new OutletService();
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
    const item = await this.service.get(id);
    if (!item) return c.json({ error: 'Outlet not found' }, 404);
    return c.json({ success: true, outlet: item });
  }

  async create(c: Context) {
    const body = await c.req.json();
    const user = c.get('user') as User;
    // Otomatis set 'createdBy' dari user yang login
    const data = { ...body, createdBy: user?.id };
    const outlet = await this.service.create(data);
    return c.json({ success: true, outlet }, 201);
  }

  async update(c: Context) {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const outlet = await this.service.update(id, body);
    return c.json({ success: true, outlet });
  }

  async remove(c: Context) {
    const id = Number(c.req.param('id'));
    await this.service.delete(id);
    return c.json({ success: true });
  }
}
