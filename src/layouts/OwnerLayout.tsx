import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Coffee, ShoppingCart, FileText, LogOut, Users, Search, ChevronDown, ChevronRight, Circle, Menu, X } from 'lucide-react';
import { apiClient } from '../api/client';

const OwnerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const fetchUser = async () => {
      try {
        const userData = await apiClient.getMe();
        if (userData) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUser();

    window.addEventListener('userUpdated', fetchUser);
    return () => window.removeEventListener('userUpdated', fetchUser);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
        await apiClient.logout();
    } catch (error) {
        console.error("Logout error:", error);
    }
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
    { 
      label: 'Laporan Keuangan', 
      icon: FileText,
      key: 'laporan', 
      children: [
        { path: '/owner/laporan-keuangan', label: 'Keuangan Toko' },
        { path: '/owner/laporan-penjualan', label: 'Penjualan Toko' },
        { path: '/owner/diskon', label: 'Diskon' },
      ]
    },
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

  // Get Current Page Title
  const getCurrentPageTitle = () => {
    for (const item of navItems) {
      if (item.path === location.pathname) return item.label;
      if (item.children) {
        const activeChild = item.children.find(child => child.path === location.pathname);
        if (activeChild) return activeChild.label;
      }
    }
    return 'Dashboard';
  };

  // Reset search when page changes
  useEffect(() => {
    setSearch("");
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-[280px] bg-white z-40 shadow-lg transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-24 flex items-center justify-between px-8">
          <h2 className="text-3xl font-bold tracking-tight text-[#202224]">
            <span className="text-[#FE4E10]">Owner</span>
          </h2>
          {/* Close button for mobile */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-[#FE4E10] transition-colors"
          >
            <X size={24} />
          </button>
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
                          onClick={() => setIsSidebarOpen(false)} // Close on mobile nav
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
                onClick={() => setIsSidebarOpen(false)} // Close on mobile nav
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
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[280px] transition-all duration-300">
        {/* Top Header */}
        <header className="bg-white h-24 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-20 shadow-sm border-b border-[#EAEAEA]">
          <div className="flex items-center gap-4">
              {/* Hamburger Menu (Mobile Only) */}
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-[#5C5C5C] hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <Menu size={24} />
              </button>

              {/* Header Title */}
              <h1 className="text-2xl font-bold text-[#202224] hidden sm:block">
                {getCurrentPageTitle()}
              </h1>
          </div>

          {/* Search Bar - Responsive */}
          <div className="flex-1 max-w-md mx-6 hidden md:block">
             <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5C5C5C]">
                   <Search size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="Cari data..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#F5F6FA] rounded-full border-none focus:ring-2 focus:ring-[#FE4E10]/20 outline-none text-sm text-[#202224] placeholder-[#A0A0A0]"
                />
             </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6 ml-auto">
            
             {/* User Profile */}
             <div className="relative pl-0 sm:pl-6 sm:border-l border-[#EAEAEA]" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-4 focus:outline-none group appearance-none select-none"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-xl overflow-hidden shadow-sm relative shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <img 
                      src={user?.imagePath ? apiClient.getImageUrl(user.imagePath) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.username || 'Admin')}&background=random`} 
                      alt={user?.name || user?.username || 'Admin'} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-bold text-[#202224] leading-tight flex items-center gap-1">
                      {user?.name || user?.username || "Admin"} 
                      <ChevronDown 
                        size={14} 
                        className={`transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} 
                      />
                    </p>
                    <p className="text-xs text-[#5C5C5C] font-medium mt-0.5">{user?.role || "Owner"}</p>
                  </div>
                </button>

                {/* Dropdown Menu - User Info & Option could be here, but sidebar logout is preferred */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-3 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-3 px-4 z-50 origin-top-right transition-all animate-in fade-in zoom-in-95">
                    <div className="pb-3 border-b border-gray-100 mb-2">
                       <p className="text-xs text-gray-400 font-medium mb-1">Logged in as</p>
                       <p className="text-sm font-bold text-[#202224] truncate">{user?.email || user?.username}</p>
                    </div>
                    <p className="text-[11px] text-[#5C5C5C]">Gunakan menu di sidebar untuk keluar dari sistem.</p>
                  </div>
                )}
             </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6 lg:p-8 bg-[#F5F6FA]">
          <Outlet context={{ search, setSearch }} />
        </main>
      </div>
    </div>
  );
};

export default OwnerLayout;

