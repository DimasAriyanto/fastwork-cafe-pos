import { useState, useEffect, useRef } from 'react';
import { Filter, ChevronDown, RotateCcw, Share, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExport';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { apiClient } from '../../api/client';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const LaporanKeuanganToko = () => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDayTransactions, setSelectedDayTransactions] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    const fetchFinancialData = async () => {
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

        const data = await apiClient.getFinancialSummary(params);
        
        setTransactions(data);
        setChartData(data.map((d: any) => ({
          name: d.tanggal,
          Pendapatan: d.pendapatan,
          Laba: d.laba
        })).reverse());

        const totalPendapatan = data.reduce((acc: number, curr: any) => acc + Number(curr.pendapatan), 0);
        const totalLaba = data.reduce((acc: number, curr: any) => acc + Number(curr.laba), 0);
        const totalTransaksi = data.reduce((acc: number, curr: any) => acc + Number(curr.totalTransaksi), 0);
        const totalMenu = data.reduce((acc: number, curr: any) => acc + Number(curr.totalMenu), 0);

        setSummaryStats([
          { title: 'Total Pendapatan', value: formatCurrency(totalPendapatan), isCurrency: true },
          { title: 'Laba Bersih', value: formatCurrency(totalLaba), isCurrency: true },
          { title: 'Total Transaksi', value: totalTransaksi.toLocaleString(), isCurrency: false },
          { title: 'Total Menu Terjual', value: `${totalMenu} Menu`, isCurrency: false },
        ]);

      } catch (err) {
        console.error("Gagal memuat laporan keuangan:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
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

  const handleViewDetail = async (item: any) => {
    try {
      setIsDetailOpen(true);
      // item.tanggal is in 'dd/mm/yy'
      const [day, month, yearShort] = item.tanggal.split('/');
      const year = `20${yearShort}`;
      const startDate = `${year}-${month}-${day}T00:00:00Z`;
      const endDate = `${year}-${month}-${day}T23:59:59Z`;

      const data = await apiClient.getTransactions({ 
        startDate, 
        endDate, 
        limit: 100,
      });
      
      const filteredDetails = data.filter((trx: any) => {
        if (filters.cashierName !== 'all' && trx.employeeName !== filters.cashierName) return false;
        if (filters.orderType !== 'all' && trx.orderType !== filters.orderType) return false;
        if (filters.paymentMethod !== 'all' && trx.paymentMethod !== filters.paymentMethod) return false;
        return true;
      });

      const detailedTransactions = await Promise.all(
        filteredDetails.map(async (trx: any) => {
          const detail = await apiClient.getTransactionDetail(trx.id);
          return {
            id: trx.id,
            waktu: new Date(trx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            kasir: trx.employeeName || 'System',
            metode: trx.paymentMethod || 'Tunai',
            total: trx.totalPrice,
            items: detail.items.map((it: any) => ({
              name: it.menuName,
              qty: it.qty
            }))
          };
        })
      );

      setSelectedDayTransactions(detailedTransactions);
    } catch (err) {
      console.error("Gagal mengambil detail transaksi:", err);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedDayTransactions([]);
  };

  const handleExportFinancial = () => {
    const headers = { 
      tanggal: 'Tanggal', 
      totalTransaksi: 'Total Transaksi',
      totalMenu: 'Total Menu Terjual',
      pendapatan: 'Pendapatan Kotor',
      laba: 'Laba Bersih'
    };
    exportToCSV(transactions, headers, 'laporan_keuangan_harian');
  };

  if (loading && transactions.length === 0) {
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
        <h1 className="text-3xl font-bold text-[#202224]">Laporan Keuangan</h1>
        <p className="text-[#565656] mt-1">Keuangan Toko</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
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

        {/* Date Filter */}
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

        {/* Reset */}
        <button 
            onClick={() => {
              handleDatePreset('all');
              setFilters({
                cashierName: 'all',
                orderType: 'all',
                paymentMethod: 'all'
              });
            }}
            className="flex items-center gap-2 text-[#FE4E10] font-bold text-sm hover:opacity-80 transition-all px-2"
        >
            <RotateCcw size={18} />
            Reset Filter
        </button>

        {/* Action Button */}
        <div className="ml-auto">
          <button 
            onClick={handleExportFinancial}
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
            <h3 className="text-3xl font-bold text-[#202224]">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* 4. Chart Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#F5F6FA]">
        <h3 className="text-xl font-bold text-[#202224] mb-8">Grafik Pendapatan & Laba</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#565656', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#565656', fontSize: 12 }}
                tickFormatter={(value) => {
                   if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
                   if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
                   return value.toString();
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: 'none',
                }}
                formatter={(value: any) => formatCurrency(Number(value))}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="plainline"
                formatter={(value) => <span className="text-sm font-medium ml-1">{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="Pendapatan"
                stroke="#20C997" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#20C997', strokeWidth: 0 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="Laba"
                stroke="#4880FF" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#4880FF', strokeWidth: 0 }}
                activeDot={{ r: 7 }}
                name="Laba Bersih"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Detail Laporan Keuangan Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#F5F6FA]">
        <h3 className="text-xl font-bold text-[#202224] mb-6">Detail Laporan Keuangan</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EAEAEA]">
                <th className="py-4 px-4 text-left text-sm font-bold text-[#202224]">Tanggal</th>
                <th className="py-4 px-4 text-right text-sm font-bold text-[#202224]">Total Transaksi</th>
                <th className="py-4 px-4 text-right text-sm font-bold text-[#202224]">Total Menu Terjual</th>
                <th className="py-4 px-4 text-right text-sm font-bold text-[#202224]">Pendapatan Kotor</th>
                <th className="py-4 px-4 text-right text-sm font-bold text-[#202224]">Laba Bersih</th>
                <th className="py-4 px-4 text-center text-sm font-bold text-[#202224]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item, index) => (
                <tr key={index} className="border-b border-[#F5F6FA] hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-sm text-[#202224] font-medium">{item.tanggal}</td>
                  <td className="py-4 px-4 text-sm text-[#202224] font-medium text-right">{item.totalTransaksi}</td>
                  <td className="py-4 px-4 text-sm text-[#202224] font-medium text-right">{item.totalMenu}</td>
                  <td className="py-4 px-4 text-sm text-[#202224] font-medium text-right">{formatCurrency(item.pendapatan)}</td>
                  <td className="py-4 px-4 text-sm text-[#202224] font-medium text-right">{formatCurrency(item.laba)}</td>
                  <td className="py-4 px-4 text-center">
                    <button 
                      onClick={() => handleViewDetail(item)}
                      className="bg-[#FE4E10] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#e0430d] transition-colors"
                    >
                      Lihat Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#EAEAEA] shrink-0">
              <h2 className="text-xl font-bold text-[#202224]">Detail Laporan Keuangan</h2>
              <button 
                onClick={handleCloseDetail}
                className="p-1 text-[#565656] hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className="p-6 overflow-y-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-[#F1F4F9] border-b border-[#EAEAEA]">
                    <th className="py-4 px-4 text-left text-sm font-semibold text-[#202224] w-[60px] rounded-tl-xl">No</th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-[#202224]">ID Transaksi</th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-[#202224]">Waktu</th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-[#202224]">Kasir</th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-[#202224]">Metode Bayar</th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-[#202224] w-[25%]">Menu</th>
                    <th className="py-4 px-4 text-center text-sm font-semibold text-[#202224]">Qty</th>
                    <th className="py-4 px-4 text-right text-sm font-semibold text-[#202224] rounded-tr-xl">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {selectedDayTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#565656]">Data transaksi tidak tersedia</td>
                    </tr>
                  ) : (
                    selectedDayTransactions.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-sm text-[#202224] align-top">{idx + 1}</td>
                        <td className="py-4 px-4 text-sm text-[#202224] font-medium align-top">{row.id}</td>
                        <td className="py-4 px-4 text-sm text-[#202224] align-top">{row.waktu}</td>
                        <td className="py-4 px-4 text-sm text-[#202224] align-top">{row.kasir}</td>
                        <td className="py-4 px-4 text-sm text-[#202224] align-top">{row.metode}</td>
                        
                        {/* Nested Menu Items */}
                        <td className="py-4 px-4 text-sm text-[#202224] align-top">
                          <div className="flex flex-col gap-2">
                            {row.items.map((item: any, i: number) => (
                              <span key={i}>{item.name}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-[#202224] text-center align-top">
                          <div className="flex flex-col gap-2">
                             {row.items.map((item: any, i: number) => (
                              <span key={i}>{item.qty}</span>
                            ))}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-sm text-[#202224] text-right font-medium align-top">{formatCurrency(row.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaporanKeuanganToko;
