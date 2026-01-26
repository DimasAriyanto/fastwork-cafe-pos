import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { authRoutes } from './routes/auth.ts';
import { roleRoutes } from './routes/roles.ts';
import { userRoutes } from './routes/users.ts';
import { outletRoutes } from './routes/outlets.ts';
import { employeeRoutes } from './routes/employees.ts';
import { checkDatabaseHealth } from './db/index.ts';

const app = new Hono();

// Middleware
app.use(logger());
app.use(
  '*',
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/roles', roleRoutes);
app.route('/api/users', userRoutes);
app.route('/api/outlets', outletRoutes);
app.route('/api/employees', employeeRoutes);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Not found handler
app.notFound((c) => {
  return c.json({ error: 'Route not found' }, 404);
});

const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize server with database health check
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

// Start server with HTTP listener
startServer().then(() => {
  serve({
    fetch: app.fetch,
    port: PORT,
  });
});
