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
    const r = await this.repo.findById(id);
    return r[0] || null;
  }

  async create(data: CreateOutletInput) {
    const created = await this.repo.create(data);
    return created[0];
  }

  async update(id: number, data: UpdateOutletInput) {
    const updated = await this.repo.update(id, data);
    return updated[0];
  }

  async delete(id: number) {
    const deleted = await this.repo.delete(id);
    return deleted[0];
  }
}
