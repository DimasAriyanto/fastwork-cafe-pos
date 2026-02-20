import { Context, Next } from 'hono';
import { verifyAccessToken } from '../utils/jwt.ts';
import type { UserContext } from '../types/index.ts'; // 👈 Import Type UserContext

/**
 * Middleware untuk memverifikasi JWT token
 */
export const authenticateToken = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
    }

    const token = authHeader.slice(7); 
    const decoded = verifyAccessToken(token);

    // Kita set user, TypeScript di Hono akan menyimpannya
    c.set('user', decoded);
    await next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: 'Unauthorized: ' + errorMessage }, 401);
  }
};

/**
 * Middleware untuk mengecek role tertentu
 */
export const authorizeRole = (allowedRoles: string | string[]) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (c: Context, next: Next) => {
    try {
      // 👇 TYPE CASTING: Kita kasih tau TS kalau ini adalah UserContext
      const user = c.get('user') as UserContext;

      if (!user) {
        return c.json({ error: 'Unauthorized: User not authenticated' }, 401);
      }

      // Sekarang user.role aman dibaca, gak bakal error merah
      if (!roles.includes(user.role)) {
        return c.json(
          {
            error: `Forbidden: You do not have permission. Required: ${roles.join(', ')}`,
          },
          403,
        );
      }

      await next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      return c.json({ error: 'Forbidden' }, 403);
    }
  };
};