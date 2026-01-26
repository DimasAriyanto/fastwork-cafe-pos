import { useState } from 'react';
import { useFetch } from '../../hooks/useAuth';
import { apiClient } from '../../api/client';
import { Trash2, Plus, Edit2 } from 'lucide-react';

export default function Pegawai() {
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
      outletId: employee.outletId,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      if (editingId) {
        // Update employee
        await apiClient.updateEmployee(editingId, formData);
        setMessage('Employee updated successfully');
      } else {
        // Create new employee
        await apiClient.createEmployee(formData);
        setMessage('Employee created successfully');
      }

      setShowForm(false);
      refetch(); // Refresh data
    } catch (error) {
      const err = error instanceof Error ? error.message : 'An error occurred';
      setMessage(`Error: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      await apiClient.deleteEmployee(id);
      setMessage('Employee deleted successfully');
      refetch(); // Refresh data
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Delete failed';
      setMessage(`Error: ${err}`);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Data Pegawai</h1>
        <button
          onClick={handleAddNew}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Tambah Pegawai
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            message.startsWith('Error')
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Edit Pegawai' : 'Tambah Pegawai Baru'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telepon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Posisi</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Nama</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Telepon</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Posisi</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {employees &&
              Array.isArray(employees) &&
              employees.map((employee: any) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{employee.name}</td>
                  <td className="px-6 py-3">{employee.email}</td>
                  <td className="px-6 py-3">{employee.phone}</td>
                  <td className="px-6 py-3">{employee.position}</td>
                  <td className="px-6 py-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {(!employees || employees.length === 0) && (
          <div className="p-6 text-center text-gray-500">Tidak ada data pegawai</div>
        )}
      </div>
    </div>
  );
}
