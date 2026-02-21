import { db } from "../db/index";
import { customers } from "../db/schemas/index";
import { eq, like, or, desc } from "drizzle-orm";

export class CustomerRepository {
  async findAll() {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async findById(id: number) {
    const [result] = await db.select().from(customers).where(eq(customers.id, id));
    return result || null;
  }

  async findByNameOrPhone(query: string) {
    return await db
      .select()
      .from(customers)
      .where(
        or(
          like(customers.name, `%${query}%`),
          like(customers.phoneNumber, `%${query}%`)
        )
      )
      .limit(10);
  }

  async create(data: any) {
    const [result] = await db.insert(customers).values(data);
    return { id: result.insertId, ...data };
  }

  async update(id: number, data: any) {
    await db.update(customers).set(data).where(eq(customers.id, id));
    return this.findById(id);
  }

  async delete(id: number) {
    await db.delete(customers).where(eq(customers.id, id));
    return true;
  }
}
