import { Hono } from 'hono';
import { EmployeeController } from '../controllers/employee.controller.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware.ts';

export const employeeRoutes = new Hono();
const employeeController = new EmployeeController();

// Public routes (no auth required)
employeeRoutes.get('/', (c) => employeeController.index(c));
// employeeRoutes.get('/list', (c) => employeeController.listPaginated(c));
// employeeRoutes.get('/:id', (c) => employeeController.get(c));

// Protected routes (requires authentication)
employeeRoutes.use('*', authenticateToken);

// Only admin and owner can create/update/delete employees
employeeRoutes.post('/', authorizeRole(['ADMIN', 'OWNER', 'CASHIER']), (c) => employeeController.store(c));
employeeRoutes.put('/:id', authorizeRole(['ADMIN', 'OWNER', 'CASHIER']), (c) => employeeController.update(c));
employeeRoutes.delete('/:id', authorizeRole(['ADMIN', 'OWNER', 'CASHIER']), (c) =>
  employeeController.delete(c),
);
