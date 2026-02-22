import { SalesService } from '../services/sales.service';
import type { Context } from 'hono';

export class SalesController {
  private service: SalesService;

  constructor() {
    this.service = new SalesService();
  }

  /**
   * GET /sales/taxes
   * Mengambil daftar pajak aktif dan total rate.
   */
  async getActiveTaxes(c: Context) {
    try {
      const taxes = await this.service.getActiveTaxes();
      const rate = await this.service.getActiveTaxRate();
      
      return c.json({ 
        success: true, 
        data: {
            taxes,
            totalRate: rate
        }
      });
    } catch (error) {
      console.error('Error in getActiveTaxes:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch taxes',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
}
