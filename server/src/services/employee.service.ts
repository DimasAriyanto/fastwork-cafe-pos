import { EmployeeRepository } from '../repositories/employee.repository.ts';
import type { CreateEmployeeInput, UpdateEmployeeInput, PaginationOptions } from '../types/index.ts';

export class EmployeeService {
  private repo: EmployeeRepository;

  constructor() {
    this.repo = new EmployeeRepository();
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

  async getByUserId(userId: number) {
    const r = await this.repo.findByUserId(userId);
    return r[0] || null;
  }

  async create(data: CreateEmployeeInput) {
    const created = await this.repo.create(data);
    return created[0];
  }

  async update(id: number, data: UpdateEmployeeInput) {
    const updated = await this.repo.update(id, data);
    return updated[0];
  }

  async delete(id: number) {
    const deleted = await this.repo.delete(id);
    return deleted[0];
  }
}
