import { Hono } from 'hono';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

export const reportRoutes = new Hono();
const controller = new ReportController();

// All report routes require login
reportRoutes.use('*', authenticateToken);
reportRoutes.use('*', authorizeRole(['ADMIN', 'OWNER'])); // Only Admins and Owners can see reports

reportRoutes.get('/dashboard-stats', (c) => controller.getDashboardStats(c));
reportRoutes.get('/revenue-graph', (c) => controller.getRevenueGraph(c));
reportRoutes.get('/financial-summary', (c) => controller.getFinancialSummary(c));
reportRoutes.get('/sales-category', (c) => controller.getSalesByCategory(c));
reportRoutes.get('/sales-product', (c) => controller.getSalesByProduct(c));
