import { Hono } from 'hono';
import { AuthController } from '../controllers/auth.controller.ts';
import { authenticateToken } from '../middleware/auth.middleware.ts';

export const authRoutes = new Hono();
const authController = new AuthController();

// Public routes (no auth required)
authRoutes.post('/login', (c) => authController.login(c));
// authRoutes.post('/register', (c) => authController.register(c));
authRoutes.post('/refresh', (c) => authController.refresh(c));

// Protected routes (requires authentication)
authRoutes.use('/logout', authenticateToken);
authRoutes.use('/me', authenticateToken);

authRoutes.post('/logout', (c) => authController.logout(c));
authRoutes.get('/me', (c) => authController.getMe(c));
