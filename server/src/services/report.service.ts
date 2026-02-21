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

  async getRevenueGraph(outletId: number, type: 'daily' | 'monthly' | 'yearly', dateRange?: { start: string, end: string }) {
    let labelFormat = "'%d %M'";
    let dateFormat = "'%Y-%m-%d'";
    let start = new Date();
    let end = new Date();

    if (dateRange?.start && dateRange.start !== '' && dateRange?.end && dateRange.end !== '') {
      start = new Date(dateRange.start);
      if (isNaN(start.getTime())) start = new Date(); // Fallback if invalid
      end = new Date(dateRange.end);
      if (isNaN(end.getTime())) end = new Date();
    } else {
      start.setDate(start.getDate() - 30);
    }

    if (type === 'monthly') {
      labelFormat = "'%M %Y'";
      dateFormat = "'%Y-%m'";
      if (!dateRange?.start) start.setMonth(start.getMonth() - 12); // Last 12 months default
    } else if (type === 'yearly') {
      labelFormat = "'%Y'";
      dateFormat = "'%Y'";
      if (!dateRange?.start) start.setFullYear(start.getFullYear() - 5); // Last 5 years default
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return await this.repository.getRevenueGraph(outletId, labelFormat, dateFormat, start, end);
  }

  async getFinancialSummary(outletId: number, dateRange?: { start: string, end: string }) {
    let start = new Date();
    let end = new Date();

    if (dateRange?.start && dateRange.start !== '' && dateRange?.end && dateRange.end !== '') {
      start = new Date(dateRange.start);
      if (isNaN(start.getTime())) start = new Date(new Date().setDate(new Date().getDate() - 30));
      end = new Date(dateRange.end);
      if (isNaN(end.getTime())) end = new Date();
    } else {
      start.setDate(start.getDate() - 30);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return await this.repository.getFinancialSummary(outletId, start, end);
  }

  async getSalesByCategory(outletId: number, dateRange?: { start: string, end: string }) {
    let start = new Date();
    let end = new Date();

    if (dateRange?.start && dateRange.start !== '' && dateRange?.end && dateRange.end !== '') {
      start = new Date(dateRange.start);
      if (isNaN(start.getTime())) start = new Date(new Date().setDate(new Date().getDate() - 30));
      end = new Date(dateRange.end);
      if (isNaN(end.getTime())) end = new Date();
    } else {
      start.setDate(start.getDate() - 30);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return await this.repository.getSalesByCategory(outletId, start, end);
  }

  async getSalesByProduct(outletId: number, dateRange?: { start: string, end: string }) {
    let start = new Date();
    let end = new Date();

    if (dateRange?.start && dateRange.start !== '' && dateRange?.end && dateRange.end !== '') {
      start = new Date(dateRange.start);
      if (isNaN(start.getTime())) start = new Date(new Date().setDate(new Date().getDate() - 30));
      end = new Date(dateRange.end);
      if (isNaN(end.getTime())) end = new Date();
    } else {
      start.setDate(start.getDate() - 30);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return await this.repository.getSalesByProduct(outletId, start, end);
  }
}
