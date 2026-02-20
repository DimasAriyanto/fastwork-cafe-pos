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
            className={`bg-white rounded-xl p-4 border border-gray-200 transition-all duration-200 group transform h-full flex flex-col ${isAvailable
                ? "cursor-pointer hover:shadow-lg hover:border-orange-200 hover:-translate-y-1"
                : "cursor-not-allowed opacity-75"
                }`}
        >
            <div className="flex items-start gap-4 h-full relative">
                {!isAvailable && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-lg">
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                            OUT OF STOCK
                        </span>
                    </div>
                )}

                {/* Product Image */}
                <div className={`w-20 h-20 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden ${!isAvailable && "grayscale"}`}>
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
                                fallback.className = "w-full h-full flex items-center justify-center";
                                fallback.innerHTML = `<span class="text-2xl">
                  ${product.category.includes("Minuman")
                                        ? "🥤"
                                        : product.category.includes("Kopi")
                                            ? "☕"
                                            : "🍽️"
                                    }
                </span>`;
                                parent.appendChild(fallback);
                            }
                        }}
                    />
                </div>

                {/* Product Info */}
                <div className={`flex-1 flex flex-col ${!isAvailable && "grayscale"}`}>
                    <p className="font-semibold text-gray-800 text-lg line-clamp-2">
                        {product.name}
                    </p>

                    <p className="text-sm text-gray-500 mt-1 truncate">
                        {product.category}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-3">
                        <p className="font-bold text-orange-600 text-lg">
                            Rp{product.price.toLocaleString()}
                        </p>

                        <div className={`w-8 h-8 flex items-center justify-center rounded-full transition transform ${isAvailable
                            ? "bg-gray-100 text-gray-600 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110"
                            : "bg-gray-200 text-gray-400"
                            }`}>
                            <Plus size={18} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
