import { db } from "../db/index";
import { taxes } from "../db/schemas/index";
import { eq, and } from "drizzle-orm";

export class SalesRepository {
  async getActiveTaxes() {
    return await db.select().from(taxes).where(eq(taxes.isActive, true));
  }

  async getAllTaxes() {
    return await db.select().from(taxes);
  }
}
