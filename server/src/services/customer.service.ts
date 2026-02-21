import { CustomerRepository } from '../repositories/customer.repository';

export class CustomerService {
  private repo: CustomerRepository;

  constructor() {
    this.repo = new CustomerRepository();
  }

  async getAllCustomers() {
    return await this.repo.findAll();
  }

  async getCustomerById(id: number) {
    return await this.repo.findById(id);
  }

  async searchCustomers(query: string) {
    if (!query) return [];
    return await this.repo.findByNameOrPhone(query);
  }

  async createCustomer(userId: number, data: any) {
    if (!data.name) throw new Error("Nama pelanggan wajib diisi.");
    return await this.repo.create({
      ...data,
      createdBy: userId,
    });
  }

  async updateCustomer(id: number, data: any) {
    return await this.repo.update(id, data);
  }

  async deleteCustomer(id: number) {
    return await this.repo.delete(id);
  }
}
