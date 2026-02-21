import { Context } from "hono";
import { ReportService } from "../services/report.service";

export class ReportController {
  private service = new ReportService();

  async getDashboardStats(c: Context) {
    try {
      const user = c.get('user');
      const outletId = user?.outletId || 1;
      const data = await this.service.getDashboardStats(outletId);
      return c.json({ success: true, data });
    } catch (e: any) {
      return c.json({ success: false, message: e.message }, 500);
    }
  }

  async getRevenueGraph(c: Context) {
    try {
      const user = c.get('user');
      const outletId = user?.outletId || 1;
      const type = (c.req.query('type') as 'monthly' | 'daily') || 'daily';
      const data = await this.service.getRevenueGraph(outletId, type);
      return c.json({ success: true, data });
    } catch (e: any) {
      return c.json({ success: false, message: e.message }, 500);
    }
  }

  async getFinancialSummary(c: Context) {
    try {
      const user = c.get('user');
      const outletId = user?.outletId || 1;
      const start = c.req.query('start');
      const end = c.req.query('end');
      
      const data = await this.service.getFinancialSummary(outletId, 
        start && end ? { start, end } : undefined
      );
      
      return c.json({ success: true, data });
    } catch (e: any) {
      return c.json({ success: false, message: e.message }, 500);
    }
  }

  async getSalesByCategory(c: Context) {
    try {
      const user = c.get('user');
      const outletId = user?.outletId || 1;
      const start = c.req.query('start');
      const end = c.req.query('end');
      
      const data = await this.service.getSalesByCategory(outletId, 
        start && end ? { start, end } : undefined
      );
      
      return c.json({ success: true, data });
    } catch (e: any) {
      return c.json({ success: false, message: e.message }, 500);
    }
  }

  async getSalesByProduct(c: Context) {
    try {
      const user = c.get('user');
      const outletId = user?.outletId || 1;
      const start = c.req.query('start');
      const end = c.req.query('end');
      
      const data = await this.service.getSalesByProduct(outletId, 
        start && end ? { start, end } : undefined
      );
      
      return c.json({ success: true, data });
    } catch (e: any) {
      return c.json({ success: false, message: e.message }, 500);
    }
  }
}
