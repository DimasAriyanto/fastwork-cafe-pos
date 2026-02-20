import { RoleService } from '../services/role.service.ts';
import type { Context } from 'hono';

export class RoleController {
  private service: RoleService;

  constructor() {
    this.service = new RoleService();
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
    const role = await this.service.get(id);
    if (!role) return c.json({ error: 'Role not found' }, 404);
    return c.json({ success: true, role });
  }

  async create(c: Context) {
    const body = await c.req.json();
    const role = await this.service.create(body);
    return c.json({ success: true, role }, 201);
  }

  async update(c: Context) {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const role = await this.service.update(id, body);
    return c.json({ success: true, role });
  }

  async remove(c: Context) {
    const id = Number(c.req.param('id'));
    await this.service.delete(id);
    return c.json({ success: true });
  }
}
