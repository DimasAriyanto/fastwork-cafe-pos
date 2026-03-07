import { Hono } from 'hono';
import { DiscountController } from '../controllers/discount.controller.ts';
import { authenticateToken } from '../middleware/auth.middleware.ts';

export const discountRoutes = new Hono();
const discountController = new DiscountController();

discountRoutes.use('*', authenticateToken);

discountRoutes.get('/', (c) => discountController.getAll(c));
discountRoutes.get('/:id', (c) => discountController.getById(c));
discountRoutes.post('/', (c) => discountController.create(c));
discountRoutes.put('/:id', (c) => discountController.update(c));
discountRoutes.delete('/:id', (c) => discountController.delete(c));
