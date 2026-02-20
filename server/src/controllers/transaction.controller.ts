/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Context } from 'hono';
import { TransactionService } from '../services/transaction.service'; // Hapus .ts
import type { CreateTransactionRequest, User } from '../types/index';

export class TransactionController {
  private service: TransactionService;

  constructor() {
    this.service = new TransactionService();
  }

  // GET History
  async list(c: Context) {
    try {
      const page = Number(c.req.query('page')) || 1;
      const limit = Number(c.req.query('limit')) || 20;
      const user = c.get('user') as User; 
      const outletId = user?.outletId || 1; 

      const data = await this.service.getTransactionHistory(outletId, page, limit);

      return c.json({ success: true, data, meta: { page, limit } });
    } catch (e: any) {
      return c.json({ success: false, message: e.message }, 500);
    }
  }

  // CREATE Transaction
  async create(c: Context) {
    try {
      const user = c.get('user') as User;
      if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

      const outletId = user.outletId || 1;
      const body = await c.req.json<CreateTransactionRequest>();

      // Panggil Service
      const result = await this.service.createTransaction(user.id, outletId, body);

      return c.json({
        success: true,
        message: "Transaksi Berhasil!",
        data: result
      }, 201);

    } catch (e: any) {
      console.error("Transaction Error:", e);
      return c.json({ success: false, message: e.message }, 400);
    }
  }

  // GET Detail
  async getDetail(c: Context) {
    try {
      const id = Number(c.req.param('id'));
      if (isNaN(id)) return c.json({ success: false, message: "Invalid ID" }, 400);

      const result = await this.service.getTransactionDetail(id);
      return c.json({ success: true, data: result });
    } catch (e: any) {
      return c.json({ success: false, message: e.message }, 404);
    }
  }
}