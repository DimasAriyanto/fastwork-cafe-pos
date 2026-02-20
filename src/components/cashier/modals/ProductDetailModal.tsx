import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { CartItem } from "../../../types/cashier";

type ProductDetailModalProps = {
    item: CartItem | null;
    onClose: () => void;
    onAddToCart: (item: CartItem) => void;
};

export default function ProductDetailModal({ item, onClose, onAddToCart }: ProductDetailModalProps) {
    const [selectedItem, setSelectedItem] = useState<CartItem | null>(item);

    useEffect(() => {
        setSelectedItem(item);
    }, [item]);

    if (!item || !selectedItem) return null;

    const handleVariantSelect = (variant: string) => {
        setSelectedItem({ ...selectedItem, selectedVariant: variant });
    };

    const handleToppingToggle = (toppingName: string) => {
        const currentToppings = selectedItem.selectedToppings || [];
        const newToppings = currentToppings.includes(toppingName)
            ? currentToppings.filter((t) => t !== toppingName)
            : [...currentToppings, toppingName];

        setSelectedItem({ ...selectedItem, selectedToppings: newToppings });
    };

    const calculateTotal = () => {
        let itemTotal = selectedItem.price * selectedItem.qty;
        if (selectedItem.selectedToppings && selectedItem.toppings) {
            selectedItem.selectedToppings.forEach((toppingName) => {
                const topping = selectedItem.toppings?.find((t) => t.name === toppingName);
                if (topping) {
                    itemTotal += topping.price * selectedItem.qty;
                }
            });
        }
        return itemTotal;
    };

    const handleAddToCart = () => {
        if (selectedItem.variants && !selectedItem.selectedVariant) {
            alert("Silakan pilih rasa terlebih dahulu!");
            return;
        }
        onAddToCart(selectedItem);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scaleIn border border-gray-200 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="font-bold text-lg">{selectedItem.name}</h3>
                        <p className="text-orange-600 font-bold">Rp{calculateTotal().toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Variants */}
                    {selectedItem.variants && (
                        <div>
                            <h4 className="font-medium text-gray-700 mb-3">Pilih Varian (Wajib)</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {selectedItem.variants.map((variant) => (
                                    <button
                                        key={variant}
                                        onClick={() => handleVariantSelect(variant)}
                                        className={`p-3 rounded-xl border-2 font-medium transition-all duration-200 ${selectedItem.selectedVariant === variant
                                            ? "border-orange-500 bg-orange-50 text-orange-600"
                                            : "border-gray-200 hover:border-orange-200 text-gray-600"
                                            }`}
                                    >
                                        {variant}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Toppings */}
                    {selectedItem.toppings && (
                        <div>
                            <h4 className="font-medium text-gray-700 mb-3">Extra Topping</h4>
                            <div className="space-y-3">
                                {selectedItem.toppings.map((topping) => {
                                    const isSelected = selectedItem.selectedToppings?.includes(topping.name);
                                    return (
                                        <button
                                            key={topping.name}
                                            onClick={() => handleToppingToggle(topping.name)}
                                            className={`w-full flex justify-between items-center p-3 rounded-xl border transition-all duration-200 group ${isSelected
                                                ? "border-orange-500 bg-white shadow-sm ring-1 ring-orange-500/20"
                                                : "border-gray-200 hover:border-orange-200 bg-white"
                                                }`}
                                        >
                                            <div className="text-left">
                                                <span className={`block text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{topping.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-gray-500 font-medium">
                                                    +Rp{topping.price.toLocaleString()}
                                                </span>
                                                {/* Circular Indicator */}
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected
                                                    ? "border-orange-500"
                                                    : "border-gray-300 group-hover:border-orange-300"
                                                    }`}>
                                                    {isSelected && (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        Tambahkan - Rp{calculateTotal().toLocaleString()}
                    </button>
                </div>
            </div>
        </div>
    );
}
