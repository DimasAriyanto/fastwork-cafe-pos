import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Search, LogOut, History, ShoppingBag } from "lucide-react";
import { useResponsive } from "../hooks/useResponsive";
import { apiClient } from "../api/client";

import type { Transaction, UnpaidOrder, PaymentMethod } from "../types/cashier";

export type CashierContextType = {
  search: string;
  setSearch: (s: string) => void;
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  unpaidOrders: UnpaidOrder[];
  addUnpaidOrder: (u: UnpaidOrder) => void;
  updateUnpaidOrder: (u: UnpaidOrder) => void;
  payUnpaidOrder: (id: string, paymentMethod: PaymentMethod, paidAmount?: number, change?: number) => void;
  createOrder: (data: any) => Promise<any>;
  refreshData: () => void;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (open: boolean) => void;
  cartCount: number;
  setCartCount: (count: number) => void;
};


export default function CashierLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<any>(null);
  const { isDesktop, isMobile } = useResponsive();

  // API-backed state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [unpaidOrders, setUnpaidOrders] = useState<UnpaidOrder[]>([]);

  const navigate = useNavigate();
  const location = useLocation();

  // Normalize API transaction → frontend Transaction shape
  const normalizeTransaction = (t: any): Transaction => ({
    id: String(t.id),
    customerName: t.customerName || t.notes || 'Guest',
    items: t.items || [],
    subtotal: Number(t.subtotal || 0),
    totalPrice: Number(t.totalPrice),
    discountAmount: Number(t.discountAmount || 0),
    paymentMethod: (t.paymentMethod?.toUpperCase() || 'CASH') as PaymentMethod,
    date: t.createdAt || new Date().toISOString(),
    paidAmount: Number(t.paidAmount || t.totalPrice),
    change: Number(t.changeAmount || 0),
    cashierName: t.cashierName || t.employeeName || '',
    serviceType: t.orderType === 'take_away' ? 'Take Away' : 'Dine In',
  });

  // Normalize API order → frontend UnpaidOrder shape
  const normalizeOrder = (o: any): UnpaidOrder => ({
    id: String(o.id),
    customerName: o.customerName || o.notes || 'Guest',
    items: o.items || [],
    totalPrice: Number(o.totalPrice),
    status: 'unpaid',
    date: o.createdAt || new Date().toISOString(),
    cashierName: o.cashierName || o.employeeName || '',
    serviceType: o.orderType === 'take_away' ? 'Take Away' : 'Dine In',
    paymentMethod: undefined,
  });

  const refreshData = useCallback(async () => {
    try {
      const [txResponse, unpaidResponse] = await Promise.all([
        apiClient.getTransactions({ limit: 50 }),
        apiClient.getUnpaidOrders(),
      ]);
      const txData = txResponse ?? [];
      setTransactions(Array.isArray(txData) ? txData.map(normalizeTransaction) : []);
      const unpaidData = Array.isArray(unpaidResponse) ? unpaidResponse : [];
      setUnpaidOrders(unpaidData.map(normalizeOrder));
    } catch (err) {
      console.error('Failed to refresh cashier data:', err);
    }
  }, []);

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
    refreshData();

    window.addEventListener('userUpdated', fetchUser);
    return () => window.removeEventListener('userUpdated', fetchUser);
  }, [refreshData]);

  const addTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  };

  const addUnpaidOrder = (order: UnpaidOrder) => {
    setUnpaidOrders(prev => [order, ...prev]);
  };

  const updateUnpaidOrder = (updatedOrder: UnpaidOrder) => {
    setUnpaidOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  // Create a new pending order via API
  const createOrder = async (data: any) => {
    const result = await apiClient.createOrder(data);
    await refreshData();
    return result;
  };

  // Pay an existing unpaid order via API
  const payUnpaidOrder = async (id: string, paymentMethod: PaymentMethod, paidAmount?: number) => {
    try {
      const order = unpaidOrders.find(o => o.id === id);
      const amount = paidAmount ?? order?.totalPrice ?? 0;
      await apiClient.payOrder(Number(id), { paymentMethod, paidAmount: amount });
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses pembayaran');
    }
  };

  const handleLogout = async () => {
    try {
        const { apiClient } = await import("../api/client");
        await apiClient.logout();
    } catch (error) {
        console.error("Logout error:", error);
    }
    navigate('/login');
  };

  const CashierIcon = () => {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.6667 14L7.33333 14C5.14718 14 4.0541 14 3.27927 14.5425C2.99261 14.7433 2.74327 14.9926 2.54254 15.2793C2 16.0541 2 17.1472 2 19.3333C2 20.4264 2 20.9729 2.27127 21.3604C2.37164 21.5037 2.4963 21.6284 2.63963 21.7287C3.02705 22 3.57359 22 4.66667 22L19.3333 22C20.4264 22 20.9729 22 21.3604 21.7287C21.5037 21.6284 21.6284 21.5037 21.7287 21.3604C22 20.9729 22 20.4264 22 19.3333C22 17.1472 22 16.0541 21.4575 15.2793C21.2567 14.9926 21.0074 14.7433 20.7207 14.5425C19.9459 14 18.8528 14 16.6667 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20 14L19.593 10.3374C19.311 7.79863 19.1699 6.52923 18.3156 5.76462C17.4614 5 16.1842 5 13.6297 5L10.3703 5C7.81585 5 6.53864 5 5.68436 5.76462C4.83009 6.52923 4.68904 7.79862 4.40695 10.3374L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M11.5 2H14M16.5 2H14M14 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 17.5L9.99615 18.1641C10.3247 18.3831 10.7107 18.5 11.1056 18.5H12.8944C13.2893 18.5 13.6753 18.3831 14.0038 18.1641L15 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 8H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }

  const isActive = (path: string) => location.pathname === path;

  // Header Trigger Logic
  const isDashboard = location.pathname.includes("/dashboard");

  return (
    <div className="h-screen w-full bg-gray-50 flex overflow-hidden">
      {/* Custom scrollbar and animations */}
      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-50 top-0 left-0 h-full w-[340px] bg-white transition-transform scroll-area shadow-2xl ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* SECTION 1: Top Row */}
        <div className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
              <div className="w-5 h-5 bg-gray-400/30 rounded-md" />
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight leading-none">Lorem Ipsum</span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="shrink-0 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            title="Close Sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.6665 10C1.6665 6.92572 1.6665 5.38858 2.34468 4.29897C2.59559 3.89585 2.90726 3.54522 3.26559 3.26295C4.23413 2.5 5.60048 2.5 8.33317 2.5H11.6665C14.3992 2.5 15.7655 2.5 16.7341 3.26295C17.0924 3.54522 17.4041 3.89585 17.655 4.29897C18.3332 5.38858 18.3332 6.92572 18.3332 10C18.3332 13.0743 18.3332 14.6114 17.655 15.701C17.4041 16.1041 17.0924 16.4548 16.7341 16.737C15.7655 17.5 14.3992 17.5 11.6665 17.5H8.33317C5.60048 17.5 4.23413 17.5 3.26559 16.737C2.90726 16.4548 2.59559 16.1041 2.34468 15.701C1.6665 14.6114 1.6665 13.0743 1.6665 10Z" stroke="#888888" strokeWidth="1.25" />
              <path d="M7.9165 2.5L7.9165 17.5" stroke="#888888" strokeWidth="1.25" strokeLinejoin="round" />
              <path d="M4.1665 5.8335H4.99984M4.1665 8.3335H4.99984" stroke="#888888" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* SECTION 2: Profile */}
        <div className="px-6 mb-2">
          <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-4">
            <div className="text-xs text-gray-400 mb-3">Kasir</div>
            <div className="flex items-center gap-3">
              <img
                src={user?.imagePath ? apiClient.getImageUrl(user.imagePath) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.username || 'Cashier')}&background=random`}
                alt="Profile"
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div>
                <div className="font-bold text-gray-900 text-sm truncate max-w-[150px]">{user?.name || user?.username || "Cashier"}</div>
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{user?.role || "Kasir"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Navigation */}
        <nav className="px-6 space-y-2 mt-4">
          <Link
            to="/cashier/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-in-out font-medium text-sm group ${isActive("/cashier/dashboard")
              ? "bg-[#FF5400] text-white shadow-lg shadow-orange-500/20"
              : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
              }`}
          >
            <CashierIcon />
            Kasir
          </Link>
          <Link
            to="/cashier/unpaid-orders"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-in-out font-medium text-sm group ${isActive("/cashier/unpaid-orders")
              ? "bg-[#FF5400] text-white shadow-lg shadow-orange-500/20"
              : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
              }`}
          >
            <div className={`w-6 h-6 flex items-center justify-center transition-transform duration-300 ${!isActive("/cashier/unpaid-orders") && "group-hover:scale-110"}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="">Pesanan Belum Dibayar</span>
          </Link>
          <Link
            to="/cashier/Riwayat"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-in-out font-medium text-sm group ${isActive("/cashier/Riwayat")
              ? "bg-[#FF5400] text-white shadow-lg shadow-orange-500/20"
              : "text-gray-500 hover:bg-orange-50 hover:text-orange-600"
              }`}
          >
            <div className={`w-6 h-6 flex items-center justify-center transition-transform duration-300 ${!isActive("/cashier/Riwayat") && "group-hover:scale-110"}`}>
              <History size={20} className="" />
            </div>
            <span className="">Riwayat Transaksi</span>
          </Link>
        </nav>

        {/* SECTION 4: Logout */}
        <div className="absolute bottom-8 left-0 w-full px-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-orange-500 transition font-medium text-sm"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <LogOut size={20} strokeWidth={2} />
            </div>
            <span className="-ml-2">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50 h-full">
          {/* Header */}
          <header className="z-30 w-full px-4 sm:px-5 py-3 shrink-0 bg-white border-b border-gray-200 lg:bg-transparent lg:border-none">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
                >
                  <svg width="32" height="32" viewBox="0 0 44 44" fill="none" className="sm:w-11 sm:h-11">
                    <rect x="0.5" y="0.5" width="43" height="43" rx="13.5" fill="white" stroke="#E7E7E7" />
                    <path d="M13.6667 22C13.6667 18.9257 13.6667 17.3886 14.3449 16.299C14.5958 15.8959 14.9075 15.5452 15.2658 15.263C16.2344 14.5 17.6007 14.5 20.3334 14.5H23.6667C26.3994 14.5 27.7658 14.5 28.7343 15.263C29.0927 15.5452 29.4043 15.8959 29.6552 16.299C30.3334 17.3886 30.3334 18.9257 30.3334 22C30.3334 25.0743 30.3334 26.6114 29.6552 27.701C29.4043 28.1041 29.0927 28.4548 28.7343 28.737C27.7658 29.5 26.3994 29.5 23.6667 29.5H20.3334C17.6007 29.5 16.2344 29.5 15.2658 28.737C14.9075 28.4548 14.5958 28.1041 14.3449 27.701C13.6667 26.6114 13.6667 25.0743 13.6667 22Z" stroke="#888888" strokeWidth="1.25" />
                    <path d="M19.9167 14.5V29.5" stroke="#888888" strokeWidth="1.25" strokeLinejoin="round" />
                    <path d="M16.1667 17.8335H17.0001M16.1667 20.3335H17.0001" stroke="#888888" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {!['/cashier/unpaid-orders', '/cashier/Riwayat', '/cashier/riwayat'].some(path => location.pathname.toLowerCase().includes(path.toLowerCase())) && (
                  <div className="relative group max-w-md w-full">
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 focus-within:bg-white focus-within:border-orange-500 transition-all w-full">
                      <Search size={16} className="text-gray-400 group-focus-within:text-orange-500 transition-colors sm:w-[18px] sm:h-[18px]" />
                      <input
                        className="outline-none w-full bg-transparent text-gray-700 placeholder-gray-400 text-xs sm:text-sm font-medium"
                        placeholder="Cari menu..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isDesktop && (
                  <>
                    {isDashboard && cartCount > 0 && (
                      <button
                        onClick={() => setIsRightPanelOpen(true)}
                        className="p-2 sm:p-2.5 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-colors shrink-0"
                        title="Buka keranjang"
                      >
                        <ShoppingBag size={20} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-hidden relative">
            <Outlet context={{
              search,
              setSearch,
              transactions,
              addTransaction,
              unpaidOrders,
              addUnpaidOrder,
              updateUnpaidOrder,
              payUnpaidOrder,
              createOrder,
              refreshData,
              isRightPanelOpen,
              setIsRightPanelOpen,
              cartCount,
              setCartCount
            } satisfies CashierContextType} />
          </div>
        </div>

        {/* Dynamic Right Panel System */}
        {isDesktop ? (
          /* Desktop: Fixed Sidebar */
          <div
            id="cashier-right-panel-slot"
            className="w-[25%] min-w-[300px] max-w-[380px] border-l border-gray-200 bg-white h-full relative z-20 shadow-[-4px_0_20px_-5px_rgba(0,0,0,0.05)] shrink-0"
          />
        ) : (
          /* Tablet & Mobile: Responsive Drawer Overlay */
          isRightPanelOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={() => setIsRightPanelOpen(false)}
              />

              {/* Drawer Content Container */}
              <div className={`
                relative bg-white shadow-2xl flex flex-col
                ${isMobile ? "w-full h-full animate-slideUp" : "w-[450px] h-full animate-slideInRight"}
              `}>
                {/* Portal Slot inside Drawer */}
                <div id="cashier-right-panel-slot" className="flex-1 overflow-hidden" />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
