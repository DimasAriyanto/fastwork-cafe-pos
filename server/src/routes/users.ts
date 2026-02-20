import { Hono } from 'hono';
import { UserController } from '../controllers/user.controller.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.ts';

export const userRoutes = new Hono();
const userController = new UserController();

// Public routes (no auth required)
userRoutes.get('/', (c) => userController.list(c));
userRoutes.get('/list', (c) => userController.listPaginated(c));
userRoutes.get('/:id', (c) => userController.get(c));

// Protected routes (requires authentication)
userRoutes.use('*', authenticateToken);

// Only admin and owner can create/update/delete users
userRoutes.post('/', authorizeRole(['admin', 'owner']), (c) => userController.create(c));
userRoutes.put('/:id', authorizeRole(['admin', 'owner']), (c) => userController.update(c));
userRoutes.delete('/:id', authorizeRole(['admin', 'owner']), (c) => userController.remove(c));
