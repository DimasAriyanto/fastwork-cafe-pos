import { useRef, useEffect } from "react";
import { Printer } from "lucide-react";
import type { Transaction } from "../../../types/cashier";

type PaymentSuccessModalProps = {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    onPrintReceipt: () => void;
    onNewOrder: () => void;
};

export default function PaymentSuccessModal({
    isOpen,
    onClose,
    transaction,
    onPrintReceipt,
    onNewOrder,
}: PaymentSuccessModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !transaction) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div
                ref={modalRef}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[92vh] overflow-y-auto animate-scaleIn relative flex flex-col items-center text-center p-5 pt-8 scrollbar-hide"
            >
                {/* Success Icon */}
                <div className="mb-3">
                    <div className="bg-[#00D95A] w-[60px] h-[60px] rounded-full flex items-center justify-center shadow-[0_8px_16px_rgba(0,217,90,0.2)]">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M5 13L9 17L19 7"
                                stroke="white"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="animate-checkmark"
                                style={{ strokeDasharray: 20, strokeDashoffset: 20 }}
                            />
                        </svg>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-[#1F2937] mb-1">Pembayaran Berhasil</h2>

                <p className="text-[#6B7280] text-sm mb-4">
                    {new Date(transaction.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} | {new Date(transaction.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </p>

                <div className="text-2xl font-black text-[#FE4E10] mb-5 font-mono">
                    Rp {(transaction.totalPrice || 0).toLocaleString('id-ID')}
                </div>

                <div className="w-full grid grid-cols-2 gap-2 mb-5 px-1">
                    <div className="flex flex-col items-center gap-0.5 border-r border-gray-100">
                        <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Metode</span>
                        <span className="text-[#1F2937] text-base font-bold">
                            {transaction.paymentMethod === "CASH" ? "Tunai" : transaction.paymentMethod}
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">
                            {transaction.paymentMethod === "QRIS" ? "Status" : "Kembalian"}
                        </span>
                        <span className={`${transaction.paymentMethod === "QRIS" ? "text-green-500" : "text-orange-500"} text-base font-bold font-mono`}>
                            {transaction.paymentMethod === "QRIS" ? "Lunas" : `Rp ${(transaction.change || 0).toLocaleString('id-ID')}`}
                        </span>
                    </div>
                </div>

                {/* Order Items Summary */}
                <div className="w-full bg-gray-50 rounded-xl p-3 mb-5 text-left border border-gray-100">
                    <h4 className="text-gray-400 font-black text-[9px] uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">Ringkasan</h4>
                    <div className="space-y-2 max-h-[100px] overflow-y-auto scrollbar-hide mb-2">
                        {transaction.items.map((item, idx) => (
                            <div key={idx} className="pb-1 last:pb-0">
                                <div className="flex justify-between items-start text-xs">
                                    <div className="font-bold text-gray-700 truncate flex-1">{item.name}</div>
                                    <div className="font-bold text-gray-900 ml-2">x{item.qty}</div>
                                </div>
                                {item.variant && (
                                    <div className="text-[9px] text-gray-400">Varian: {item.variant}</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Price Breakdown */}
                    <div className="border-t border-gray-200 pt-2 space-y-1 text-[10px]">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Sub Total</span>
                            <span className="font-bold text-gray-700">Rp {(transaction.subtotal || 0).toLocaleString('id-ID')}</span>
                        </div>
                        {(transaction.discountAmount || 0) > 0 && (
                            <div className="flex justify-between text-orange-600 italic font-bold">
                                <span>Diskon{(transaction.discount || 0) > 0 ? ` (${transaction.discount}%)` : ''}</span>
                                <span>- Rp {(transaction.discountAmount || 0).toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        {transaction.taxDetails && transaction.taxDetails.length > 0 ? (
                            transaction.taxDetails.map((t, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span className="text-gray-400">{t.name}</span>
                                    <span className="font-bold text-gray-700">Rp {t.amount.toLocaleString('id-ID')}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex justify-between">
                                <span className="text-gray-400">Pajak</span>
                                <span className="font-bold text-gray-700">Rp {(transaction.tax || 0).toLocaleString('id-ID')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="w-full space-y-2">
                    <button
                        onClick={onPrintReceipt}
                        className="w-full h-10 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all uppercase tracking-widest"
                    >
                        <Printer size={14} />
                        Cetak Struk
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onNewOrder}
                            className="flex-1 h-11 bg-white border-2 border-[#FE4E10] text-[#FE4E10] rounded-xl font-black text-xs hover:bg-orange-50 uppercase tracking-widest"
                        >
                            Baru
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 h-11 bg-[#FE4E10] text-white rounded-xl font-black text-xs hover:bg-[#e64610] shadow-lg shadow-orange-500/20 uppercase tracking-widest"
                        >
                            Selesai
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes checkmark {
                    to { stroke-dashoffset: 0; }
                }
                .animate-checkmark {
                    animation: checkmark 0.4s ease-in-out forwards 0.2s;
                }
            `}</style>
        </div>
    );
}