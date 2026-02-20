/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Context } from 'hono';
import { ToppingService } from '../services/topping.service'; // 👈 Ganti Import
import type { UserContext } from '../types/index';

export class ToppingController {
  private service: ToppingService; // 👈 Ganti Property

  constructor() {
    this.service = new ToppingService(); // 👈 Init Service
  }

  // GET /api/toppings
  async index(c: Context) {
    const user = c.get('user') as UserContext;
    const outletId = user.outletId || 1;

    const data = await this.service.getAllToppings(outletId); // 👈 Panggil Service
    return c.json({ success: true, data });
  }

  // POST /api/toppings
  async store(c: Context) {
    try {
      const user = c.get('user') as UserContext;
      const body = await c.req.json();
      
      if (!body.name || body.price === undefined) {
        return c.json({ success: false, message: "Nama dan Harga wajib diisi" }, 400);
      }

      const newTopping = await this.service.createTopping({ // 👈 Panggil Service
        name: body.name,
        price: body.price.toString(),
        outletId: user.outletId || 1,
        isAvailable: true
      });

      return c.json({ success: true, message: "Topping berhasil ditambah", data: newTopping }, 201);
    } catch (e: any) {
      return c.json({ success: false, message: e.message }, 500);
    }
  }

  // PUT /api/toppings/:id
  async update(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();
      
      const updated = await this.service.updateTopping(id, body); // 👈 Panggil Service
      return c.json({ success: true, message: "Topping diupdate", data: updated });
    } catch (e: any) {
      // Kalau error "Topping tidak ditemukan" dari service, return 404
      const status = e.message.includes("tidak ditemukan") ? 404 : 500;
      return c.json({ success: false, message: e.message }, status);
    }
  }

  // DELETE /api/toppings/:id
  async delete(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      await this.service.deleteTopping(id); // 👈 Panggil Service
      return c.json({ success: true, message: "Topping dihapus" });
    } catch (e: any) {
      const status = e.message.includes("tidak ditemukan") ? 404 : 500;
      return c.json({ success: false, message: e.message }, status);
    }
  }
}