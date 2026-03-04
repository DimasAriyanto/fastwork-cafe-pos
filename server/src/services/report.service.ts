import { ReportRepository } from "../repositories/report.repository";

export class ReportService {
  private repository = new ReportRepository();

  async getDashboardStats(outletId: number) {
    const stats = await this.repository.getDashboardStats(outletId);
    
    // Calculate total modal and net profit as simple placeholders
    // until the db has cost data.
    const totalModal = stats.totalRevenue * 0.4;
    const netProfit = stats.totalRevenue - totalModal;

    return {
      ...stats,
      totalModal,
      netProfit,
      // Trend calculation (mocked for now as we'd need yesterday's data)
      trend: {
        revenue: "+8.5% dari kemarin",
        transactions: "+1.8% dari kemarin",
      }
    };
  }

  async getRevenueGraph(outletId: number, type: 'daily' | 'monthly' | 'yearly', filters?: { start?: string, end?: string, cashierName?: string, orderType?: string, paymentMethod?: string }) {
    let labelFormat = "'%d %M'";
    let dateFormat = "'%Y-%m-%d'";
    let start = new Date();
    let end = new Date();

    if (filters?.start && filters.start !== '' && filters?.end && filters.end !== '') {
      start = new Date(filters.start);
      if (isNaN(start.getTime())) start = new Date(); // Fallback if invalid
      end = new Date(filters.end);
      if (isNaN(end.getTime())) end = new Date();
    } else {
      start.setDate(start.getDate() - 30);
    }

    if (type === 'monthly') {
      labelFormat = "'%M %Y'";
      dateFormat = "'%Y-%m'";
      if (!filters?.start) start.setMonth(start.getMonth() - 12); // Last 12 months default
    } else if (type === 'yearly') {
      labelFormat = "'%Y'";
      dateFormat = "'%Y'";
      if (!filters?.start) start.setFullYear(start.getFullYear() - 5); // Last 5 years default
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return await this.repository.getRevenueGraph(outletId, labelFormat, dateFormat, {
      ...filters,
      start,
      end
    });
  }

  async getFinancialSummary(outletId: number, filters?: { start?: string, end?: string, cashierName?: string, orderType?: string, paymentMethod?: string }) {
    let start = new Date();
    let end = new Date();

    if (filters?.start && filters.start !== '' && filters?.end && filters.end !== '') {
      start = new Date(filters.start);
      if (isNaN(start.getTime())) start = new Date(new Date().setDate(new Date().getDate() - 30));
      end = new Date(filters.end);
      if (isNaN(end.getTime())) end = new Date();
    } else {
      start.setDate(start.getDate() - 30);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return await this.repository.getFinancialSummary(outletId, { ...filters, start, end });
  }

  async getSalesByCategory(outletId: number, filters?: { start?: string, end?: string, cashierName?: string, orderType?: string, paymentMethod?: string }) {
    let start = new Date();
    let end = new Date();

    if (filters?.start && filters.start !== '' && filters?.end && filters.end !== '') {
      start = new Date(filters.start);
      if (isNaN(start.getTime())) start = new Date(new Date().setDate(new Date().getDate() - 30));
      end = new Date(filters.end);
      if (isNaN(end.getTime())) end = new Date();
    } else {
      start.setDate(start.getDate() - 30);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return await this.repository.getSalesByCategory(outletId, { ...filters, start, end });
  }

  async getSalesByProduct(outletId: number, filters?: { start?: string, end?: string, cashierName?: string, orderType?: string, paymentMethod?: string }) {
    let start = new Date();
    let end = new Date();

    if (filters?.start && filters.start !== '' && filters?.end && filters.end !== '') {
      start = new Date(filters.start);
      if (isNaN(start.getTime())) start = new Date(new Date().setDate(new Date().getDate() - 30));
      end = new Date(filters.end);
      if (isNaN(end.getTime())) end = new Date();
    } else {
      start.setDate(start.getDate() - 30);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return await this.repository.getSalesByProduct(outletId, { ...filters, start, end });
  }
}
