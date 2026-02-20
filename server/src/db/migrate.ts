import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  console.log('🚀 Starting advanced database migration...');

  // 1. Cek Config
  if (!process.env.DB_HOST || !process.env.DB_NAME) {
    console.error('❌ Database configuration missing in .env');
    process.exit(1);
  }

  let connection;

  try {
    // 2. Connect ke Database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT) || 3306,
      // multipleStatements TIDAK PERLU true karena kita kirim satu-satu
      multipleStatements: false 
    });

    console.log(`✅ Connected to ${process.env.DB_NAME}`);

    // 3. Baca File SQL
    const migrationPath = join(__dirname, 'migrations.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // 4. SPLIT LOGIC: Potong kue berdasarkan marker '---SPLIT---'
    const statements = migrationSQL.split('---SPLIT---');

    console.log(`📝 Found ${statements.length} SQL blocks to execute.`);

    // 5. Eksekusi Satu per Satu
    for (const statement of statements) {
        const query = statement.trim();
        
        // Skip kalau kosong (misal split terakhir)
        if (!query) continue;

        try {
            await connection.query(query);
        } catch (err: any) {
            // Abaikan error "Duplicate column" atau sejenisnya biar gak stop di tengah jalan
            if (err.code === 'ER_DUP_KEYNAME') {
                console.warn('   ⚠️ Index already exists, skipping...');
            } else {
                console.error('   ❌ Failed at query chunk:');
                console.error(query.substring(0, 50) + '...'); // Print 50 char pertama aja biar gak nyepam
                throw err; // Lempar error biar script stop
            }
        }
    }

    console.log('✅ All migrations executed successfully!');
  } catch (error) {
    console.error('❌ Fatal Error:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

migrate();