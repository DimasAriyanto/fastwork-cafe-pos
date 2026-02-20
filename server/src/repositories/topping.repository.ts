import { db } from '../db/index';
import { toppings } from '../db/schemas/index';
import { eq, desc } from 'drizzle-orm';
import type { CreateToppingRepoInput, UpdateToppingRequest } from '../types/topping';

export class ToppingRepository {
  
  // ✅ FIND ALL
  async findAll(outletId: number) {
    // Ambil semua topping berdasarkan outletId
    const data = await db
      .select()
      .from(toppings)
      .where(eq(toppings.outletId, outletId))
      .orderBy(desc(toppings.id)); // Urutkan dari yang terbaru

    // Convert decimal string to clean string (remove .00)
    return data.map(t => ({
      ...t,
      price: parseFloat(t.price).toString()
    }));
  }

  // ✅ FIND BY ID
  async findById(id: number) {
    const [topping] = await db
      .select()
      .from(toppings)
      .where(eq(toppings.id, id))
      .limit(1);
    return topping ? { ...topping, price: parseFloat(topping.price).toString() } : null;
  }

  // ✅ CREATE
  async create(data: CreateToppingRepoInput) {
    const [result] = await db.insert(toppings).values(data);
    return this.findById(result.insertId);
  }

  // ✅ UPDATE
  async update(id: number, data: UpdateToppingRequest) {
    await db
      .update(toppings)
      .set(data)
      .where(eq(toppings.id, id));
    return this.findById(id);
  }

  // ✅ DELETE
  async delete(id: number) {
    await db.delete(toppings).where(eq(toppings.id, id));
    return { id };
  }
}