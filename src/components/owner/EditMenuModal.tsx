import { useState, useRef, useEffect } from 'react';
import { X, Upload, ChevronDown, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

interface EditMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any | null;
  onSaved: () => void;
}

const EditMenuModal = ({ isOpen, onClose, initialData, onSaved }: EditMenuModalProps) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [allToppings, setAllToppings] = useState<any[]>([]);
  const [selectedToppingIds, setSelectedToppingIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    description: '',
    isAvailable: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || '',
        categoryId: String(initialData.categoryId || ''),
        price: String(initialData.price || ''),
        description: initialData.description || '',
        isAvailable: initialData.isAvailable ?? true,
      });
      setImagePreview(initialData.image ? apiClient.getImageUrl(initialData.image) : null);
      setImageFile(null);
      // Pre-select toppings already linked to this menu
      const linkedIds = (initialData.toppings || []).map((t: any) => Number(t.id));
      setSelectedToppingIds(linkedIds);
    }
    if (isOpen) {
      apiClient.getCategories().then((data: any) => {
        setCategories(Array.isArray(data) ? data : (data.data || data));
      });
      apiClient.getToppings().then((data: any) => {
        setAllToppings(Array.isArray(data) ? data : (data.data || data));
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen || !initialData) return null;

  const toggleTopping = (id: number) => {
    setSelectedToppingIds(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.price) return;
    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('categoryId', formData.categoryId);
      submitData.append('price', formData.price);
      submitData.append('description', formData.description);
      submitData.append('isAvailable', String(formData.isAvailable));
      submitData.append('toppingIds', JSON.stringify(selectedToppingIds));
      
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      await apiClient.updateMenu(initialData.id, submitData);
      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || "Gagal mengupdate menu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 md:p-8 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[#202224]">Edit Menu</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#202224]">Gambar Menu</label>
            <div
              className="border-2 border-dashed border-[#EAEAEA] rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <div className="w-12 h-12 bg-[#FE4E10]/10 rounded-full flex items-center justify-center mb-3">
                    <Upload size={24} className="text-[#FE4E10]" />
                  </div>
                  <p className="text-sm text-[#5C5C5C] font-semibold">Klik untuk upload gambar</p>
                  <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG (Max. 3MB)</p>
                </>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>
          </div>

          {/* Menu Name */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#202224]">Nama Menu <span className="text-[#FF4D4D]">*</span></label>
            <input
              type="text" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama menu"
              className="w-full px-4 py-3 bg-gray-50 border border-[#EAEAEA] rounded-xl text-[#202224] focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#202224]">Kategori <span className="text-[#FF4D4D]">*</span></label>
            <div className="relative">
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-[#EAEAEA] rounded-xl text-[#202224] appearance-none focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all cursor-pointer"
                required
              >
                <option value="" disabled>Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown size={20} />
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#202224]">Harga <span className="text-[#FF4D4D]">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#5C5C5C] font-semibold">Rp</span>
              <input
                type="number" value={formData.price} min="0"
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-[#EAEAEA] rounded-xl text-[#202224] focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#202224]">Deskripsi <span className="text-gray-400 font-normal">(Opsional)</span></label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi menu..."
              rows={2}
              className="w-full px-4 py-3 bg-gray-50 border border-[#EAEAEA] rounded-xl text-[#202224] focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all resize-none"
            />
          </div>

          {/* Extra Toppings */}
          {allToppings.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-[#202224]">Extra Topping Tersedia</label>
              <p className="text-xs text-gray-400">Pilih topping yang bisa ditambahkan ke menu ini oleh kasir.</p>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                {allToppings.map((t: any) => {
                  const isSelected = selectedToppingIds.includes(Number(t.id));
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => toggleTopping(Number(t.id))}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-[#FE4E10]/10 border-[#FE4E10] text-[#FE4E10]'
                          : 'bg-gray-50 border-[#EAEAEA] text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span>{t.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">Rp{Number(t.price).toLocaleString('id-ID')}</span>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#FE4E10] border-[#FE4E10]' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#202224]">Status Menu</label>
            <div className="flex gap-4">
              <button type="button" onClick={() => setFormData({ ...formData, isAvailable: true })}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${formData.isAvailable ? 'bg-green-50 text-green-600 border-green-500' : 'bg-gray-50 text-gray-400 border-[#EAEAEA] hover:bg-gray-100'}`}>
                Tersedia
              </button>
              <button type="button" onClick={() => setFormData({ ...formData, isAvailable: false })}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${!formData.isAvailable ? 'bg-red-50 text-red-600 border-red-500' : 'bg-gray-50 text-gray-400 border-[#EAEAEA] hover:bg-gray-100'}`}>
                Tidak Tersedia
              </button>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 bg-white border border-[#EAEAEA] text-[#5C5C5C] rounded-xl font-bold text-base hover:bg-gray-50 active:scale-[0.98] transition-all">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 py-3.5 bg-[#FE4E10] text-white rounded-xl font-bold text-base hover:bg-[#e0450e] active:scale-[0.98] transition-all shadow-lg shadow-[#FE4E10]/30 flex items-center justify-center gap-2 disabled:opacity-60">
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMenuModal;
