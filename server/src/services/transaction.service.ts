import { TransactionRepository } from '../repositories/transaction.repository';
import { EmployeeRepository } from '../repositories/employee.repository';
import { SalesService } from './sales.service';
import type { CreateTransactionRequest, TransactionResponse } from '../types/index';

export class TransactionService {
  private trxRepo: TransactionRepository;
  private employeeRepo: EmployeeRepository;
  private salesService: SalesService;

  constructor() {
    this.trxRepo = new TransactionRepository();
    this.employeeRepo = new EmployeeRepository();
    this.salesService = new SalesService();
  }

  // Create a pending/unpaid order (checkout from cashier POS)
  async createOrder(userId: number, outletId: number, data: {
    customerName?: string;
    orderType?: string;
    notes?: string;
    items: Array<{ menuId: number; variantId?: number; qty: number; price: number; toppings?: { toppingId: number; price: number }[] }>;
  }) {
    if (!data.items || data.items.length === 0) {
      throw new Error('Keranjang belanja kosong.');
    }
    // Find employee linked to this user
    const allEmployees = await this.employeeRepo.findAll();
    const emp = allEmployees.find((e: any) => e.userId === userId);
    const cashierId = emp?.id ?? userId; // fallback to userId if no employee record

    const transactionId = await this.trxRepo.createOrder({
      outletId,
      cashierId,
      createdBy: userId,
      customerName: data.customerName,
      notes: data.notes || data.customerName || 'Guest',
      orderType: data.orderType || 'dine_in',
      items: data.items,
    });

    return { transactionId };
  }

  // Update a pending order
  async updateOrder(transactionId: number, userId: number, outletId: number, data: any) {
    if (!data.items || data.items.length === 0) {
      throw new Error('Keranjang belanja kosong.');
    }
    
    // Find employee linked to this user (same logic as createOrder)
    const allEmployees = await this.employeeRepo.findAll();
    const emp = allEmployees.find((e: any) => e.userId === userId);
    const cashierId = emp?.id ?? userId;

    await this.trxRepo.updateOrder(transactionId, {
      outletId,
      cashierId,
      createdBy: userId,
      customerName: data.customerName,
      notes: data.notes || data.customerName,
      orderType: data.orderType || 'dine_in',
      items: data.items,
    });

    return { transactionId };
  }

  // Delete a pending order
  async deleteTransaction(transactionId: number) {
    await this.trxRepo.deleteTransaction(transactionId);
    return { success: true };
  }

  // Pay a pending order
  async payOrder(transactionId: number, userId: number, data: { paymentMethod: string; paidAmount: number }) {
    await this.trxRepo.payOrder(transactionId, data.paymentMethod, data.paidAmount, userId);
    return await this.trxRepo.findById(transactionId);
  }

  // Get all unpaid orders for an outlet (optionally scoped by cashier)
  async getUnpaidOrders(outletId: number, cashierId?: number) {
    return await this.trxRepo.getUnpaidOrders(outletId, cashierId);
  }

  async createTransaction(
    userId: number, 
    outletId: number, 
    data: CreateTransactionRequest
  ): Promise<TransactionResponse> {
    
    // 1. VALIDASI
    if (!data.items || data.items.length === 0) {
      throw new Error("Keranjang belanja kosong.");
    }

    // 2. HITUNG ULANG (RE-CALCULATION)
    // Kita hitung Subtotal murni dulu
    let calculatedSubtotal = 0; // 👈 Ganti nama variabel biar jelas

    const mappedItems = data.items.map((item) => {
      const basePrice = Number(item.price);
      const qty = item.qty;
      const toppingsTotal = item.toppings?.reduce((acc, t) => acc + Number(t.price), 0) || 0;

      const unitPriceWithTopping = basePrice + toppingsTotal;
      
      // Tambah ke Subtotal
      calculatedSubtotal += (unitPriceWithTopping * qty);

      return {
        menuId: item.menuId,
        variantId: item.variantId,
        qty: qty,
        price: basePrice,
        toppings: item.toppings?.map(t => ({
            toppingId: t.toppingId,
            price: Number(t.price)
        })) || []
      };
    });

    // 👇 SEKARANG DINAMIS: AMBIL DARI DATABASE
    const taxRate = await this.salesService.getActiveTaxRate();
    const calculatedTax = Math.round(calculatedSubtotal * taxRate);
    const calculatedGrandTotal = calculatedSubtotal + calculatedTax;

    // Validasi Pembayaran (Bandingkan dengan Grand Total yang sudah +Pajak)
    if (data.paidAmount < calculatedGrandTotal) {
      throw new Error(`Pembayaran kurang. Total: ${calculatedGrandTotal}, Dibayar: ${data.paidAmount}`);
    }

    // 3. SUSUN DATA
    const transactionData = {
      outletId: outletId,
      cashierId: userId,
      customerName: data.customerName || 'Guest',
      
      subtotal: calculatedSubtotal,      // <-- Harus ada dan angka
      taxAmount: calculatedTax,
      // Kirim Total yang SUDAH plus Pajak
      totalAmount: calculatedGrandTotal, 
      
      paidAmount: Number(data.paidAmount),
      paymentMethod: data.paymentMethod || 'CASH',
      notes: data.notes,
      items: mappedItems
    };

    // 4. EKSEKUSI
    const transactionId = await this.trxRepo.createTransaction(transactionData);

    return {
      transactionId,
      totalAmount: calculatedGrandTotal,
      paidAmount: transactionData.paidAmount,
      change: transactionData.paidAmount - calculatedGrandTotal,
      status: 'success'
    };
  }

  // ... (Method history & detail tetap sama)
  async getTransactionHistory(options: {
    outletId: number;
    cashierId?: number;
    paymentStatus?: string;
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    return await this.trxRepo.findAll(options);
  }

  async getTransactionDetail(id: number) {
    const trx = await this.trxRepo.findById(id);
    if (!trx) throw new Error("Transaksi tidak ditemukan.");
    return trx;
  }
}