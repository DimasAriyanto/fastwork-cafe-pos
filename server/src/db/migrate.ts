import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  console.log('🚀 Starting database migration...');

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log(`📦 Connecting to: ${databaseUrl.replace(/:[^:]*@/, ':****@')}`);

  const client = new pg.Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = join(__dirname, 'migrations.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing migrations...');
    await client.query(migrationSQL);

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

migrate();
