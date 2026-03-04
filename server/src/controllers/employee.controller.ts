import type { Context } from 'hono';
import { EmployeeService } from '../services/employee.service';

export class EmployeeController {
  private service: EmployeeService;

  constructor() {
    this.service = new EmployeeService();
  }

  async index(c: Context) {
    const data = await this.service.getAll();
    return c.json({ success: true, data });
  }

  async store(c: Context) {
    try {
      const body = await c.req.parseBody();
      const name = String(body['name']);
      const position = String(body['position']);
      const photo = body['photo'] instanceof File ? body['photo'] : undefined;
      
      // 👇 PARSING BOOLEAN DARI FORM DATA
      // FormData cuma kirim string, jadi kita cek stringnya
      const isActive = body['isActive'] === 'true'; 

      // New: User account data
      const username = body['username'] ? String(body['username']) : undefined;
      const email = body['email'] ? String(body['email']) : undefined;
      const password = body['password'] ? String(body['password']) : undefined;

      if (!name || !position) {
        return c.json({ success: false, message: "Nama dan Posisi wajib diisi" }, 400);
      }

      // Kita update signature service create biar terima isActive dan userData
      const result = await this.service.create(name, position, isActive, photo, {
        username,
        email,
        password
      });
      return c.json({ success: true, message: "Pegawai ditambah", data: result }, 201);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      return c.json({ success: false, message: msg }, 500);
    }
  }

  async update(c: Context) {
    try {
      const id = Number(c.req.param('id'));
      const body = await c.req.parseBody();
      
      const name = String(body['name']);
      const position = String(body['position']);
      const photo = body['photo'] instanceof File ? body['photo'] : undefined;
      
      // 👇 PARSING BOOLEAN
      const isActive = body['isActive'] === 'true';

      // New: User account data
      const username = body['username'] ? String(body['username']) : undefined;
      const email = body['email'] ? String(body['email']) : undefined;
      const password = body['password'] ? String(body['password']) : undefined;

      const result = await this.service.update(id, name, position, isActive, photo, {
        username,
        email,
        password
      });
      return c.json({ success: true, message: "Pegawai diupdate", data: result });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error";
      return c.json({ success: false, message: msg }, 500);
    }
  }

  async delete(c: Context) {
    const id = Number(c.req.param('id'));
    await this.service.delete(id);
    return c.json({ success: true, message: "Pegawai dihapus" });
  }
}