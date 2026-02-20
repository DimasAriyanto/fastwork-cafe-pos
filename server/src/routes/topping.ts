import { Hono } from 'hono';
import { ToppingController } from '../controllers/topping.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

export const toppingRoutes = new Hono();
const controller = new ToppingController();

toppingRoutes.use('*', authenticateToken);

toppingRoutes.get('/', (c) => controller.index(c));
toppingRoutes.post('/', authorizeRole(['OWNER']), (c) => controller.store(c));
toppingRoutes.put('/:id', authorizeRole(['OWNER']), (c) => controller.update(c));
toppingRoutes.delete('/:id', authorizeRole(['OWNER']), (c) => controller.delete(c));