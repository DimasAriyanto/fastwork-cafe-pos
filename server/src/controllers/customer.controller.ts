import type { Context } from 'hono';
import { CustomerService } from '../services/customer.service';
import type { User } from '../types/index';

export class CustomerController {
  private service: CustomerService;

  constructor() {
    this.service = new CustomerService();
  }

  async list(c: Context) {
    try {
      const query = c.req.query('q');
      if (query) {
        const data = await this.service.searchCustomers(query);
        return c.json({ success: true, data });
      }
      const data = await this.service.getAllCustomers();
      return c.json({ success: true, data });
    } catch (e: any) {
      return c.json({ success: false, message: e.message }, 500);
    }
  }

  async getDetail(c: Context) {
    try {
      const id = Number(c.req.param('id'));
      const data = await this.service.getCustomerById(id);
      if (!data) return c.json({ success: false, message: 'Customer not found' }, 404);
      return c.json({ success: true, data });
    } catch (e: any) {
      return c.json({ success: false, message: e.message }, 500);
    }
  }

  async create(c: Context) {
    try {
      const user = c.get('user') as User;
      const body = await c.req.json();
      const data = await this.service.createCustomer(user.id, body);
      return c.json({ success: true, message: 'Customer created', data }, 201);
    } catch (e: any) {
      return c.json({ success: false, message: e.message }, 400);
    }
  }

  async update(c: Context) {
    try {
      const id = Number(c.req.param('id'));
      const body = await c.req.json();
      const data = await this.service.updateCustomer(id, body);
      return c.json({ success: true, message: 'Customer updated', data });
    } catch (e: any) {
      return c.json({ success: false, message: e.message }, 400);
    }
  }

  async delete(c: Context) {
    try {
      const id = Number(c.req.param('id'));
      await this.service.deleteCustomer(id);
      return c.json({ success: true, message: 'Customer deleted' });
    } catch (e: any) {
      return c.json({ success: false, message: e.message }, 400);
    }
  }
}
