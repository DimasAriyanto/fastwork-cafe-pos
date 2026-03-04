import { useState, useMemo } from "react";
import { X, Search, Plus } from "lucide-react";
import { PRODUCTS_BY_CATEGORY, CATEGORIES } from "../../../constants/products";
import type { Product } from "../../../types/cashier";

type AddMenuModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onAddProduct: (product: Product) => void;
};

export default function AddMenuModal({ isOpen, onClose, onAddProduct }: AddMenuModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Semua Menu");

    const filteredProducts = useMemo(() => {
        const products = PRODUCTS_BY_CATEGORY[selectedCategory] || [];
        if (!searchTerm) return products;
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [selectedCategory, searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-scaleIn">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Tambah Menu</h2>
                        <p className="text-gray-500 text-sm">Pilih menu untuk ditambahkan ke pesanan</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-6 pb-2 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari menu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white focus:border-orange-500 transition-all"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.name}
                                onClick={() => setSelectedCategory(cat.name)}
                                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${selectedCategory === cat.name
                                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {cat.icon} {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar">
                    {filteredProducts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <p>Menu tidak ditemukan</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-col gap-3 hover:shadow-xl hover:border-orange-200 transition-all group cursor-pointer"
                                    onClick={() => onAddProduct(product)} // Bisa klik di seluruh card
                                >
                                    <div className="w-24 h-24 mx-auto rounded-xl bg-gray-100 overflow-hidden relative flex-shrink-0">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                                        />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="font-bold text-gray-900 group-hover:text-orange-500 transition-colors line-clamp-1">{product.name}</h4>
                                        <p className="text-orange-500 font-bold">Rp {product.price.toLocaleString("id-ID")}</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onAddProduct(product); }}
                                        className="w-full py-2 bg-orange-50 text-orange-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-500 hover:text-white transition-all active:scale-95 shadow-sm"
                                    >
                                        <Plus size={18} /> Tambah
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
