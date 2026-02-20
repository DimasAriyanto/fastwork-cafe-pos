/* eslint-disable @typescript-eslint/no-unused-vars */
import { AuthService } from '../services/auth.service.ts';
import type { Context } from 'hono';
import { User } from '../types/index.ts';
import { RoleRepository } from '../repositories/role.repository';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * POST /auth/login
   * Menangani proses masuk user. Jika sukses, mengembalikan Access Token & Refresh Token.
   */
  async login(c: Context) {
    try {
      const body = await c.req.json();
      const { username, password } = body;

      if (!username || !password) {
        return c.json({ error: 'Mohon lengkapi username dan password.' }, 400);
      }

      const result = await this.authService.login(username, password);

      return c.json({
        success: true,
        message: "Login berhasil.",
        data: result,
      });
    } catch (error) {
      console.error("Login Error:", error);
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan sistem.';

      // Return 401 jika password salah atau user tidak ada
      if (message.includes('not found') || message === 'Invalid password') {
        return c.json({ error: 'Username atau password salah.' }, 401);
      }

      return c.json({ error: message }, 500);
    }
  }

  /**
   * POST /auth/register
   * Pendaftaran user baru (Default role bisa diatur di Service).
   */
  async register(c: Context) {
    try {
      const body = await c.req.json();
      const { email, password, name, username, roleId } = body;

      if (!email || !password || !name) {
        return c.json({ error: 'Email, password, dan nama wajib diisi.' }, 400);
      }

      const result = await this.authService.register(username || '', email, password, name, roleId || 1);

      return c.json(
        {
          success: true,
          message: "Registrasi berhasil.",
          data: result,
        },
        201,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal registrasi.';
      if (message.includes('already exists')) {
        return c.json({ error: 'Username atau Email sudah terdaftar.' }, 400);
      }
      return c.json({ error: message }, 500);
    }
  }

  /**
   * POST /auth/logout
   * Menghapus Refresh Token dari database agar tidak bisa dipakai login ulang.
   */
  async logout(c: Context) {
    try {
      const body = await c.req.json();
      const { refreshToken } = body;

      if (!refreshToken) {
        return c.json({ error: 'Refresh token diperlukan.' }, 400);
      }

      await this.authService.logout(refreshToken);

      return c.json({
        success: true,
        message: 'Logout berhasil.',
      });
    } catch (error) {
      return c.json({ error: 'Gagal logout.' }, 500);
    }
  }

  /**
   * POST /auth/refresh
   * Meminta Access Token baru menggunakan Refresh Token yang valid.
   */
  async refresh(c: Context) {
    try {
      const body = await c.req.json();
      const { refreshToken } = body;

      if (!refreshToken) {
        return c.json({ error: 'Refresh token diperlukan.' }, 400);
      }

      const result = await this.authService.refreshAccessToken(refreshToken);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return c.json({ error: 'Sesi berakhir, silakan login ulang.' }, 401);
    }
  }

  /**
   * GET /auth/me
   * Mendapatkan profil user yang sedang login berdasarkan Token.
   */
  async getMe(c: Context) {
    try {
      const user = c.get('user') as User;
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const userData = await this.authService.getUserById(user.id);
      return c.json({ success: true, data: userData });
    } catch (error) {
      return c.json({ error: 'Gagal memuat profil.' }, 401);
    }
  }

  async seedUsers(c: Context) {
    const roleRepo = new RoleRepository();
    
    // 1. Pastikan Role OWNER & CASHIER ada
    let ownerRole = await roleRepo.findByName('owner');
    if (!ownerRole) {
      ownerRole = await roleRepo.create({ name: 'owner', description: 'Pemilik Toko' });
    }

    let cashierRole = await roleRepo.findByName('cashier');
    if (!cashierRole) {
      cashierRole = await roleRepo.create({ name: 'cashier', description: 'Kasir Toko' });
    }

    // 2. Buat User Dummy (Cek dulu biar gak duplikat error)
    try {
      // Register Owner (Role ID dinamis dari DB)
      await this.authService.register('owner', 'owner@jagoeng.com', 'owner123', 'Bos Besar', ownerRole.id);
      
      // Register Cashier
      await this.authService.register('cashier', 'cashier@jagoeng.com', 'cashier123', 'Kasir Andalan', cashierRole.id);
      
      return c.json({ message: 'Seeding Berhasil! User: owner/owner123 & cashier/cashier123' });
    } catch (e) {
      return c.json({ message: 'Seeding mungkin sudah pernah dilakukan.', error: e instanceof Error ? e.message : e });
    }
  }
}
