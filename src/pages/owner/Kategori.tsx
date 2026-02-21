import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

const OwnerKategori = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getCategories();
      // Response could be paginated {data: [...]} or just array
      setCategories(Array.isArray(data) ? data : (data.data || data));
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal memuat kategori");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAddCategory = () => {
    setEditingId(null);
    setCategoryName("");
    setIsModalOpen(true);
  };

  const handleEditCategory = (id: number, name: string) => {
    setEditingId(id);
    setCategoryName(name);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCategoryName("");
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!categoryName.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingId !== null) {
        await apiClient.updateCategory(editingId, categoryName);
      } else {
        await apiClient.createCategory(categoryName);
      }
      await fetchCategories();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan kategori");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm("Apakah kamu yakin ingin menghapus kategori ini?")) return;
    try {
      await apiClient.deleteCategory(id);
      await fetchCategories();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus kategori");
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#202224]">Kategori</h1>
      </div>

      {/* Primary Action */}
      <div>
        <button
          onClick={handleAddCategory}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FE4E10] text-white rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] transition-all transform hover:-translate-y-0.5"
        >
          <Plus size={20} className="stroke-[3]" />
          <span className="font-bold text-sm">Tambah Kategori</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#EAEAEA] overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px] gap-2">
            <Loader2 size={24} className="animate-spin text-[#FE4E10]" />
            <p className="text-[#565656]">Memuat data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[400px] gap-2">
            <p className="text-red-500 font-medium">{error}</p>
            <button onClick={fetchCategories} className="text-sm text-[#FE4E10] font-bold underline">Coba Lagi</button>
          </div>
        ) : categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white text-[#202224] border-b border-[#EAEAEA]">
                <tr>
                  <th className="px-6 py-5 font-bold text-sm w-24">No</th>
                  <th className="px-6 py-5 font-bold text-sm">Kategori</th>
                  <th className="px-6 py-5 font-bold text-sm text-center w-40">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {categories.map((item, index) => (
                  <tr key={item.id} className="hover:bg-[#FDFDFD] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#202224]">{index + 1}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleEditCategory(item.id, item.name)}
                          className="p-2 bg-[#F0F2FF] text-[#4D71FF] rounded-lg hover:bg-[#4D71FF] hover:text-white transition-all duration-200"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(item.id)}
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
            <p className="text-[#565656]">Belum ada kategori. Tambahkan kategori pertama!</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#202224]">
                {editingId ? "Edit Kategori" : "Tambah Kategori"}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-[#565656] hover:bg-gray-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#202224]">
                  Masukkan Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="Contoh: Makanan Ringan"
                  className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={!categoryName.trim() || isSubmitting}
                  className="px-8 py-3 bg-[#FE4E10] text-white font-bold rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {editingId ? "Simpan" : "Kirim"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerKategori;
