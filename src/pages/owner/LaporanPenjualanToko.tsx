import { useState, useEffect } from 'react';
import { Filter, ChevronDown, RotateCcw, Share } from 'lucide-react';
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
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [filterLabel, setFilterLabel] = useState('Semua Waktu');

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        const [categories, products] = await Promise.all([
          apiClient.getSalesByCategory(dateRange.start, dateRange.end),
          apiClient.getSalesByProduct(dateRange.start, dateRange.end)
        ]);

        setCategorySales(categories);
        setProductSales(products);

        // Aggregate stats
        const totalGross = products.reduce((acc: number, curr: any) => acc + Number(curr.gross), 0);
        const totalSold = products.reduce((acc: number, curr: any) => acc + Number(curr.sold), 0);
        
        // Count distinct successful transactions? 
        // For simplicity, we'll re-use the financial summary for these specific overall stats
        const financialSummary = await apiClient.getFinancialSummary(dateRange.start, dateRange.end);
        const totalTrx = financialSummary.reduce((acc: number, curr: any) => acc + Number(curr.totalTransaksi), 0);
        const avgDaily = totalTrx > 0 ? totalGross / financialSummary.length : 0;

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
  }, [dateRange]);

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
          <button className="flex items-center gap-2 bg-white border border-[#D5D5D5] rounded-lg px-4 py-2.5 text-[#202224] text-sm font-medium hover:bg-gray-50">
            <Filter size={18} />
            Filter By
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className="flex items-center gap-8 bg-white border border-[#D5D5D5] rounded-lg px-4 py-2.5 text-[#202224] text-sm font-medium hover:bg-gray-50 min-w-[160px] justify-between"
            >
              {filterLabel}
              <ChevronDown size={16} />
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
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              setDateRange({ start: '', end: '' });
              setFilterLabel('Semua Waktu');
            }}
            className="flex items-center gap-2 text-[#FE4E10] text-sm font-medium hover:text-[#e0430d] px-2"
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
