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

  // ⚠️ FIX: Hapus [0] karena Repository modern mengembalikan Object atau Null
  async get(id: number) {
    const result = await this.repo.findById(id);
    return result || null;
  }

  async create(data: CreateUserInput) {
    const created = await this.repo.create(data);
    return created; // ⚠️ Hapus [0]
  }

  async update(id: number, data: UpdateUserInput) {
    const updated = await this.repo.update(id, data);
    return updated; // ⚠️ Hapus [0]
  }

  async findByEmail(email: string) {
    const result = await this.repo.findByEmail(email);
    return result || null; // ⚠️ Hapus [0]
  }

  async findByUsername(username: string) {
    const result = await this.repo.findByUsername(username);
    return result || null; // ⚠️ Hapus [0]
  }

  async delete(id: number) {
    const deleted = await this.repo.delete(id);
    return deleted; // ⚠️ Hapus [0]
  }
}