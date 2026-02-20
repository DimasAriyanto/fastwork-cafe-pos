import { Hono } from 'hono';
import { RoleController } from '../controllers/role.controller.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.ts';

export const roleRoutes = new Hono();
const roleController = new RoleController();

// Public routes (no auth required)
roleRoutes.get('/', (c) => roleController.list(c));
roleRoutes.get('/list', (c) => roleController.listPaginated(c));
roleRoutes.get('/:id', (c) => roleController.get(c));

// Protected routes (requires authentication)
roleRoutes.use('*', authenticateToken);

// Only owner can manage roles
roleRoutes.post('/', authorizeRole('owner'), (c) => roleController.create(c));
roleRoutes.put('/:id', authorizeRole('owner'), (c) => roleController.update(c));
roleRoutes.delete('/:id', authorizeRole('owner'), (c) => roleController.remove(c));
