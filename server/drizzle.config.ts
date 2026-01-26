import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schemas/index.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString:
      process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/cafe_pos',
  },
});
