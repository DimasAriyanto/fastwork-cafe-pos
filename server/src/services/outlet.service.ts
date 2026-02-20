import { OutletRepository } from '../repositories/outlet.repository.ts';
import type { CreateOutletInput, UpdateOutletInput, PaginationOptions } from '../types/index.ts';

export class OutletService {
  private repo: OutletRepository;

  constructor() {
    this.repo = new OutletRepository();
  }

  async list() {
    return await this.repo.findAll();
  }

  async listWithPagination(options: PaginationOptions = {}) {
    return await this.repo.findAllWithPagination(options);
  }

  async get(id: number) {
    // ⚠️ FIX: Repo returns single object
    const result = await this.repo.findById(id);
    return result || null;
  }

  async create(data: CreateOutletInput) {
    // ⚠️ FIX: Remove [0]
    const created = await this.repo.create(data);
    return created;
  }

  async update(id: number, data: UpdateOutletInput) {
    const updated = await this.repo.update(id, data);
    return updated;
  }

  async delete(id: number) {
    const deleted = await this.repo.delete(id);
    return deleted;
  }
}
