import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Filter, RotateCcw, ChevronDown, X, Calendar } from 'lucide-react';
import { apiClient } from '../../api/client';

const OwnerDiskon = () => {
  // Main Data State
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Modal State
  const [isOpenTambahDiskonModal, setIsOpenTambahDiskonModal] = useState(false);
  const [formDiskon, setFormDiskon] = useState({
    name: '',
    percentage: '',
    minSpend: '0',
    startDate: '',
    endDate: '',
    isActive: true
  });

  // Edit Modal State
  const [isOpenEditDiskonModal, setIsOpenEditDiskonModal] = useState(false);
  const [selectedDiskon, setSelectedDiskon] = useState<any>(null);
  const [editFormDiskon, setEditFormDiskon] = useState({
    name: '',
    percentage: '',
    minSpend: '0',
    startDate: '',
    endDate: '',
    isActive: true
  });

  // Filter State
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const fetchDiscounts = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getDiscounts();
      setDiscounts(response || []);
    } catch (error) {
      console.error("Failed to fetch discounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  // Wrapper for closing filter dropdown when clicking outside
  const toggleDateFilter = () => setIsDateFilterOpen(!isDateFilterOpen);

  // Filter Logic
  const filteredDiscounts = discounts.filter(item => {
    let isValid = true;

    if (filterStartDate) {
      const filterStart = new Date(filterStartDate);
      const itemStart = new Date(item.startDate);
      if (itemStart < filterStart) isValid = false;
    }

    if (filterEndDate) {
      const filterEnd = new Date(filterEndDate);
      const itemEnd = new Date(item.endDate);
      if (itemEnd > filterEnd) isValid = false;
    }

    return isValid;
  });

  const handleResetFilter = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setIsDateFilterOpen(false);
  };

  const handleOpenModal = () => setIsOpenTambahDiskonModal(true);
  const handleCloseModal = () => setIsOpenTambahDiskonModal(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormDiskon(prev => ({ 
      ...prev, 
      [name]: name === 'isActive' ? value === 'true' : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createDiscount({
        ...formDiskon,
        percentage: parseFloat(formDiskon.percentage),
        minSpend: parseInt(formDiskon.minSpend),
        startDate: formDiskon.startDate ? new Date(formDiskon.startDate).toISOString() : null,
        endDate: formDiskon.endDate ? new Date(formDiskon.endDate).toISOString() : null,
      });
      fetchDiscounts();
      setIsOpenTambahDiskonModal(false);
      setFormDiskon({
        name: '',
        percentage: '',
        minSpend: '0',
        startDate: '',
        endDate: '',
        isActive: true
      });
    } catch (error: any) {
      alert(error.message || "Gagal menambah diskon");
    }
  };

  // Edit Handlers
  const handleOpenEditModal = (item: any) => {
    setSelectedDiskon(item);
    setEditFormDiskon({
      name: item.name,
      percentage: item.percentage.toString(),
      minSpend: (item.minSpend || 0).toString(),
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      isActive: item.isActive !== false
    });
    setIsOpenEditDiskonModal(true);
  };

  const handleCloseEditModal = () => {
    setIsOpenEditDiskonModal(false);
    setSelectedDiskon(null);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormDiskon(prev => ({ 
      ...prev, 
      [name]: name === 'isActive' ? value === 'true' : value 
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiskon) return;

    try {
      await apiClient.updateDiscount(selectedDiskon.id, {
        ...editFormDiskon,
        percentage: parseFloat(editFormDiskon.percentage),
        minSpend: parseInt(editFormDiskon.minSpend),
        startDate: editFormDiskon.startDate ? new Date(editFormDiskon.startDate).toISOString() : null,
        endDate: editFormDiskon.endDate ? new Date(editFormDiskon.endDate).toISOString() : null,
      });
      fetchDiscounts();
      handleCloseEditModal();
    } catch (error: any) {
      alert(error.message || "Gagal mengupdate diskon");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus diskon ini?")) {
      try {
        await apiClient.deleteDiscount(id);
        fetchDiscounts();
      } catch (error: any) {
        alert(error.message || "Gagal menghapus diskon");
      }
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#202224]">Diskon</h1>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Filter Section */}
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-[#EAEAEA]">
            <div className="px-2">
                <Filter size={20} className="text-[#5C5C5C]" />
            </div>
            <div className="h-6 w-[1px] bg-[#EAEAEA]"></div>
            <div className="flex items-center gap-2 px-2 text-sm font-medium text-[#202224]">
                <span>Filter By</span>
            </div>
             <div className="h-6 w-[1px] bg-[#EAEAEA]"></div>
            <div className="relative">
                <button 
                    onClick={toggleDateFilter}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-[#202224] hover:bg-gray-50 rounded-lg transition-colors ${isDateFilterOpen ? 'bg-gray-50' : ''}`}
                >
                    Tanggal
                    <ChevronDown size={14} className={`text-[#202224] transition-transform ${isDateFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Date Filter Dropdown */}
                {isDateFilterOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsDateFilterOpen(false)} />
                        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-[#EAEAEA] p-4 z-20 animate-in fade-in zoom-in-95 duration-200">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[#5C5C5C]">Dari Tanggal</label>
                                    <input 
                                        type="date"
                                        value={filterStartDate}
                                        onChange={(e) => setFilterStartDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[#5C5C5C]">Sampai Tanggal</label>
                                    <input 
                                        type="date"
                                        value={filterEndDate}
                                        onChange={(e) => setFilterEndDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10]"
                                    />
                                </div>
                                <div className="pt-2 flex justify-end">
                                    <button
                                        onClick={() => setIsDateFilterOpen(false)}
                                        className="px-3 py-1.5 text-xs font-bold text-white bg-[#FE4E10] rounded-lg hover:bg-[#e0450e] transition-colors"
                                    >
                                        Terapkan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            <div className="h-6 w-[1px] bg-[#EAEAEA]"></div>
             <button 
                onClick={handleResetFilter}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-[#FF4D4D] hover:bg-[#FFF0F0] rounded-lg transition-colors"
            >
                <RotateCcw size={14} />
                Reset Filter
            </button>
        </div>

        {/* Primary Action */}
        <button 
            onClick={handleOpenModal}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FE4E10] text-white rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
        >
            <Plus size={20} className="stroke-[3]" />
            <span className="font-bold text-sm">Tambah Diskon</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#EAEAEA] overflow-hidden min-h-[400px]">
        {isLoading ? (
            <div className="flex items-center justify-center h-[400px]">
                <p className="text-[#565656] animate-pulse">Memuat data...</p>
            </div>
        ) : filteredDiscounts.length > 0 ? (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[#202224] border-b border-[#EAEAEA]">
                <tr>
                    <th className="px-6 py-5 font-bold text-sm w-24">Id</th>
                    <th className="px-6 py-5 font-bold text-sm">Nama/Judul</th>
                    <th className="px-6 py-5 font-bold text-sm text-center">Diskon</th>
                    <th className="px-6 py-5 font-bold text-sm text-center">Min. Belanja</th>
                    <th className="px-6 py-5 font-bold text-sm">Status</th>
                    <th className="px-6 py-5 font-bold text-sm text-center w-40">Aksi</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F5]">
                {filteredDiscounts.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[#FDFDFD] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#202224]">{index + 1}</td>
                    <td className="px-6 py-4">
                        <div className="font-medium text-[#202224]">{item.name}</div>
                        <div className="text-xs text-gray-400">
                            {item.startDate ? new Date(item.startDate).toLocaleDateString('id-ID') : '-'} s/d {item.endDate ? new Date(item.endDate).toLocaleDateString('id-ID') : '-'}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-[#202224] font-bold text-center text-orange-600">{item.percentage}%</td>
                    <td className="px-6 py-4 text-[#202224] font-medium text-center">Rp{(item.minSpend || 0).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                            item.isActive !== false
                            ? 'bg-[#E6F9F0] text-[#00B69B]' 
                            : 'bg-[#F2F4F7] text-[#344054]'
                        }`}>
                            {item.isActive !== false ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                        <button 
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 bg-[#F0F2FF] text-[#4D71FF] rounded-lg hover:bg-[#4D71FF] hover:text-white transition-all duration-200"
                        >
                            <Pencil size={18} />
                        </button>
                        <button 
                            onClick={() => handleDelete(item.id)}
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
                <p className="text-[#565656]">Belum ada diskon tersedia</p>
            </div>
        )}
      </div>

      {/* Modal Tambah Diskon */}
      {isOpenTambahDiskonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleCloseModal}>
            <div
                className="bg-white w-full max-w-[550px] rounded-[20px] shadow-2xl overflow-hidden transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#EAEAEA]">
                    <h2 className="text-xl font-bold text-[#202224]">Tambah Diskon</h2>
                    <button 
                        onClick={handleCloseModal}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={24} className="text-[#5C5C5C]" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {/* Nama Diskon */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-[#202224]">Nama/Judul Diskon</label>
                            <input 
                                type="text" 
                                name="name"
                                required
                                value={formDiskon.name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224] placeholder:text-[#9A9A9A]"
                                placeholder="Contoh: Diskon Grand Opening"
                            />
                        </div>

                        {/* Persentase Diskon */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-[#202224]">Persentase (%)</label>
                            <input
                                type="number"
                                name="percentage"
                                required
                                value={formDiskon.percentage}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224]"
                                placeholder="10"
                            />
                        </div>

                        {/* Minimal Belanja */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-[#202224]">Minimal Belanja (Rp)</label>
                            <input 
                                type="number" 
                                name="minSpend"
                                value={formDiskon.minSpend}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224]"
                                placeholder="0"
                            />
                        </div>

                        {/* Tanggal Mulai & Berakhir */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-[#202224]">Tanggal Mulai</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        name="startDate"
                                        value={formDiskon.startDate}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-[#202224]">Tanggal Berakhir</label>
                                <div className="relative">
                                     <input 
                                        type="date" 
                                        name="endDate"
                                        value={formDiskon.endDate}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-[#202224]">Status</label>
                            <div className="relative">
                                <select 
                                    name="isActive"
                                    value={formDiskon.isActive.toString()}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224] appearance-none cursor-pointer"
                                >
                                    <option value="true">Aktif</option>
                                    <option value="false">Tidak Aktif</option>
                                </select>
                                <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none" />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 pb-2">
                            <button 
                                type="submit" 
                                className="w-full py-3 bg-[#FE4E10] text-white font-bold rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] transition-all transform hover:-translate-y-0.5"
                            >
                                Simpan Diskon
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* Modal Edit Diskon */}
      {isOpenEditDiskonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleCloseEditModal}>
            <div
                className="bg-white w-full max-w-[550px] rounded-[20px] shadow-2xl overflow-hidden transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#EAEAEA]">
                    <h2 className="text-xl font-bold text-[#202224]">Edit Diskon</h2>
                    <button 
                        onClick={handleCloseEditModal}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={24} className="text-[#5C5C5C]" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
                    <form className="space-y-4" onSubmit={handleEditSubmit}>
                        {/* Nama Diskon */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-[#202224]">Nama/Judul Diskon</label>
                            <input 
                                type="text" 
                                name="name"
                                required
                                value={editFormDiskon.name}
                                onChange={handleEditInputChange}
                                className="w-full px-4 py-2.5 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224] placeholder:text-[#9A9A9A]"
                            />
                        </div>

                        {/* Persentase Diskon */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-[#202224]">Persentase (%)</label>
                            <input
                                type="number"
                                name="percentage"
                                required
                                value={editFormDiskon.percentage}
                                onChange={handleEditInputChange}
                                className="w-full px-4 py-2.5 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224]"
                            />
                        </div>

                        {/* Minimal Belanja */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-[#202224]">Minimal Belanja (Rp)</label>
                            <input 
                                type="number" 
                                name="minSpend"
                                value={editFormDiskon.minSpend}
                                onChange={handleEditInputChange}
                                className="w-full px-4 py-2.5 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224]"
                            />
                        </div>

                        {/* Tanggal Mulai & Berakhir */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-[#202224]">Tanggal Mulai</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        name="startDate"
                                        value={editFormDiskon.startDate}
                                        onChange={handleEditInputChange}
                                        className="w-full px-4 py-2.5 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-[#202224]">Tanggal Berakhir</label>
                                <div className="relative">
                                     <input 
                                        type="date" 
                                        name="endDate"
                                        value={editFormDiskon.endDate}
                                        onChange={handleEditInputChange}
                                        className="w-full px-4 py-2.5 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-[#202224]">Status</label>
                            <div className="relative">
                                <select 
                                    name="isActive"
                                    value={editFormDiskon.isActive.toString()}
                                    onChange={handleEditInputChange}
                                    className="w-full px-4 py-2.5 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224] appearance-none cursor-pointer"
                                >
                                    <option value="true">Aktif</option>
                                    <option value="false">Tidak Aktif</option>
                                </select>
                                <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none" />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 pb-2">
                            <button 
                                type="submit" 
                                className="w-full py-3 bg-[#FE4E10] text-white font-bold rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] transition-all transform hover:-translate-y-0.5"
                            >
                                Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDiskon;
