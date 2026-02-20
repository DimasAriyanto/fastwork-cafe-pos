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
    url: process.env.DATABASE_URL as string,
  },
  
  // Opsional: Biar log-nya lebih detail pas generate
  verbose: true,
  strict: true,
});