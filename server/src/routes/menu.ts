import { Hono } from 'hono';
import { MenuController } from '../controllers/menu.controller.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.ts';

export const menuRoutes = new Hono();
const menuController = new MenuController();

// 🔒 Protected routes (Requires authentication for ALL menu ops)
// Kita wajib pasang auth di awal karena MenuController butuh 'user.outletId' dari token
menuRoutes.use('*', authenticateToken);

// 📖 Read Access (Cashier & Owner bisa akses)
menuRoutes.get('/', (c) => menuController.listPaginated(c));
menuRoutes.get('/:id', (c) => menuController.get(c));

// 📝 Write Access (Only OWNER can Create/Update/Delete)
// Cashier dilarang ngutak-ngatik menu master
menuRoutes.post('/', authorizeRole(['OWNER']), (c) => menuController.create(c));
menuRoutes.put('/:id', authorizeRole(['OWNER']), (c) => menuController.update(c));
menuRoutes.delete('/:id', authorizeRole(['OWNER']), (c) => menuController.remove(c));