import { SalesRepository } from '../repositories/sales.repository';

export class SalesService {
  private salesRepo: SalesRepository;

  constructor() {
    this.salesRepo = new SalesRepository();
  }

  async getActiveTaxes() {
    return await this.salesRepo.getActiveTaxes();
  }

  /**
   * Returns the sum of all active tax percentages.
   * Format: 0.11 for 11%
   */
  async getActiveTaxRate(): Promise<number> {
    const activeTaxes = await this.salesRepo.getActiveTaxes();
    const totalPercentage = activeTaxes.reduce((sum, tax) => {
        return sum + parseFloat(tax.percentage.toString());
    }, 0);
    
    return totalPercentage / 100;
  }
}
