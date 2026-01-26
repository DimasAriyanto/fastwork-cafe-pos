import { AuthService } from '../services/auth.service.ts';
import type { Context } from 'hono';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async login(c: Context) {
    try {
      const body = await c.req.json();
      const { username, password } = body;

      if (!username || !password) {
        return c.json({ error: 'Username and password required' }, 400);
      }

      const result = await this.authService.login(username, password);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Internal server error';

      if (message.includes('not found') || message === 'Invalid password') {
        return c.json({ error: message }, 401);
      }

      return c.json({ error: message }, 500);
    }
  }

  async register(c: Context) {
    try {
      const body = await c.req.json();
      const { email, password, name, username, roleId } = body;

      if (!email || !password || !name) {
        return c.json({ error: 'Email, password, and name are required' }, 400);
      }

      const result = await this.authService.register(username || '', email, password, name, roleId || 1);

      return c.json(
        {
          success: true,
          data: result,
        },
        201,
      );
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Internal server error';

      if (message.includes('already exists')) {
        return c.json({ error: message }, 400);
      }

      return c.json({ error: message }, 500);
    }
  }

  async logout(c: Context) {
    try {
      const body = await c.req.json();
      const { refreshToken } = body;

      if (!refreshToken) {
        return c.json({ error: 'Refresh token required' }, 400);
      }

      await this.authService.logout(refreshToken);

      return c.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Logout failed';
      return c.json({ error: message }, 500);
    }
  }

  async refresh(c: Context) {
    try {
      const body = await c.req.json();
      const { refreshToken } = body;

      if (!refreshToken) {
        return c.json({ error: 'Refresh token required' }, 400);
      }

      const result = await this.authService.refreshAccessToken(refreshToken);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      return c.json({ error: message }, 401);
    }
  }

  async getMe(c: Context) {
    try {
      const user = c.get('user');

      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const userData = await this.authService.getUserById(user.id);

      return c.json({
        success: true,
        data: userData,
      });
    } catch (error) {
      console.error(error);
      return c.json({ error: 'Unauthorized' }, 401);
    }
  }
}
