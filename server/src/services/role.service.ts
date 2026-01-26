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

  async get(id: number) {
    const r = await this.roleRepo.findById(id);
    return r[0] || null;
  }

  async create(data: CreateRoleInput) {
    const created = await this.roleRepo.create(data);
    return created[0];
  }

  async update(id: number, data: UpdateRoleInput) {
    const updated = await this.roleRepo.update(id, data);
    return updated[0];
  }

  async delete(id: number) {
    const deleted = await this.roleRepo.delete(id);
    return deleted[0];
  }
}
