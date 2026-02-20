import { Hono } from 'hono';
import { OutletController } from '../controllers/outlet.controller.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.ts';

export const outletRoutes = new Hono();
const outletController = new OutletController();

// Public routes (no auth required)
outletRoutes.get('/', (c) => outletController.list(c));
outletRoutes.get('/list', (c) => outletController.listPaginated(c));
outletRoutes.get('/:id', (c) => outletController.get(c));

// Protected routes (requires authentication)
outletRoutes.use('*', authenticateToken);

// Only admin and owner can create/update/delete outlets
outletRoutes.post('/', authorizeRole(['admin', 'owner']), (c) => outletController.create(c));
outletRoutes.put('/:id', authorizeRole(['admin', 'owner']), (c) => outletController.update(c));
outletRoutes.delete('/:id', authorizeRole(['admin', 'owner']), (c) => outletController.remove(c));
