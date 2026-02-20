import { Hono } from 'hono';
import { CategoryController } from '../controllers/category.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

export const categoryRoutes = new Hono();
const controller = new CategoryController();

// 🔒 Middleware Global untuk route ini: Wajib Login
categoryRoutes.use('*', authenticateToken);

// 📖 Read Access (Owner & Cashier bisa lihat kategori)
categoryRoutes.get('/', (c) => controller.index(c));
categoryRoutes.get('/:id', (c) => controller.show(c));

// 📝 Write Access (Hanya OWNER yang bisa modifikasi)
categoryRoutes.post('/', authorizeRole(['OWNER']), (c) => controller.store(c));
categoryRoutes.put('/:id', authorizeRole(['OWNER']), (c) => controller.update(c));
categoryRoutes.delete('/:id', authorizeRole(['OWNER']), (c) => controller.destroy(c));