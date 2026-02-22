import { Hono } from 'hono';
import { SalesController } from '../controllers/sales.controller';
import { authenticateToken } from '../middleware/auth.middleware';

export const salesRoutes = new Hono();
const controller = new SalesController();

// Protect routes
salesRoutes.use('*', authenticateToken);

// Get active taxes
salesRoutes.get('/taxes', (c) => controller.getActiveTaxes(c));
