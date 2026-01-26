import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schemas/index.ts';

interface PostgresError extends Error {
  code?: string;
  detail?: string;
  hint?: string;
}

function isPostgresError(error: unknown): error is PostgresError {
  return error instanceof Error && 'code' in error;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// Function to check database connection and schema
export async function checkDatabaseHealth() {
  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');

    // Test query to check if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const tables = result.rows.map((row) => row.table_name);
    console.log('📋 Existing tables:', tables.length > 0 ? tables.join(', ') : 'No tables found');

    // Check if expected tables exist (sesuaikan dengan schema Anda)
    const expectedTables = ['users', 'roles', 'outlets', 'employees'];
    const missingTables = expectedTables.filter((table) => !tables.includes(table));

    if (missingTables.length > 0) {
      console.warn('⚠️  Missing tables:', missingTables.join(', '));
      console.warn('💡 Run "npm run db:migrate" to create missing tables');
    }

    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    
    if (isPostgresError(error)) {
      console.error('Error:', error.message);

      if (error.code === 'ECONNREFUSED') {
        console.error('\n💡 Possible solutions:');
        console.error('   1. Make sure PostgreSQL is running');
        console.error('   2. Check DATABASE_URL in .env file');
        console.error('   3. Verify database credentials');
      } else if (error.code === '3D000') {
        console.error('\n💡 Database does not exist. Please create it first:');
      } else if (error.code === '28P01') {
        console.error('\n💡 Authentication failed. Check your database credentials in .env');
      }
    } else {
      console.error('Error:', error);
    }

    throw error;
  }
}

// Test connection immediately when module loads
pool.on('error', (err: Error) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(1);
});