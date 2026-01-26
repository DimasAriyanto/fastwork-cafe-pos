import { db } from '../db/index.ts';
import { refreshTokens } from '../db/schemas/index.ts';
import { eq } from 'drizzle-orm';

export class RefreshTokenRepository {
  async create(userId: number, token: string, expiresAt: Date) {
    return await db.insert(refreshTokens).values({
      userId,
      token,
      expiresAt,
    });
  }

  async findByToken(token: string) {
    return await db.select().from(refreshTokens).where(eq(refreshTokens.token, token)).limit(1);
  }

  async findByUserId(userId: number) {
    return await db.select().from(refreshTokens).where(eq(refreshTokens.userId, userId));
  }

  async deleteByToken(token: string) {
    return await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  }

  async deleteByUserId(userId: number) {
    return await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
  }

  async isTokenValid(token: string): Promise<boolean> {
    const result = await this.findByToken(token);
    if (result.length === 0) {
      return false;
    }

    const tokenRecord = result[0];
    return new Date() <= tokenRecord.expiresAt;
  }
}
