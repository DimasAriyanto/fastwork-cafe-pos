import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;

const DATABASE_URL = `mysql://${DB_USER}:${DB_PASSWORD ? DB_PASSWORD : ''}@${DB_HOST}:${DB_PORT || 3306}/${DB_NAME}`;

export default defineConfig({
  schema: './src/db/schemas/index.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
