import React, { useState } from 'react';
import { Filter, RotateCcw, Download, X } from 'lucide-react';

interface TransactionItem {
  id: number;
  name: string;
  variant?: string;
  quantity: number;
  price: number;
}

interface Transaction {
  id: string;
  date: string;
  cashier: string;
  customer: string;
  service: string;
  method: string;
  itemCount: number;
  total: string;
  // Detail fields
  orderId: string;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  paidAmount: number;
  change: number;
}

const mockTransactions: Transaction[] = [
  { 
    id: "#0001", 
    date: "01/10/26 10:45", 
    cashier: "Nicolas", 
    customer: "Dinda",
    service: "Makan Di Tempat",
    method: "Tunai",
    itemCount: 2,
    total: "Rp22.500",
    orderId: "#0001",
    items: [
      { id: 1, name: "Roti Maryam", variant: "Matcha", quantity: 1, price: 10000 },
      { id: 2, name: "Jagung Bakar", variant: "Manis", quantity: 1, price: 10000 },
    ],
    subtotal: 20000,
    tax: 2500,
    paidAmount: 30000,
    change: 7500
  },
  { 
    id: "#0002", 
    date: "01/10/26 11:30", 
    cashier: "Nicolas", 
    customer: "Budi",
    service: "Bungkus",
    method: "QRIS",
    itemCount: 3,
    total: "Rp45.000",
    orderId: "#0002",
    items: [
        { id: 1, name: "Kopi Susu", quantity: 2, price: 15000 },
        { id: 2, name: "Roti Bakar", variant: "Coklat", quantity: 1, price: 15000 }
    ],
    subtotal: 45000,
    tax: 0, // Assuming included or 0 for simplification if total matches
    paidAmount: 45000,
    change: 0
  },
  { 
    id: "#0003", 
    date: "01/10/26 12:15", 
    cashier: "Siti", 
    customer: "Ayu",
    service: "Makan Di Tempat",
    method: "Tunai",
    itemCount: 1,
    total: "Rp15.000",
    orderId: "#0003",
    items: [
        { id: 1, name: "Indomie Goreng", quantity: 1, price: 15000 }
    ],
    subtotal: 15000,
    tax: 0,
    paidAmount: 20000,
    change: 5000
  },
  { 
    id: "#0004", 
    date: "01/10/26 13:00", 
    cashier: "Siti", 
    customer: "Rizky",
    service: "Makan Di Tempat",
    method: "Tunai",
    itemCount: 4,
    total: "Rp80.000",
    orderId: "#0004",
    items: [
        { id: 1, name: "Paket Ayam", quantity: 2, price: 25000 },
        { id: 2, name: "Es Teh", quantity: 2, price: 5000 }
    ],
    subtotal: 60000, // Example adjustment
    tax: 20000, // Just mock numbers matching total
    paidAmount: 100000,
    change: 20000
  },
  { 
    id: "#0005", 
    date: "01/10/26 14:20", 
    cashier: "Nicolas", 
    customer: "Dewi",
    service: "Bungkus",
    method: "QRIS",
    itemCount: 2,
    total: "Rp32.000",
    orderId: "#0005",
    items: [
        { id: 1, name: "Burger", quantity: 1, price: 25000 },
        { id: 2, name: "Air Mineral", quantity: 1, price: 7000 }
    ],
    subtotal: 32000,
    tax: 0,
    paidAmount: 32000,
    change: 0
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const DataTransaksi = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const handleViewDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
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
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EAEAEA] rounded-lg text-[#202224] hover:bg-gray-50 transition-colors">
            <span className="text-sm font-medium">Tanggal</span>
            <span className="text-xs text-gray-400">▼</span>
        </button>

        {/* Reset Filter */}
        <button className="flex items-center gap-2 px-4 py-2 text-[#FF4D4D] hover:bg-[#FFF0F0] rounded-lg transition-colors">
            <RotateCcw size={18} />
            <span className="text-sm font-medium">Riset Filter</span>
        </button>

        {/* Export */}
        <button className="flex items-center gap-2 px-6 py-2 bg-white border border-[#EAEAEA] rounded-lg text-[#565656] hover:bg-gray-50 hover:text-[#202224] transition-all ml-auto">
            <Download size={18} />
            <span className="text-sm font-bold">Export</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#EAEAEA] overflow-hidden min-h-[400px]">
        {mockTransactions.length > 0 ? (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[#202224] border-b border-[#EAEAEA]">
                <tr>
                    <th className="px-6 py-5 font-bold text-sm">ID</th>
                    <th className="px-6 py-5 font-bold text-sm">Tanggal & Jam</th>
                    <th className="px-6 py-5 font-bold text-sm">Kasir</th>
                    <th className="px-6 py-5 font-bold text-sm">Pelanggan</th>
                    <th className="px-6 py-5 font-bold text-sm">Layanan</th>
                    <th className="px-6 py-5 font-bold text-sm">Metode</th>
                    <th className="px-6 py-5 font-bold text-sm">Item</th>
                    <th className="px-6 py-5 font-bold text-sm">Total</th>
                    <th className="px-6 py-5 font-bold text-sm text-center">Aksi</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F5]">
                {mockTransactions.map((item, index) => (
                    <tr key={index} className="hover:bg-[#FDFDFD] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#202224]">{item.id}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.date}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.cashier}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.customer}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.service}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.method}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.itemCount}</td>
                    <td className="px-6 py-4 font-bold text-[#202224]">{item.total}</td>
                    <td className="px-6 py-4 text-center">
                        <button 
                            onClick={() => handleViewDetail(item)}
                            className="px-4 py-2 bg-[#FE4E10] text-white text-xs font-bold rounded-lg hover:bg-[#e0450e] transition-colors shadow-sm"
                        >
                            Lihat Detail
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        ) : (
            <div className="flex items-center justify-center h-[400px]">
                <p className="text-[#565656]">Belum ada data transaksi</p>
            </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {isModalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#202224]">Detail Transaksi</h2>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                        <div className="space-y-1">
                            <p className="text-gray-500">Tanggal & Jam:</p>
                            <p className="font-medium text-[#202224]">{selectedTransaction.date}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-500">Order ID:</p>
                            <p className="font-medium text-[#202224]">{selectedTransaction.orderId}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-500">Kasir:</p>
                            <p className="font-medium text-[#202224]">{selectedTransaction.cashier}</p>
                        </div>
                         <div className="space-y-1">
                            <p className="text-gray-500">Jenis Layanan:</p>
                            <p className="font-medium text-[#202224]">{selectedTransaction.service}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-500">Pelanggan:</p>
                            <p className="font-medium text-[#202224]">{selectedTransaction.customer}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-500">Pembayaran:</p>
                            <p className="font-medium text-[#202224]">{selectedTransaction.method}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border border-[#EAEAEA] rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#F8F9FA] border-b border-[#EAEAEA] text-[#202224]">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-center w-12">No</th>
                                    <th className="px-4 py-3 font-semibold">Menu</th>
                                    <th className="px-4 py-3 font-semibold text-center">Jumlah</th>
                                    <th className="px-4 py-3 font-semibold text-right">Harga</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EAEAEA]">
                                {selectedTransaction.items.map((item, idx) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 text-center text-gray-500">{idx + 1}</td>
                                        <td className="px-4 py-3 text-[#202224]">
                                            <div className="font-medium">{item.name}</div>
                                            {item.variant && <div className="text-xs text-gray-500 mt-0.5">Rasa: {item.variant}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-center text-[#202224]">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right text-[#202224]">{formatCurrency(item.price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Payment Summary */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-500">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span>Pajak(4%):</span>
                            <span>{formatCurrency(selectedTransaction.tax)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-dashed border-gray-200">
                            <span className="font-bold text-lg text-[#202224]">Total:</span>
                            <span className="font-bold text-lg text-[#202224]">{selectedTransaction.total}</span>
                        </div>
                         <div className="flex justify-between text-gray-500 pt-1">
                            <span>Dibayar</span>
                            <span className="font-medium text-[#202224]">{formatCurrency(selectedTransaction.paidAmount)}</span>
                        </div>
                         <div className="flex justify-between text-gray-500">
                            <span>Kembalian</span>
                            <span className="font-medium text-[#202224]">{formatCurrency(selectedTransaction.change)}</span>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-4">
                     <button className="flex-1 px-4 py-3 bg-[#FE4E10] text-white font-bold rounded-xl hover:bg-[#e0450e] transition-colors">
                        Lihat Struk
                    </button>
                    <button onClick={closeModal} className="flex-1 px-4 py-3 bg-white border border-[#EAEAEA] text-[#202224] font-bold rounded-xl hover:bg-gray-50 transition-colors">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DataTransaksi;
