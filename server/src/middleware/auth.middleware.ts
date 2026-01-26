import { Context, Next } from 'hono';
import { verifyAccessToken } from '../utils/jwt.ts';

/**
 * Middleware untuk memverifikasi JWT token
 * Menambahkan user info ke context
 */
export const authenticateToken = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
    }

    const token = authHeader.slice(7); // Remove 'Bearer '
    const decoded = verifyAccessToken(token);

    // Attach user info ke context
    c.set('user', decoded);
    await next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Auth middleware error:', errorMessage);
    return c.json({ error: 'Unauthorized: ' + errorMessage }, 401);
  }
};

/**
 * Middleware untuk mengecek role tertentu
 * @param {string|string[]} allowedRoles - Role yang diizinkan
 */
export const authorizeRole = (allowedRoles: string | string[]) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (c: Context, next: Next) => {
    try {
      const user = c.get('user');

      if (!user) {
        return c.json({ error: 'Unauthorized: User not authenticated' }, 401);
      }

      if (!roles.includes(user.role)) {
        return c.json(
          {
            error: `Forbidden: You do not have permission to access this resource. Required role: ${roles.join(', ')}`,
          },
          403,
        );
      }

      await next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Authorization middleware error:', errorMessage);
      return c.json({ error: 'Forbidden' }, 403);
    }
  };
};