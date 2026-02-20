import { TransactionRepository } from '../repositories/transaction.repository'; // Hapus .ts saat import
import { MenuRepository } from '../repositories/menu.repository';
import type { CreateTransactionRequest, TransactionResponse } from '../types/index';

export class TransactionService {
  private trxRepo: TransactionRepository;
  private menuRepo: MenuRepository;

  constructor() {
    this.trxRepo = new TransactionRepository();
    this.menuRepo = new MenuRepository();
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

    // 👇 INI YANG KEMARIN KURANG: TAMBAHKAN PAJAK 11%
    const taxRate = 0.11;
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
  async getTransactionHistory(outletId: number, page: number = 1, limit: number = 20) {
    return await this.trxRepo.findAll({ outletId, page, limit });
  }

  async getTransactionDetail(id: number) {
    const trx = await this.trxRepo.findById(id);
    if (!trx) throw new Error("Transaksi tidak ditemukan.");
    return trx;
  }
}