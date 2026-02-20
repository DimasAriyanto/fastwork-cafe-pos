import { TrendingUp, ShoppingBag, Users, DollarSign, Calendar, TrendingDown } from 'lucide-react';
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

const Dashboard = () => {
  // Mock Data for Revenue Line Chart
  const revenueData = [
    { name: 'Jan', value: 10000 },
    { name: 'Feb', value: 35000 },
    { name: 'Mar', value: 25000 },
    { name: 'Apr', value: 55000 },
    { name: 'May', value: 45000 },
    { name: 'Jun', value: 75000 },
    { name: 'Jul', value: 65000 },
    { name: 'Aug', value: 85000 },
    { name: 'Sep', value: 70000 },
    { name: 'Oct', value: 95000 },
    { name: 'Nov', value: 85000 },
    { name: 'Dec', value: 110000 },
  ];

  // Mock Data for Daily Revenue Bar Chart
  const dailyData = [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 6000 },
    { name: 'Wed', value: 3000 },
    { name: 'Thu', value: 7500 },
    { name: 'Fri', value: 5000 },
    { name: 'Sat', value: 9000 },
    { name: 'Sun', value: 7000 },
  ];

  const stats = [
    { 
        title: 'Total Pendapatan', 
        value: 'Rp 650.000', 
        icon: Users, 
        iconColor: 'text-[#8280FF]', 
        iconBg: 'bg-[#8280FF]/20', 
        trend: '8.5% Naik dari kemarin', 
        isUp: true 
    },
    { 
        title: 'Total Modal', 
        value: 'Rp 425.000', 
        icon: ShoppingBag, 
        iconColor: 'text-[#FEC53D]', 
        iconBg: 'bg-[#FEC53D]/20', 
        trend: '1.3% Naik dari minggu lalu', 
        isUp: true 
    },
    { 
        title: 'Laba Bersih', 
        value: 'Rp 500.000', 
        icon: DollarSign, 
        iconColor: 'text-[#4AD991]', 
        iconBg: 'bg-[#4AD991]/20', 
        trend: '4.3% Turun dari kemarin', 
        isUp: false 
    },
    { 
        title: 'Total Transaksi', 
        value: '1,420', 
        icon: Calendar, 
        iconColor: 'text-[#FF9066]', 
        iconBg: 'bg-[#FF9066]/20', 
        trend: '1.8% Naik dari kemarin', 
        isUp: true 
    },
  ];

  const bestSelling = [
    { name: 'Es Coklat', price: 'Rp.12.000', orders: 1200, image: '/images/menu/gambar-coklat.jpg' },
    { name: 'Roti Maryam', price: 'Rp.15.000', orders: 950, image: '/images/menu/gambar-roti-maryam.jpg' },
    { name: 'Es Matcha', price: 'Rp.17.000', orders: 800, image: '/images/menu/gambar-es-matcha.jpg' },
    { name: 'Jagoeng Bakar', price: 'Rp.18.000', orders: 600, image: '/images/menu/gambar-jagung-bakar.jpg' },
  ];

  return (
    <div className="space-y-8">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-[#F5F6FA] hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[#565656] font-medium text-sm mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-[#202224]">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-full ${stat.iconBg}`}>
                  <Icon size={24} className={stat.iconColor} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                 <span className={`flex items-center gap-1 ${stat.isUp ? 'text-[#4AD991]' : 'text-red-500'}`}>
                    {stat.isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                 </span>
                 <span className="text-[#606060] text-xs">{stat.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-[#F5F6FA] flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-bold text-[#202224]">Grafik Pendapatan</h3>
               <select className="bg-[#FCFDFD] border border-[#D5D5D5] text-[#202224] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#FE4E10]">
                  <option>Tahun Ini</option>
                  <option>2024</option>
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
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#F5F6FA]">
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
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#F5F6FA]">
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
                              src={item.image}
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                           />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-[#202224] text-sm truncate">{item.name}</h4>
                           <p className="text-xs text-[#565656]">{item.price}</p>
                        </div>
                        <div className="text-[#202224] text-sm font-bold bg-[#F5F6FA] px-2 py-1 rounded-lg">
                           {item.orders}
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
