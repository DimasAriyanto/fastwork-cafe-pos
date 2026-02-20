import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';



const OwnerKategori = () => {
  const [categories, setCategories] = useState([
    { id: 1, name: "Roti" },
    { id: 2, name: "Jagung" },
    { id: 3, name: "Minuman Dingin" },
    { id: 4, name: "Minuman Panas - Non Kopi" },
    { id: 5, name: "Minuman Panas - Kopi" },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

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


  const handleSubmit = () => {
    if (!categoryName.trim()) return;

    if (editingId !== null) {
      // Edit Mode
      setCategories(categories.map(cat => 
        cat.id === editingId ? { ...cat, name: categoryName } : cat
      ));
    } else {
      // Add Mode
      const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
      setCategories([...categories, { id: newId, name: categoryName }]);
    }
    
    handleCloseModal();
  };

  const handleDeleteCategory = (id: number) => {
    if (window.confirm("Apakah kamu yakin ingin menghapus kategori ini?")) {
      setCategories(categories.filter(item => item.id !== id));
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
        {categories.length > 0 ? (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[#202224] border-b border-[#EAEAEA]">
                <tr>
                    <th className="px-6 py-5 font-bold text-sm w-24">Id</th>
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
                <p className="text-[#565656]">Halaman Manajemen Kategori</p>
            </div>
        )}
      </div>

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-2xl p-6  animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#202224]">
                {editingId ? "Edit Kategori" : "Tambah Kategori"}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-[#565656] hover:bg-gray-100 rounded-lg transition-colors"
              >
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
                  placeholder="Contoh: Makanan Ringan"
                  className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={!categoryName.trim()}
                  className="px-8 py-3 bg-[#FE4E10] text-white font-bold rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                >
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
