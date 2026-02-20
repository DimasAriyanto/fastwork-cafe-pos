import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Pastikan path schema ini mengarah ke file index yang baru kita buat
  schema: './src/db/schemas/index.ts',
  
  // Folder output hasil generate SQL
  out: './drizzle', 
  
  // PENTING: Ganti driver ke dialect mysql
  dialect: 'mysql',
  
  // PENTING: Gunakan credentials terpisah biar aman & sesuai env sebelumnya
  dbCredentials: {
    host: process.env.DB_HOST as string,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_NAME as string,
    port: Number(process.env.DB_PORT) || 3306,
  },
  
  // Opsional: Biar log-nya lebih detail pas generate
  verbose: true,
  strict: true,
});