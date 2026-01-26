import { UserRepository } from '../repositories/user.repository.ts';
import type { CreateUserInput, UpdateUserInput, PaginationOptions } from '../types/index.ts';

export class UserService {
  private repo: UserRepository;

  constructor() {
    this.repo = new UserRepository();
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

  async create(data: CreateUserInput) {
    const created = await this.repo.create(data);
    return created[0];
  }

  async update(id: number, data: UpdateUserInput) {
    const updated = await this.repo.update(id, data);
    return updated[0];
  }

  async findByEmail(email: string) {
    const r = await this.repo.findByEmail(email);
    return r[0] || null;
  }

  async findByUsername(username: string) {
    const r = await this.repo.findByUsername(username);
    return r[0] || null;
  }

  async delete(id: number) {
    const deleted = await this.repo.delete(id);
    return deleted[0];
  }
}
