import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const mockAdditionalMenus = [
  { id: 1, name: "Keju", price: "Rp500" },
  { id: 2, name: "Oreo", price: "Rp500" },
  { id: 3, name: "Red Velvet", price: "Rp500" },
];

const OwnerTambahanMenu = () => {
  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#202224]">Tambahan Menu</h1>
      </div>

      {/* Primary Action */}
      <div>
        <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FE4E10] text-white rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] transition-all transform hover:-translate-y-0.5">
            <Plus size={20} className="stroke-[3]" />
            <span className="font-bold text-sm">Add Category</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#EAEAEA] overflow-hidden min-h-[400px]">
        {mockAdditionalMenus.length > 0 ? (
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
                {mockAdditionalMenus.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[#FDFDFD] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#202224]">{index + 1}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.price}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                        <button className="p-2 bg-[#F0F2FF] text-[#4D71FF] rounded-lg hover:bg-[#4D71FF] hover:text-white transition-all duration-200">
                            <Pencil size={18} />
                        </button>
                        <button className="p-2 bg-[#FFF0F0] text-[#FF4D4D] rounded-lg hover:bg-[#FF4D4D] hover:text-white transition-all duration-200">
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
    </div>
  );
};

export default OwnerTambahanMenu;
