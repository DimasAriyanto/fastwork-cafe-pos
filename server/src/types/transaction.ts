export interface TransactionItemInput {
  menuId: number;
  variantId?: number; // ✅ Pastikan ini ada
  qty: number;
  price: number;
  // 👇 TAMBAHAN BARU
  toppings?: Array<{
    toppingId: number;
    price: number; // Harga topping saat itu
  }>;
}

export interface CreateTransactionRequest {
  customerName?: string;
  paymentMethod: 'CASH' | 'QRIS' | 'DEBIT' | 'TRANSFER'; // Union Type biar gak typo
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  items: TransactionItemInput[]; // Array of items
}

export interface TransactionResponse {
  transactionId: number;
  totalAmount: number;
  paidAmount: number;
  change: number;
  status: string;
}
