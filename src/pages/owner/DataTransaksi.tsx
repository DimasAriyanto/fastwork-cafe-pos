import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Filter, RotateCcw, Download, X, Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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
  discountAmount?: number;
  manualDiscountType?: 'fixed' | 'percentage' | null;
  manualDiscountValue?: number;
  items?: TransactionItem[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  // Kompensasi jika browser otomatis menambah 7 jam (WIB) ke data yang sudah waktu lokal
  d.setHours(d.getHours() - 7);
  
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

  /* Date Filter State */
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  });
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  
  /* Filter By State */
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [filters, setFilters] = useState({
    cashierName: 'all',
    orderType: 'all',
    paymentMethod: 'all'
  });
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    if (isDateDropdownOpen || isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDateDropdownOpen]);

  const getFilterLabel = () => {
    if (filterType === 'all') return 'Semua Tanggal';
    if (!startDate) return 'Pilih Tanggal';
    
    const formatDateShort = (d: Date) => {
      return `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
    };

    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        return formatDateShort(startDate);
      }
      return `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;
    }
    return formatDateShort(startDate);
  };

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
      // Normalize: API may return cashierName (from users join) or employeeName (from employees join)
      setSelectedTransaction({
        ...detail,
        employeeName: detail.employeeName || detail.cashierName || '-',
        customerName: detail.customerName || detail.notes || 'Pelanggan',
        items: (detail.items || []).map((item: any) => ({
          ...item,
          price: item.finalPrice || item.price || 0,
          subTotal: item.subTotal || item.subtotal || 0
        }))
      });
    } catch (err: any) {
      alert(err.message || "Gagal memuat detail transaksi");
    }
  };

  const handleViewDetail = async (transaction: Transaction) => {
    setIsModalOpen(true);
    setSelectedTransaction(transaction); // Show list data immediately while fetching
    await fetchTransactionDetail(transaction.id); // Then replace with full detail
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleViewReceipt = () => {
    setTimeout(() => {
        window.print();
    }, 100);
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const trxDate = new Date(t.createdAt);
      trxDate.setHours(trxDate.getHours() - 7); // Kompensasi shift
      
      // Date Filter
      if (filterType !== 'all' && (startDate || endDate)) {
        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        
        const end = endDate ? new Date(endDate) : (start ? new Date(start) : null);
        if (end) end.setHours(23, 59, 59, 999);
        
        if (start && end && (trxDate < start || trxDate > end)) return false;
        if (start && trxDate < start) return false;
        if (end && trxDate > end) return false;
      }

      // Cashier Filter
      if (filters.cashierName !== 'all' && t.employeeName !== filters.cashierName) return false;

      // Order Type Filter
      if (filters.orderType !== 'all' && t.orderType !== filters.orderType) return false;

      // Payment Method Filter
      if (filters.paymentMethod !== 'all' && t.paymentMethod !== filters.paymentMethod) return false;
      
      return true;
    });
  }, [transactions, filterType, startDate, endDate, filters]);

  // Extract unique filter options
  const filterOptions = useMemo(() => {
     return {
        cashiers: Array.from(new Set(transactions.map(t => t.employeeName).filter(Boolean))),
        paymentMethods: Array.from(new Set(transactions.map(t => t.paymentMethod).filter(Boolean)))
     };
  }, [transactions]);

  const handleDatePreset = (type: typeof filterType) => {
    setFilterType(type);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (type) {
      case 'today':
        setStartDate(start);
        setEndDate(start);
        break;
      case 'yesterday':
        const yesterday = new Date(start);
        yesterday.setDate(start.getDate() - 1);
        setStartDate(yesterday);
        setEndDate(yesterday);
        break;
      case 'week':
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
        const startOfWeek = new Date(start.setDate(diff));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        setStartDate(startOfWeek);
        setEndDate(endOfWeek);
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setStartDate(startOfMonth);
        setEndDate(endOfMonth);
        break;
      case 'year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        setStartDate(startOfYear);
        setEndDate(endOfYear);
        break;
      case 'custom':
        // Keep current selection or clear if needed
        break;
      case 'all':
        setStartDate(null);
        setEndDate(null);
        setIsDateDropdownOpen(false);
        break;
    }
    
    if (type !== 'custom' && type !== 'all') {
      // Keep open or close? Typically ClickUp keeps it open to show the range
    }
  };

  const handleCalendarClick = (date: Date) => {
    setFilterType('custom');
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else {
      if (date < startDate) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

  const handleResetFilter = () => {
      setFilterType('all');
      setStartDate(null);
      setEndDate(null);
      setFilters({
        cashierName: 'all',
        orderType: 'all',
        paymentMethod: 'all'
      });
  };

  const renderMonth = (monthOffset: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth() + monthOffset, 1);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    
    const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, date.getMonth(), 1).getDay(); // 0 = Sunday
    
    const days = [];
    // Adjust for Monday start: 0(Sun) becomes 6, 1(Mon) becomes 0
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let i = 0; i < startOffset; i++) {
        days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const current = new Date(year, date.getMonth(), d);
        const isSelected = (startDate && current.toDateString() === startDate.toDateString()) || 
                           (endDate && current.toDateString() === endDate.toDateString());
        const isInRange = startDate && endDate && current > startDate && current < endDate;
        const isHovered = startDate && !endDate && hoverDate && (
            (current > startDate && current <= hoverDate) || (current < startDate && current >= hoverDate)
        );

        days.push(
            <div 
                key={d} 
                className={`h-9 w-9 flex items-center justify-center cursor-pointer text-sm transition-all relative z-10
                    ${isSelected ? 'bg-black text-white rounded-md' : ''}
                    ${isInRange ? 'bg-gray-100' : ''}
                    ${isHovered ? 'bg-gray-50' : ''}
                    hover:bg-gray-200 rounded-md
                `}
                onClick={() => handleCalendarClick(current)}
                onMouseEnter={() => setHoverDate(current)}
                onMouseLeave={() => setHoverDate(null)}
            >
                {d}
            </div>
        );
    }

    return (
        <div className="w-[280px]">
            <div className="text-center font-bold mb-4">{monthName} {year}</div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-[10px] font-bold text-gray-400 uppercase">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days}
            </div>
        </div>
    );
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
      orderType: 'Tipe Order',
      paidAmount: 'Diterima',
      changeAmount: 'Kembalian'
    };

    // Prepare data for export
    const dataToExport = filteredTransactions.map(t => ({
      ...t,
      createdAt: formatDate(t.createdAt),
      customerName: t.customerName || 'Pelanggan',
      totalPrice: Number(t.totalPrice),
      subtotal: Number(t.subtotal),
      taxAmount: Number(t.taxAmount),
      orderType: t.orderType === 'take_away' ? 'Bawa Pulang' : 'Makan Ditempat',
      paidAmount: Number(t.paidAmount),
      changeAmount: Number(t.changeAmount)
    }));

    exportToCSV(dataToExport, headers, 'data_transaksi');
  };

  return (
    <div className="space-y-8 font-sans relative">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#202224]">Data Transaksi</h1>
      </div>

      {/* Filter and Actions Bar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Filter By */}
        <div className="relative" ref={filterDropdownRef}>
            <button 
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 bg-white border border-[#EAEAEA] rounded-lg text-[#202224] hover:bg-gray-50 transition-colors ${
                    filters.cashierName !== 'all' || filters.orderType !== 'all' || filters.paymentMethod !== 'all' 
                    ? 'border-[#FE4E10] text-[#FE4E10] bg-[#FFF5F2]' : ''
                }`}
            >
                <Filter size={18} />
                <span className="text-sm font-medium">Filter By</span>
            </button>

            {isFilterDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#EAEAEA] rounded-xl shadow-xl z-50 py-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Kasir */}
                    <div className="px-4 py-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kasir</p>
                        <select 
                            value={filters.cashierName}
                            onChange={(e) => setFilters(prev => ({ ...prev, cashierName: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-[#FE4E10] outline-none transition-all"
                        >
                            <option value="all">Semua Kasir</option>
                            {filterOptions.cashiers.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tipe Pesanan */}
                    <div className="px-4 py-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tipe Pesanan</p>
                        <select 
                            value={filters.orderType}
                            onChange={(e) => setFilters(prev => ({ ...prev, orderType: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-[#FE4E10] outline-none transition-all"
                        >
                            <option value="all">Semua Tipe</option>
                            <option value="dine_in">Makan Ditempat</option>
                            <option value="take_away">Bawa Pulang</option>
                        </select>
                    </div>

                    {/* Metode Pembayaran */}
                    <div className="px-4 py-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Metode</p>
                        <select 
                            value={filters.paymentMethod}
                            onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-[#FE4E10] outline-none transition-all"
                        >
                            <option value="all">Semua Metode</option>
                            {filterOptions.paymentMethods.map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-3 px-4 pt-3 border-t border-gray-50">
                        <button 
                            onClick={() => setIsFilterDropdownOpen(false)}
                            className="w-full py-2 bg-black text-white text-xs font-bold rounded-lg hover:opacity-80 transition-all"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Date Filter */}
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 bg-white border border-[#EAEAEA] rounded-lg text-[#202224] hover:bg-gray-50 transition-colors ${filterType !== 'all' ? 'border-[#FE4E10] text-[#FE4E10] bg-[#FFF5F2]' : ''}`}
            >
                <Calendar size={14} className={filterType !== 'all' ? 'text-[#FE4E10]' : 'text-gray-400'} />
                <span className="text-sm font-medium">{getFilterLabel()}</span>
            </button>

            {isDateDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 flex bg-white border border-[#EAEAEA] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Sidebar Presets */}
                    <div className="w-[180px] border-r border-gray-100 py-4 flex flex-col">
                        {[
                            { id: 'today', label: 'Hari Ini' },
                            { id: 'yesterday', label: 'Kemarin' },
                            { id: 'week', label: 'Minggu Ini' },
                            { id: 'month', label: 'Bulan Ini' },
                            { id: 'year', label: 'Tahun Ini' },
                            { id: 'custom', label: 'Custom' }
                        ].map((item) => (
                            <button 
                                key={item.id}
                                onClick={() => handleDatePreset(item.id as any)}
                                className={`w-[90%] mx-auto text-left px-4 py-2.5 text-sm rounded-xl transition-all mb-1 ${filterType === item.id ? 'bg-gray-100 text-black font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                        <div className="mt-auto px-4 pt-4 border-t border-gray-50">
                             <button 
                                onClick={handleResetFilter}
                                className="w-full py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all"
                             >
                                Clear Filter
                             </button>
                        </div>
                    </div>
                    
                    {/* Calendar Content */}
                    <div className="p-6 flex flex-col relative">
                        <div className="flex gap-8">
                            {renderMonth(0)}
                            {renderMonth(1)}
                        </div>
                        
                        {/* Navigation Arrows */}
                        <button 
                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                            className="absolute left-2 top-[40%] -translate-y-[50%] p-2 hover:bg-gray-100 rounded-full border border-gray-100 shadow-sm z-20 bg-white"
                        >
                            <ChevronLeft size={18} className="text-gray-600" />
                        </button>
                        <button 
                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                            className="absolute right-2 top-[40%] -translate-y-[50%] p-2 hover:bg-gray-100 rounded-full border border-gray-100 shadow-sm z-20 bg-white"
                        >
                            <ChevronRight size={18} className="text-gray-600" />
                        </button>

                        <div className="mt-6 flex justify-end gap-3 border-t border-gray-50 pt-4">
                            <button 
                                onClick={() => setIsDateDropdownOpen(false)}
                                className="px-6 py-2 bg-black text-white text-sm font-bold rounded-xl hover:opacity-80 transition-all shadow-lg"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
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
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Pelanggan</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Kasir</th>
                            <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider">Tipe</th>
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
                                <td className="px-6 py-4 font-medium text-gray-700 truncate max-w-[150px]">{transaction.customerName || "Pelanggan"}</td>
                                <td className="px-6 py-4 font-medium text-gray-700">{transaction.employeeName || "-"}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                        transaction.orderType === 'take_away' 
                                            ? 'bg-orange-100 text-orange-600' 
                                            : 'bg-green-100 text-green-600'
                                    }`}>
                                        {transaction.orderType === 'take_away' ? 'Bawa Pulang' : 'Makan Ditempat'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {transaction.paymentMethod ? (
                                        <span className="px-3 py-1 bg-[#F1F4FD] text-[#5887FF] rounded-full text-xs font-bold uppercase">
                                            {transaction.paymentMethod}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">Belum Bayar</span>
                                    )}
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
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-base font-bold text-gray-900">Detail Transaksi</h2>
                    <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={16} className="text-gray-400" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="px-6 py-4 max-h-[75vh] overflow-y-auto">

                    {/* Info Grid — like reference screenshot */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-5 text-sm">
                        <div>
                            <p className="text-gray-400 text-xs">Tanggal & Jam</p>
                            <p className="font-semibold text-gray-800">{formatDate(selectedTransaction.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs">Order ID</p>
                            <p className="font-semibold text-gray-800">#{selectedTransaction.id}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs">Kasir</p>
                            <p className="font-semibold text-gray-800">{selectedTransaction.employeeName || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs">Jenis Layanan</p>
                            <p className="font-semibold text-gray-800">
                                {selectedTransaction.orderType === 'take_away' ? 'Bawa Pulang' : 'Makan Di Tempat'}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs">Pelanggan</p>
                            <p className="font-semibold text-gray-800">{selectedTransaction.customerName || 'Pelanggan'}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs">Pembayaran</p>
                            <p className="font-semibold text-gray-800 capitalize">{selectedTransaction.paymentMethod || '-'}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-sm mb-4 border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left text-gray-400 font-semibold text-xs py-2 w-6">No</th>
                                <th className="text-left text-gray-400 font-semibold text-xs py-2">Menu</th>
                                <th className="text-center text-gray-400 font-semibold text-xs py-2">Jumlah</th>
                                <th className="text-right text-gray-400 font-semibold text-xs py-2">Harga</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(selectedTransaction.items || []).map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-50">
                                    <td className="py-2 text-xs text-gray-500">{idx + 1}</td>
                                    <td className="py-2 text-xs font-medium text-gray-800">
                                        {item.name}
                                        {item.variant && <span className="text-gray-400 ml-1">({item.variant})</span>}
                                    </td>
                                    <td className="py-2 text-xs text-center text-gray-700">{item.qty}</td>
                                    <td className="py-2 text-xs text-right font-medium text-gray-800">Rp{(item.subTotal || 0).toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="space-y-1.5 text-sm border-t border-gray-100 pt-3">
                        <div className="flex justify-between text-gray-500">
                            <span>Subtotal</span>
                            <span>Rp{(selectedTransaction.subtotal || 0).toLocaleString('id-ID')}</span>
                        </div>
                        {(selectedTransaction.discountAmount || 0) > 0 && (
                            <div className="flex justify-between text-orange-500">
                                <span>Diskon</span>
                                <span>- Rp{(selectedTransaction.discountAmount || 0).toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-gray-500">
                            <span>Pajak(PPN)</span>
                            <span>Rp{(selectedTransaction.taxAmount || 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-1">
                            <span>Total:</span>
                            <span>Rp{(selectedTransaction.totalPrice || 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-xs pt-1">
                            <span>Dibayar</span>
                            <span>Rp{(selectedTransaction.paidAmount || 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-xs">
                            <span>Kembalian</span>
                            <span>Rp{(selectedTransaction.changeAmount || 0).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={handleViewReceipt}
                        className="flex-1 py-2.5 bg-[#FE4E10] text-white rounded-xl text-sm font-semibold hover:bg-[#E0450E] transition-all"
                    >
                        Lihat Struk
                    </button>
                    <button
                        onClick={closeModal}
                        className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
                    >
                        Tutup
                    </button>
                </div>
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
                        price: (item as any).finalPrice || item.price,
                        variant: item.variant
                    })),
                    totalItems: selectedTransaction.totalItems,
                    subtotal: selectedTransaction.subtotal,
                    taxAmount: selectedTransaction.taxAmount,
                    taxDetails: selectedTransaction.taxDetails,
                    discountAmount: selectedTransaction.discountAmount || 0,
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
