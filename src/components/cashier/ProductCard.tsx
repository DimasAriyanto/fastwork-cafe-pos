import { Plus } from "lucide-react";
import type { Product } from "../../types/cashier";

type ProductCardProps = {
    product: Product;
    onClick: (product: Product) => void;
};

export default function ProductCard({ product, onClick }: ProductCardProps) {
    const isAvailable = product.isAvailable !== false;

    return (
        <div
            onClick={() => isAvailable && onClick(product)}
            className={`bg-white rounded-xl border border-gray-200 transition-all duration-200 group transform h-full flex flex-col overflow-hidden ${isAvailable
                ? "cursor-pointer hover:shadow-md hover:border-orange-200 hover:-translate-y-0.5"
                : "cursor-not-allowed opacity-70"
                }`}
        >
            {/* Product Image */}
            <div className={`relative w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden ${!isAvailable ? "grayscale" : ""}`}>
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                            const fallback = document.createElement("div");
                            fallback.className = "w-full h-full flex items-center justify-center absolute inset-0";
                            fallback.innerHTML = `<span class="text-3xl">${
                                product.category.includes("Minuman") ? "🥤"
                                : product.category.includes("Kopi") ? "☕"
                                : "🍽️"
                            }</span>`;
                            parent.appendChild(fallback);
                        }
                    }}
                />
                {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                            OUT OF STOCK
                        </span>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className={`flex flex-col flex-1 p-2.5 sm:p-3 ${!isAvailable ? "grayscale" : ""}`}>
                <p className="font-semibold text-gray-800 text-xs sm:text-sm leading-tight line-clamp-2 mb-0.5">
                    {product.name}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400 truncate mb-2">
                    {product.category}
                </p>
                <div className="mt-auto flex items-center justify-between gap-1">
                    <p className="font-bold text-orange-600 text-xs sm:text-sm">
                        Rp{product.price.toLocaleString('id-ID')}
                    </p>
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 flex items-center justify-center rounded-full transition-all ${isAvailable
                        ? "bg-gray-100 text-gray-500 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110"
                        : "bg-gray-200 text-gray-300"
                        }`}>
                        <Plus size={14} />
                    </div>
                </div>
            </div>
        </div>
    );
}
