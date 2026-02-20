import { DiscountRepository } from '../repositories/discount.repository.ts';

export class DiscountService {
  private discountRepository: DiscountRepository;

  constructor() {
    this.discountRepository = new DiscountRepository();
  }

  async getAllDiscounts() {
    return await this.discountRepository.findAll();
  }

  async getDiscountById(id: number) {
    const discount = await this.discountRepository.findById(id);
    if (!discount) throw new Error('Discount not found');
    return discount;
  }

  async getDiscountByCode(code: string) {
    const discount = await this.discountRepository.findByCode(code);
    if (!discount) throw new Error('Discount code not found');
    return discount;
  }

  async createDiscount(data: any) {
    // Check if code already exists if provided
    if (data.code) {
      const existing = await this.discountRepository.findByCode(data.code);
      if (existing) throw new Error('Discount code already exists');
    }
    // Convert dates if provided as strings
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    return await this.discountRepository.create(data);
  }

  async updateDiscount(id: number, data: any) {
    const existing = await this.discountRepository.findById(id);
    if (!existing) throw new Error('Discount not found');

    if (data.code && data.code !== existing.code) {
      const duplicateCode = await this.discountRepository.findByCode(data.code);
      if (duplicateCode) throw new Error('Discount code already exists');
    }

    // Convert dates if provided as strings
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    return await this.discountRepository.update(id, data);
  }

  async deleteDiscount(id: number) {
    const deleted = await this.discountRepository.delete(id);
    if (!deleted) throw new Error('Discount not found');
    return deleted;
  }
}
