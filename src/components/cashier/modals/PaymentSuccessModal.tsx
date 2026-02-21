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
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-[640px] overflow-hidden animate-scaleIn relative flex flex-col items-center text-center p-10 pt-12"
            >
                {/* Success Icon */}
                <div className="mb-8">
                    <div className="bg-[#00D95A] w-[112px] h-[112px] rounded-full flex items-center justify-center shadow-[0_12px_24px_rgba(0,217,90,0.3)]">
                        <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

                <h2 className="text-[32px] font-semibold text-[#1F2937] mb-2">Pembayaran Berhasil</h2>

                <p className="text-[#6B7280] text-lg mb-6">
                    {new Date(transaction.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} | {new Date(transaction.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </p>

                <div className="text-[48px] font-semibold text-[#1F2937] mb-10">
                    Rp { (transaction.totalPrice || 0).toLocaleString('id-ID') }
                </div>

                <div className="w-full grid grid-cols-2 gap-8 mb-8 px-4">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[#9CA3AF] text-base font-semibold">Metode Pembayaran</span>
                        <span className="text-[#1F2937] text-[28px] font-semibold">
                            {transaction.paymentMethod === "CASH" ? "Tunai" : transaction.paymentMethod}
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-right">
                        <span className="text-[#9CA3AF] text-base font-semibold">
                            {transaction.paymentMethod === "QRIS" ? "Kembali" : "Kembalian"}
                        </span>
                        <span className="text-[#1F2937] text-[28px] font-semibold">
                            Rp {transaction.paymentMethod === "QRIS" ? "0" : ((transaction.change || 0).toLocaleString('id-ID'))}
                        </span>
                    </div>

                </div>

                {/* Order Items Summary */}
                <div className="w-full bg-gray-50 rounded-2xl p-6 mb-10 text-left border border-gray-100">
                    <h4 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-4">Ringkasan Pesanan</h4>
                    <div className="space-y-4 max-h-[160px] overflow-y-auto custom-scrollbar pr-2 mb-4">
                        {transaction.items.map((item, idx) => (
                            <div key={idx} className="border-b border-gray-200 border-dashed pb-3 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-bold text-gray-800">{item.name}</div>
                                    <div className="font-bold text-gray-800">x{item.qty}</div>
                                </div>
                                {item.variant && (
                                    <div className="text-xs text-gray-500 mb-1">Rasa: {item.variant}</div>
                                )}
                                {item.note && (
                                    <div className="text-xs text-orange-600 bg-orange-50 px-2.5 py-1.5 rounded-lg inline-block font-medium">
                                        Catatan: {item.note}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Price Breakdown */}
                    <div className="border-t border-gray-200 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Sub Total</span>
                            <span className="font-medium text-gray-800">Rp {(transaction.subtotal || 0).toLocaleString('id-ID')}</span>
                        </div>
                        {(transaction.discount || 0) > 0 && (
                            <div className="flex justify-between text-sm text-orange-600 italic">
                                <span>Potongan ({transaction.discount}%)</span>
                                <span className="font-medium">- Rp {((transaction.subtotal || 0) * (transaction.discount || 0) / 100).toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Pajak (10%)</span>
                            <span className="font-medium text-gray-800">Rp {(transaction.tax || 0).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="w-full space-y-4 px-2">
                    <button
                        onClick={onPrintReceipt}
                        className="w-full h-14 flex items-center justify-center gap-3 bg-white border border-[#E5E7EB] text-[#1F2937] rounded-xl font-semibold text-lg hover:bg-gray-50 hover:scale-[1.01] transition-all active:scale-[0.98]"
                    >
                        <Printer size={20} />
                        Cetak Struk
                    </button>

                    <div className="flex gap-4">
                        <button
                            onClick={onNewOrder}
                            className="flex-1 h-16 bg-[#FE4E10] text-white rounded-2xl font-semibold text-lg hover:bg-[#e64610] hover:scale-[1.02] hover:shadow-lg transition-all active:scale-[0.98]"
                        >
                            + Buat Pesanan Baru
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 h-16 bg-[#FE4E10] text-white rounded-2xl font-semibold text-lg hover:bg-[#e64610] hover:scale-[1.02] hover:shadow-lg transition-all active:scale-[0.98]"
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