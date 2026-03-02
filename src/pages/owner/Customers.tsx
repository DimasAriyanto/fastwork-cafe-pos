import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, Search, Phone, Mail, MapPin } from 'lucide-react';
import { apiClient } from '../../api/client';

interface Customer {
  id: number;
  name: string;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
}

const Customers = () => {
  const { search } = useOutletContext<{ search: string }>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtered customers based on global search
  const filteredCustomers = React.useMemo(() => {
    if (!search) return customers;
    const s = search.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(s) || 
      (c.phoneNumber && c.phoneNumber.includes(s)) ||
      (c.email && c.email.toLowerCase().includes(s))
    );
  }, [customers, search]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    address: ''
  });

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getCustomers();
      setCustomers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal mengambil data pelanggan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ name: '', phoneNumber: '', email: '', address: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setIsEditMode(true);
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      phoneNumber: customer.phoneNumber || '',
      email: customer.email || '',
      address: customer.address || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (isEditMode && editingId) {
        await apiClient.updateCustomer(editingId, formData);
      } else {
        await apiClient.createCustomer(formData);
      }
      fetchCustomers();
      closeModal();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan data pelanggan");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data pelanggan ini?")) return;
    try {
      await apiClient.deleteCustomer(id);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus data pelanggan");
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#202224]">Pelanggan</h1>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-[#FE4E10] text-white rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] transition-all transform hover:-translate-y-0.5"
        >
          <Plus size={20} className="stroke-[3]" />
          <span className="font-bold text-sm">Tambah Pelanggan</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#EAEAEA] overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FE4E10]"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[400px] gap-4">
            <p className="text-red-500 font-medium">{error}</p>
            <button 
              onClick={fetchCustomers}
              className="px-4 py-2 bg-[#FE4E10] text-white rounded-lg hover:bg-[#e0450e]"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F9FAFB] text-[#202224] border-b border-[#EAEAEA]">
                <tr>
                  <th className="px-6 py-5 font-bold text-sm w-16 text-center">No</th>
                  <th className="px-6 py-5 font-bold text-sm">Nama</th>
                  <th className="px-6 py-5 font-bold text-sm">Kontak</th>
                  <th className="px-6 py-5 font-bold text-sm">Alamat</th>
                  <th className="px-6 py-5 font-bold text-sm text-center w-40">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-[#FDFDFD] transition-colors">
                    <td className="px-6 py-4 text-[#565656] text-center font-medium">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#202224]">{customer.name}</div>
                      <div className="text-[11px] text-gray-400">ID: CUST-{customer.id.toString().padStart(4, '0')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {customer.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm text-[#565656]">
                            <Phone size={14} className="text-gray-400" />
                            {customer.phoneNumber}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-[#565656]">
                            <Mail size={14} className="text-gray-400" />
                            {customer.email}
                          </div>
                        )}
                        {!customer.phoneNumber && !customer.email && <span className="text-gray-300 text-xs italic">Tidak ada kontak</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.address ? (
                        <div className="flex items-start gap-2 text-sm text-[#565656] max-w-xs line-clamp-2">
                          <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          {customer.address}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs italic">Tidak ada alamat</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleOpenEditModal(customer)}
                          className="p-2 bg-[#F0F2FF] text-[#4D71FF] rounded-lg hover:bg-[#4D71FF] hover:text-white transition-all duration-200"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 bg-[#FFF0F0] text-[#FF4D4D] rounded-lg hover:bg-[#FF4D4D] hover:text-white transition-all duration-200"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] gap-2">
            <Search size={48} className="text-gray-200" />
            <p className="text-[#565656] font-medium">Belum ada data pelanggan</p>
            {search && <p className="text-sm text-gray-400">Tidak ada hasil untuk "{search}"</p>}
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#202224]">
                {isEditMode ? 'Edit' : 'Tambah'} Pelanggan
              </h2>
              <button 
                onClick={closeModal}
                className="p-2 text-[#565656] hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#202224]">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama pelanggan"
                  className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#202224]">Nomor Telepon</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-1 focus:ring-[#FE4E10]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#202224]">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="pelanggan@mail.com"
                    className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-1 focus:ring-[#FE4E10]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#202224]">Alamat</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Masukkan alamat lengkap (opsional)"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-1 focus:ring-[#FE4E10] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 text-[#565656] font-bold rounded-xl hover:bg-gray-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!formData.name.trim()}
                  className="px-8 py-2.5 bg-[#FE4E10] text-white font-bold rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                >
                  {isEditMode ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
