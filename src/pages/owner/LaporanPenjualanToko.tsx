import React from 'react';
import { Filter, ChevronDown, RotateCcw, Share } from 'lucide-react';


const LaporanPenjualanToko = () => {
  // Mock Data for Summary Cards
  const summaryStats = [
    { title: 'Total Penjualan', value: 'Rp 14.250.000', isCurrency: true },
    { title: 'Produk Terjual', value: '840 Item', isCurrency: false },
    { title: 'Transaksi Sukses', value: '312', isCurrency: false },
    { title: 'Rata-rata Harian', value: 'Rp 450.000', isCurrency: true },
  ];





  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#202224]">Laporan Keuangan</h1>
        <p className="text-[#565656] mt-1">Penjualan Toko</p>
      </div>

      {/* 2. Filter & Action Bar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Filter Group */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-[#D5D5D5] rounded-lg px-4 py-2.5 text-[#202224] text-sm font-medium hover:bg-gray-50">
            <Filter size={18} />
            Filter By
          </button>
          
          <div className="relative">
            <button className="flex items-center gap-8 bg-white border border-[#D5D5D5] rounded-lg px-4 py-2.5 text-[#202224] text-sm font-medium hover:bg-gray-50 min-w-[140px] justify-between">
              Minggu ini
              <ChevronDown size={16} />
            </button>
          </div>

          <button className="flex items-center gap-2 text-[#FE4E10] text-sm font-medium hover:text-[#e0430d] px-2">
            <RotateCcw size={16} />
            Reset Filter
          </button>
        </div>

        {/* Action Button */}
        <div className="ml-auto">
          <button className="flex items-center gap-2 bg-white border border-[#D5D5D5] rounded-lg px-4 py-2.5 text-[#202224] text-sm font-medium hover:bg-gray-50">
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



      {/* 5. Category Sales Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#F5F6FA]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-[#202224]">Penjualan per Kategori</h3>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 bg-white border border-[#D5D5D5] rounded-lg px-4 py-2 text-[#202224] text-sm font-medium hover:bg-gray-50">
              <span className="text-[#565656]">01/11/2026 - 01/18/2026</span>
            </button>
            <button className="flex items-center gap-2 bg-white border border-[#D5D5D5] rounded-lg px-4 py-2 text-[#202224] text-sm font-medium hover:bg-gray-50">
              <Share size={16} />
              Export
            </button>
          </div>
        </div>
        
        {/* Summary Row for Categories */}
        <div className="grid grid-cols-2 bg-white rounded-xl border border-[#F5F6FA] mb-6 divide-x divide-[#F5F6FA]">
          <div className="p-4 text-center">
            <p className="text-[#565656] text-sm mb-1">Produk Terjual</p>
            <p className="text-[#202224] text-lg font-bold">718</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-[#565656] text-sm mb-1">Total Penjualan Kotor</p>
            <p className="text-[#202224] text-lg font-bold">Rp 6.040.000</p>
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
              {[
                { category: 'Minuman Dingin', sold: 330, gross: 2400000 },
                { category: 'Minuman Panas - Kopi', sold: 150, gross: 1270000 },
                { category: 'Minuman Panas - Non Kopi', sold: 120, gross: 775000 },
                { category: 'Jagung', sold: 75, gross: 915000 },
                { category: 'Roti', sold: 68, gross: 680000 },
              ].map((item, index) => (
                <tr key={index} className="border-b border-[#F5F6FA] hover:bg-gray-50 transition-colors last:border-b-0">
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium">{item.category}</td>
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium text-center">{item.sold}</td>
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium text-right">
                    Rp {item.gross.toLocaleString('id-ID')}
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
                  className="pl-10 pr-4 py-2 border border-[#D5D5D5] rounded-lg text-sm text-[#202224] focus:outline-none focus:border-[#FE4E10] w-[200px]"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9da0a5]">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                   </svg>
                </div>
             </div>
             <button className="flex items-center gap-2 bg-white border border-[#D5D5D5] rounded-lg px-4 py-2 text-[#202224] text-sm font-medium hover:bg-gray-50">
              <span className="text-[#565656]">01/11/2026 - 01/18/2026</span>
            </button>
            <button className="flex items-center gap-2 bg-white border border-[#D5D5D5] rounded-lg px-4 py-2 text-[#202224] text-sm font-medium hover:bg-gray-50">
              <Share size={16} />
              Export
            </button>
          </div>
        </div>

         {/* Summary Row for Products */}
        <div className="grid grid-cols-2 bg-white rounded-xl border border-[#F5F6FA] mb-6 divide-x divide-[#F5F6FA]">
          <div className="p-4 text-center">
            <p className="text-[#565656] text-sm mb-1">Produk Terjual</p>
            <p className="text-[#202224] text-lg font-bold">718</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-[#565656] text-sm mb-1">Total Penjualan Kotor</p>
            <p className="text-[#202224] text-lg font-bold">Rp 6.482.000</p>
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
              {[
                { id: 1, product: 'Es Lemon Teh', category: 'Minuman Dingin', sold: 120, gross: 600000 },
                { id: 2, product: 'Es Teh', category: 'Minuman Dingin', sold: 40, gross: 280000 },
                { id: 3, product: 'Kopi Susu Gula Aren', category: 'Minuman Panas - Kopi', sold: 85, gross: 850000 },
                { id: 4, product: 'Jagung Bakar Pedas', category: 'Jagung', sold: 45, gross: 540000 },
                { id: 5, product: 'Roti Bakar Coklat', category: 'Roti', sold: 35, gross: 350000 },
              ].map((item, index) => (
                <tr key={index} className="border-b border-[#F5F6FA] hover:bg-gray-50 transition-colors last:border-b-0">
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium">{item.id}.</td>
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium">{item.product}</td>
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium">{item.category}</td>
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium text-center">{item.sold}</td>
                  <td className="py-4 px-6 text-sm text-[#565656] font-medium text-right">
                    Rp {item.gross.toLocaleString('id-ID')}
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
