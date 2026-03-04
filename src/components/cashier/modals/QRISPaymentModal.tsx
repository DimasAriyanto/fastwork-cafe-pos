import { useRef, useEffect } from "react";
import { X } from "lucide-react";

type QRISPaymentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    onPaymentConfirm: () => void;
};

export default function QRISPaymentModal({
    isOpen,
    onClose,
    total,
    onPaymentConfirm,
}: QRISPaymentModalProps) {
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div
                ref={modalRef}
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-[500px] overflow-hidden animate-scaleIn relative flex flex-col p-8"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-semibold text-[#1F2937]">Pembayaran</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                {/* Amount Card */}
                <div className="bg-[#F8F9FA] rounded-2xl p-6 mb-8 text-center">
                    <p className="text-gray-500 text-sm font-medium mb-1">Total Pembayaran</p>
                    <p className="text-[32px] font-bold text-[#1F2937]">
                        Rp {(total || 0).toLocaleString("id-ID")}
                    </p>
                </div>

                {/* QR Code Simulation */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-[180px] h-[180px] bg-white border-2 border-gray-100 rounded-2xl p-4 flex items-center justify-center mb-6 shadow-sm">
                        {/* Mock QRIS Icon/Pattern */}
                        <div className="relative w-full h-full flex items-center justify-center">
                            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="120" height="120" rx="12" fill="#FE4E10" fillOpacity="0.05" />
                                <path d="M30 30H50V50H30V30ZM30 70H50V90H30V70ZM70 30H90V50H70V30ZM75 75H85V85H75V75Z" fill="#FE4E10" />
                                <path d="M40 40H45V45H40V40ZM40 75H45V80H40V75ZM75 40H80V45H75V40Z" fill="#FE4E10" />
                                <rect x="55" y="55" width="10" height="10" fill="#FE4E10" />
                                <rect x="30" y="55" width="5" height="5" fill="#FE4E10" />
                                <rect x="55" y="30" width="5" height="5" fill="#FE4E10" />
                                <path d="M90 70V90H70V85H85V70H90Z" fill="#FE4E10" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 text-[#FE4E10] font-bold text-xs">
                                    QRIS
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-[#1F2937] mb-2">Pembayaran QRIS</h3>
                    <p className="text-gray-500 text-sm text-center px-4 mb-2">
                        Silahkan scan QRIS<br />menggunakan aplikasi pembayaran
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#FE4E10] rounded-full animate-pulse" />
                        <span className="text-[#FE4E10] text-sm font-medium">Menunggu konfirmasi ..</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onClose}
                        className="h-14 rounded-2xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all active:scale-[0.98]"
                    >
                        Kembali
                    </button>
                    <button
                        onClick={onPaymentConfirm}
                        className="h-14 rounded-2xl bg-[#FE4E10] text-white font-bold hover:bg-[#e64610] shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]"
                    >
                        Konfirmasi Pembayaran
                    </button>
                </div>
            </div>
        </div>
    );
}
