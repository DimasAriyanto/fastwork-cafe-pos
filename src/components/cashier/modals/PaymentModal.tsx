import { useState, useEffect } from "react";
import type { PaymentMethod, TransactionItem } from "../../../types/cashier";

type PaymentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    items: TransactionItem[];
    subtotal: number;
    tax: number;
    total: number;
    discount?: number;
    onPaymentSuccess: (
        paidAmount: number,
        change: number,
        paymentMethod: PaymentMethod
    ) => void;
};


export default function PaymentModal({
    isOpen,
    onClose,
    items,
    subtotal,
    tax,
    total,
    discount,
    onPaymentSuccess,
}: PaymentModalProps) {
    const [cashAmount, setCashAmount] = useState("");
    const [change, setChange] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setCashAmount("");
            setChange(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const cash = parseInt(cashAmount) || 0;
        setChange(cash >= total ? cash - total : 0);
    }, [cashAmount, total]);

    const handleNumPadClick = (value: string) => {
        if (value === "delete") {
            setCashAmount((p) => p.slice(0, -1));
        } else {
            if (cashAmount === "" && value === "0") return;
            setCashAmount((p) => p + value);
        }
    };

    const handlePay = () => {
        const cash = parseInt(cashAmount) || 0;
        if (cash >= total) onPaymentSuccess(cash, change, "CASH");
    };


    if (!isOpen) return null;

    const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "delete"];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-[1037px] h-full max-h-[700px] p-[16.5px] animate-scaleIn overflow-hidden">
                <div className="grid grid-cols-2 gap-8 h-full">

                    {/* ================= LEFT ================= */}
                    <div className="flex flex-col h-full">
                        {/* HEADER — FIX: TIDAK ADA mb-6 */}
                        <div className="h-[96px] flex items-end">
                            <h2 className="text-3xl font-semibold">Pembayaran</h2>
                        </div>

                        {/* BODY */}
                        <div className="flex-1 bg-[#F8F9FA] rounded-3xl p-6 flex flex-col overflow-hidden">
                            <h3 className="font-semibold text-lg mb-4">Detail transaksi</h3>

                            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                                {items.map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-lg font-semibold">
                                            <span>{item.name}</span>
                                            <span>x{item.qty}</span>
                                        </div>

                                        {item.variant && (
                                            <p className="text-sm text-gray-500">Rasa: {item.variant}</p>
                                        )}

                                        {item.note && (
                                            <p className="text-sm italic text-gray-500">
                                                Catatan: {item.note}
                                            </p>
                                        )}

                                        <p className="mt-1 font-semibold">
                                            Rp.{(item.price * item.qty).toLocaleString("id-ID")},00
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-5 mt-5 border-t space-y-3">
                                <div className="flex justify-between text-lg">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-semibold">
                                        Rp.{subtotal.toLocaleString("id-ID")},00
                                    </span>
                                </div>

                                {discount !== undefined && discount > 0 && (
                                    <div className="flex justify-between text-lg text-orange-500 italic font-medium">
                                        <span className="text-gray-500">Potongan ({discount}%)</span>
                                        <span>
                                            - Rp.{(subtotal * discount / 100).toLocaleString("id-ID")},00
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between text-lg">
                                    <span className="text-gray-500">Pajak (10%)</span>
                                    <span className="font-semibold">
                                        Rp.{tax.toLocaleString("id-ID")},00
                                    </span>
                                </div>

                                <div className="flex justify-between text-xl pt-3">
                                    <span className="font-semibold">Total</span>
                                    <span className="font-semibold">
                                        Rp.{total.toLocaleString("id-ID")},00
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ================= RIGHT ================= */}
                    <div className="flex flex-col h-full">

                        {/* HEADER — TINGGI SAMA */}
                        <div className="h-[96px] flex flex-col justify-end">
                            <div className="text-[48px] font-semibold flex justify-end gap-2">
                                <span className="text-gray-400">Rp</span>
                                <span>
                                    {cashAmount
                                        ? parseInt(cashAmount).toLocaleString("id-ID")
                                        : "0"}
                                </span>
                            </div>

                            <div className="flex justify-between text-lg mt-1">
                                <span className="text-gray-500">Kembali</span>
                                <span className="font-semibold">
                                    Rp{change.toLocaleString("id-ID")}
                                </span>
                            </div>
                        </div>

                        {/* KEYPAD */}
                        <div className="flex-1 flex items-center">
                            <div className="w-full grid grid-cols-3 grid-rows-4 gap-4">
                                {keypad.map((k) => (
                                    <button
                                        key={k}
                                        onClick={() => handleNumPadClick(k)}
                                        className="h-[72px] flex items-center justify-center rounded-xl text-3xl font-medium bg-white border border-gray-50 hover:bg-gray-100 hover:scale-[1.05] hover:shadow-md active:scale-[0.97] transition-all duration-200"
                                    >
                                        {k === "delete" ? "⌫" : k}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={onClose}
                                className="py-5 rounded-[20px] border text-xl font-semibold hover:bg-gray-50 hover:scale-[1.02] hover:shadow-md transition-all active:scale-[0.98]"
                            >
                                Batal
                            </button>

                            <button
                                onClick={handlePay}
                                disabled={(parseInt(cashAmount) || 0) < total}
                                className={`py-5 rounded-[20px] text-xl font-semibold transition-all active:scale-[0.98]
                                    ${(parseInt(cashAmount) || 0) >= total
                                        ? "bg-[#FE4E10] text-white hover:bg-[#e64610] hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/30"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                Bayar Sekarang
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
