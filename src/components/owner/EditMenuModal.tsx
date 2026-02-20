import { useState, useRef, useEffect } from 'react';
import { X, Upload, ChevronDown } from 'lucide-react';

interface MenuData {
  id: number;
  name: string;
  category: string;
  price: number;
  flavors: string;
  image: string;
  isActive?: boolean;
}

interface EditMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: MenuData | null;
  onSave: (updatedData: MenuData) => void;
}

const EditMenuModal = ({ isOpen, onClose, initialData, onSave }: EditMenuModalProps) => {
  const [formData, setFormData] = useState<MenuData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        isActive: initialData.isActive ?? true // Default to active if undefined
      });
      setImagePreview(initialData.image);
    }
  }, [initialData]);

  if (!isOpen || !formData) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, we'd upload this. Here we just create a local URL for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData({ ...formData, image: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl transform transition-all p-6 md:p-8 m-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[#202224]">Edit Menu</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#202224]">
              Menu Image
            </label>
            <div 
              className="border-2 border-dashed border-[#EAEAEA] rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className="w-12 h-12 bg-[#FE4E10]/10 rounded-full flex items-center justify-center mb-3">
                    <Upload size={24} className="text-[#FE4E10]" />
                  </div>
                  <p className="text-sm text-[#5C5C5C] font-semibold">
                    Klik untuk upload gambar
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    SVG, PNG, JPG (Max. 3MB)
                  </p>
                </>
              )}
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          </div>

          {/* Menu Name */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#202224]">
              Menu Name
            </label>
            <input 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masukkan nama menu"
              className="w-full px-4 py-3 bg-gray-50 border border-[#EAEAEA] rounded-xl text-[#202224] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#202224]">
              Category
            </label>
            <div className="relative">
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-[#EAEAEA] rounded-xl text-[#202224] appearance-none focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all cursor-pointer"
                required
              >
                <option value="" disabled>Pilih Kategori</option>
                <option value="Roti">Roti</option>
                <option value="Jagung">Jagung</option>
                <option value="Minuman">Minuman</option>
                <option value="Camilan">Camilan</option>
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDown size={20} />
              </div>
            </div>
          </div>

          {/* Menu Status */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#202224]">
              Menu Status
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => prev ? ({ ...prev, isActive: true }) : null)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${
                  formData?.isActive 
                    ? 'bg-green-50 text-green-600 border-green-500' 
                    : 'bg-gray-50 text-gray-400 border-[#EAEAEA] hover:bg-gray-100'
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => prev ? ({ ...prev, isActive: false }) : null)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${
                  !formData?.isActive 
                    ? 'bg-red-50 text-red-600 border-red-500' 
                    : 'bg-gray-50 text-gray-400 border-[#EAEAEA] hover:bg-gray-100'
                }`}
              >
                Tidak Aktif
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#202224]">
              Price
            </label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#5C5C5C] font-semibold">Rp</span>
                <input 
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="0"
                  min="0"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-[#EAEAEA] rounded-xl text-[#202224] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all"
                  required
                />
            </div>
          </div>

          {/* Flavors */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#202224]">
              Flavors
            </label>
            <input 
              type="text"
              value={formData.flavors}
              onChange={(e) => setFormData({ ...formData, flavors: e.target.value })}
              placeholder="Contoh: Coklat, Keju, BBQ"
              className="w-full px-4 py-3 bg-gray-50 border border-[#EAEAEA] rounded-xl text-[#202224] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FE4E10]/20 focus:border-[#FE4E10] transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 bg-white border border-[#EAEAEA] text-[#5C5C5C] rounded-xl font-bold text-base hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
                Cancel
            </button>
            <button 
                type="submit"
                className="flex-1 py-3.5 bg-[#FE4E10] text-white rounded-xl font-bold text-base hover:bg-[#e0450e] active:scale-[0.98] transition-all shadow-lg shadow-[#FE4E10]/30"
            >
                Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMenuModal;
