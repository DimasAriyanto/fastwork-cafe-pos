import { useState, useEffect, useRef } from "react";
import { X, Minus, Plus } from "lucide-react";
import type { CartItem } from "../../../types/cashier";

type ProductNoteModalProps = {
    item: CartItem | null;
    index?: number; // Present if editing
    onClose: () => void;
    onSave: (item: CartItem, index?: number) => void;
};

export default function ProductNoteModal({ item, index, onClose, onSave }: ProductNoteModalProps) {
    const [qty, setQty] = useState(1);
    const [note, setNote] = useState("");
    const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
    const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (item) {
            setQty(item.qty || 1);
            setNote(item.note || "");
            setSelectedVariant(item.selectedVariant);
            setSelectedToppings(item.selectedToppings || []);
        }
    }, [item]);

    useEffect(() => {
        if (item && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [item]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!item) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const toggleTopping = (toppingName: string) => {
        setSelectedToppings(prev =>
            prev.includes(toppingName)
                ? prev.filter(t => t !== toppingName)
                : [...prev, toppingName]
        );
    };

    const totalWithToppings = (item.price * qty) + (selectedToppings.reduce((acc, tName) => {
        const topping = item.toppings?.find(t => t.name === tName);
        return acc + (topping ? topping.price * qty : 0);
    }, 0));

    const handleSubmit = () => {
        if (item.variants && item.variants.length > 0 && !selectedVariant) {
            alert("Silakan pilih rasa!");
            return;
        }
        onSave({
            ...item,
            qty,
            note,
            selectedVariant,
            selectedToppings
        }, index);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn border border-gray-100 flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-2">
                    <div className="flex items-center gap-2">
                        <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10.7486 15.7483C8.0646 15.7483 5.6146 16.1263 3.74859 16.7483M16.7486 10.7483C17.3732 10.7481 17.9891 10.6016 18.5469 10.3206C19.1047 10.0395 19.589 9.63179 19.9609 9.12996C20.3328 8.62813 20.582 8.04618 20.6886 7.43072C20.7951 6.81527 20.7561 6.18341 20.5745 5.58576C20.393 4.98811 20.074 4.44128 19.6431 3.98907C19.2123 3.53685 18.6815 3.19183 18.0933 2.98163C17.5051 2.77143 16.8759 2.7019 16.256 2.7786C15.6361 2.8553 15.0428 3.0761 14.5236 3.42332C14.2485 2.64177 13.7376 1.96485 13.0615 1.48601C12.3853 1.00717 11.5772 0.75 10.7486 0.75C9.92004 0.75 9.11191 1.00717 8.43573 1.48601C7.75956 1.96485 7.24868 2.64177 6.9736 3.42332C6.45439 3.0761 5.86108 2.8553 5.24119 2.7786C4.6213 2.7019 3.99207 2.77143 3.40389 2.98163C2.81571 3.19183 2.28492 3.53685 1.85406 3.98907C1.42319 4.44128 1.10421 4.98811 0.922672 5.58576C0.741134 6.18341 0.70208 6.81527 0.808639 7.43072C0.915197 8.04618 1.16441 8.62813 1.53631 9.12996C1.90821 9.63179 2.39246 10.0395 2.95028 10.3206C3.5081 10.6016 4.12398 10.7481 4.74859 10.7483V16.2483M19.7486 16.2483H13.7486M19.7486 16.2483C19.7486 16.9483 17.7546 18.2573 17.2486 18.7483M19.7486 16.2483C19.7486 15.5483 17.7546 14.2393 17.2486 13.7483" stroke="#2C2C2C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>

                        <h3 className="font-bold text-gray-800 text-xl">
                            {index !== undefined ? "Edit Pesanan" : "Tambah Pesanan"}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-800 transition-colors"
                    >
                        <X size={24} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {/* Product Card */}
                    <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl bg-white shadow-sm">
                        <div className="w-24 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 flex flex-col justify-between h-20 py-1">
                            <h4 className="font-bold text-gray-800 text-lg leading-tight">{item.name}</h4>
                            <p className="text-gray-400 font-medium">Rp{item.price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50/50 border border-gray-100 rounded-xl px-2 py-1">
                            <button
                                onClick={() => setQty(Math.max(1, qty - 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-[#FE4E10] transition-colors shadow-sm"
                            >
                                <Minus size={16} strokeWidth={3} />
                            </button>
                            <span className="font-bold text-gray-800 text-base min-w-[12px] text-center">
                                {qty}
                            </span>
                            <button
                                onClick={() => setQty(qty + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-[#FE4E10] transition-colors shadow-sm"
                            >
                                <Plus size={16} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* Variants */}
                    {item.variants && item.variants.length > 0 && (
                        <div className="space-y-3">
                            <label className="block font-semibold text-gray-800 text-sm tracking-wide uppercase opacity-70">Pilih Rasa<span className="text-red-500">*</span></label>
                            <div className="space-y-2">
                                {item.variants.map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => setSelectedVariant(v)}
                                        className={`w-full flex justify-between items-center p-3.5 rounded-xl border transition-all duration-200 group ${selectedVariant === v
                                            ? "border-[#FE4E10] bg-white ring-1 ring-[#FE4E10]"
                                            : "border-gray-200 hover:border-orange-200 bg-white"
                                            }`}
                                    >
                                        <span className={`text-sm font-medium ${selectedVariant === v ? "text-gray-900" : "text-gray-700"}`}>{v}</span>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedVariant === v
                                            ? "border-[#FE4E10]"
                                            : "border-gray-200 group-hover:border-orange-300"
                                            }`}>
                                            {selectedVariant === v && (
                                                <div className="w-3.5 h-3.5 rounded-full bg-[#FE4E10]" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Toppings */}
                    {item.toppings && item.toppings.length > 0 && (
                        <div className="space-y-3">
                            <label className="block font-semibold text-gray-800 text-sm tracking-wide uppercase opacity-70">Extra Topping</label>
                            <div className="space-y-2">
                                {item.toppings.map((t) => {
                                    const isSelected = selectedToppings.includes(t.name);
                                    return (
                                        <button
                                            key={t.name}
                                            onClick={() => toggleTopping(t.name)}
                                            className="w-full flex justify-between items-center p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-white transition-all duration-200 group"
                                        >
                                            <span className="text-sm font-medium text-gray-700">{t.name}</span>

                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-gray-400 font-medium">
                                                    Rp{t.price.toLocaleString()}
                                                </span>
                                                {/* Checkbox Indicator */}
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected
                                                    ? "bg-[#FE4E10] border-[#FE4E10]"
                                                    : "border-gray-100 group-hover:border-gray-200"
                                                    }`}>
                                                    {isSelected && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
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

                    {/* Note Field */}
                    <div className="space-y-3">
                        <label className="block font-semibold text-gray-800 text-sm tracking-wide uppercase opacity-70">Catatan</label>
                        <textarea
                            ref={textareaRef}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Tulis catatan"
                            className="w-full h-32 p-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-[#FE4E10] resize-none text-gray-700 placeholder:text-gray-300 transition-all font-medium leading-relaxed"
                        />
                    </div>
                </div>

                {/* Footer / CTA */}
                <div className="p-6 pt-2">
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-[#FE4E10] text-white p-5 rounded-2xl font-semibold text-lg hover:bg-[#e64610] transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98] transform hover:translate-y-[-2px]"
                    >
                        (Rp{totalWithToppings.toLocaleString()}) {index !== undefined ? "Simpan Perubahan" : "Tambah Ke Pesanan"}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
                .animate-scaleIn {
                    animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #F1F5F9;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
