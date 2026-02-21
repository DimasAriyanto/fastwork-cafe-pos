import React, { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Upload } from 'lucide-react';
import { apiClient } from '../../api/client';

interface Employee {
  id: number;
  name: string;
  position: string;
  imagePath: string; // From BE
  isActive: boolean;
}

const OwnerPegawai = () => {
  // Main Employee State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editAvatar, setEditAvatar] = useState<File | null>(null);
  const [editPreviewAvatar, setEditPreviewAvatar] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Employees
  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getEmployees();
      setEmployees(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal mengambil data pegawai");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // --- Add Employee Handlers ---
  const handleAddEmployee = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setName("");
    setPosition("");
    setAvatar(null);
    setIsActive(true);
    setUsername("");
    setEmail("");
    setPassword("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !position.trim() || !username.trim() || !email.trim() || !password.trim()) return;
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('position', position);
    formData.append('isActive', String(isActive));
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    if (avatar) {
      formData.append('photo', avatar);
    }

    try {
      await apiClient.createEmployee(formData);
      fetchEmployees();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message || "Gagal menambah pegawai");
    }
  };

  // --- Edit Employee Handlers ---
  const handleEditClick = (employee: any) => {
    setEditingId(employee.id);
    setEditName(employee.name);
    setEditPosition(employee.position);
    setEditPreviewAvatar(employee.imagePath ? apiClient.getImageUrl(employee.imagePath) : "");
    setEditIsActive(employee.isActive);
    setEditAvatar(null);
    
    // Set Account Data (from join)
    setEditUsername(employee.username || "");
    setEditEmail(employee.email || "");
    setEditPassword(""); // Reset password field
    
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingId(null);
    setEditName("");
    setEditPosition("");
    setEditAvatar(null);
    setEditPreviewAvatar("");
    setEditIsActive(true);
    setEditUsername("");
    setEditEmail("");
    setEditPassword("");
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

  const handleEditSubmit = async () => {
    if (!editName.trim() || !editPosition.trim() || !editingId) return;

    const formData = new FormData();
    formData.append('name', editName);
    formData.append('position', editPosition);
    formData.append('isActive', String(editIsActive));
    
    // Data Akun
    formData.append('username', editUsername);
    formData.append('email', editEmail);
    if (editPassword.trim() !== "") {
      formData.append('password', editPassword);
    }

    if (editAvatar) {
      formData.append('photo', editAvatar);
    }

    try {
      await apiClient.updateEmployee(editingId, formData);
      fetchEmployees();
      handleCloseEditModal();
    } catch (err: any) {
      alert(err.message || "Gagal mengupdate pegawai");
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pegawai ini?")) return;
    try {
      await apiClient.deleteEmployee(id);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus pegawai");
    }
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
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FE4E10]"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[400px] gap-4">
            <p className="text-red-500 font-medium">{error}</p>
            <button 
              onClick={fetchEmployees}
              className="px-4 py-2 bg-[#FE4E10] text-white rounded-lg hover:bg-[#e0450e]"
            >
              Coba Lagi
            </button>
          </div>
        ) : employees.length > 0 ? (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[#202224] border-b border-[#EAEAEA]">
                <tr>
                    <th className="px-6 py-5 font-bold text-sm w-24">Id</th>
                    <th className="px-6 py-5 font-bold text-sm">Foto Profil</th>
                    <th className="px-6 py-5 font-bold text-sm">Nama</th>
                    <th className="px-6 py-5 font-bold text-sm">Posisi</th>
                    <th className="px-6 py-5 font-bold text-sm">Status</th>
                    <th className="px-6 py-5 font-bold text-sm text-center w-40">Aksi</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F5]">
                {employees.map((employee, index) => (
                    <tr key={employee.id} className="hover:bg-[#FDFDFD] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#202224]">{index + 1}</td>
                    <td className="px-6 py-4">
                        <img 
                            src={employee.imagePath ? apiClient.getImageUrl(employee.imagePath) : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random`} 
                            alt={employee.name} 
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                    </td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{employee.name}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{employee.position}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${employee.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {employee.isActive ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
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
                  Masukkan Foto Profil
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

              {/* User Account Section */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <h3 className="text-sm font-bold text-[#FE4E10]">Data Akun Login</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#202224]">Username *</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="w-full px-4 py-2 text-sm rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-1 focus:ring-[#FE4E10]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#202224]">Email *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2 text-sm rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-1 focus:ring-[#FE4E10]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#202224]">Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-4 py-2 text-sm rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-1 focus:ring-[#FE4E10]"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#202224]">Status Aktif</label>
                <button 
                  onClick={() => setIsActive(!isActive)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isActive ? 'bg-[#FE4E10]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isActive ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={!name.trim() || !position.trim() || !username.trim() || !email.trim() || !password.trim()}
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

              {/* User Account Section */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <h3 className="text-sm font-bold text-[#FE4E10]">Data Akun Login</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#202224]">Username *</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="username"
                      className="w-full px-4 py-2 text-sm rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-1 focus:ring-[#FE4E10]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#202224]">Email *</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2 text-sm rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-1 focus:ring-[#FE4E10]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#202224]">Password (Opsional)</label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak ingin mengubah"
                    className="w-full px-4 py-2 text-sm rounded-xl border border-[#EAEAEA] focus:outline-none focus:ring-1 focus:ring-[#FE4E10]"
                  />
                  <p className="text-[10px] text-gray-400 italic font-medium">* Isi jika ingin mengganti password pegawai</p>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#202224]">Status Aktif</label>
                <button 
                  onClick={() => setEditIsActive(!editIsActive)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${editIsActive ? 'bg-[#FE4E10]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editIsActive ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleEditSubmit}
                  disabled={!editName.trim() || !editPosition.trim() || !editUsername.trim() || !editEmail.trim() || !editingId}
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
