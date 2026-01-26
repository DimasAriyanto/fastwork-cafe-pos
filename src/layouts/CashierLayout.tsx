import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Search, LogOut, ClipboardList, History } from "lucide-react";

export type TransactionItem = {
  name: string;
  qty: number;
  price: number;
  variant?: string;
  note?: string;
};

export type Transaction = {
  id: string;
  date: string;
  customerName: string;
  serviceType: "Dine In" | "Take Away";
  items: TransactionItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  totalPrice: number;
  paymentMethod?: "Cash" | "QRIS" | string;
  paidAmount?: number;
  change?: number;
};

export type UnpaidOrder = Transaction & {
  status: "unpaid";
};

export type CashierContextType = {
  search: string;
  setSearch: (s: string) => void;
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  unpaidOrders: UnpaidOrder[];
  addUnpaidOrder: (u: UnpaidOrder) => void;
  updateUnpaidOrder: (u: UnpaidOrder) => void;
  payUnpaidOrder: (id: string, paymentMethod: "Cash" | "QRIS") => void;
};

export default function CashierLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Initialize from localStorage if available
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [unpaidOrders, setUnpaidOrders] = useState<UnpaidOrder[]>(() => {
    const saved = localStorage.getItem('unpaidOrders');
    return saved ? JSON.parse(saved) : [];
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('unpaidOrders', JSON.stringify(unpaidOrders));
  }, [unpaidOrders]);

  const addTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  };

  const addUnpaidOrder = (order: UnpaidOrder) => {
    setUnpaidOrders(prev => [order, ...prev]);
  };

  const updateUnpaidOrder = (updatedOrder: UnpaidOrder) => {
    setUnpaidOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const payUnpaidOrder = (id: string, paymentMethod: "Cash" | "QRIS") => {
    const order = unpaidOrders.find(o => o.id === id);
    if (order) {
      const { status, ...transactionData } = order;
      const completedTransaction: Transaction = {
        ...transactionData,
        paymentMethod: paymentMethod,
        date: new Date().toISOString(), // Update date to payment time
        paidAmount: transactionData.totalPrice, // Assume full payment
        change: 0
      };

      setTransactions(prev => [completedTransaction, ...prev]);
      setUnpaidOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  const handleLogout = () => {
    // Logic from Close Cashier and Sidebar Logout
    localStorage.removeItem('token');
    localStorage.removeItem('role');
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

  return (
    <div className="h-screen w-full bg-gray-50 flex overflow-hidden">
      {/* Custom scrollbar styling */}
      <style>{`
        .scroll-area {
            overflow-y: auto;
        }
        .scroll-area::-webkit-scrollbar {
            width: 6px;
        }
        .scroll-area::-webkit-scrollbar-track {
            background: transparent;
        }
        .scroll-area::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 3px;
        }
        .scroll-area::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.2);
        }
      `}</style>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-50 top-0 left-0 h-full w-64 bg-white transition-transform scroll-area ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-4 border-b">
          <h1 className="font-bold text-lg">Lorem Ipsum</h1>
          <p className="text-sm text-gray-500">Kasir • Shift Pagi</p>
        </div>

        <nav className="p-3 space-y-2">
          <Link
            to="/cashier/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${isActive("/cashier/dashboard")
              ? "bg-orange-500 text-white"
              : "hover:bg-orange-500 hover:text-white"
              }`}
          >
            <CashierIcon />
            Cashier
          </Link>
          <Link
            to="/cashier/unpaid-orders"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${isActive("/cashier/unpaid-orders")
              ? "bg-orange-500 text-white"
              : "hover:bg-orange-500 hover:text-white"
              }`}
          >
            <ClipboardList size={18} />
            Unpaid Orders
          </Link>
          <Link
            to="/cashier/Riwayat"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${isActive("/cashier/Riwayat")
              ? "bg-orange-500 text-white"
              : "hover:bg-orange-500 hover:text-white"
              }`}
          >
            <History size={18} />
            Riwayat Transaksi
          </Link>
        </nav>

        <div className="absolute bottom-4 left-0 w-full px-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition"
          >
            <LogOut size={18} /> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm z-30">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4 flex-1">
              <button onClick={() => setSidebarOpen(true)}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.272727" y="0.272727" width="35.4545" height="35.4545" rx="7.72727" fill="white" />
                  <rect x="0.272727" y="0.272727" width="35.4545" height="35.4545" rx="7.72727" stroke="#E4E7EC" strokeWidth="0.545455" />
                  <path d="M9.66675 18C9.66675 14.9257 9.66675 13.3886 10.3449 12.299C10.5958 11.8959 10.9075 11.5452 11.2658 11.263C12.2344 10.5 13.6007 10.5 16.3334 10.5H19.6667C22.3994 10.5 23.7658 10.5 24.7343 11.263C25.0927 11.5452 25.4043 11.8959 25.6552 12.299C26.3334 13.3886 26.3334 14.9257 26.3334 18C26.3334 21.0743 26.3334 22.6114 25.6552 23.701C25.4043 24.1041 25.0927 24.4548 24.7343 24.737C23.7658 25.5 22.3994 25.5 19.6667 25.5H16.3334C13.6007 25.5 12.2344 25.5 11.2658 24.737C10.9075 24.4548 10.5958 24.1041 10.3449 23.701C9.66675 22.6114 9.66675 21.0743 9.66675 18Z" stroke="#888888" strokeWidth="1.25" />
                  <path d="M15.9167 10.5L15.9167 25.5" stroke="#888888" strokeWidth="1.25" strokeLinejoin="round" />
                  <path d="M12.1667 13.8335H13.0001M12.1667 16.3335H13.0001" stroke="#888888" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className="relative flex-1">
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white max-w-lg">
                  <Search size={18} className="text-gray-400" />
                  <input
                    className="outline-none w-full bg-transparent text-gray-700 placeholder-gray-400"
                    placeholder="Cari"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="ml-4">
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition font-medium flex items-center gap-2 shadow-md hover:shadow-lg whitespace-nowrap"
              >
                <LogOut size={18} />
                <span>Tutup Kasir</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="scroll-area h-full">
            <Outlet context={{ search, setSearch, transactions, addTransaction, unpaidOrders, addUnpaidOrder, updateUnpaidOrder, payUnpaidOrder } satisfies CashierContextType} />
          </div>
        </div>
      </div>
    </div>
  );
}
