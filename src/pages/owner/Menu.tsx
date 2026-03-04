import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import AddMenuModal from '../../components/owner/AddMenuModal';
import EditMenuModal from '../../components/owner/EditMenuModal';
import {
  Filter,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../../api/client';

const OwnerMenu = () => {
  const { search } = useOutletContext<{ search: string }>();
  const [menus, setMenus] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;
  const totalPages = Math.ceil(totalItems / limit);

  // Filters
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // Modals
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);

  const fetchMenus = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { page: currentPage, limit };
      if (filterCategoryId) params.categoryId = filterCategoryId;
      if (search) params.search = search; // Add search param

      const data = await apiClient.getMenus(params);
      // data can be paginated
      if (Array.isArray(data)) {
        setMenus(data);
        setTotalItems(data.length);
      } else {
        setMenus(data.data || []);
        setTotalItems(data.total || (data.data || []).length);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal memuat menu");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterCategoryId, search]);

  useEffect(() => { fetchMenus(); }, [fetchMenus]);

  // Handle Search Debounce & Reset Page
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    apiClient.getCategories().then((data: any) => {
      setCategories(Array.isArray(data) ? data : (data.data || data));
    });
  }, []);

  const handleEditClick = (menu: any) => {
    setEditingMenu(menu);
    setIsEditModalOpen(true);
  };

  const handleToggleStatus = async (menu: any) => {
    try {
      await apiClient.updateMenu(menu.id, { isAvailable: !menu.isAvailable });
      fetchMenus();
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status menu");
    }
  };

  const handleDeleteMenu = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus menu ini?")) return;
    try {
      await apiClient.deleteMenu(id);
      fetchMenus();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus menu");
    }
  };

  const resetFilter = () => {
    setFilterCategoryId("");
    setCurrentPage(1);
  };

  const selectedCategoryName = categories.find(c => String(c.id) === filterCategoryId)?.name;

  return (
    <div className="space-y-8 font-sans" onClick={() => setIsCategoryOpen(false)}>
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#202224]">Menu Makanan</h1>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EAEAEA] rounded-xl text-[#5C5C5C] hover:bg-gray-50 transition-colors shadow-sm">
            <Filter size={18} />
            <span className="font-semibold text-sm">Filter By</span>
          </button>

          {/* Category Dropdown */}
          <div className="relative group" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="flex items-center gap-8 justify-between px-4 py-2 bg-white border border-[#EAEAEA] rounded-xl text-[#202224] min-w-[140px] hover:bg-gray-50 transition-colors shadow-sm"
            >
              <span className="font-semibold text-sm">
                {selectedCategoryName || "Kategori"}
              </span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCategoryOpen && (
              <div className="absolute top-full left-0 mt-2 w-full min-w-[160px] bg-white border border-[#EAEAEA] rounded-xl shadow-lg z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="py-1">
                  <button
                    onClick={() => { setFilterCategoryId(""); setIsCategoryOpen(false); setCurrentPage(1); }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${!filterCategoryId ? 'bg-[#FE4E10]/10 text-[#FE4E10]' : 'text-[#5C5C5C] hover:bg-gray-50'}`}
                  >Semua Kategori</button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setFilterCategoryId(String(cat.id)); setIsCategoryOpen(false); setCurrentPage(1); }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${filterCategoryId === String(cat.id) ? 'bg-[#FE4E10]/10 text-[#FE4E10]' : 'text-[#5C5C5C] hover:bg-gray-50'}`}
                    >{cat.name}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 text-[#FE4E10] font-bold text-sm hover:text-[#e0450e] transition-colors ml-2" onClick={resetFilter}>
            <RotateCcw size={18} />
            Reset Filter
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsAddMenuOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FE4E10] text-white rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] transition-all transform hover:-translate-y-0.5"
          >
            <Plus size={20} className="stroke-[3]" />
            <span className="font-bold text-sm">Tambah Menu</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#EAEAEA] overflow-hidden min-h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px] gap-2">
            <Loader2 size={24} className="animate-spin text-[#FE4E10]" />
            <p className="text-[#565656]">Memuat data menu...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[300px] gap-2">
            <p className="text-red-500 font-medium">{error}</p>
            <button onClick={fetchMenus} className="text-sm text-[#FE4E10] font-bold underline">Coba Lagi</button>
          </div>
        ) : menus.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-[#565656]">Belum ada menu. Tambahkan menu pertama!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white text-[#202224] border-b border-[#EAEAEA]">
                <tr>
                  <th className="px-6 py-5 font-bold text-sm">No</th>
                  <th className="px-6 py-5 font-bold text-sm">Gambar</th>
                  <th className="px-6 py-5 font-bold text-sm">Nama Menu</th>
                  <th className="px-6 py-5 font-bold text-sm">Kategori</th>
                  <th className="px-6 py-5 font-bold text-sm">Harga</th>
                  <th className="px-6 py-5 font-bold text-sm">Status</th>
                  <th className="px-6 py-5 font-bold text-sm text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {menus.map((item, index) => (
                  <tr key={item.id} className={`hover:bg-[#FDFDFD] transition-colors ${!item.isAvailable ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 font-semibold text-[#202224]">{(currentPage - 1) * limit + index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                        {item.image ? (
                          <img src={apiClient.getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#FE4E10]/10 to-[#FE4E10]/20 flex items-center justify-center text-[#FE4E10] text-xs font-bold">
                            {item.name?.[0]}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#202224] font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-[#202224]">{item.categoryName || item.category?.name || '-'}</td>
                    <td className="px-6 py-4 text-[#202224]">Rp{Number(item.price).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${
                          item.isAvailable
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {item.isAvailable ? 'Tersedia' : 'Habis'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-2 bg-[#F0F2FF] text-[#4D71FF] rounded-lg hover:bg-[#4D71FF] hover:text-white transition-all duration-200"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteMenu(item.id)}
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
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-[#5C5C5C] text-sm font-medium">
            Showing <span className="text-[#202224] font-bold">{(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, totalItems)}</span> of <span className="text-[#202224] font-bold">{totalItems}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-[#EAEAEA] text-[#5C5C5C] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-[#202224]">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-[#EAEAEA] text-[#5C5C5C] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddMenuModal
        isOpen={isAddMenuOpen}
        onClose={() => setIsAddMenuOpen(false)}
        onSaved={() => { fetchMenus(); setIsAddMenuOpen(false); }}
      />

      <EditMenuModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingMenu(null); }}
        initialData={editingMenu}
        onSaved={() => { fetchMenus(); setIsEditModalOpen(false); setEditingMenu(null); }}
      />
    </div>
  );
};

export default OwnerMenu;
