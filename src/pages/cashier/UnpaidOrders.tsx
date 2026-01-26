import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Search, SlidersHorizontal, Minus, Plus, Trash2, Edit } from "lucide-react";
import type { CashierContextType } from "../../layouts/CashierLayout";

export default function UnpaidOrders() {
    const { unpaidOrders, payUnpaidOrder } = useOutletContext<CashierContextType>();
    const [localSearch, setLocalSearch] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [paymentOption, setPaymentOption] = useState<"payNow" | "payLater">("payNow");

    // Filter orders
    const filteredOrders = useMemo(() => {
        return unpaidOrders.filter(o =>
            o.customerName.toLowerCase().includes(localSearch.toLowerCase()) ||
            o.id.toLowerCase().includes(localSearch.toLowerCase())
        );
    }, [unpaidOrders, localSearch]);

    const selectedOrder = useMemo(() =>
        unpaidOrders.find(o => o.id === selectedOrderId),
        [unpaidOrders, selectedOrderId]);

    // Handle local edits within the detail panel (if we were to implement full editing)
    // For now, we assume "Simpan" just persists what is there (or any future edits).
    // "Bayar" triggers payment.

    const handlePay = () => {
        if (selectedOrderId) {
            // For simplicity, defaulting to Cash here or opening a modal for payment method could be better. 
            // But prompt implies 'Bayar' button on the panel does the job. 
            // Since 'Bayar Sekarang' is selected in options, we proceed.
            if (confirm("Proses pembayaran?")) {
                payUnpaidOrder(selectedOrderId, "Cash"); // Default to Cash for now or add selector
                setSelectedOrderId(null);
            }
        }
    };

    const handleSave = () => {
        // Logic to save changes would go here if items were editable
        alert("Perubahan disimpan!");
        setSelectedOrderId(null);
    };



    return (
        <div className="flex h-full bg-gray-50 overflow-hidden">
            {/* LEFT CONTENT: Grid of Unpaid Orders */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden ${selectedOrderId ? 'w-2/3 pr-0' : 'w-full'} transition-all duration-300`}>
                <div className="p-6 pb-2">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Pesanan Belum Dibayar</h1>
                        <p className="text-gray-500 mt-1">Daftar transaksi hari ini dengan status, pembayaran, dan pelanggan</p>
                    </div>

                    <div className="flex gap-4 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Cari Order ID atau Nama Pelanggan"
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                            />
                        </div>
                        <button className="px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
                            <SlidersHorizontal size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 scroll-area">
                    {filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <p>Tidak ada pesanan belum dibayar</p>
                        </div>
                    ) : (
                        <div className={`grid gap-4 ${selectedOrderId ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                            {filteredOrders.map(order => (
                                <div key={order.id} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group h-full">
                                    <div>
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-lg">
                                                {order.customerName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800">{order.customerName}</h3>
                                                <p className="text-xs text-gray-500">Order {order.id}</p>
                                            </div>
                                        </div>
                                        <div className="mb-4 text-xs text-gray-500">
                                            {new Date(order.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} - {order.serviceType}
                                            <div className="float-right">{new Date(order.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-gray-400 border-b pb-1 mb-2">
                                                <span>Nama</span>
                                                <div className="flex gap-4">
                                                    <span>Jumlah</span>
                                                    <span>Harga</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                {order.items.slice(0, 3).map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-800 font-medium truncate w-32">{item.name}</span>
                                                        <div className="flex gap-6 text-right">
                                                            <span className="w-4">{item.qty}</span>
                                                            <span className="w-20">Rp{item.price.toLocaleString('id-ID')}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {order.items.length > 3 && (
                                                    <p className="text-xs text-center text-gray-500 mt-1">+{order.items.length - 3} item lainnya</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-4 pt-3 border-t border-gray-100">
                                            <span className="font-bold text-gray-700">Total</span>
                                            <span className="font-bold text-gray-900 text-lg">Rp{order.totalPrice.toLocaleString('id-ID')}</span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedOrderId(order.id)}
                                            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all transform active:scale-95 shadow-md hover:shadow-lg"
                                        >
                                            Lihat Detail
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT CONTENT: Detail Panel */}
            {selectedOrderId && selectedOrder && (
                <div className="w-[400px] bg-white border-l border-gray-200 h-full flex flex-col animate-slideInRight z-10 transition-transform duration-300">
                    <div className="p-6 flex-1 overflow-y-auto scroll-area">
                        <div className="flex justify-between items-start mb-6">
                            <div className="text-center w-full">
                                <h2 className="font-bold text-lg text-gray-900">{selectedOrder.customerName}</h2>
                                <p className="text-gray-500 text-sm">{selectedOrder.id}</p>
                            </div>
                            <button className="absolute right-6 top-6 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-gray-400">
                                <Edit size={16} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="w-full border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                                <span className="text-sm text-gray-600">Makan di tempat</span>
                                {/* Would be a dropdown in full version */}
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            {selectedOrder.items.map((item, idx) => (
                                <div key={idx} className="flex gap-3">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                        {/* Placeholder image or mapped if available in item (TransactionItem might need image prop or we map from name) */}
                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Img</div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-sm text-gray-800">{item.name}</h4>
                                            <button className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
                                        </div>
                                        {item.variant && <p className="text-xs text-gray-500 mb-1">Rasa: {item.variant}</p>}
                                        <div className="flex justify-between items-end mt-2">
                                            <span className="text-xs font-medium text-gray-500">Rp{item.price.toLocaleString('id-ID')}</span>
                                            <div className="flex items-center gap-3">
                                                <button className="p-1 border rounded text-gray-400 hover:bg-gray-50"><Edit size={12} /></button>
                                                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-0.5">
                                                    <button className="text-gray-400 hover:text-orange-500"><Minus size={12} /></button>
                                                    <span className="text-sm font-medium w-4 text-center">{item.qty}</span>
                                                    <button className="text-gray-400 hover:text-orange-500"><Plus size={12} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full py-3 border-2 border-dashed border-orange-300 text-orange-500 rounded-xl font-medium mb-8 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2">
                            Tambahkan Menu <Plus size={16} />
                        </button>

                        {/* Summary */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500">Sub Total</span>
                                <span className="font-medium">Rp{selectedOrder.subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-4">
                                <span className="text-gray-500">Pajak (11%)</span>
                                <span className="font-medium">Rp{selectedOrder.tax.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                                <span>Total</span>
                                <span>Rp{selectedOrder.totalPrice.toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        {/* Payment Options */}
                        <div className="mb-4">
                            <h4 className="font-bold text-sm text-gray-800 mb-3">Opsi Pembayaran</h4>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button
                                    className={`py-3 rounded-lg border text-sm font-medium ${paymentOption === 'payLater' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-500'}`}
                                >
                                    Bayar Nanti
                                </button>
                                <button
                                    className={`py-3 rounded-lg border text-sm font-medium ${paymentOption === 'payNow' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-500'}`}
                                    onClick={() => setPaymentOption('payNow')}
                                >
                                    Bayar Sekarang
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Buttons */}
                    <div className="p-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                        <button
                            onClick={handleSave}
                            className="py-3 px-4 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            Simpan
                        </button>
                        <button
                            onClick={handlePay}
                            className="py-3 px-4 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all transform active:scale-95"
                        >
                            Bayar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
