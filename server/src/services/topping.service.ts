import { ToppingRepository } from '../repositories/topping.repository';
import type { CreateToppingRepoInput, UpdateToppingRequest } from '../types/topping';

export class ToppingService {
  private repo: ToppingRepository;

  constructor() {
    this.repo = new ToppingRepository();
  }

  async getAllToppings(outletId: number) {
    return await this.repo.findAll(outletId);
  }

  async getToppingById(id: number) {
    const topping = await this.repo.findById(id);
    if (!topping) throw new Error("Topping tidak ditemukan");
    return topping;
  }

  async createTopping(input: CreateToppingRepoInput) {
    // Bisa tambah validasi bisnis disini kalau perlu
    return await this.repo.create(input);
  }

  async updateTopping(id: number, input: UpdateToppingRequest) {
    // Cek dulu datanya ada gak
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error("Topping tidak ditemukan");

    return await this.repo.update(id, input);
  }

  async deleteTopping(id: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error("Topping tidak ditemukan");

    return await this.repo.delete(id);
  }
}