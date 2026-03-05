import { useState } from "react";
import OrderTypeSelector from "./OrderTypeSelector";
import CartItem from "./CartItem";
import type { CartItem as CartItemType, PaymentMethod } from "../../types/cashier";

type CartPanelProps = {
    cart: CartItemType[];
    customer: string;
    setCustomer: (name: string) => void;
    dineType: "dinein" | "takeaway";
    setDineType: (type: "dinein" | "takeaway") => void;
    onUpdateQuantity: (index: number, delta: number) => void;
    onRemoveItem: (index: number) => void;
    onEditItem: (item: CartItemType, index: number) => void;
    onCheckout: (payType: "payNow" | "payLater", method?: PaymentMethod) => void;
    subtotal: number;
    tax: number;
    total: number;
    taxRate?: number;
    taxDetails?: { name: string; amount: number; percentage: number }[];
    appliedDiscount: { code: string; percentage: number; minSpend: number } | null;
    removeDiscount: () => void;
    manualDiscount: { type: 'fixed' | 'percentage'; value: number } | null;
    onSetManualDiscount: (discount: { type: 'fixed' | 'percentage'; value: number } | null) => void;
};

export default function CartPanel({
    cart,
    customer,
    setCustomer,
    dineType,
    setDineType,
    onUpdateQuantity,
    onRemoveItem,
    onEditItem,
    subtotal,
    tax,
    taxDetails,
    total,
    taxRate = 0.1,
    appliedDiscount,
    removeDiscount,
    manualDiscount,
    onSetManualDiscount,
    onCheckout,
}: CartPanelProps) {
    const [payType, setPayType] = useState<"payNow" | "payLater">("payNow");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [manualDiscountType, setManualDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [manualDiscountValue, setManualDiscountValue] = useState("");

    const handleApplyManualDiscount = () => {
        const val = parseFloat(manualDiscountValue);
        if (isNaN(val) || val <= 0) {
            onSetManualDiscount(null);
            return;
        }
        onSetManualDiscount({ type: manualDiscountType, value: val });
    };

    const handleRemoveManualDiscount = () => {
        setManualDiscountValue("");
        onSetManualDiscount(null);
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            alert("Keranjang kosong!");
            return;
        }
        if (payType === "payNow" && !paymentMethod) {
            alert("Pilih metode pembayaran!");
            return;
        }
        onCheckout(payType, paymentMethod || undefined);
    };

    return (
        <div className="w-full bg-white flex flex-col h-full">
            <div className="flex-1 overflow-y-auto hide-scrollbar">
                <div className="p-6">

                    {/* Customer Info */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Pelanggan</label>
                        <input
                            type="text"
                            value={customer}
                            onChange={(e) => setCustomer(e.target.value)}
                            placeholder="Nama pelanggan..."
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all font-medium"
                        />
                    </div>

                    <OrderTypeSelector orderType={dineType} setOrderType={setDineType} />

                    {/* Cart Items */}
                    <div className="mb-8">
                        <h3 className="font-semibold text-gray-800 text-lg mb-4">Pesanan</h3>
                        <div className="space-y-4">
                            {cart.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>Belum ada pesanan</p>
                                    <p className="text-sm mt-1">Klik produk untuk menambahkan ke keranjang</p>
                                </div>
                            ) : (
                                cart.map((item, index) => (
                                    <CartItem
                                        key={`${item.id}-${item.selectedVariant || index}`}
                                        item={item}
                                        index={index}
                                        onUpdateQuantity={onUpdateQuantity}
                                        onRemove={onRemoveItem}
                                        onEdit={onEditItem}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Order Summary - ONLY VISIBLE IF CART NOT EMPTY */}
                    {cart.length > 0 && (
                        <div className="mt-8">
                            {/* Summary Section */}
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-center text-gray-400">
                                    <span className="text-base">Sub Total</span>
                                    <span className="text-base">
                                        Rp{subtotal.toLocaleString("id-ID")}
                                    </span>
                                </div>
                                {appliedDiscount && appliedDiscount.percentage > 0 && subtotal >= appliedDiscount.minSpend && (
                                    <div className="flex justify-between items-center text-orange-500 italic">
                                        <span className="text-base">Potongan ({appliedDiscount.percentage}%)</span>
                                        <span className="text-base">
                                            - Rp{((subtotal * appliedDiscount.percentage) / 100).toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                )}
                                {manualDiscount && (
                                    <div className="flex justify-between items-center text-orange-600 italic">
                                        <span className="text-base">
                                            Diskon ({manualDiscount.type === 'percentage' ? `${manualDiscount.value}%` : `Rp${manualDiscount.value.toLocaleString("id-ID")}`})
                                        </span>
                                        <span className="text-base">
                                            - Rp{(manualDiscount.type === 'percentage' 
                                                ? Math.round(subtotal * (manualDiscount.value / 100)) 
                                                : manualDiscount.value
                                            ).toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                )}
                                {taxDetails && taxDetails.length > 0 ? (
                                    taxDetails.map((t, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-gray-400">
                                            <span className="text-base">{t.name} ({t.percentage}%)</span>
                                            <span className="text-base">
                                                Rp{t.amount.toLocaleString("id-ID")}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex justify-between items-center text-gray-400">
                                        <span className="text-base">Pajak ({(taxRate * 100).toFixed(0)}%)</span>
                                        <span className="text-base">
                                            Rp{tax.toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-lg font-bold text-gray-800">Total</span>
                                    <span className="text-lg font-bold text-gray-800">
                                        Rp{total.toLocaleString("id-ID")}
                                    </span>
                                </div>
                            </div>

                            <hr className="border-gray-200 mb-6" />

                            <div className="flex flex-col gap-2 mb-8">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-gray-800">Diskon</span>
                                    {(appliedDiscount || manualDiscount) && (
                                        <button 
                                            onClick={() => {
                                                removeDiscount();
                                                handleRemoveManualDiscount();
                                            }}
                                            className="text-sm text-red-500 hover:underline"
                                        >
                                            Hapus Semua
                                        </button>
                                    )}
                                </div>

                                {/* Manual Discount Input */}
                                <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Diskon</span>
                                        <div className="flex bg-gray-200 rounded-lg p-0.5">
                                            <button
                                                onClick={() => setManualDiscountType('fixed')}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${manualDiscountType === 'fixed' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}
                                            >
                                                Rp
                                            </button>
                                            <button
                                                onClick={() => setManualDiscountType('percentage')}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${manualDiscountType === 'percentage' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}
                                            >
                                                %
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                placeholder={manualDiscountType === 'fixed' ? "0" : "0"}
                                                value={manualDiscountValue}
                                                onChange={(e) => setManualDiscountValue(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 bg-white text-gray-700 h-[48px] pr-10"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                                                {manualDiscountType === 'fixed' ? 'Rp' : '%'}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={handleApplyManualDiscount}
                                            className="h-[48px] px-4 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-all active:scale-95"
                                        >
                                            Ok
                                        </button>
                                    </div>
                                </div>

                            </div>

                            {/* Payment Options */}
                            <div className="mb-8">
                                <h3 className="font-bold text-[#1F2937] text-lg mb-4">Opsi Pembayaran</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setPayType("payLater")}
                                        className={`h-14 rounded-2xl flex items-center justify-center font-medium border transition-all duration-200 ${payType === "payLater"
                                            ? "bg-white border-[#FE4E10] text-[#1F2937]"
                                            : "bg-white border-gray-200 text-[#1F2937]"
                                            }`}
                                    >
                                        Bayar Nanti
                                    </button>

                                    <button
                                        onClick={() => setPayType("payNow")}
                                        className={`h-14 rounded-2xl flex items-center justify-center font-medium border transition-all duration-200 ${payType === "payNow"
                                            ? "bg-white border-[#FE4E10] text-[#1F2937]"
                                            : "bg-white border-gray-200 text-[#1F2937]"
                                            }`}
                                    >
                                        Bayar Sekarang
                                    </button>
                                </div>
                            </div>

                            {/* Payment Method */}
                            {payType === "payNow" && (
                                <div className="mb-8">
                                    <h3 className="font-bold text-[#1F2937] text-lg mb-4">
                                        Metode Pembayaran
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* CASH */}
                                        <div className="flex flex-col items-center gap-2">
                                            <button
                                                onClick={() => setPaymentMethod("CASH")}
                                                className={`w-full h-14 rounded-2xl flex items-center justify-center border transition-all duration-200 ${paymentMethod === "CASH"
                                                    ? "border-[#FE4E10] bg-white"
                                                    : "border-gray-200 bg-white"
                                                    }`}
                                            >
                                                <svg width="38" height="20" viewBox="0 0 38 20" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M37.767 4.54042C37.767 4.54042 34.0025 1.66805 29.6481 1.32605C25.2937 0.984039 15.9703 3.15752 12.6295 2.20833C9.2912 1.25913 6.11152 -0.00976562 6.11152 -0.00976562L0 16.2876C0 16.2876 7.75465 18.4363 11.1673 18.3521C15.9182 18.2381 21.8166 15.5664 25.0211 16.2182C28.8253 16.994 35.8116 19.9902 35.8116 19.9902L37.767 4.54042Z" fill="#BDE377" /> <path d="M36.7312 5.12006C36.7312 5.12006 32.9592 2.99862 28.9344 2.69627C24.9096 2.39639 16.3123 4.10147 13.2194 3.31585C10.1264 2.52774 7.17973 1.48438 7.17973 1.48438L1.89844 15.1969C1.89844 15.1969 6.53289 16.726 11.1525 17.073C14.8848 17.3505 22.0124 14.5724 24.9988 15.0358C27.9852 15.4992 34.7535 17.98 34.7535 17.98L36.7312 5.12006Z" fill="#6BA638" /> <path d="M25.128 13.9106C28.5952 14.2749 33.9186 16.5079 33.9186 16.5079L35.6856 5.91311C35.6856 5.91311 33.0983 4.15599 28.7017 3.64793C24.8851 3.20679 16.2333 4.94657 13.2817 4.27742C10.33 3.61076 7.51462 2.73096 7.51462 2.73096L3.68066 14.2997C3.68066 14.2997 7.242 15.5538 11.2792 15.9949C15.9136 16.503 22.2655 13.6083 25.128 13.9106Z" fill="#BDE377" /> <path d="M21.2389 3.77932C23.7123 3.45466 25.1794 4.65664 24.8424 8.23533C24.4533 12.3518 22.084 14.9937 20.3517 15.1548C18.6218 15.3184 14.9093 15.4819 15.3529 10.5327C15.6503 7.24152 17.9948 3.96519 19.2042 3.82888C20.4112 3.6901 21.2389 3.77932 21.2389 3.77932Z" fill="#6BA638" /> <path d="M19.026 13.556L20.0694 13.561L20.1214 12.934C21.5886 12.872 22.5675 12.3516 22.7162 10.9513C22.917 9.06781 21.373 8.83237 20.6072 8.46558C19.8414 8.09878 19.2986 7.97239 19.3779 7.43707C19.4548 6.90424 19.7596 6.59445 20.5353 6.58206C21.886 6.56223 21.6877 7.40981 21.6877 7.40981L22.9888 7.42716C22.9888 7.42716 23.2615 5.46434 21.0954 5.27103L21.1475 4.68862L20.2776 4.67871L20.1437 5.29581C18.8897 5.47177 18.2131 6.21527 18.0471 7.00337C17.6629 8.82493 19.0409 9.2512 19.7992 9.50399C20.7063 9.80882 21.2962 10.1087 21.2491 10.6614C21.1871 11.39 20.6667 11.7072 19.7571 11.6056C18.4436 11.4544 18.6691 10.24 18.6691 10.24L17.4473 10.2054C17.4473 10.2054 16.798 12.6614 19.1301 12.9117L19.026 13.556Z" fill="#BDE377" /> <path d="M30.3048 11.0355C29.7745 10.8793 29.4894 10.3217 29.6728 9.79385C29.8538 9.26349 30.4312 8.96113 30.964 9.11727C31.4944 9.2734 31.7794 9.82854 31.596 10.3589C31.4151 10.8893 30.8377 11.1916 30.3048 11.0355Z" fill="#6BA638" /> <path d="M8.63685 9.94808C8.10649 9.79195 7.82148 9.23433 8.00488 8.70644C8.18579 8.17609 8.76324 7.87373 9.29608 8.02986C9.82644 8.186 10.109 8.74114 9.92805 9.2715C9.74713 9.80186 9.16721 10.1042 8.63685 9.94808Z" fill="#6BA638" /> </svg>
                                            </button>
                                            <span className="text-gray-500 font-medium">Cash</span>
                                        </div>

                                        {/* QRIS */}
                                        <div className="flex flex-col items-center gap-2">
                                            <button
                                                onClick={() => setPaymentMethod("QRIS")}
                                                className={`w-full h-14 rounded-2xl flex items-center justify-center border transition-all duration-200 ${paymentMethod === "QRIS"
                                                    ? "border-[#FE4E10] bg-white"
                                                    : "border-gray-200 bg-white"
                                                    }`}
                                            >
                                                <svg viewBox="0 0 80 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[20px] w-auto" > <path d="M76.7227 10.4773H64.024V7.936H76.7227V2.856H56.4053V15.5547H69.104V18.096H56.4053V23.176H76.7227V10.4773Z" fill="black" /> <path d="M53.8667 2.856H48.7867V23.1733H53.8667V2.856Z" fill="black" /> <path d="M25.9307 2.856V7.936H41.168V10.4773H25.9307V23.176H31.008V15.632L38.6293 23.176H46.248L38.2987 15.5547H46.248V2.856H25.9307Z" fill="black" /> <path d="M10.6907 15.5547H15.7573V10.488H10.6907V15.5547ZM11.9627 11.7467H14.5013V14.2853H11.9627V11.7467Z" fill="black" /> <path d="M8.152 2.856H3.70667C3.53867 2.85728 3.37786 2.92428 3.25867 3.04267C3.19937 3.10176 3.15234 3.172 3.12031 3.24935C3.08827 3.3267 3.07185 3.40962 3.072 3.49333V22.5387C3.07185 22.6224 3.08827 22.7053 3.12031 22.7827C3.15234 22.86 3.19937 22.9302 3.25867 22.9893C3.37813 23.107 3.539 23.1731 3.70667 23.1733H15.7707V18.1067H8.152V2.856Z" fill="black" /> <path d="M22.7547 2.856H10.6907V7.936H18.312V15.5547H23.3787V3.49333C23.3802 3.32555 23.3161 3.16381 23.2 3.04267C23.081 2.92563 22.9216 2.8588 22.7547 2.856Z" fill="black" /> <path d="M23.392 18.096H18.312V29.5253H23.392V18.096Z" fill="black" /> <path d="M10.16 0H0.634667C0.466559 0.000701921 0.305536 0.0677938 0.186665 0.186665C0.0677938 0.305536 0.000701921 0.466559 0 0.634667V10.16H1.26933V1.89333C1.27281 1.72708 1.34113 1.56878 1.4597 1.4522C1.57827 1.33562 1.73772 1.26999 1.904 1.26933H10.1707L10.16 0Z" fill="black" /> <path d="M78.7307 16.5067V24.7733C78.73 24.9414 78.6629 25.1025 78.544 25.2213C78.4251 25.3402 78.2641 25.4073 78.096 25.408H69.8293V26.6667H79.3547C79.4388 26.6677 79.5223 26.6521 79.6004 26.6207C79.6785 26.5893 79.7496 26.5428 79.8096 26.4838C79.8696 26.4248 79.9173 26.3545 79.95 26.2769C79.9826 26.1994 79.9997 26.1161 80 26.032V16.5067H78.7307Z" fill="black" /> </svg>
                                            </button>
                                            <span className="text-gray-500 font-medium">Qris</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Order Button */}
                            <button
                                onClick={handleCheckout}
                                className="w-full h-14 bg-[#FE4E10] text-white rounded-2xl font-semibold text-lg flex items-center justify-center hover:bg-[#e0440e] transition-all duration-200 active:scale-[0.98] mt-4"
                            >
                                Pesan
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
