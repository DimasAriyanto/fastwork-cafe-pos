import { Hono } from 'hono';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware'; // Sesuaikan path import

export const transactionRoutes = new Hono();
const controller = new TransactionController();

// 🔒 SEMUA TRANSAKSI BUTUH LOGIN
transactionRoutes.use('*', authenticateToken);

// Route Definitions
transactionRoutes.post('/', authorizeRole(['ADMIN', 'CASHIER']), (c) => controller.create(c)); // Checkout
transactionRoutes.get('/:id', (c) => controller.getDetail(c)); // Detail Struk

transactionRoutes.get('/', (c) => controller.list(c));