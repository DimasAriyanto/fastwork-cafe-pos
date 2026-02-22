import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Filter, RotateCcw, Download, X, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { exportToCSV } from '../../utils/csvExport';
import { PrintableReceipt } from '../../components/cashier/PrintableReceipt';
import type { Transaction as CashierTransaction } from '../../types/cashier';

interface TransactionItem {
  id: number;
  name: string;
  variant?: string;
  qty: number;
  price: number;
  subTotal: number;
}

interface Transaction {
  id: number;
  createdAt: string;
  employeeName: string;
  customerName: string;
  orderType: string;
  paymentMethod: string;
  totalItems: number;
  totalPrice: number;
  subtotal: number;
  taxAmount: number;
  taxDetails?: { name: string; percentage: number; amount: number }[];
  paidAmount: number;
  changeAmount: number;
  items?: TransactionItem[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
};

const DataTransaksi = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  /* Receipt State */
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  /* Date Filter State */
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getTransactions({ limit: 100 });
      setTransactions(response || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data transaksi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactionDetail = async (id: number) => {
    try {
      const detail = await apiClient.getTransactionDetail(id);
      setSelectedTransaction(detail);
    } catch (err: any) {
      alert(err.message || "Gagal memuat detail transaksi");
    }
  };

  // Extract unique dates for filter
  const uniqueDates = useMemo(() => {
     const dates = transactions.map(t => t.createdAt.split('T')[0]);
     return Array.from(new Set(dates)).sort().reverse();
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return selectedDate 
      ? transactions.filter(t => t.createdAt.startsWith(selectedDate))
      : transactions;
  }, [transactions, selectedDate]);

  const handleViewDetail = async (transaction: Transaction) => {
    setIsModalOpen(true);
    setIsReceiptOpen(false);
    await fetchTransactionDetail(transaction.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsReceiptOpen(false);
    setSelectedTransaction(null);
  };

  const handleViewReceipt = () => {
    setIsModalOpen(false);
    setIsReceiptOpen(true);
    // Trigger print dialog
    setTimeout(() => {
        window.print();
    }, 100);
  };

  const closeReceipt = () => {
    setIsReceiptOpen(false);
    setSelectedTransaction(null); 
  };

  const handleDateSelect = (date: string) => {
      setSelectedDate(date);
      setIsDateDropdownOpen(false);
  };

  const handleResetFilter = () => {
      setSelectedDate(null);
  };

  const handleExportData = () => {
    const headers = {
      id: 'ID Transaksi',
      createdAt: 'Tanggal',
      employeeName: 'Kasir',
      customerName: 'Pelanggan',
      paymentMethod: 'Metode Pembayaran',
      totalItems: 'Total Item',
      totalPrice: 'Total Harga',
      subtotal: 'Subtotal',
      taxAmount: 'Pajak',
      paidAmount: 'Diterima',
      changeAmount: 'Kembalian'
    };

    // Prepare data for export
    const dataToExport = filteredTransactions.map(t => ({
      ...t,
      createdAt: formatDate(t.createdAt),
      totalPrice: Number(t.totalPrice),
      subtotal: Number(t.subtotal),
      taxAmount: Number(t.taxAmount),
      paidAmount: Number(t.paidAmount),
      changeAmount: Number(t.changeAmount)
    }));

    exportToCSV(dataToExport, headers, 'data_transaksi');
  };

  return (
    <div className="space-y-8 font-sans relative">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#202224]">Data Transaksi</h1>
      </div>

      {/* Filter and Actions Bar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Filter By */}
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EAEAEA] rounded-lg text-[#202224] hover:bg-gray-50 transition-colors">
            <Filter size={18} />
            <span className="text-sm font-medium">Filter By</span>
        </button>

        {/* Date Filter */}
        <div className="relative">
            <button 
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 bg-white border border-[#EAEAEA] rounded-lg text-[#202224] hover:bg-gray-50 transition-colors ${selectedDate ? 'border-[#FE4E10] text-[#FE4E10] bg-[#FFF5F2]' : ''}`}
            >
                <span className="text-sm font-medium">{selectedDate || 'Semua Tanggal'}</span>
                <Filter size={14} className={selectedDate ? 'text-[#FE4E10]' : 'text-gray-400'} />
            </button>

            {isDateDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#EAEAEA] rounded-xl shadow-xl z-20 py-2">
                    <button 
                        onClick={handleResetFilter}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                    >
                        Semua Tanggal
                    </button>
                    {uniqueDates.map(date => (
                        <button 
                            key={date}
                            onClick={() => handleDateSelect(date)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedDate === date ? 'text-[#FE4E10] bg-[#FFF5F2]' : 'text-gray-700'}`}
                        >
                            {date}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Reset */}
        <button 
            onClick={handleResetFilter}
            className="flex items-center gap-2 text-[#FE4E10] font-bold text-sm hover:opacity-80 transition-opacity"
        >
            <RotateCcw size={18} />
            Reset Filter
        </button>

        {/* Export Button */}
        <div className="flex-1" />
        <button 
          onClick={handleExportData}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#EAEAEA] rounded-xl text-[#202224] font-bold hover:bg-gray-50 transition-all shadow-sm"
        >
            <Download size={18} />
            Export Data
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EAEAEA] overflow-hidden">
        {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={40} className="animate-spin text-[#FE4E10]" />
                <p className="text-gray-500 font-medium">Memuat data transaksi...</p>
             </div>
        ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-red-500 font-medium">{error}</p>
                <button onClick={fetchTransactions} className="px-4 py-2 bg-[#FE4E10] text-white rounded-lg">Coba Lagi</button>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F9F9FB] text-[#202224] border-b border-[#EAEAEA]">
                        <tr>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Kasir</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Pelanggan</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Metode</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider text-center">Qty</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Total</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                        {filteredTransactions.map(transaction => (
                            <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-[#202224]">#{transaction.id}</td>
                                <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(transaction.createdAt)}</td>
                                <td className="px-6 py-4 font-medium text-gray-700">{transaction.employeeName || "-"}</td>
                                <td className="px-6 py-4 text-gray-600">{transaction.customerName || "Pelanggan"}</td>
                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 bg-[#F1F4FD] text-[#5887FF] rounded-full text-xs font-bold uppercase">
                                        {transaction.paymentMethod}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center font-semibold text-gray-700">{transaction.totalItems}</td>
                                <td className="px-6 py-4 font-bold text-[#202224]">{formatCurrency(transaction.totalPrice)}</td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={() => handleViewDetail(transaction)}
                                        className="w-full py-2 bg-[#F9F9FB] border border-[#EAEAEA] rounded-lg text-sm font-bold text-[#202224] hover:bg-[#FE4E10] hover:text-white hover:border-[#FE4E10] transition-all"
                                    >
                                        View Detail
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-[#FDFDFD]">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Detail Transaksi</h2>
                        <p className="text-sm text-gray-400 mt-0.5">ID: #{selectedTransaction.id}</p>
                    </div>
                    <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
                    {/* Customer & Cashier Info */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 rounded-2xl p-4">
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Pelanggan</p>
                            <p className="font-bold text-gray-900">{selectedTransaction.customerName || "Pelanggan"}</p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4">
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Kasir</p>
                            <p className="font-bold text-gray-900">{selectedTransaction.employeeName || "-"}</p>
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-4 mb-8">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-l-4 border-[#FE4E10] pl-3">Order Items</h3>
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-[#F9F9FB]">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider text-[10px]">Item</th>
                                        <th className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider text-[10px]">Qty</th>
                                        <th className="px-4 py-3 text-right font-bold text-gray-500 uppercase tracking-wider text-[10px]">Price</th>
                                        <th className="px-4 py-3 text-right font-bold text-gray-500 uppercase tracking-wider text-[10px]">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(selectedTransaction.items || []).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-gray-900">{item.name}</div>
                                                {item.variant && <div className="text-[10px] text-gray-400">{item.variant}</div>}
                                            </td>
                                            <td className="px-4 py-4 text-center font-medium text-gray-700">{item.qty}x</td>
                                            <td className="px-4 py-4 text-right text-gray-600">{formatCurrency(item.price)}</td>
                                            <td className="px-4 py-4 text-right font-bold text-gray-900">{formatCurrency(item.subTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-[#1A1C1E] rounded-3xl p-6 text-white shadow-xl shadow-gray-200">
                        <div className="space-y-3 pb-4 border-b border-white/10">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Subtotal</span>
                                <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                            </div>
                            {selectedTransaction.taxDetails && selectedTransaction.taxDetails.length > 0 ? (
                                selectedTransaction.taxDetails.map((td, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-gray-400">{td.name} ({td.percentage}%)</span>
                                        <span>{formatCurrency(td.amount)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Pajak</span>
                                    <span>{formatCurrency(selectedTransaction.taxAmount)}</span>
                                </div>
                            )}
                        </div>
                        <div className="pt-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold">Total Pembayaran</span>
                                <span className="text-2xl font-black text-[#FE4E10]">{formatCurrency(selectedTransaction.totalPrice)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-400 pt-2 border-t border-white/5">
                                <span>Metode Pembayaran</span>
                                <span className="font-bold text-white uppercase">{selectedTransaction.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Diterima</span>
                                <span className="text-green-400 font-medium">{formatCurrency(selectedTransaction.paidAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Kembalian</span>
                                <span className="text-orange-400 font-medium">{formatCurrency(selectedTransaction.changeAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-8 bg-gray-50/50 flex gap-4">
                    <button 
                        onClick={handleViewReceipt}
                        className="flex-1 py-4 bg-white border border-[#EAEAEA] rounded-2xl font-bold text-gray-900 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                    >
                        Print Receipt
                    </button>
                    <button 
                        onClick={closeModal}
                        className="flex-1 py-4 bg-[#FE4E10] text-white rounded-2xl font-bold hover:bg-[#E0450E] transition-all shadow-lg shadow-[#FE4E10]/20"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Mini Receipt Modal */}
      {isReceiptOpen && selectedTransaction && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={closeReceipt} />
                <div className="relative bg-white w-full max-w-sm shadow-2xl p-8 transform animate-in slide-in-from-bottom-10">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-black tracking-tighter uppercase mb-1 italic">POS CAFE</h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Jl. Contoh No. 123, Jakarta</p>
                        <p className="text-[10px] text-gray-400 font-mono">--------------------------------------</p>
                    </div>

                    <div className="font-mono text-[10px] space-y-1 mb-6">
                        <div className="flex justify-between">
                            <span>REG: {selectedTransaction.id}</span>
                            <span>{selectedTransaction.createdAt.split('T')[1].substring(0,5)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>CSR: {selectedTransaction.employeeName || "-"}</span>
                            <span>{selectedTransaction.createdAt.split('T')[0]}</span>
                        </div>
                        <p>--------------------------------------</p>
                    </div>

                    <div className="font-mono text-[10px] space-y-4 mb-8">
                        {(selectedTransaction.items || []).map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between font-bold">
                                    <span className="max-w-[150px]">{item.name}</span>
                                    <span>{formatCurrency(item.subTotal)}</span>
                                </div>
                                <div className="text-gray-500 pl-2">
                                    {item.qty} x {formatCurrency(item.price)}
                                </div>
                            </div>
                        ))}
                        <p>--------------------------------------</p>
                    </div>

                    <div className="font-mono text-xs space-y-2 mb-8 uppercase">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                        </div>
                        {selectedTransaction.taxDetails && selectedTransaction.taxDetails.length > 0 ? (
                            selectedTransaction.taxDetails.map((td, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span>{td.name} ({td.percentage}%)</span>
                                    <span>{formatCurrency(td.amount)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex justify-between">
                                <span>Tax</span>
                                <span>{formatCurrency(selectedTransaction.taxAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-black text-sm pt-2">
                            <span>TOTAL</span>
                            <span>{formatCurrency(selectedTransaction.totalPrice)}</span>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span>{selectedTransaction.paymentMethod}</span>
                            <span>{formatCurrency(selectedTransaction.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Change</span>
                            <span>{formatCurrency(selectedTransaction.changeAmount)}</span>
                        </div>
                    </div>

                    <div className="text-center font-mono italic text-[10px] text-gray-400 mt-12 border-t border-dashed pt-4">
                        THANK YOU FOR YOUR VISIT
                    </div>

                    <button 
                        onClick={closeReceipt}
                        className="mt-8 w-full py-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all no-print"
                    >
                        Close
                    </button>
                </div>
           </div>
      )}
      {createPortal(
        <div className="final-print-container">
          <div className="text-center py-2 font-mono text-[10px] border-b border-dashed mb-4">--- RECEIPT ---</div>
          {selectedTransaction && (
            <PrintableReceipt 
                ref={receiptRef} 
                transaction={{
                    id: String(selectedTransaction.id),
                    date: selectedTransaction.createdAt,
                    customerName: selectedTransaction.customerName || "Pelanggan",
                    cashierName: selectedTransaction.employeeName,
                    items: (selectedTransaction.items || []).map(item => ({
                        name: item.name,
                        qty: item.qty,
                        price: item.price,
                        variant: item.variant
                    })),
                    totalItems: selectedTransaction.totalItems,
                    subtotal: selectedTransaction.subtotal,
                    taxAmount: selectedTransaction.taxAmount,
                    taxDetails: selectedTransaction.taxDetails,
                    totalPrice: selectedTransaction.totalPrice,
                    paidAmount: selectedTransaction.paidAmount,
                    change: selectedTransaction.changeAmount,
                    paymentMethod: selectedTransaction.paymentMethod as any,
                    serviceType: selectedTransaction.orderType === 'take_away' ? 'Take Away' : 'Dine In'
                } as CashierTransaction} 
            />
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default DataTransaksi;
