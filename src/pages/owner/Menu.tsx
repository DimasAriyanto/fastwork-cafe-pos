import { useState } from 'react';
import { 
  Filter, 
  RotateCcw, 
  Plus, 
  Download, 
  Pencil, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown
} from 'lucide-react';

// Mock Data
const mockMenuData = [
  { id: 1, name: "Roti Maryam", category: "Roti", price: 10000, flavors: "Matcha, Coklat, Oreo", image: "https://images.unsplash.com/photo-1574129643536-27b53a8120d0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: 2, name: "Jagung Bakar", category: "Jagung", price: 12000, flavors: "Pedas, Manis, BBQ", image: "https://images.unsplash.com/photo-1534939561126-855f866540b9?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: 3, name: "Es Teh Manis", category: "Minuman", price: 5000, flavors: "Original", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: 4, name: "Roti Bakar", category: "Roti", price: 15000, flavors: "Coklat, Keju, Kacang", image: "https://images.unsplash.com/photo-1588667364639-6677cbd7796d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: 5, name: "Pisang Keju", category: "Camilan", price: 12000, flavors: "Original", image: "https://images.unsplash.com/photo-1506543730-8456f9160530?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: 6, name: "Kopi Susu", category: "Minuman", price: 18000, flavors: "Gula Aren", image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: 7, name: "Sosis Bakar", category: "Camilan", price: 15000, flavors: "BBQ, Lada Hitam", image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: 8, name: "Lemon Tea", category: "Minuman", price: 8000, flavors: "Dingin, Panas", image: "https://images.unsplash.com/photo-1616428787723-57da33dfad4f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
  { id: 9, name: "Kentang Goreng", category: "Camilan", price: 12000, flavors: "Balado, Keju", image: "https://images.unsplash.com/photo-1630384060421-a431e4cad2e2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
];

const OwnerMenu = () => {
  const [filterCategory, setFilterCategory] = useState("Semua");

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#202224]">Menu Makanan</h1>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Left Side: Filters */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Mock Filter UI */}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EAEAEA] rounded-xl text-[#5C5C5C] hover:bg-gray-50 transition-colors shadow-sm">
            <Filter size={18} />
            <span className="font-semibold text-sm">Filter By</span>
          </button>

          {/* Category Dropdown (Mock) */}
          <div className="relative group">
            <button className="flex items-center gap-8 justify-between px-4 py-2 bg-white border border-[#EAEAEA] rounded-xl text-[#202224] min-w-[140px] hover:bg-gray-50 transition-colors shadow-sm">
              <span className="font-semibold text-sm">Kategori</span>
              <ChevronDown size={16} />
            </button>
          </div>

          <button 
            className="flex items-center gap-2 text-[#FE4E10] font-bold text-sm hover:text-[#e0450e] transition-colors ml-2"
            onClick={() => setFilterCategory("Semua")}
          >
            <RotateCcw size={18} />
            Riset Filter
          </button>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FE4E10] text-white rounded-xl shadow-lg shadow-[#FE4E10]/30 hover:bg-[#e0450e] transition-all transform hover:-translate-y-0.5">
            <Plus size={20} className="stroke-[3]" />
            <span className="font-bold text-sm">Tambah Menu</span>
          </button>
          
          <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-[#EAEAEA] text-[#5C5C5C] rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <Download size={20} />
            <span className="font-semibold text-sm">Export</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[20px] shadow-sm border border-[#EAEAEA] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white text-[#202224] border-b border-[#EAEAEA]">
              <tr>
                <th className="px-6 py-5 font-bold text-sm">Id</th>
                <th className="px-6 py-5 font-bold text-sm">Gambar</th>
                <th className="px-6 py-5 font-bold text-sm">Nama Makanan</th>
                <th className="px-6 py-5 font-bold text-sm">Kategori</th>
                <th className="px-6 py-5 font-bold text-sm">Harga</th>
                <th className="px-6 py-5 font-bold text-sm">Rasa</th>
                <th className="px-6 py-5 font-bold text-sm text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {mockMenuData.map((item, index) => (
                <tr key={item.id} className="hover:bg-[#FDFDFD] transition-colors">
                  <td className="px-6 py-4 font-semibold text-[#202224]">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#202224] font-medium">{item.name}</td>
                  <td className="px-6 py-4 text-[#202224]">{item.category}</td>
                  <td className="px-6 py-4 text-[#202224]">Rp{item.price.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-[#5C5C5C] text-sm max-w-[200px] truncate">{item.flavors}</td>
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
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-[#5C5C5C] text-sm font-medium">
          Showing <span className="text-[#202224] font-bold">1-09</span> of <span className="text-[#202224] font-bold">31</span>
        </p>
        
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg border border-[#EAEAEA] text-[#5C5C5C] hover:bg-gray-50 hover:text-[#202224] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button className="p-2 rounded-lg border border-[#EAEAEA] text-[#5C5C5C] hover:bg-gray-50 hover:text-[#202224] transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerMenu;
