import { useState, useEffect, useRef } from 'react';
import { Filter, ChevronDown, RotateCcw, Share, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../../api/client';
import { exportToCSV } from '../../utils/csvExport';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const LaporanPenjualanToko = () => {
  const [summaryStats, setSummaryStats] = useState<any[]>([]);
  const [categorySales, setCategorySales] = useState<any[]>([]);
  const [productSales, setProductSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), 
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0) 
  });
  const [filterType, setFilterType] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [filterLabel, setFilterLabel] = useState('Bulan Ini');
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [filters, setFilters] = useState({
    cashierName: 'all',
    orderType: 'all',
    paymentMethod: 'all'
  });
  const [availableCashiers, setAvailableCashiers] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const emps = await apiClient.getEmployees();
        setAvailableCashiers(emps.map((e: any) => e.name));
      } catch (err) {
        console.error("Gagal memuat opsi filter:", err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        const startStr = dateRange.start?.toISOString().split('T')[0];
        const endStr = dateRange.end?.toISOString().split('T')[0];
        
        const params = {
          start: startStr,
          end: endStr,
          cashier: filters.cashierName,
          orderType: filters.orderType,
          paymentMethod: filters.paymentMethod
        };

        const [categories, products] = await Promise.all([
          apiClient.getSalesByCategory(params),
          apiClient.getSalesByProduct(params)
        ]);

        setCategorySales(categories);
        setProductSales(products);

        // Aggregate stats
        const totalGross = products.reduce((acc: number, curr: any) => acc + Number(curr.gross), 0);
        const totalSold = products.reduce((acc: number, curr: any) => acc + Number(curr.sold), 0);
        
        const financialSummary = await apiClient.getFinancialSummary(params);
        const totalTrx = financialSummary.reduce((acc: number, curr: any) => acc + Number(curr.totalTransaksi), 0);
        const avgDaily = financialSummary.length > 0 ? totalGross / financialSummary.length : 0;

        setSummaryStats([
          { title: 'Total Penjualan', value: formatCurrency(totalGross), isCurrency: true },
          { title: 'Produk Terjual', value: `${totalSold} Item`, isCurrency: false },
          { title: 'Transaksi Sukses', value: totalTrx.toLocaleString(), isCurrency: false },
          { title: 'Rata-rata Harian', value: formatCurrency(avgDaily), isCurrency: true },
        ]);

      } catch (err) {
        console.error("Gagal memuat laporan penjualan:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [dateRange, filters]);

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
  }, [isDateDropdownOpen, isFilterDropdownOpen]);

  const handleDatePreset = (type: typeof filterType) => {
    setFilterType(type);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let newStart: Date | null = null;
    let newEnd: Date | null = null;
    let label = '';

    switch (type) {
      case 'today':
        newStart = start;
        newEnd = start;
        label = 'Hari Ini';
        break;
      case 'yesterday':
        const yesterday = new Date(start);
        yesterday.setDate(start.getDate() - 1);
        newStart = yesterday;
        newEnd = yesterday;
        label = 'Kemarin';
        break;
      case 'week':
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        newStart = new Date(start.setDate(diff));
        newEnd = new Date(newStart);
        newEnd.setDate(newStart.getDate() + 6);
        label = 'Minggu Ini';
        break;
      case 'month':
        newStart = new Date(now.getFullYear(), now.getMonth(), 1);
        newEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        label = 'Bulan Ini';
        break;
      case 'year':
        newStart = new Date(now.getFullYear(), 0, 1);
        newEnd = new Date(now.getFullYear(), 11, 31);
        label = 'Tahun Ini';
        break;
      case 'all':
        newStart = null;
        newEnd = null;
        label = 'Semua Waktu';
        setIsDateDropdownOpen(false);
        break;
    }
    
    setDateRange({ start: newStart, end: newEnd });
    setFilterLabel(label);
  };

  const handleCalendarClick = (date: Date) => {
    setFilterType('custom');
    if (!dateRange.start || (dateRange.start && dateRange.end)) {
      setDateRange({ start: date, end: null });
    } else {
      if (date < dateRange.start) {
        setDateRange({ start: date, end: dateRange.start });
      } else {
        setDateRange({ ...dateRange, end: date });
      }
    }
  };

  const renderMonth = (monthOffset: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth() + monthOffset, 1);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, date.getMonth(), 1).getDay();
    const days = [];
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let i = 0; i < startOffset; i++) {
        days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const current = new Date(year, date.getMonth(), d);
        const isSelected = (dateRange.start && current.toDateString() === dateRange.start.toDateString()) || 
                           (dateRange.end && current.toDateString() === dateRange.end.toDateString());
        const isInRange = dateRange.start && dateRange.end && current > dateRange.start && current < dateRange.end;
        const isHovered = dateRange.start && !dateRange.end && hoverDate && (
            (current > dateRange.start && current <= hoverDate) || (current < dateRange.start && current >= hoverDate)
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

  const filteredProducts = productSales.filter(p => 
    p.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportSummary = () => {
    const headers = { title: 'Statistik', value: 'Nilai' };
    exportToCSV(summaryStats, headers, 'ringkasan_penjualan');
  };

  const handleExportCategory = () => {
    const headers = { category: 'Kategori', sold: 'Terjual', gross: 'Penjualan Kotor' };
    exportToCSV(categorySales, headers, 'penjualan_per_kategori');
  };

  const handleExportProduct = () => {
    const headers = { product: 'Produk', category: 'Kategori', sold: 'Terjual', gross: 'Penjualan Kotor' };
    exportToCSV(filteredProducts, headers, 'penjualan_per_produk');
  };

  if (loading && summaryStats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FE4E10]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#202224]">Laporan Keuangan</h1>
        <p className="text-[#565656] mt-1">Penjualan Toko</p>
      </div>

      {/* 2. Filter & Action Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Filter By */}
          <div className="relative" ref={filterDropdownRef}>
            <button 
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 bg-white border border-[#D5D5D5] rounded-lg text-[#202224] hover:bg-gray-50 transition-colors ${
                    filters.cashierName !== 'all' || filters.orderType !== 'all' || filters.paymentMethod !== 'all' 
                    ? 'border-[#FE4E10] text-[#FE4E10] bg-[#FFF5F2]' : ''
                }`}
            >
                <Filter size={18} />
                <span className="text-sm font-medium">Filter By</span>
            </button>

            {isFilterDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-[#EAEAEA] rounded-xl shadow-xl z-50 py-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kasir</p>
                        <select 
                            value={filters.cashierName}
                            onChange={(e) => setFilters(prev => ({ ...prev, cashierName: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-[#FE4E10] outline-none transition-all"
                        >
                            <option value="all">Semua Kasir</option>
                            {availableCashiers.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

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

                    <div className="px-4 py-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Metode</p>
                        <select 
                            value={filters.paymentMethod}
                            onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-[#FE4E10] outline-none transition-all"
                        >
                            <option value="all">Semua Metode</option>
                            <option value="CASH">CASH</option>
                            <option value="QRIS">QRIS</option>
                            <option value="TRANSFER">TRANSFER</option>
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
          
          {/* ClickUp Date Picker */}
          <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 bg-white border border-[#D5D5D5] rounded-lg text-[#202224] hover:bg-gray-50 transition-colors min-w-[200px] justify-between ${
                    filterType !== 'all' ? 'border-[#FE4E10] text-[#FE4E10] bg-[#FFF5F2]' : ''
                }`}
            >
                <div className="flex items-center gap-2">
                    <Calendar size={18} />
                    <span className="text-sm font-medium">{filterLabel}</span>
                </div>
                <ChevronDown size={14} className={isDateDropdownOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>

            {isDateDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-[#EAEAEA] rounded-2xl shadow-2xl z-50 flex overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Presets Sidebar */}
                    <div className="w-[180px] border-r border-[#EAEAEA] bg-gray-50/50 py-4">
                        {[
                            { id: 'all', label: 'Semua Waktu' },
                            { id: 'today', label: 'Hari Ini' },
                            { id: 'yesterday', label: 'Kemarin' },
                            { id: 'week', label: 'Minggu Ini' },
                            { id: 'month', label: 'Bulan Ini' },
                            { id: 'year', label: 'Tahun Ini' },
                        ].map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => handleDatePreset(preset.id as any)}
                                className={`w-full text-left px-6 py-2.5 text-sm transition-colors
                                    ${filterType === preset.id ? 'text-[#FE4E10] font-bold bg-[#FFF5F2]' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Dual Calendar View */}
                    <div className="p-6">
                        <div className="flex gap-8">
                            <div className="relative">
                                {renderMonth(0)}
                                <button 
                                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                                    className="absolute -left-2 top-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            </div>
                            <div className="relative">
                                {renderMonth(1)}
                                <button 
                                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                                    className="absolute -right-2 top-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 pt-6 border-t border-[#EAEAEA] flex items-center justify-between">
                            <div className="text-xs text-gray-500 font-medium">
                                {dateRange.start && (
                                    <>
                                        Selected: <span className="text-black font-bold">{dateRange.start.toLocaleDateString('id-ID')}</span>
                                        {dateRange.end && <> - <span className="text-black font-bold">{dateRange.end.toLocaleDateString('id-ID')}</span></>}
                                    </>
                                )}
                            </div>
                            <button 
                                onClick={() => setIsDateDropdownOpen(false)}
                                className="px-6 py-2 bg-black text-white text-xs font-bold rounded-lg hover:opacity-80 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
          </div>

          <button 
            onClick={() => {
              handleDatePreset('all');
              setFilters({
                cashierName: 'all',
                orderType: 'all',
                paymentMethod: 'all'
              });
            }}
            className="flex items-center gap-2 text-[#FE4E10] text-sm font-bold hover:opacity-80 px-2 transition-all"
          >
            <RotateCcw size={16} />
            Reset Filter
          </button>
        </div>

        <div className="ml-auto">
          <button 
            onClick={handleExportSummary}
            className="flex items-center gap-2 bg-white border border-[#D5D5D5] rounded-lg px-4 py-2.5 text-[#202224] text-sm font-medium hover:bg-gray-50"
          >
            <Share size={18} />
            Export
          </button>
        </div>
      </div>

      {/* 3. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl shadow-sm border border-[#F5F6FA] flex flex-col justify-center min-h-[140px]"
          >
            <p className="text-[#565656] text-sm font-medium mb-2">{stat.title}</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#202224]">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* 5. Category Sales Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#F5F6FA]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-[#202224]">Penjualan per Kategori</h3>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 bg-white border border-[#D5D5D5] rounded-lg px-4 py-2 text-[#202224] text-sm font-medium hover:bg-gray-50">
              <span className="text-[#565656]">Data 30 Hari Terakhir</span>
            </button>
            <button 
              onClick={handleExportCategory}
              className="flex items-center gap-2 bg-white border border-[#D5D5D5] rounded-lg px-4 py-2 text-[#202224] text-sm font-medium hover:bg-gray-50"
            >
              <Share size={16} />
              Export
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-xl border border-[#F5F6FA]">
          <table className="w-full">
            <thead>
              <tr className="bg-white border-b border-[#F5F6FA]">
                <th className="py-4 px-6 text-left text-sm font-medium text-[#202224]">Kategori</th>
                <th className="py-4 px-6 text-center text-sm font-medium text-[#202224]">Terjual</th>
                <th className="py-4 px-6 text-right text-sm font-medium text-[#202224]">Penjualan Kotor</th>
              </tr>
            </thead>
            <tbody>
              {categorySales.map((item, index) => (
                <tr key={index} className="border-b border-[#F5F6FA] hover:bg-gray-50 transition-colors last:border-b-0">
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium">{item.category}</td>
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium text-center">{item.sold}</td>
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium text-right">
                    {formatCurrency(item.gross)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Product Sales Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#F5F6FA]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-[#202224]">Penjualan per Produk</h3>
          <div className="flex flex-wrap items-center gap-3">
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Cari Produk" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-[#D5D5D5] rounded-lg text-sm text-[#202224] focus:outline-none focus:border-[#FE4E10] w-full sm:w-[200px]"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9da0a5]">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                   </svg>
                </div>
             </div>
             <button className="flex items-center gap-2 bg-white border border-[#D5D5D5] rounded-lg px-4 py-2 text-[#202224] text-sm font-medium hover:bg-gray-50">
              <span className="text-[#565656]">Data 30 Hari Terakhir</span>
            </button>
            <button 
              onClick={handleExportProduct}
              className="flex items-center gap-2 bg-white border border-[#D5D5D5] rounded-lg px-4 py-2 text-[#202224] text-sm font-medium hover:bg-gray-50"
            >
              <Share size={16} />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#F5F6FA]">
          <table className="w-full">
            <thead>
              <tr className="bg-white border-b border-[#F5F6FA]">
                <th className="py-4 px-6 text-left text-sm font-medium text-[#202224]">No</th>
                <th className="py-4 px-6 text-left text-sm font-medium text-[#202224]">Produk</th>
                <th className="py-4 px-6 text-left text-sm font-medium text-[#202224]">Kategori</th>
                <th className="py-4 px-6 text-center text-sm font-medium text-[#202224]">Terjual</th>
                <th className="py-4 px-6 text-right text-sm font-medium text-[#202224]">Penjualan Kotor</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((item, index) => (
                <tr key={index} className="border-b border-[#F5F6FA] hover:bg-gray-50 transition-colors last:border-b-0">
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium">{index + 1}.</td>
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium">{item.product}</td>
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium">{item.category}</td>
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium text-center">{item.sold}</td>
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium text-right">
                    {formatCurrency(item.gross)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LaporanPenjualanToko;
