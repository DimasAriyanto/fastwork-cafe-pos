import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
const JWT_EXPIRY = (process.env.JWT_EXPIRY || '60m') as string;
const JWT_REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRY || '7d') as string;

// Define payload types
export interface AccessTokenPayload {
  id: number;
  username: string;
  email: string;
  name: string;
  roleId: number;
  role: string;
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

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, accessTokenOptions);
};

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, refreshTokenOptions);
};

export const verifyAccessToken = (token: string): DecodedAccessToken => {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedAccessToken;
  } catch {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): DecodedRefreshToken => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as DecodedRefreshToken;
  } catch {
    throw new Error('Invalid or expired refresh token');
  }
};