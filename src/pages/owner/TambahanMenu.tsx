import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';



const OwnerTambahanMenu = () => {
  const [additionalMenus, setAdditionalMenus] = useState([
    { id: 1, name: "Keju", price: "Rp500" },
    { id: 2, name: "Oreo", price: "Rp500" },
    { id: 3, name: "Red Velvet", price: "Rp500" },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toppingName, setToppingName] = useState("");
  const [toppingPrice, setToppingPrice] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleAddTopping = () => {
    setEditingId(null);
    setToppingName("");
    setToppingPrice("");
    setIsModalOpen(true);
  };

  const handleEditTopping = (id: number, name: string, price: string) => {
    setEditingId(id);
    setToppingName(name);
    setToppingPrice(price);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setToppingName("");
    setToppingPrice("");
    setEditingId(null);
  };


  const handleSubmit = () => {
    if (!toppingName.trim() || !toppingPrice.trim()) return;

    if (editingId !== null) {
      // Edit Mode
      setAdditionalMenus(additionalMenus.map(item => 
        item.id === editingId ? { ...item, name: toppingName, price: toppingPrice } : item
      ));
    } else {
      // Add Mode
      const newId = additionalMenus.length > 0 ? Math.max(...additionalMenus.map(m => m.id)) + 1 : 1;
      setAdditionalMenus([...additionalMenus, { id: newId, name: toppingName, price: toppingPrice }]);
    }
    
    handleCloseModal();
  };

  const handleDeleteTopping = (id: number) => {
    if (window.confirm("Apakah kamu yakin ingin menghapus extra topping ini?")) {
      setAdditionalMenus(additionalMenus.filter(item => item.id !== id));
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#202224]">Extra Topping</h1>
      </div>

      {/* Primary Action */}
      <div>
        <button 
          onClick={handleAddTopping}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FE4E10] text-white rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] transition-all transform hover:-translate-y-0.5"
        >
            <Plus size={20} className="stroke-[3]" />
            <span className="font-bold text-sm">Tambah Kategori</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#EAEAEA] overflow-hidden min-h-[400px]">
        {additionalMenus.length > 0 ? (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[#202224] border-b border-[#EAEAEA]">
                <tr>
                    <th className="px-6 py-5 font-bold text-sm w-24">Id</th>
                    <th className="px-6 py-5 font-bold text-sm">Tambahan Menu</th>
                    <th className="px-6 py-5 font-bold text-sm">Harga</th>
                    <th className="px-6 py-5 font-bold text-sm text-center w-40">Aksi</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F5]">
                {additionalMenus.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[#FDFDFD] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#202224]">{index + 1}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.price}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                        <button 
                            onClick={() => handleEditTopping(item.id, item.name, item.price)}
                            className="p-2 bg-[#F0F2FF] text-[#4D71FF] rounded-lg hover:bg-[#4D71FF] hover:text-white transition-all duration-200"
                        >
                            <Pencil size={18} />
                        </button>
                        <button 
                            onClick={() => handleDeleteTopping(item.id)}
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
                <p className="text-[#565656]">Halaman Manajemen Tambahan Menu</p>
            </div>
        )}
      </div>

      {/* Add Extra Topping Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#202224]">
                {editingId ? "Edit Extra Topping" : "Tambah Extra Topping"}
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
                  Tulis Extra Topping <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={toppingName}
                  onChange={(e) => setToppingName(e.target.value)}
                  placeholder="Contoh: Keju"
                  className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#202224]">
                  Tulis Harga <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" // Using text to allow "Rp" formatting if user types it, or number if strict. Design says "Tulis Harga" so text is safe.
                  value={toppingPrice}
                  onChange={(e) => setToppingPrice(e.target.value)}
                  placeholder="Contoh: 500"
                  className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={!toppingName.trim() || !toppingPrice.trim()}
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

export default OwnerTambahanMenu;
