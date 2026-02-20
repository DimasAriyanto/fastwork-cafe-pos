import React, { useState } from 'react';
import { Filter, ChevronDown, RotateCcw, Share, X } from 'lucide-react';
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

const LaporanKeuanganToko = () => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  const handleViewDetail = (item: any) => {
    setSelectedTransaction(item);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedTransaction(null);
  };
  // Mock Data for Summary Cards
  const summaryStats = [
    { title: 'Total Pendapatan', value: 'Rp 9.617.589', isCurrency: true },
    { title: 'Laba Bersih', value: 'Rp 4.221.723', isCurrency: true },
    { title: 'Total Transaksi', value: '165', isCurrency: false },
    { title: 'Total Menu Terjual', value: '431 Menu', isCurrency: false },
  ];

  // Mock Data for Chart
  const chartData = [
    { name: '25/01/26', Pendapatan: 950000, Laba: 400000 },
    { name: '26/01/26', Pendapatan: 1800000, Laba: 900000 },
    { name: '27/01/26', Pendapatan: 1400000, Laba: 700000 },
    { name: '28/01/26', Pendapatan: 1350000, Laba: 1100000 },
    { name: '29/01/26', Pendapatan: 1450000, Laba: 750000 },
    { name: '30/01/26', Pendapatan: 2100000, Laba: 1350000 },
    { name: '31/01/26', Pendapatan: 1150000, Laba: 750000 },
  ];

  // Mock Data for Table
  const transactions = [
    {
      tanggal: '25/01/26',
      totalTransaksi: 24,
      totalMenu: 48,
      pendapatan: 'Rp 1.802.931',
      laba: 'Rp 906.580',
    },
    {
      tanggal: '26/01/26',
      totalTransaksi: 37,
      totalMenu: 74,
      pendapatan: 'Rp 1.340.965',
      laba: 'Rp 491.504',
    },
    {
      tanggal: '27/01/26',
      totalTransaksi: 15,
      totalMenu: 30,
      pendapatan: 'Rp 856.793',
      laba: 'Rp 470.339',
    },
    {
      tanggal: '28/01/26',
      totalTransaksi: 33,
      totalMenu: 99,
      pendapatan: 'Rp 922.821',
      laba: 'Rp 398.701',
    },
    {
      tanggal: '29/01/26',
      totalTransaksi: 12,
      totalMenu: 48,
      pendapatan: 'Rp 1.941.471',
      laba: 'Rp 697.584',
    },
    {
      tanggal: '30/01/26',
      totalTransaksi: 26,
      totalMenu: 78,
      pendapatan: 'Rp 556.637',
      laba: 'Rp 195.320',
    },
    {
      tanggal: '31/01/26',
      totalTransaksi: 18,
      totalMenu: 54,
      pendapatan: 'Rp 2.196.025',
      laba: 'Rp 1.61.695',
    },
  ];



  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#202224]">Laporan Keuangan</h1>
        <p className="text-[#565656] mt-1">Keuangan Toko</p>
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
                   if (value >= 1000000) return `${value / 1000000}jt`;
                   if (value >= 1000) return `${value / 1000}rb`;
                   return value;
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: 'none',
                }}
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
                stroke="#20C997" // Greenish color from design
                strokeWidth={3}
                dot={{ r: 4, fill: '#20C997', strokeWidth: 0 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="Laba"
                stroke="#4880FF" // Blueish color
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
                  <td className="py-4 px-4 text-sm text-[#202224] font-medium text-right">{item.pendapatan}</td>
                  <td className="py-4 px-4 text-sm text-[#202224] font-medium text-right">{item.laba}</td>
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
    {/* Detail Modal */}
      {isDetailOpen && selectedTransaction && (
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
                  {/* Mock Data for the modal view */}
                  {[
                    {
                      no: 1,
                      id: "TRX-001",
                      waktu: "10.45",
                      kasir: "Andi",
                      metode: "Tunai",
                      total: "20.000",
                      items: [
                        { name: "Es Coklat Nusantara", qty: 1 },
                        { name: "Es Teh Tarik", qty: 1 }
                      ]
                    },
                    {
                      no: 2,
                      id: "TRX-002",
                      waktu: "10.50",
                      kasir: "Andi",
                      metode: "Tunai",
                      total: "20.000",
                      items: [
                         { name: "Es Coklat Nusantara", qty: 1 },
                         { name: "Es Teh Tarik", qty: 1 }
                      ]
                    },
                    {
                      no: 3,
                      id: "TRX-003",
                      waktu: "10.55",
                      kasir: "Andi",
                      metode: "Tunai",
                      total: "20.000",
                      items: [
                         { name: "Es Coklat Nusantara", qty: 1 },
                         { name: "Es Teh Tarik", qty: 1 }
                      ]
                    },
                     {
                      no: 4,
                      id: "TRX-004",
                      waktu: "11.05",
                      kasir: "Andi",
                      metode: "Tunai",
                      total: "20.000",
                      items: [
                         { name: "Es Coklat Nusantara", qty: 1 },
                         { name: "Es Teh Tarik", qty: 1 }
                      ]
                    },
                     {
                      no: 5,
                      id: "TRX-005",
                      waktu: "11.15",
                      kasir: "Andi",
                      metode: "Tunai",
                      total: "20.000",
                      items: [
                         { name: "Es Coklat Nusantara", qty: 1 },
                         { name: "Es Teh Tarik", qty: 1 }
                      ]
                    }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-sm text-[#202224] align-top">{row.no}</td>
                      <td className="py-4 px-4 text-sm text-[#202224] font-medium align-top">{row.id}</td>
                      <td className="py-4 px-4 text-sm text-[#202224] align-top">{row.waktu}</td>
                      <td className="py-4 px-4 text-sm text-[#202224] align-top">{row.kasir}</td>
                      <td className="py-4 px-4 text-sm text-[#202224] align-top">{row.metode}</td>
                      
                      {/* Nested Menu Items */}
                      <td className="py-4 px-4 text-sm text-[#202224] align-top">
                        <div className="flex flex-col gap-2">
                          {row.items.map((item, i) => (
                            <span key={i}>{item.name}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-[#202224] text-center align-top">
                        <div className="flex flex-col gap-2">
                           {row.items.map((item, i) => (
                            <span key={i}>{item.qty}</span>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-sm text-[#202224] text-right font-medium align-top">{row.total}</td>
                    </tr>
                  ))}
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
