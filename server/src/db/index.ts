/* eslint-disable @typescript-eslint/no-explicit-any */
// import 'dotenv/config';
// import { drizzle } from 'drizzle-orm/node-postgres';
// import * as schema from './schemas/index.ts';
// import mysql from 'mysql2/promise';

// interface PostgresError extends Error {
//   code?: string;
//   detail?: string;
//   hint?: string;
// }

// function isPostgresError(error: unknown): error is PostgresError {
//   return error instanceof Error && 'code' in error;
// }

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// export const db = drizzle(pool, { schema });

// // Function to check database connection and schema
// export async function checkDatabaseHealth() {
//   try {
//     // Test basic connection
//     const client = await pool.connect();
//     console.log('✅ Database connection successful');

//     // Test query to check if tables exist
//     const result = await client.query(`
//       SELECT table_name 
//       FROM information_schema.tables 
//       WHERE table_schema = 'public'
//     `);

//     const tables = result.rows.map((row) => row.table_name);
//     console.log('📋 Existing tables:', tables.length > 0 ? tables.join(', ') : 'No tables found');

//     // Check if expected tables exist (sesuaikan dengan schema Anda)
//     const expectedTables = ['users', 'roles', 'outlets', 'employees'];
//     const missingTables = expectedTables.filter((table) => !tables.includes(table));

//     if (missingTables.length > 0) {
//       console.warn('⚠️  Missing tables:', missingTables.join(', '));
//       console.warn('💡 Run "npm run db:migrate" to create missing tables');
//     }

//     client.release();
//     return true;
//   } catch (error) {
//     console.error('❌ Database connection failed:');
    
//     if (isPostgresError(error)) {
//       console.error('Error:', error.message);

//       if (error.code === 'ECONNREFUSED') {
//         console.error('\n💡 Possible solutions:');
//         console.error('   1. Make sure PostgreSQL is running');
//         console.error('   2. Check DATABASE_URL in .env file');
//         console.error('   3. Verify database credentials');
//       } else if (error.code === '3D000') {
//         console.error('\n💡 Database does not exist. Please create it first:');
//       } else if (error.code === '28P01') {
//         console.error('\n💡 Authentication failed. Check your database credentials in .env');
//       }
//     } else {
//       console.error('Error:', error);
//     }

//     throw error;
//   }
// }

// // Test connection immediately when module loads
// pool.on('error', (err: Error) => {
//   console.error('❌ Unexpected database error:', err);
//   process.exit(1);
// });

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schemas/index'; // Pastikan path ini benar

// Interface Error khusus MySQL
interface MySQLError extends Error {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

function isMySQLError(error: unknown): error is MySQLError {
  return error instanceof Error && ('code' in error || 'errno' in error);
}

// Setup Connection Pool MySQL
// Pastikan variabel di .env sudah sesuai (DB_HOST, DB_USER, dll)
const poolConnection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Inisialisasi Drizzle dengan mode 'default'
export const db = drizzle(poolConnection, { schema, mode: 'default' });

// Function to check database connection and schema (MySQL Version)
export async function checkDatabaseHealth() {
  let connection;
  try {
    // 1. Test basic connection
    connection = await poolConnection.getConnection();
    console.log('✅ Database connection successful');

    // 2. Test query to check if tables exist (MySQL Style)
    // "SHOW TABLES" jauh lebih simpel daripada query information_schema di Postgres
    const [rows] = await connection.query('SHOW TABLES');
    
    // Convert hasil query (Array of objects) jadi array string nama tabel
    // Object.values(row)[0] mengambil value pertama dari row (biasanya sih nama tabel)
    const tables = (rows as any[]).map((row) => Object.values(row)[0] as string);
    
    console.log('📋 Existing tables:', tables.length > 0 ? tables.join(', ') : 'No tables found');

    // 3. Check if expected tables exist
    // Sesuaikan list ini dengan schema tabel yang Wajib ada di aplikasi POS
    const expectedTables = ['users', 'roles', 'employees', 'outlets']; // Contoh tabel core
    const missingTables = expectedTables.filter((table) => !tables.includes(table));

    if (missingTables.length > 0) {
      console.warn('⚠️  Missing tables:', missingTables.join(', '));
      console.warn('💡 Run "npm run db:push" or migration command to create missing tables');
    }

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    
    if (isMySQLError(error)) {
      console.error('Error Code:', error.code);
      console.error('Message:', error.message);

      // Mapping Error Code MySQL
      if (error.code === 'ECONNREFUSED') {
        console.error('\n💡 Possible solutions:');
        console.error('   1. Make sure MySQL Server is running (XAMPP/Laragon/VPS)');
        console.error('   2. Check DB_HOST and DB_PORT in .env');
      } else if (error.code === 'ER_BAD_DB_ERROR' || error.errno === 1049) {
        console.error(`\n💡 Database "${process.env.DB_NAME}" does not exist.`);
        console.error('   Please create the database first in phpMyAdmin or CLI.');
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.errno === 1045) {
        console.error('\n💡 Authentication failed.');
        console.error('   Check DB_USER and DB_PASSWORD in your .env file.');
      }
    } else {
      console.error('Error:', error);
    }

    throw error;
  } finally {
    // Selalu release koneksi balik ke pool supaya gak memory leak
    if (connection) connection.release();
  }
}

// Listener kalau pool-nya error mendadak
(poolConnection as any).on('error', (err: any) => {
  console.error('❌ Unexpected database pool error:', err);
  // Jangan langsung process.exit(1) di production kalau bisa di-handle, 
  // tapi untuk init awal boleh lah.
});