import { Hono } from 'hono';
import { CustomerController } from '../controllers/customer.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

export const customerRoutes = new Hono();
const controller = new CustomerController();

customerRoutes.use('*', authenticateToken);

customerRoutes.get('/', (c) => controller.list(c));
customerRoutes.get('/:id', (c) => controller.getDetail(c));
customerRoutes.post('/', authorizeRole(['ADMIN', 'OWNER', 'CASHIER']), (c) => controller.create(c));
customerRoutes.put('/:id', authorizeRole(['ADMIN', 'OWNER']), (c) => controller.update(c));
customerRoutes.delete('/:id', authorizeRole(['ADMIN', 'OWNER']), (c) => controller.delete(c));
