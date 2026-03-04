import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar, TrendingDown, Search, Percent } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
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

const Dashboard = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [bestSelling, setBestSelling] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [graphType, setGraphType] = useState<'monthly' | 'daily'>('monthly');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Stats
        const statsRes = await apiClient.getDashboardStats();
        
        const mappedStats = [
          { 
              title: 'Total Pendapatan', 
              value: formatCurrency(statsRes.totalRevenue), 
              icon: DollarSign, 
              iconColor: 'text-[#8280FF]', 
              iconBg: 'bg-[#8280FF]/20', 
              trend: statsRes.trend.revenue, 
              isUp: true 
          },
          { 
              title: 'Total Diskon', 
              value: formatCurrency(statsRes.totalDiscount || 0), 
              icon: Percent, 
              iconColor: 'text-orange-500', 
              iconBg: 'bg-orange-50', 
              trend: 'Potongan', 
              isUp: true 
          },
          { 
              title: 'Total Pajak (PPN)', 
              value: formatCurrency(statsRes.totalTax || 0), 
              icon: Search, 
              iconColor: 'text-blue-500', 
              iconBg: 'bg-blue-50', 
              trend: 'Setoran', 
              isUp: true 
          },
          { 
            title: 'Laba Bersih', 
            value: formatCurrency(statsRes.netProfit), 
            icon: TrendingUp, 
            iconColor: 'text-[#4AD991]', 
            iconBg: 'bg-[#4AD991]/20', 
            trend: statsRes.trend.revenue, 
            isUp: true 
          },
          { 
              title: 'Total Transaksi', 
              value: statsRes.totalTransactions.toLocaleString(), 
              icon: Calendar, 
              iconColor: 'text-[#FF9066]', 
              iconBg: 'bg-[#FF9066]/20', 
              trend: statsRes.trend.transactions, 
              isUp: true 
          },
        ];
        setStats(mappedStats);
        setBestSelling(statsRes.bestSelling);

        // 2. Fetch Graph Data
        const graphRes = await apiClient.getRevenueGraph(graphType);
        setRevenueData(graphRes);

        // 3. Daily Customers (Mock/Placeholder for now, or use daily revenue)
        const dailyRes = await apiClient.getRevenueGraph('daily');
        setDailyData(dailyRes.slice(-7)); // Last 7 days

      } catch (err) {
        console.error("Gagal memuat data dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [graphType]);

  if (loading && stats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FE4E10]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-[#F5F6FA] hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[#565656] font-medium text-xs sm:text-sm mb-1 truncate">{stat.title}</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#202224] truncate">{stat.value}</h3>
                </div>
                <div className={`p-2 sm:p-3 rounded-full shrink-0 ml-2 ${stat.iconBg}`}>
                  <Icon size={20} className={`${stat.iconColor} sm:w-6 sm:h-6`} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                 <span className={`flex items-center gap-1 ${stat.isUp ? 'text-[#4AD991]' : 'text-red-500'}`}>
                    {stat.isUp ? <TrendingUp size={14} className="sm:w-4 sm:h-4" /> : <TrendingDown size={14} className="sm:w-4 sm:h-4" />}
                 </span>
                 <span className="text-[#606060] text-[10px] sm:text-xs truncate">{stat.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-[#F5F6FA] flex flex-col min-h-[400px] sm:min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg sm:text-xl font-bold text-[#202224]">Grafik Pendapatan</h3>
               <select 
                value={graphType}
                onChange={(e) => setGraphType(e.target.value as any)}
                className="bg-[#FCFDFD] border border-[#D5D5D5] text-[#202224] text-xs sm:text-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 outline-none focus:border-[#FE4E10]"
               >
                  <option value="monthly">Tahun Ini</option>
                  <option value="daily">Minggu Ini</option>
               </select>
            </div>
            
            <div className="flex-1 w-full min-h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#FE4E10" stopOpacity={0.2}/>
                           <stop offset="95%" stopColor="#FE4E10" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
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
                        tickFormatter={(value) => `${value / 1000}k`}
                     />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}
                        itemStyle={{ color: '#202224', fontWeight: 'bold' }}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#FE4E10" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
        </div>

        {/* Right Column: Bar Chart & Best Selling */}
        <div className="space-y-8">
           {/* Secondary Bar Chart */}
           <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-[#F5F6FA]">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-bold text-[#202224]">Jumlah Pelanggan</h3>
                 <select className="bg-[#FCFDFD] border border-[#D5D5D5] text-[#202224] text-xs rounded-lg px-2 py-1 outline-none">
                    <option>Mingguan</option>
                 </select>
              </div>
              <div className="h-[200px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData} barSize={20}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                       <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#565656', fontSize: 10 }}
                          dy={5}
                       />
                       <Tooltip 
                          cursor={{fill: 'transparent'}}
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: 'none', fontSize: '12px' }}
                       />
                       <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                          {dailyData.map((_, index) => (
                             <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4880FF' : '#FE4E10'} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Best Selling Products */}
           <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-[#F5F6FA]">
               <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-bold text-[#202224]">Menu Terlaris</h3>
               </div>
               
               <div className="space-y-5">
                  {bestSelling.map((item, idx) => (
                     <div key={idx} className="flex items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center font-bold text-[#565656] bg-gray-50 rounded-lg">
                           #{idx + 1}
                        </div>
                         <div className="w-12 h-12 bg-gray-100 rounded-xl shrink-0 overflow-hidden">
                            <img 
                               src={apiClient.getImageUrl(item.image)}
                               alt={item.menuName} 
                               className="w-full h-full object-cover" 
                            />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#202224] text-sm truncate">{item.menuName}</h4>
                            <p className="text-xs text-[#565656]">{formatCurrency(item.price)}</p>
                         </div>
                         <div className="text-[#202224] text-sm font-bold bg-[#F5F6FA] px-2 py-1 rounded-lg">
                            {item.qty} terjual
                         </div>
                     </div>
                  ))}
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
