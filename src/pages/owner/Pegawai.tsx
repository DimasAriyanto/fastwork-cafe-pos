import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useFetch } from '../../hooks/useAuth';
import { apiClient } from '../../api/client';

const OwnerPegawai = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    outletId: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch employees data
  const { data: employees, loading, error, refetch } = useFetch(
    () => apiClient.getEmployees(),
    [],
  );

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', position: '', outletId: 1 });
    setShowForm(true);
  };

  const handleEdit = (employee: any) => {
    setEditingId(employee.id);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      outletId: employee.outletId || 1,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      if (editingId) {
        await apiClient.updateEmployee(editingId, formData);
        setMessage('Pegawai berhasil diperbarui');
      } else {
        await apiClient.createEmployee(formData);
        setMessage('Pegawai berhasil ditambahkan');
      }

      setShowForm(false);
      refetch();
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Terjadi kesalahan';
      setMessage(`Error: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pegawai ini?')) {
      return;
    }

    try {
      await apiClient.deleteEmployee(id);
      setMessage('Pegawai berhasil dihapus');
      refetch();
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Gagal menghapus';
      setMessage(`Error: ${err}`);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setMessage('');
  };

  if (loading) {
    return (
      <div className="space-y-8 font-sans">
        <div>
          <h1 className="text-3xl font-bold text-[#202224]">Pegawai</h1>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-[#565656]">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#202224]">Pegawai</h1>
      </div>

      {/* Primary Action */}
      <div>
        <button
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FE4E10] text-white rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] transition-all transform hover:-translate-y-0.5"
        >
          <Plus size={20} className="stroke-[3]" />
          <span className="font-bold text-sm">Tambah Pegawai</span>
        </button>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.startsWith('Error')
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      {/* Error Alert */}
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#202224]">
                {editingId ? 'Edit Pegawai' : 'Tambah Pegawai Baru'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#202224] mb-1">
                  Nama
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FE4E10]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#202224] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FE4E10]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#202224] mb-1">
                  Telepon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FE4E10]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#202224] mb-1">
                  Posisi
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FE4E10]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#FE4E10] text-white rounded-lg hover:bg-[#e0450e] disabled:bg-gray-400 transition-colors font-medium"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#EAEAEA] overflow-hidden min-h-[400px]">
        {employees && Array.isArray(employees) && employees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white text-[#202224] border-b border-[#EAEAEA]">
                <tr>
                  <th className="px-6 py-5 font-bold text-sm w-24">Id</th>
                  <th className="px-6 py-5 font-bold text-sm">Nama</th>
                  <th className="px-6 py-5 font-bold text-sm">Email</th>
                  <th className="px-6 py-5 font-bold text-sm">Telepon</th>
                  <th className="px-6 py-5 font-bold text-sm">Posisi</th>
                  <th className="px-6 py-5 font-bold text-sm text-center w-40">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {employees.map((employee: any, index: number) => (
                  <tr key={employee.id} className="hover:bg-[#FDFDFD] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#202224]">{index + 1}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{employee.name}</td>
                    <td className="px-6 py-4 text-[#202224]">{employee.email}</td>
                    <td className="px-6 py-4 text-[#202224]">{employee.phone || '-'}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">
                      {employee.position}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="p-2 bg-[#F0F2FF] text-[#4D71FF] rounded-lg hover:bg-[#4D71FF] hover:text-white transition-all duration-200"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="p-2 bg-[#FFF0F0] text-[#FF4D4D] rounded-lg hover:bg-[#FF4D4D] hover:text-white transition-all duration-200"
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
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-[#565656]">Belum ada data pegawai</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerPegawai;
