/* eslint-disable @typescript-eslint/no-unused-vars */
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';

/**
 * ------------------------------------------------------------------
 * JWT CONFIGURATION
 * ------------------------------------------------------------------
 * Mengambil konfigurasi rahasia dari Environment Variable.
 * Fallback string disediakan hanya untuk Development mode.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
const JWT_EXPIRY = (process.env.JWT_EXPIRY || '60m') as string; // Default: 1 Jam
const JWT_REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRY || '7d') as string; // Default: 7 Hari

/**
 * Tipe data payload yang akan disimpan di dalam Token.
 * Pastikan tidak menyimpan data sensitif seperti password di sini.
 */
export interface AccessTokenPayload {
  id: number;
  username: string;
  email: string;
  name: string;
  roleId: number;
  role: string;
  outletId: number;
}

export interface RefreshTokenPayload {
  id: number;
  email: string;
}

export interface DecodedAccessToken extends AccessTokenPayload {
  iat: number;
  exp: number;
}

export interface DecodedRefreshToken extends RefreshTokenPayload {
  iat: number;
  exp: number;
}

const accessTokenOptions: SignOptions = {
  expiresIn: JWT_EXPIRY as unknown as number | StringValue,
};

const refreshTokenOptions: SignOptions = {
  expiresIn: JWT_REFRESH_EXPIRY as unknown as number | StringValue,
};

/**
 * Membuat Access Token (Short-lived).
 * Digunakan untuk otentikasi setiap request API.
 */
export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, accessTokenOptions);
};

/**
 * Membuat Refresh Token (Long-lived).
 * Digunakan untuk mendapatkan Access Token baru ketika yang lama expired.
 */
export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, refreshTokenOptions);
};

/**
 * Memverifikasi validitas Access Token.
 * Akan throw error jika token expired atau signature salah.
 */
export const verifyAccessToken = (token: string): DecodedAccessToken => {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedAccessToken;
  } catch (error) {
    throw new Error('Akses ditolak: Token tidak valid atau sudah kadaluarsa.');
  }
};

/**
 * Memverifikasi validitas Refresh Token.
 * Digunakan pada endpoint /refresh-token.
 */
export const verifyRefreshToken = (token: string): DecodedRefreshToken => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as DecodedRefreshToken;
  } catch (error) {
    throw new Error('Sesi berakhir: Silakan login kembali.');
  }
};