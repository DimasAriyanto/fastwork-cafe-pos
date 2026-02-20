import React, { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Upload } from 'lucide-react';

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
  // Main Employee State
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);

  // Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editAvatar, setEditAvatar] = useState<File | null>(null);
  const [editPreviewAvatar, setEditPreviewAvatar] = useState("");
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // --- Add Employee Handlers ---
  const handleAddEmployee = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setName("");
    setPosition("");
    setAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !position.trim() || !avatar) return;
    
    // Create new employee object (mock)
    const newEmployee: Employee = {
      id: employees.length + 1, // Simple ID generation
      name,
      position,
      avatar: URL.createObjectURL(avatar) // Create generic URL for preview
    };

    setEmployees([...employees, newEmployee]);
    
    console.log("Employee Submitted:", {
      name,
      position,
      avatar: avatar.name,
      fileObject: avatar
    });
    
    handleCloseModal();
  };

  // --- Edit Employee Handlers ---
  const handleEditClick = (employee: Employee) => {
    setEditingId(employee.id);
    setEditName(employee.name);
    setEditPosition(employee.position);
    setEditPreviewAvatar(employee.avatar);
    setEditAvatar(null); // Reset file input
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingId(null);
    setEditName("");
    setEditPosition("");
    setEditAvatar(null);
    setEditPreviewAvatar("");
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditAvatar(file);
      setEditPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = () => {
    if (!editName.trim() || !editPosition.trim() || !editingId) return;

    setEmployees(employees.map(emp => 
      emp.id === editingId 
        ? { 
            ...emp, 
            name: editName, 
            position: editPosition,
            avatar: editAvatar ? URL.createObjectURL(editAvatar) : emp.avatar 
          } 
        : emp
    ));

    handleCloseEditModal();
  };

  const handleDeleteEmployee = (id: number) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#202224]">Pegawai</h1>
      </div>

      {/* Primary Action */}
      <div>
        <button 
          onClick={handleAddEmployee}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FE4E10] text-white rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] transition-all transform hover:-translate-y-0.5"
        >
            <Plus size={20} className="stroke-[3]" />
            <span className="font-bold text-sm">Tambah Pegawai</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#EAEAEA] overflow-hidden min-h-[400px]">
        {employees.length > 0 ? (
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
                {employees.map((employee, index) => (
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
                        <button 
                          onClick={() => handleEditClick(employee)}
                          className="p-2 bg-[#F0F2FF] text-[#4D71FF] rounded-lg hover:bg-[#4D71FF] hover:text-white transition-all duration-200"
                        >
                            <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteEmployee(employee.id)}
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

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#202224]">Tambah Pegawai</h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-[#565656] hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* File Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#202224]">
                  Masukkan Foto Profil <span className="text-red-500">*</span>
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] cursor-pointer hover:border-[#FE4E10] transition-colors flex items-center justify-between group"
                >
                  <span className={`text-sm ${avatar ? 'text-[#202224]' : 'text-gray-400'}`}>
                    {avatar ? avatar.name : "Pilih Gambar"}
                  </span>
                  <Upload size={18} className="text-gray-400 group-hover:text-[#FE4E10] transition-colors" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#202224]">
                  Masukkan Nama Pegawai <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Aurelia Kartini"
                  className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all"
                />
              </div>

              {/* Position Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#202224]">
                  Masukkan Posisi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Contoh: Kasir"
                  className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={!name.trim() || !position.trim() || !avatar}
                  className="px-8 py-3 bg-[#FE4E10] text-white font-bold rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                >
                  Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#202224]">Edit Pegawai</h2>
              <button 
                onClick={handleCloseEditModal}
                className="p-2 text-[#565656] hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              
              {/* File Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#202224]">
                  Foto Profil
                </label>
                <div 
                  onClick={() => editFileInputRef.current?.click()}
                  className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] cursor-pointer hover:border-[#FE4E10] transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    {editPreviewAvatar && (
                        <img src={editPreviewAvatar} alt="Preview" className="w-8 h-8 rounded-full object-cover" />
                    )}
                    <span className={`text-sm ${editAvatar ? 'text-[#202224]' : 'text-gray-500'}`}>
                         {editAvatar ? editAvatar.name : "Ganti Foto"}
                    </span>
                  </div>
                  <Upload size={18} className="text-gray-400 group-hover:text-[#FE4E10] transition-colors" />
                </div>
                <input 
                  type="file" 
                  ref={editFileInputRef}
                  onChange={handleEditFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#202224]">
                  Nama Pegawai <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: Aurelia Kartini"
                  className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all"
                />
              </div>

              {/* Position Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#202224]">
                  Posisi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  placeholder="Contoh: Kasir"
                  className="w-full px-4 py-3 rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleEditSubmit}
                  disabled={!editName.trim() || !editPosition.trim()}
                  className="px-8 py-3 bg-[#FE4E10] text-white font-bold rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerPegawai;