import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import ProtectedRoute from './routes/ProtectedRoute';
import OwnerLayout from './layouts/OwnerLayout';
import Dashboard from './pages/owner/Dashboard';
import Menu from './pages/owner/Menu';
import DataTransaksi from './pages/owner/DataTransaksi';
import Laporan from './pages/owner/Laporan';
import Pegawai from './pages/owner/Pegawai';
import Kategori from './pages/owner/Kategori';
import TambahanMenu from './pages/owner/TambahanMenu';
import Unauthorized from './pages/auth/Unauthorized';

// Cashier Pages
import CashierLayout from './layouts/CashierLayout';
import CashierDashboard from './pages/cashier/Dashboard';
import UnpaidOrders from './pages/cashier/UnpaidOrders';
import Riwayat from './pages/cashier/Riwayat';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Owner Routes */}
      <Route element={<ProtectedRoute allowedRoles={['OWNER']} />}>
        <Route path="/owner" element={<OwnerLayout />}>
          <Route index element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="menu" element={<Menu />} />
          <Route path="kategori" element={<Kategori />} />
          <Route path="tambahan-menu" element={<TambahanMenu />} />
          <Route path="data-transaksi" element={<DataTransaksi />} />
          <Route path="laporan" element={<Laporan />} />
          <Route path="pegawai" element={<Pegawai />} />
        </Route>
      </Route>

      {/* Cashier Routes */}
      <Route element={<ProtectedRoute allowedRoles={['CASHIER']} />}>
        <Route path="/cashier" element={<CashierLayout />}>
          <Route index element={<Navigate to="/cashier/dashboard" replace />} />
          <Route path="dashboard" element={<CashierDashboard />} />
          <Route path="unpaid-orders" element={<UnpaidOrders />} />
          <Route path="Riwayat" element={<Riwayat />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
