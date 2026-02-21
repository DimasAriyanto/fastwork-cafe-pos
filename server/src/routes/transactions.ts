import { Hono } from 'hono';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

export const transactionRoutes = new Hono();
const controller = new TransactionController();

// All transaction routes require login
transactionRoutes.use('*', authenticateToken);

// Unpaid orders (pesanan belum dibayar)
transactionRoutes.get('/unpaid', (c) => controller.getUnpaidOrders(c));

// Pay a pending order
transactionRoutes.post('/:id/pay', authorizeRole(['ADMIN', 'CASHIER']), (c) => controller.payOrder(c));

// Create pending order (checkout from POS)
transactionRoutes.post('/order', authorizeRole(['ADMIN', 'CASHIER']), (c) => controller.createOrder(c));

// Legacy: direct checkout (items + pay at once)
transactionRoutes.post('/', authorizeRole(['ADMIN', 'CASHIER']), (c) => controller.create(c));

// Get detail
transactionRoutes.get('/:id', (c) => controller.getDetail(c));

// Transaction history (paid)
transactionRoutes.get('/', (c) => controller.list(c));