import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';

// Import Routes
import { authRoutes } from './routes/auth.ts';
import { roleRoutes } from './routes/roles.ts';
import { userRoutes } from './routes/users.ts';
import { outletRoutes } from './routes/outlets.ts';
import { employeeRoutes } from './routes/employees.ts';
import { menuRoutes } from './routes/menu.ts';
import { transactionRoutes } from './routes/transactions.ts';
import { customerRoutes } from './routes/customer.ts';

import { checkDatabaseHealth } from './db/index.ts';
import { categoryRoutes } from './routes/category.ts';
import { toppingRoutes } from './routes/topping.ts';
import { discountRoutes } from './routes/discount.ts';
import { reportRoutes } from './routes/reports.ts';
import { salesRoutes } from './routes/sales.ts';

const app = new Hono();

// 1. Static Files (Buat akses foto pegawai)
// Akses: http://localhost:3000/uploads/nama-file.png
app.use('/uploads/*', serveStatic({ root: './' }));

// 2. Middleware
app.use(logger());
app.use(
  '*',
  cors({
    origin: 'http://localhost:5173', // URL Frontend Vite (sesuaikan nanti)
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// 3. Routes Registration
app.route('/api/auth', authRoutes);
app.route('/api/roles', roleRoutes);
app.route('/api/users', userRoutes);
app.route('/api/outlets', outletRoutes);
app.route('/api/employees', employeeRoutes); // 👈 Ini yang support Form-Data
app.route('/api/menus', menuRoutes);
app.route('/api/categories', categoryRoutes);
app.route('/api/toppings', toppingRoutes);
app.route('/api/discounts', discountRoutes);
app.route('/api/customers', customerRoutes);

// ⚠️ FIX: Tambahkan '/' di depan
app.route('/api/transactions', transactionRoutes); 
app.route('/api/reports', reportRoutes);
app.route('/api/sales', salesRoutes);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Not found handler
app.notFound((c) => {
  return c.json({ error: 'Route not found' }, 404);
});

const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize server
async function startServer() {
  try {
    console.log('🔍 Checking database connection...');
    await checkDatabaseHealth();

    console.log(`\n🚀 Server starting on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}`);
    console.log(`🏥 Health check at http://localhost:${PORT}/api/health\n`);
  } catch {
    console.error('\n❌ Failed to start server due to database errors');
    console.error('Please fix the database connection and try again.\n');
    process.exit(1);
  }
}

startServer().then(() => {
  serve({
    fetch: app.fetch,
    port: PORT,
  });
});