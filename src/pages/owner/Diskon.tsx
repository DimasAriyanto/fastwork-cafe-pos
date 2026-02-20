import { useState } from 'react';
import { Plus, Pencil, Trash2, Filter, RotateCcw, ChevronDown, X, Calendar } from 'lucide-react';

const mockDiscounts = [
  { 
    id: 1, 
    title: "Diskon Hari Ibu", 
    percentage: "10%", 
    startDate: "02/01/2026", 
    endDate: "10/01/2025", 
    status: "Aktif" 
  },
  { 
    id: 2, 
    title: "Diskon Opening", 
    percentage: "10%", 
    startDate: "22/01/2025", 
    endDate: "24/02/2025", 
    status: "Aktif" 
  },
  { 
    id: 3, 
    title: "Diskon 12.12", 
    percentage: "10%", 
    startDate: "21/04/2025", 
    endDate: "25/04/2025", 
    status: "Aktif" 
  },
];

const OwnerDiskon = () => {
  // Main Data State
  const [discounts, setDiscounts] = useState(mockDiscounts);

  // Add Modal State
  const [isOpenTambahDiskonModal, setIsOpenTambahDiskonModal] = useState(false);
  const [formDiskon, setFormDiskon] = useState({
    judul: '',
    persentase: '',
    startDate: '',
    endDate: '',
    status: 'Aktif'
  });

  // Edit Modal State
  const [isOpenEditDiskonModal, setIsOpenEditDiskonModal] = useState(false);
  const [selectedDiskon, setSelectedDiskon] = useState<any>(null);
  const [editFormDiskon, setEditFormDiskon] = useState({
    judul: '',
    persentase: '',
    startDate: '',
    endDate: '',
    status: 'Aktif'
  });

  // Filter State
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Wrapper for closing filter dropdown when clicking outside
  const toggleDateFilter = () => setIsDateFilterOpen(!isDateFilterOpen);

  // Helper to parse DD/MM/YYYY to Date object
  const parseDate = (dateString: string) => {
    const parts = dateString.split('/');
    // parts[0] is day, parts[1] is month, parts[2] is year
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  // Filter Logic
  const filteredDiscounts = discounts.filter(item => {
    const itemStartDate = parseDate(item.startDate);
    const itemEndDate = parseDate(item.endDate);
    
    let isValid = true;

    if (filterStartDate) {
      const filterStart = new Date(filterStartDate);
      // Reset hours to compare only dates
      filterStart.setHours(0, 0, 0, 0);
      if (itemStartDate < filterStart) isValid = false;
    }

    if (filterEndDate) {
      const filterEnd = new Date(filterEndDate);
      // Reset hours to compare only dates
      filterEnd.setHours(23, 59, 59, 999);
      if (itemEndDate > filterEnd) isValid = false;
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
    setFormDiskon(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Diskon Submitted:", formDiskon);
    setIsOpenTambahDiskonModal(false);
  };

  // Edit Handlers
  const handleOpenEditModal = (item: any) => {
    setSelectedDiskon(item);
    setEditFormDiskon({
      judul: item.title,
      persentase: item.percentage,
      startDate: item.startDate,
      endDate: item.endDate,
      status: item.status
    });
    setIsOpenEditDiskonModal(true);
  };

  const handleCloseEditModal = () => {
    setIsOpenEditDiskonModal(false);
    setSelectedDiskon(null);
    setEditFormDiskon({
      judul: '',
      persentase: '',
      startDate: '',
      endDate: '',
      status: 'Aktif'
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormDiskon(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiskon) return;

    const updatedDiscounts = discounts.map(item => 
      item.id === selectedDiskon.id 
        ? { 
            ...item, 
            title: editFormDiskon.judul,
            percentage: editFormDiskon.persentase,
            startDate: editFormDiskon.startDate,
            endDate: editFormDiskon.endDate,
            status: editFormDiskon.status
          } 
        : item
    );

    setDiscounts(updatedDiscounts);
    console.log("Updated Discount Data:", updatedDiscounts);
    handleCloseEditModal();
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
        {filteredDiscounts.length > 0 ? (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[#202224] border-b border-[#EAEAEA]">
                <tr>
                    <th className="px-6 py-5 font-bold text-sm w-24">Id</th>
                    <th className="px-6 py-5 font-bold text-sm">Judul</th>
                    <th className="px-6 py-5 font-bold text-sm">Persentase</th>
                    <th className="px-6 py-5 font-bold text-sm">Mulai</th>
                    <th className="px-6 py-5 font-bold text-sm">Hingga</th>
                    <th className="px-6 py-5 font-bold text-sm">Status</th>
                    <th className="px-6 py-5 font-bold text-sm text-center w-40">Aksi</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F5]">
                {filteredDiscounts.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[#FDFDFD] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#202224]">{index + 1}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.title}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.percentage}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.startDate}</td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.endDate}</td>
                    <td className="px-6 py-4">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                            item.status === 'Aktif' 
                            ? 'bg-[#E6F9F0] text-[#00B69B]' 
                            : 'bg-[#F2F4F7] text-[#344054]'
                        }`}>
                            {item.status}
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
                <p className="text-[#565656]">Belum ada diskon tersedia</p>
            </div>
        )}
      </div>

      {/* Modal Tambah Diskon */}
      {isOpenTambahDiskonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleCloseModal}>
            <div 
                className="bg-white w-[500px] rounded-[20px] shadow-2xl overflow-hidden transform transition-all scale-100"
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
                <div className="p-6">
                    <form className="space-y-5">
                        {/* Judul Diskon */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#202224]">Judul Diskon</label>
                            <input 
                                type="text" 
                                name="judul"
                                value={formDiskon.judul}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224] placeholder:text-[#9A9A9A]"
                            />
                        </div>

                         {/* Persentase Diskon */}
                         <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#202224]">Persentase Diskon</label>
                            <input 
                                type="text"
                                name="persentase"
                                value={formDiskon.persentase}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224] placeholder:text-[#9A9A9A]"
                            />
                        </div>

                        {/* Tanggal Mulai & Berakhir */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#202224]">Tanggal Mulai</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        name="startDate"
                                        value={formDiskon.startDate}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224] placeholder:text-[#9A9A9A]"
                                    />
                                    <Calendar size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#202224]">Tanggal Berakhir</label>
                                <div className="relative">
                                     <input 
                                        type="text" 
                                        name="endDate"
                                        value={formDiskon.endDate}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224] placeholder:text-[#9A9A9A]"
                                    />
                                    <Calendar size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#202224]">Status</label>
                            <div className="relative">
                                <select 
                                    name="status"
                                    value={formDiskon.status}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224] appearance-none cursor-pointer"
                                >
                                    <option value="Aktif">Aktif</option>
                                    <option value="Tidak Aktif">Tidak Aktif</option>
                                </select>
                                <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none" />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button 
                                type="button" 
                                onClick={handleSubmit}
                                className="w-full py-3 bg-[#FE4E10] text-white font-bold rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] transition-all transform hover:-translate-y-0.5"
                            >
                                Kirim
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* Modal Edit Diskon */}
      {isOpenEditDiskonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity" onClick={handleCloseEditModal}>
            <div 
                className="bg-white w-[500px] rounded-[20px] shadow-2xl overflow-hidden transform transition-all scale-100"
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
                <div className="p-6">
                    <form className="space-y-5">
                        {/* Judul Diskon */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#202224]">Judul Diskon</label>
                            <input 
                                type="text" 
                                name="judul"
                                value={editFormDiskon.judul}
                                onChange={handleEditInputChange}
                                className="w-full px-4 py-3 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224] placeholder:text-[#9A9A9A]"
                            />
                        </div>

                         {/* Persentase Diskon */}
                         <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#202224]">Persentase Diskon</label>
                            <input 
                                type="text"
                                name="persentase"
                                value={editFormDiskon.persentase}
                                onChange={handleEditInputChange}
                                className="w-full px-4 py-3 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224] placeholder:text-[#9A9A9A]"
                            />
                        </div>

                        {/* Tanggal Mulai & Berakhir */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#202224]">Tanggal Mulai</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        name="startDate"
                                        value={editFormDiskon.startDate}
                                        onChange={handleEditInputChange}
                                        className="w-full px-4 py-3 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224] placeholder:text-[#9A9A9A]"
                                    />
                                    <Calendar size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#202224]">Tanggal Berakhir</label>
                                <div className="relative">
                                     <input 
                                        type="text" 
                                        name="endDate"
                                        value={editFormDiskon.endDate}
                                        onChange={handleEditInputChange}
                                        className="w-full px-4 py-3 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224] placeholder:text-[#9A9A9A]"
                                    />
                                    <Calendar size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#202224]">Status</label>
                            <div className="relative">
                                <select 
                                    name="status"
                                    value={editFormDiskon.status}
                                    onChange={handleEditInputChange}
                                    className="w-full px-4 py-3 bg-white border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all text-[#202224] appearance-none cursor-pointer"
                                >
                                    <option value="Aktif">Aktif</option>
                                    <option value="Tidak Aktif">Tidak Aktif</option>
                                </select>
                                <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A9A9A] pointer-events-none" />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button 
                                type="button" 
                                onClick={handleEditSubmit}
                                className="w-full py-3 bg-[#FE4E10] text-white font-bold rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] transition-all transform hover:-translate-y-0.5"
                            >
                                Simpan
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
