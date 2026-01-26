import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Employee {
  id: number;
  name: string;
  position: string;
  avatar: string;
}

const mockEmployees: Employee[] = [
  { 
    id: 1, 
    name: "Aurelia Kartini", 
    position: "Kasir",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150"
  },
  { 
    id: 2, 
    name: "Broicad Lauren", 
    position: "Kasir",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150"
  },
  { 
    id: 3, 
    name: "Karelia Syalie", 
    position: "Kasir",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150"
  },
];

const OwnerPegawai = () => {
  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#202224]">Pegawai</h1>
      </div>

      {/* Primary Action */}
      <div>
        <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FE4E10] text-white rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] transition-all transform hover:-translate-y-0.5">
            <Plus size={20} className="stroke-[3]" />
            <span className="font-bold text-sm">Tambah Pegawai</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#EAEAEA] overflow-hidden min-h-[400px]">
        {mockEmployees.length > 0 ? (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[#202224] border-b border-[#EAEAEA]">
                <tr>
                    <th className="px-6 py-5 font-bold text-sm w-24">Id</th>
                    <th className="px-6 py-5 font-bold text-sm">Foto Profil</th>
                    <th className="px-6 py-5 font-bold text-sm">Nama</th>
                    <th className="px-6 py-5 font-bold text-sm">Posisi</th>
                    <th className="px-6 py-5 font-bold text-sm text-center w-40">Aksi</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F5]">
                {mockEmployees.map((employee, index) => (
                    <tr key={employee.id} className="hover:bg-[#FDFDFD] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#202224]">{index + 1}</td>
                    <td className="px-6 py-4">
                        <img 
                            src={employee.avatar} 
                            alt={employee.name} 
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                    </td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{employee.name}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{employee.position}</td>
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
                <p className="text-[#565656]">Belum ada data pegawai</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default OwnerPegawai;
