import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Coffee, ShoppingCart, FileText, LogOut, Users, Search, Bell, ChevronDown, ChevronRight, Circle } from 'lucide-react';

const OwnerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const navItems = [
    { path: '/owner/dashboard', label: 'Beranda', icon: LayoutDashboard },
    { 
      label: 'Manajemen Menu', 
      icon: Coffee,
      key: 'menu',
      children: [
        { path: '/owner/menu', label: 'Menu Makanan' },
        { path: '/owner/kategori', label: 'Kategori' },
        { path: '/owner/tambahan-menu', label: 'Tambahan Menu' },
      ]
    },
    { path: '/owner/data-transaksi', label: 'Data Transaksi', icon: ShoppingCart },
    { path: '/owner/laporan', label: 'Laporan Keuangan', icon: FileText },
    { path: '/owner/pegawai', label: 'Pegawai', icon: Users },
  ];

  // Auto-expand submenu if current path is a child
  useEffect(() => {
    const activeParent = navItems.find((item) => 
      item.children?.some((child) => child.path === location.pathname)
    );
    if (activeParent && activeParent.key) {
      setOpenSubmenu(activeParent.key);
    }
  }, [location.pathname]);

  const toggleSubmenu = (key: string) => {
    setOpenSubmenu(openSubmenu === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex font-sans">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-white h-screen fixed top-0 left-0 z-30 shadow-lg rounded-r-[30px]">
        <div className="h-28 flex items-center px-8">
          <h2 className="text-3xl font-bold tracking-tight text-[#202224]">
            <span className="text-[#FE4E10]">Owner</span>
          </h2>
        </div>
        
        <nav className="flex-1 py-4 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            
            // Check if item has children (submenu)
            if (item.children) {
              const isChildActive = item.children.some(child => child.path === location.pathname);
              const isOpen = openSubmenu === item.key;
              
              return (
                <div key={item.key} className="space-y-1">
                  <button
                    onClick={() => item.key && toggleSubmenu(item.key)}
                    className={`nav-item w-full flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                      isChildActive || isOpen
                        ? 'bg-[#FE4E10]/10 text-[#FE4E10]' 
                        : 'text-[#5C5C5C] hover:bg-[#FE6B38]/10 hover:text-[#FE6B38]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Icon size={22} strokeWidth={isChildActive || isOpen ? 2.5 : 2} className="relative z-10" />
                      <span className={`relative z-10 text-[15px] ${isChildActive || isOpen ? 'font-semibold' : 'font-medium'}`}>
                        {item.label}
                      </span>
                    </div>
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  
                  {/* Submenu */}
                  <div className={`pl-11 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    {item.children.map((child) => {
                      const isSubActive = location.pathname === child.path;
                      return (
                         <Link
                          key={child.path}
                          to={child.path}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                            isSubActive 
                              ? 'text-[#FE4E10] bg-[#FE4E10]/10 font-medium translate-x-1' 
                              : 'text-[#5C5C5C] hover:text-[#FE6B38] hover:translate-x-1'
                          }`}
                        >
                          <Circle size={6} className={isSubActive ? 'fill-current' : ''} />
                          <span className="text-[14px]">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Standard Menu Item
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path!} // Direct path existing items
                className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-[#FE4E10] text-white shadow-md shadow-[#FE4E10]/20' 
                    : 'text-[#5C5C5C] hover:bg-[#FE6B38]/10 hover:text-[#FE6B38]'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
                <span className={`relative z-10 text-[15px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto mb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-3.5 w-full text-left text-[#5C5C5C] hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors font-medium group"
          >
            <LogOut size={22} />
            <span className="font-semibold text-[15px]">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper - Adjusted margin for fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[280px]">
        {/* Top Header */}
        <header className="bg-white h-24 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-20 shadow-sm border-b border-[#EAEAEA]">
          {/* Header Title */}
          <h1 className="text-2xl font-bold text-[#202224] hidden sm:block">
            {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h1>

          {/* Search Bar - Responsive */}
          <div className="flex-1 max-w-md mx-6 hidden md:block">
             <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C5C5C]">
                   <Search size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="Search here..." 
                  className="w-full pl-12 pr-4 py-3 bg-[#F5F6FA] rounded-full border-none focus:ring-2 focus:ring-[#FE4E10]/20 outline-none text-sm text-[#202224] placeholder-[#A0A0A0]"
                />
             </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6 ml-auto">
             {/* Notification */}
             <button className="relative p-2.5 text-[#5C5C5C] hover:bg-[#F5F6FA] rounded-full transition-colors border border-[#D5D5D5]">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#FE4E10] rounded-full border border-white"></span>
             </button>

             {/* User Profile */}
             <div className="flex items-center gap-4 pl-0 sm:pl-6 sm:border-l border-[#EAEAEA]">
                <div className="w-12 h-12 bg-gray-200 rounded-xl overflow-hidden shadow-sm relative shrink-0">
                  <img src="https://ui-avatars.com/api/?name=Admin+Owner&background=random" alt="Admin" className="w-full h-full object-cover" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-bold text-[#202224] leading-tight flex items-center gap-1">
                    Jhon Doe <ChevronDown size={14} />
                  </p>
                  <p className="text-xs text-[#5C5C5C] font-medium mt-0.5">Admin</p>
                </div>
             </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6 lg:p-8 bg-[#F5F6FA]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;

