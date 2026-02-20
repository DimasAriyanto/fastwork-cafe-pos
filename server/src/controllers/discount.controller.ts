import type { Context } from 'hono';
import { DiscountService } from '../services/discount.service.ts';

export class DiscountController {
  private discountService: DiscountService;

  constructor() {
    this.discountService = new DiscountService();
  }

  async getAll(c: Context) {
    try {
      const results = await this.discountService.getAllDiscounts();
      return c.json({ success: true, data: results });
    } catch (error) {
      return c.json({ success: false, error: (error as Error).message }, 500);
    }
  }

  async getById(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      const result = await this.discountService.getDiscountById(id);
      return c.json({ success: true, data: result });
    } catch (error) {
      return c.json({ success: false, error: (error as Error).message }, 404);
    }
  }

  async create(c: Context) {
    try {
      const body = await c.req.json();
      const result = await this.discountService.createDiscount(body);
      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return c.json({ success: false, error: (error as Error).message }, 400);
    }
  }

  async update(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();
      const result = await this.discountService.updateDiscount(id, body);
      return c.json({ success: true, data: result });
    } catch (error) {
      return c.json({ success: false, error: (error as Error).message }, 400);
    }
  }

  async delete(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      await this.discountService.deleteDiscount(id);
      return c.json({ success: true, message: 'Discount deleted' });
    } catch (error) {
      return c.json({ success: false, error: (error as Error).message }, 404);
    }
  }

  async getByCode(c: Context) {
    try {
      const code = c.req.param('code');
      const result = await this.discountService.getDiscountByCode(code);
      return c.json({ success: true, data: result });
    } catch (error) {
      return c.json({ success: false, error: (error as Error).message }, 404);
    }
  }
}
