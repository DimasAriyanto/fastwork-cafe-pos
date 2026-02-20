import { Pencil, Trash2, Minus, Plus } from "lucide-react";
import type { CartItem as CartItemType } from "../../types/cashier";

type CartItemProps = {
    item: CartItemType;
    index: number;
    onUpdateQuantity: (index: number, delta: number) => void;
    onRemove: (index: number) => void;
    onEdit: (item: CartItemType, index: number) => void;
};

export default function CartItem({ item, index, onUpdateQuantity, onRemove, onEdit }: CartItemProps) {
    return (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <p className="font-bold text-gray-800 text-lg">{item.name}</p>
                    {item.selectedVariant && (
                        <p className="text-sm text-gray-600 mt-1">Rasa: {item.selectedVariant}</p>
                    )}
                    {item.selectedToppings && item.selectedToppings.length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                            + {item.selectedToppings.join(", ")}
                        </p>
                    )}
                    {item.note && (
                        <p className="text-xs text-orange-500 mt-2 bg-orange-50 p-2 rounded-lg border border-orange-100 flex gap-1.5 items-start font-medium">
                            <span className="font-bold uppercase text-[10px] mt-0.5 tracking-wider opacity-70">Catatan:</span>
                            <span>{item.note}</span>
                        </p>
                    )}
                </div>
                <p className="font-bold text-orange-600 text-lg">
                    Rp{(item.price * item.qty).toLocaleString()}
                </p>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(item, index)}
                        className="p-2 hover:bg-gray-100 rounded-lg border border-gray-300 text-gray-600 hover:text-orange-600 transition transform hover:scale-105"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={() => onRemove(index)}
                        className="p-2 hover:bg-gray-100 rounded-lg border border-gray-300 text-red-500 hover:bg-red-50 transition transform hover:scale-105"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-4 bg-white border border-gray-300 rounded-xl px-4 py-2">
                    <button
                        onClick={() => {
                            if (item.qty > 1) {
                                onUpdateQuantity(index, -1);
                            }
                        }}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition transform hover:scale-110"
                    >
                        <Minus size={16} />
                    </button>
                    <span className="font-bold text-gray-800 text-xl min-w-[30px] text-center">
                        {item.qty}
                    </span>
                    <button
                        onClick={() => onUpdateQuantity(index, 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition transform hover:scale-110"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
