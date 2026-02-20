import { RoleRepository } from '../repositories/role.repository.ts';
import type { CreateRoleInput, UpdateRoleInput, PaginationOptions } from '../types/index.ts';

export class RoleService {
  private roleRepo: RoleRepository;

  constructor() {
    this.roleRepo = new RoleRepository();
  }

  async list() {
    return await this.roleRepo.findAll();
  }

  async listWithPagination(options: PaginationOptions = {}) {
    return await this.roleRepo.findAllWithPagination(options);
  }

  // ⚠️ FIX: Hapus [0]
  async get(id: number) {
    const result = await this.roleRepo.findById(id);
    return result || null;
  }

  async create(data: CreateRoleInput) {
    const created = await this.roleRepo.create(data);
    return created; // ⚠️ Hapus [0]
  }

  async update(id: number, data: UpdateRoleInput) {
    const updated = await this.roleRepo.update(id, data);
    return updated; // ⚠️ Hapus [0]
  }

  async delete(id: number) {
    const deleted = await this.roleRepo.delete(id);
    return deleted; // ⚠️ Hapus [0]
  }
}