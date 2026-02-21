import { useState, useEffect } from 'react';
import { Filter, ChevronDown, RotateCcw, Share, X } from 'lucide-react';
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
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [filterLabel, setFilterLabel] = useState('Semua Waktu');

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getFinancialSummary(dateRange.start, dateRange.end);
        
        // Mapped for the table and chart
        setTransactions(data);
        setChartData(data.map((d: any) => ({
          name: d.tanggal,
          Pendapatan: d.pendapatan,
          Laba: d.laba
        })).reverse()); // Reverse to show chronological order in chart

        // Calculate aggregate for summary cards
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
  }, [dateRange]);

  const handleViewDetail = async (item: any) => {
    try {
      setIsDetailOpen(true);
      // item.tanggal is in 'dd/mm/yy'
      const [day, month, yearShort] = item.tanggal.split('/');
      const year = `20${yearShort}`;
      const startDate = `${year}-${month}-${day}T00:00:00Z`;
      const endDate = `${year}-${month}-${day}T23:59:59Z`;

      const data = await apiClient.getTransactions({ startDate, endDate, limit: 100 });
      
      // We need to fetch item details for each transaction if not included?
      // Actually, getTransactions (findAll) doesn't include items by default.
      // But we can map it to show headers first, or fetch details in parallel.
      // For now, let's fetch details for each to get the items list.
      const detailedTransactions = await Promise.all(
        data.map(async (trx: any) => {
          const detail = await apiClient.getTransactionDetail(trx.id);
          return {
            id: trx.id,
            waktu: new Date(trx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            kasir: trx.cashierName || 'System',
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
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EAEAEA] rounded-lg text-[#202224] hover:bg-gray-50 transition-colors">
            <Filter size={18} />
            <span className="text-sm font-medium">Filter By</span>
        </button>

        {/* Date Filter */}
        <div className="relative">
            <button 
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 bg-white border border-[#EAEAEA] rounded-lg text-[#202224] hover:bg-gray-50 transition-colors min-w-[160px] justify-between`}
            >
                <span className="text-sm font-medium">{filterLabel}</span>
                <ChevronDown size={14} className="text-gray-400" />
            </button>

            {isDateDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#EAEAEA] rounded-xl shadow-xl z-20 py-2">
                    {[
                      { label: 'Semua Waktu', range: { start: '', end: '' } },
                      { label: 'Hari Ini', range: { 
                        start: new Date().toISOString().split('T')[0], 
                        end: new Date().toISOString().split('T')[0] 
                      } },
                      { label: 'Minggu Ini', range: { 
                        start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], 
                        end: new Date().toISOString().split('T')[0] 
                      } },
                      { label: 'Bulan Ini', range: { 
                        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], 
                        end: new Date().toISOString().split('T')[0] 
                      } },
                    ].map((item) => (
                      <button 
                          key={item.label}
                          onClick={() => {
                            setDateRange(item.range);
                            setFilterLabel(item.label);
                            setIsDateDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700`}
                      >
                          {item.label}
                      </button>
                    ))}
                </div>
            )}
        </div>

        {/* Reset */}
        <button 
            onClick={() => {
              setDateRange({ start: '', end: '' });
              setFilterLabel('Semua Waktu');
            }}
            className="flex items-center gap-2 text-[#FE4E10] font-bold text-sm hover:opacity-80 transition-opacity"
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
