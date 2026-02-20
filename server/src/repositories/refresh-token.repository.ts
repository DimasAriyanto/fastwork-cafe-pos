import { db } from '../db/index.ts';
import { refreshTokens } from '../db/schemas/index.ts';
import { eq } from 'drizzle-orm';

export class RefreshTokenRepository {
  async create(userId: number, token: string, expiresAt: Date) {
    // MySQL Insert
    await db.insert(refreshTokens).values({
      userId,
      token,
      expiresAt,
    });
    // Gak perlu return data lengkap buat refresh token, cukup void
  }

  async findByToken(token: string) {
    // Return single object (bukan array)
    const [result] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token)).limit(1);
    return result;
  }

  async findByUserId(userId: number) {
    return await db.select().from(refreshTokens).where(eq(refreshTokens.userId, userId));
  }

  async deleteByToken(token: string) {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  }

  async deleteByUserId(userId: number) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }

  async isTokenValid(token: string): Promise<boolean> {
    const tokenRecord = await this.findByToken(token);
    
    if (!tokenRecord) {
      return false;
    }

    return new Date() <= tokenRecord.expiresAt;
  }
}