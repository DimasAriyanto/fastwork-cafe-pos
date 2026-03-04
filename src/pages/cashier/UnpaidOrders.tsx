import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useOutletContext } from "react-router-dom";
import { Search, Minus, Plus, Trash2, ClipboardList, Check, ShoppingBag } from "lucide-react";
import DateFilter from "../../components/cashier/DateFilter";
import type { CashierContextType } from "../../layouts/CashierLayout";
import PaymentModal from "../../components/cashier/modals/PaymentModal";
import QRISPaymentModal from "../../components/cashier/modals/QRISPaymentModal";
import PaymentSuccessModal from "../../components/cashier/modals/PaymentSuccessModal";
import AddMenuModal from "../../components/cashier/modals/AddMenuModal";
import type { Product, PaymentMethod, Transaction, UnpaidOrder } from "../../types/cashier";
import { apiClient } from "../../api/client";

// Hooks
import { usePayment } from "../../hooks/usePayment";
import { usePortalTarget } from "../../hooks/usePortalTarget";
import { useResponsive } from "../../hooks/useResponsive";


export default function UnpaidOrders() {
    const { unpaidOrders, payUnpaidOrder, updateUnpaidOrder, setIsRightPanelOpen, refreshData } = useOutletContext<CashierContextType>();
    const { isDesktop } = useResponsive();
    const [localSearch, setLocalSearch] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [fetchedDetails, setFetchedDetails] = useState<Record<string, UnpaidOrder>>({});
    const [paymentOption, setPaymentOption] = useState<PaymentMethod>("CASH");
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

    // Edit Name State
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempCustomerName, setTempCustomerName] = useState("");

    // Modal states using shared hook
    const {
        isPaymentModalOpen, openPaymentModal, closePaymentModal,
        isQRISModalOpen, openQRISModal, closeQRISModal,
        isSuccessModalOpen, openSuccessModal, closeSuccessModal,
        lastTransaction
    } = usePayment();

    // Manual Discount State for Sidebar
    const [manualDiscountType, setManualDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [manualDiscountValue, setManualDiscountValue] = useState("");


    // Filter orders
    const filteredOrders = useMemo(() => {
        return unpaidOrders.filter(o => {
            const matchesSearch = o.customerName.toLowerCase().includes(localSearch.toLowerCase()) ||
                o.id.toLowerCase().includes(localSearch.toLowerCase());

            let matchDate = true;
            if (dateRange.start && dateRange.end) {
                const orderDate = new Date(o.date);
                orderDate.setHours(orderDate.getHours() - 7); // Kompensasi shift agar filter match dengan tampilan

                const startDate = new Date(dateRange.start);
                const endDate = new Date(dateRange.end);

                // Set hours to compare strictly by date
                orderDate.setHours(0, 0, 0, 0);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(0, 0, 0, 0);

                matchDate = orderDate >= startDate && orderDate <= endDate;
            } else if (dateRange.start) {
                const orderDate = new Date(o.date);
                orderDate.setHours(orderDate.getHours() - 7); // Kompensasi shift

                const startDate = new Date(dateRange.start);
                orderDate.setHours(0, 0, 0, 0);
                startDate.setHours(0, 0, 0, 0);
                matchDate = orderDate >= startDate;
            }

            return matchesSearch && matchDate;
        });
    }, [unpaidOrders, localSearch, dateRange]);

    const selectedOrder = useMemo(() => {
        if (!selectedOrderId) return null;
        return fetchedDetails[selectedOrderId] || unpaidOrders.find(o => o.id === selectedOrderId);
    }, [unpaidOrders, selectedOrderId, fetchedDetails]);

    // Selection handler for responsiveness
    const handleOrderSelect = async (id: string) => {
        setSelectedOrderId(id);
        if (!isDesktop) {
            setIsRightPanelOpen(true);
        }

        if (!fetchedDetails[id]) {
            try {
                const detail = await apiClient.getTransactionDetail(Number(id));
                
                // Calculate manual discount object if exists in detail
                const manualDiscount = detail.manualDiscountType 
                    ? { type: detail.manualDiscountType as 'fixed' | 'percentage', value: detail.manualDiscountValue || 0 }
                    : null;
                
                setFetchedDetails(prev => ({
                    ...prev,
                    [id]: {
                        ...detail,
                        id: String(detail.id),
                        date: detail.createdAt,
                        tax: detail.taxAmount,
                        customerName: detail.customerName || detail.notes || "Pelanggan",
                        status: "unpaid",
                        manualDiscount: manualDiscount,
                        discountAmount: detail.discountAmount || 0,
                        items: (detail.items || []).map((item: any) => ({
                            menuId: item.menuId,
                            variantId: item.variantId,
                            name: item.name, 
                            qty: item.qty,
                            price: item.finalPrice || item.price,            
                            basePrice: item.originalPrice, 
                            variant: item.variantName,
                            toppings: (item.toppings || []).map((t: any) => ({
                                name: t.name,
                                price: t.price,
                                toppingId: t.toppingId
                            }))
                        }))
                    } as UnpaidOrder
                }));

                // Initialize sidebar input state from fetched detail
                if (detail.manualDiscountType) {
                    setManualDiscountType(detail.manualDiscountType as 'fixed' | 'percentage');
                    setManualDiscountValue(String(detail.manualDiscountValue || ""));
                } else {
                    setManualDiscountType('fixed');
                    setManualDiscountValue("");
                }
            } catch (err) {
                console.error("Gagal memuat detail pesanan:", id, err);
            }
        }
    };

    const handleApplyManualDiscount = () => {
        if (!selectedOrderId) return;
        const val = parseFloat(manualDiscountValue);
        
        setFetchedDetails(prev => {
            const current = prev[selectedOrderId];
            if (!current) return prev;
            
            const manualDiscount = (isNaN(val) || val <= 0) ? null : { type: manualDiscountType, value: val };
            
            // Recalculate totalPrice
            const subtotal = current.subtotal || 0;
            const discountAmount = manualDiscount ? (manualDiscount.type === 'percentage' ? Math.round(subtotal * (manualDiscount.value / 100)) : manualDiscount.value) : 0;
            const totalAfterDiscount = subtotal - discountAmount;
            const taxAmount = (current.taxDetails || []).reduce((sum, t) => sum + Math.round(totalAfterDiscount * (t.percentage / 100)), 0);
            
            return {
                ...prev,
                [selectedOrderId]: {
                    ...current,
                    manualDiscount,
                    discountAmount,
                    totalPrice: totalAfterDiscount + taxAmount
                }
            };
        });
    };

    const handleRemoveManualDiscount = () => {
        if (!selectedOrderId) return;
        setManualDiscountValue("");
        setFetchedDetails(prev => {
            const current = prev[selectedOrderId];
            if (!current) return prev;
            
            const subtotal = current.subtotal || 0;
            const taxAmount = (current.taxDetails || []).reduce((sum, t) => sum + Math.round(subtotal * (t.percentage / 100)), 0);
            
            return {
                ...prev,
                [selectedOrderId]: {
                    ...current,
                    manualDiscount: null,
                    discountAmount: 0,
                    totalPrice: subtotal + taxAmount
                }
            };
        });
    };

    // Reset edit state when selection changes
    useEffect(() => {
        setIsEditingName(false);
        if (selectedOrder) {
            setTempCustomerName(selectedOrder.customerName);
            if (selectedOrder.paymentMethod) {
                setPaymentOption(selectedOrder.paymentMethod);
            }
        }
    }, [selectedOrder]);

    // Handle local edits within the detail panel (if we were to implement full editing)
    // For now, we assume "Simpan" just persists what is there (or any future edits).
    // "Bayar" triggers payment.

    const handleSave = async (silent = false) => {
        if (!selectedOrder) return;
        
        try {
            const payload = {
                customerName: selectedOrder.customerName,
                orderType: selectedOrder.serviceType === 'Take Away' ? 'take_away' : 'dine_in',
                items: selectedOrder.items.map(item => ({
                    menuId: item.menuId,
                    variantId: item.variantId,
                    qty: item.qty,
                    // Use basePrice as the price to send to backend (base only).
                    // Backend will add topping prices from the toppings array.
                    price: item.basePrice ?? item.price,
                    toppings: (item.toppings || []).map(t => ({
                        toppingId: t.toppingId,
                        price: t.price
                    }))
                })),
                manualDiscountType: selectedOrder.manualDiscount?.type || undefined,
                manualDiscountValue: selectedOrder.manualDiscount?.value || 0,
                discountAmount: selectedOrder.discountAmount || 0
            };

            await apiClient.updateTransaction(Number(selectedOrder.id), payload);
            setIsEditingName(false);
            // Refresh local state by re-fetching details to ensure consistency
            const freshDetail = await apiClient.getTransactionDetail(Number(selectedOrder.id));
            
            // Calculate manual discount object if exists in detail
            const manualDiscount = freshDetail.manualDiscountType 
                ? { type: freshDetail.manualDiscountType as 'fixed' | 'percentage', value: freshDetail.manualDiscountValue || 0 }
                : null;
                
            setFetchedDetails(prev => ({
                ...prev,
                [selectedOrder.id]: {
                    ...freshDetail,
                    id: String(freshDetail.id),
                    date: freshDetail.createdAt,
                    tax: freshDetail.taxAmount,
                    customerName: freshDetail.customerName || freshDetail.notes || "Pelanggan",
                    status: "unpaid",
                    manualDiscount: manualDiscount,
                    discountAmount: freshDetail.discountAmount || 0,
                    items: (freshDetail.items || []).map((i: any) => ({
                        menuId: i.menuId,
                        variantId: i.variantId,
                        name: i.name,
                        qty: i.qty,
                        price: i.price,            
                        basePrice: i.originalPrice, 
                        variant: i.variantName,
                        toppings: (i.toppings || []).map((t: any) => ({
                            name: t.name,
                            price: t.price,
                            toppingId: t.toppingId
                        }))
                    }))
                } as UnpaidOrder
            }));
            
            if (!silent) {
                alert("Perubahan disimpan!");
            }
        } catch (err: any) {
            alert(err.message || "Gagal menyimpan perubahan");
        }
    };

    const handleCancelOrder = async () => {
        if (!selectedOrder) return;
        
        if (!confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) return;

        try {
            await apiClient.deleteTransaction(Number(selectedOrder.id));
            alert("Pesanan berhasil dibatalkan!");
            
            // Refresh from context
            refreshData();
            
            // Reset selection
            setSelectedOrderId(null);
            setIsRightPanelOpen(false);
        } catch (err: any) {
            alert(err.message || "Gagal membatalkan pesanan");
        }
    };

    const handlePay = async () => {
        if (!selectedOrder) return;

        // Sync any changes before payment
        try {
            await handleSave(true);
            
            if (paymentOption === "CASH") {
                openPaymentModal();
            } else if (paymentOption === "QRIS") {
                openQRISModal();
            }
        } catch (err) {
            // Error already handled in handleSave
        }
    };

    const handlePaymentSuccess = (paidAmount: number, change: number, method: PaymentMethod) => {
        if (!selectedOrder) return;

        const transaction: Transaction = {
            ...selectedOrder,
            paymentMethod: method,
            paidAmount,
            change: method === "QRIS" ? 0 : change,
            date: new Date().toISOString()
        };


        payUnpaidOrder(selectedOrder.id, method, paidAmount, change);
        openSuccessModal(transaction);
        closePaymentModal();
        closeQRISModal();
        setSelectedOrderId(null);
        setIsRightPanelOpen(false); // Close drawer
    };


    const handleQRISPaymentConfirm = () => {
        if (!selectedOrder) return;
        handlePaymentSuccess(selectedOrder.totalPrice, 0, "QRIS");
    };

    const handleSaveName = () => {
        if (!selectedOrder || !tempCustomerName.trim()) return;

        const updatedOrder: UnpaidOrder = {
            ...selectedOrder,
            customerName: tempCustomerName.trim()
        };

        updateUnpaidOrder(updatedOrder);
        setIsEditingName(false);
    };

    const handleAddProduct = (product: Product) => {
        if (!selectedOrder) return;

        // More precise match including menuId (and potentially variantId if we support it in AddMenuModal)
        const existingItemIndex = selectedOrder.items.findIndex(item => 
            item.menuId === product.id && !item.variantId
        );
        let updatedItems = [...selectedOrder.items];

        if (existingItemIndex > -1) {
            updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                qty: updatedItems[existingItemIndex].qty + 1
            };
        } else {
            updatedItems.push({
                menuId: product.id,
                variantId: undefined,
                name: product.name,
                price: product.price,
                basePrice: product.price, // same as unit price since no toppings yet
                qty: 1
            });
        }

        const newSubtotal = updatedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        
        // 1. Promo Discount (Percentage)
        const promoDiscountPercent = selectedOrder.discount || 0;
        const promoDiscountAmount = newSubtotal * (promoDiscountPercent / 100);
        
        // 2. Manual Discount
        const manualDiscount = selectedOrder.manualDiscount;
        const manualDiscountAmount = manualDiscount 
            ? (manualDiscount.type === 'percentage' ? Math.round(newSubtotal * (manualDiscount.value / 100)) : manualDiscount.value) 
            : 0;
            
        const totalDiscount = Math.min(newSubtotal, promoDiscountAmount + manualDiscountAmount);
        const totalAfterDiscount = newSubtotal - totalDiscount;
        const newTax = totalAfterDiscount * 0.10;
        const newTotal = totalAfterDiscount + newTax;

        const updatedOrder: UnpaidOrder = {
            ...selectedOrder,
            items: updatedItems,
            totalItems: updatedItems.reduce((acc, item) => acc + item.qty, 0),
            subtotal: newSubtotal,
            discountAmount: totalDiscount,
            tax: newTax,
            totalPrice: newTotal
        };

        updateUnpaidOrder(updatedOrder);
        // We keep the modal open so user can add multiple items
    };

    const handleUpdateQty = (menuId: number | undefined, variantId: number | undefined, delta: number) => {
        if (!selectedOrder || !menuId) return;

        const updatedItems = selectedOrder.items.map(item => {
            const isMenuMatch = item.menuId === menuId;
            const isVariantMatch = item.variantId === variantId;
            
            if (isMenuMatch && isVariantMatch) {
                const newQty = Math.max(0, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }).filter(item => item.qty > 0);

        const newSubtotal = updatedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        
        // 1. Promo Discount (Percentage)
        const promoDiscountPercent = selectedOrder.discount || 0;
        const promoDiscountAmount = newSubtotal * (promoDiscountPercent / 100);
        
        // 2. Manual Discount
        const manualDiscount = selectedOrder.manualDiscount;
        const manualDiscountAmount = manualDiscount 
            ? (manualDiscount.type === 'percentage' ? Math.round(newSubtotal * (manualDiscount.value / 100)) : manualDiscount.value) 
            : 0;
            
        const totalDiscount = Math.min(newSubtotal, promoDiscountAmount + manualDiscountAmount);
        const totalAfterDiscount = newSubtotal - totalDiscount;
        const newTax = totalAfterDiscount * 0.10;
        const newTotal = totalAfterDiscount + newTax;

        const updatedOrder: UnpaidOrder = {
            ...selectedOrder,
            items: updatedItems,
            totalItems: updatedItems.reduce((acc, item) => acc + item.qty, 0),
            subtotal: newSubtotal,
            discountAmount: totalDiscount,
            tax: newTax,
            totalPrice: newTotal
        };

        updateUnpaidOrder(updatedOrder);
    };

    const handleDeleteItem = (menuId: number | undefined, variantId: number | undefined) => {
        if (!selectedOrder || !menuId) return;

        const updatedItems = selectedOrder.items.filter(item => {
            const isMenuMatch = item.menuId === menuId;
            const isVariantMatch = item.variantId === variantId;
            return !(isMenuMatch && isVariantMatch);
        });

        const newSubtotal = updatedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        
        // 1. Promo Discount (Percentage)
        const promoDiscountPercent = selectedOrder.discount || 0;
        const promoDiscountAmount = newSubtotal * (promoDiscountPercent / 100);
        
        // 2. Manual Discount
        const manualDiscount = selectedOrder.manualDiscount;
        const manualDiscountAmount = manualDiscount 
            ? (manualDiscount.type === 'percentage' ? Math.round(newSubtotal * (manualDiscount.value / 100)) : manualDiscount.value) 
            : 0;
            
        const totalDiscount = Math.min(newSubtotal, promoDiscountAmount + manualDiscountAmount);
        const totalAfterDiscount = newSubtotal - totalDiscount;
        const newTax = totalAfterDiscount * 0.10;
        const newTotal = totalAfterDiscount + newTax;

        const updatedOrder: UnpaidOrder = {
            ...selectedOrder,
            items: updatedItems,
            totalItems: updatedItems.reduce((acc, item) => acc + item.qty, 0),
            subtotal: newSubtotal,
            discountAmount: totalDiscount,
            tax: newTax,
            totalPrice: newTotal
        };

        updateUnpaidOrder(updatedOrder);
    };


    // Portal Target
    const rightPanelTarget = usePortalTarget("cashier-right-panel-slot");

    return (
        <>
            {/* LEFT CONTENT: Grid of Unpaid Orders */}
            {/* This div now sits DIRECTLY in the Left Column of CashierLayout */}
            <div className="flex flex-col h-full bg-gray-50 overflow-hidden w-full">
                <div className="px-6 py-5 border-b border-transparent">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Pesanan Belum Dibayar</h1>
                            <p className="text-sm text-gray-500 mt-1">Daftar transaksi hari ini dengan status dan pembayaran</p>
                        </div>

                        <div className="flex items-center gap-3 w-full xl:w-auto">
                            <div className="relative group w-full xl:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cari Order ID..."
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                                />
                            </div>
                            <DateFilter onFilterChange={setDateRange} />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-24 scroll-area hide-scrollbar">
                    {filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <p>Tidak ada pesanan belum dibayar</p>
                        </div>
                    ) : (
                        // Grid Layout: 3 columns on LG because we have more space now (65% of screen)
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                            {filteredOrders.map(order => (
                                <div
                                    key={order.id}
                                    onClick={() => handleOrderSelect(order.id)}
                                    className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all active:scale-[0.98] group relative overflow-hidden
                                        ${selectedOrderId === order.id
                                            ? "border-[#FE4E10]"
                                            : "border-gray-200 hover:border-[#FE4E10]"
                                        }
                                    `}
                                >
                                    {selectedOrderId === order.id && (
                                        <div className="absolute top-0 right-0 w-[40px] h-[40px] bg-orange-500 blur-2xl opacity-20 -mr-2 -mt-2"></div>
                                    )}

                                    <div>
                                        <div className="flex items-start gap-3 mb-4">
                                            <div>
                                                <h3 className="font-bold text-gray-800">Order #{order.id}</h3>
                                            </div>
                                        </div>
                                        <div className="mb-4 text-xs text-gray-500">
                                            {(() => {
                                                const d = new Date(order.date);
                                                d.setHours(d.getHours() - 7);
                                                return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
                                            })()} - {order.serviceType}
                                            <div className="float-right">
                                                {(() => {
                                                    const d = new Date(order.date);
                                                    d.setHours(d.getHours() - 7);
                                                    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                                                })()}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-gray-400 border-b pb-1 mb-2">
                                                <span>Nama</span>
                                                <div className="flex gap-4">
                                                    <span>Jml</span>
                                                    <span>Harga</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                {order.items.slice(0, 3).map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-800 font-medium truncate w-32">{item.name}</span>
                                                        <div className="flex gap-4 text-right">
                                                            <span className="w-6 text-center">{item.qty}</span>
                                                            <span className="w-20">Rp{(item.price || 0).toLocaleString('id-ID')}</span>
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
                                            <span className="font-bold text-gray-900 text-lg">Rp{(order.totalPrice || 0).toLocaleString('id-ID')}</span>
                                        </div>
                                        {/* Button is redundant as whole card is clickable, but kept for clarity */}
                                        <button
                                            className="w-full py-3 rounded-xl font-bold transition-all bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600"
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

            {/* RIGHT CONTENT: Detail Panel via Portal */}
            {rightPanelTarget && createPortal(
                <div className="h-full flex flex-col bg-white">
                    {selectedOrderId && selectedOrder ? (
                        <>
                            <div className="p-4 sm:p-5 flex-1 overflow-y-auto scroll-area hide-scrollbar">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="text-center w-full relative border-b border-gray-100 pb-2">
                                        <h2 className="font-bold text-base text-gray-900 leading-tight">Order #{selectedOrder.id}</h2>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="w-full border border-gray-100 bg-gray-50/50 rounded-lg px-3 py-2 flex justify-between items-center">
                                        <span className="text-[11px] font-medium text-gray-600 uppercase tracking-widest">{selectedOrder.serviceType || 'Makan di tempat'}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-2.5">
                                            <div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden border border-gray-200">
                                                {/* Placeholder image or mapped if available in item (TransactionItem might need image prop or we map from name) */}
                                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Img</div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-1">
                                                    <h4 className="font-bold text-[13px] text-gray-800 leading-tight truncate">{item.name}</h4>
                                                     <button
                                                        onClick={() => handleDeleteItem(item.menuId, item.variantId)}
                                                        className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                                        title="Hapus Menu"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                 {item.variant && <p className="text-xs text-gray-500 mb-1">Variant: {item.variant}</p>}
                                                {item.toppings && item.toppings.length > 0 && (
                                                    <p className="text-[10px] text-gray-400 mb-1">
                                                        Toppings: {item.toppings.map(t => t.name).join(", ")}
                                                    </p>
                                                )}
                                                <div className="flex justify-between items-center mt-1.5">
                                                    <span className="text-[11px] font-bold text-orange-600">Rp{(item.price || 0).toLocaleString('id-ID')}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-1.5 py-0.5">
                                                            <button
                                                                onClick={() => handleUpdateQty(item.menuId, item.variantId, -1)}
                                                                className="text-gray-400 hover:text-orange-500"
                                                            >
                                                                <Minus size={12} />
                                                            </button>
                                                            <span className="text-sm font-medium w-4 text-center">{item.qty}</span>
                                                            <button
                                                                onClick={() => handleUpdateQty(item.menuId, item.variantId, 1)}
                                                                className="text-gray-400 hover:text-orange-500"
                                                            >
                                                                <Plus size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                </div>

                                <button
                                    onClick={() => setShowAddMenu(true)}
                                    className="w-full py-2 border-2 border-dashed border-orange-200 text-orange-500 rounded-lg text-xs font-bold mb-6 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    Tambah Menu <Plus size={14} />
                                </button>


                                {/* Summary */}
                                <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100">
                                    <div className="flex justify-between text-[11px] mb-1.5 text-gray-500 font-medium">
                                        <span>Sub Total</span>
                                        <span className="text-gray-900 font-bold">Rp{(selectedOrder.subtotal || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                    {selectedOrder.manualDiscount && (
                                        <div className="flex justify-between text-[11px] mb-1.5 text-orange-600 italic font-bold">
                                            <span>Manual ({selectedOrder.manualDiscount?.type === 'percentage' ? `${selectedOrder.manualDiscount?.value || 0}%` : `Rp${(selectedOrder.manualDiscount?.value || 0).toLocaleString("id-ID")}`})</span>
                                            <span>- Rp{(selectedOrder.manualDiscount.type === 'percentage' 
                                                ? Math.round((selectedOrder.subtotal || 0) * (selectedOrder.manualDiscount.value / 100)) 
                                                : selectedOrder.manualDiscount.value
                                            ).toLocaleString("id-ID")}</span>
                                        </div>
                                    )}
                                    {(selectedOrder.discount || 0) > 0 && (
                                        <div className="flex justify-between text-[11px] mb-1.5 text-orange-500 italic font-medium">
                                            <span>Promo ({selectedOrder.discount}%)</span>
                                            <span className="font-bold">- Rp{((selectedOrder.subtotal || 0) * (selectedOrder.discount || 0) / 100).toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                    {selectedOrder.taxDetails && selectedOrder.taxDetails.length > 0 ? (
                                        selectedOrder.taxDetails.map((t, idx) => (
                                            <div key={idx} className="flex justify-between text-[11px] mb-1.5 text-gray-500 font-medium">
                                                <span>{t.name} ({t.percentage}%)</span>
                                                <span className="text-gray-900 font-bold">Rp{t.amount?.toLocaleString("id-ID") || 0}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex justify-between text-[11px] mb-1.5 text-gray-500 font-medium">
                                            <span>Pajak ({(selectedOrder.taxRate || 0.1) * 100}%)</span>
                                            <span className="text-gray-900 font-bold">Rp{(selectedOrder.tax || 0).toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-base font-black border-t border-gray-200 pt-2 mt-2">
                                        <span className="text-gray-700">Total</span>
                                        <span className="text-[#FE4E10]">Rp{(selectedOrder.totalPrice || 0).toLocaleString('id-ID')}</span>
                                    </div>

                                    {/* Manual Discount Input Section */}
                                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                                        <div className="flex items-center justify-between mb-2 px-0.5">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Diskon Manual</span>
                                            {selectedOrder.manualDiscount && (
                                                <button 
                                                    onClick={handleRemoveManualDiscount}
                                                    className="text-[10px] text-red-500 hover:underline font-bold"
                                                >
                                                    HAPUS
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipe</span>
                                                <div className="flex bg-gray-100 rounded-lg p-0.5">
                                                    <button
                                                        onClick={() => setManualDiscountType('fixed')}
                                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${manualDiscountType === 'fixed' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}
                                                    >
                                                        Rp
                                                    </button>
                                                    <button
                                                        onClick={() => setManualDiscountType('percentage')}
                                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${manualDiscountType === 'percentage' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}
                                                    >
                                                        %
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        value={manualDiscountValue}
                                                        onChange={(e) => setManualDiscountValue(e.target.value)}
                                                        className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 bg-gray-50 text-gray-700 h-[38px] text-xs pr-8"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[10px]">
                                                        {manualDiscountType === 'fixed' ? 'Rp' : '%'}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={handleApplyManualDiscount}
                                                    className="h-[38px] px-4 bg-orange-500 text-white rounded-xl font-bold text-xs hover:bg-orange-600 transition-all active:scale-95 shadow-sm"
                                                >
                                                    OK
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Options */}
                                <div className="mb-4">
                                    <h4 className="font-bold text-sm text-gray-800 mb-3">Metode Pembayaran</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        {/* CASH */}
                                        <div className="flex flex-col items-center gap-2">
                                            <button
                                                onClick={() => setPaymentOption('CASH')}
                                                className={`w-full h-14 rounded-2xl flex items-center justify-center border transition-all duration-200 ${paymentOption === "CASH"
                                                    ? "border-[#FE4E10] bg-white shadow-sm"
                                                    : "border-gray-200 bg-gray-50 opacity-50"
                                                    }`}
                                            >
                                                <svg width="38" height="20" viewBox="0 0 38 20" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M37.767 4.54042C37.767 4.54042 34.0025 1.66805 29.6481 1.32605C25.2937 0.984039 15.9703 3.15752 12.6295 2.20833C9.2912 1.25913 6.11152 -0.00976562 6.11152 -0.00976562L0 16.2876C0 16.2876 7.75465 18.4363 11.1673 18.3521C15.9182 18.2381 21.8166 15.5664 25.0211 16.2182C28.8253 16.994 35.8116 19.9902 35.8116 19.9902L37.767 4.54042Z" fill="#BDE377" /> <path d="M36.7312 5.12006C36.7312 5.12006 32.9592 2.99862 28.9344 2.69627C24.9096 2.39639 16.3123 4.10147 13.2194 3.31585C10.1264 2.52774 7.17973 1.48438 7.17973 1.48438L1.89844 15.1969C1.89844 15.1969 6.53289 16.726 11.1525 17.073C14.8848 17.3505 22.0124 14.5724 24.9988 15.0358C27.9852 15.4992 34.7535 17.98 34.7535 17.98L36.7312 5.12006Z" fill="#6BA638" /> <path d="M25.128 13.9106C28.5952 14.2749 33.9186 16.5079 33.9186 16.5079L35.6856 5.91311C35.6856 5.91311 33.0983 4.15599 28.7017 3.64793C24.8851 3.20679 16.2333 4.94657 13.2817 4.27742C10.33 3.61076 7.51462 2.73096 7.51462 2.73096L3.68066 14.2997C3.68066 14.2997 7.242 15.5538 11.2792 15.9949C15.9136 16.503 22.2655 13.6083 25.128 13.9106Z" fill="#BDE377" /> <path d="M21.2389 3.77932C23.7123 3.45466 25.1794 4.65664 24.8424 8.23533C24.4533 12.3518 22.084 14.9937 20.3517 15.1548C18.6218 15.3184 14.9093 15.4819 15.3529 10.5327C15.6503 7.24152 17.9948 3.96519 19.2042 3.82888C20.4112 3.6901 21.2389 3.77932 21.2389 3.77932Z" fill="#6BA638" /> <path d="M19.026 13.556L20.0694 13.561L20.1214 12.934C21.5886 12.872 22.5675 12.3516 22.7162 10.9513C22.917 9.06781 21.373 8.83237 20.6072 8.46558C19.8414 8.09878 19.2986 7.97239 19.3779 7.43707C19.4548 6.90424 19.7596 6.59445 20.5353 6.58206C21.886 6.56223 21.6877 7.40981 21.6877 7.40981L22.9888 7.42716C22.9888 7.42716 23.2615 5.46434 21.0954 5.27103L21.1475 4.68862L20.2776 4.67871L20.1437 5.29581C18.8897 5.47177 18.2131 6.21527 18.0471 7.00337C17.6629 8.82493 19.0409 9.2512 19.7992 9.50399C20.7063 9.80882 21.2962 10.1087 21.2491 10.6614C21.1871 11.39 20.6667 11.7072 19.7571 11.6056C18.4436 11.4544 18.6691 10.24 18.6691 10.24L17.4473 10.2054C17.4473 10.2054 16.798 12.6614 19.1301 12.9117L19.026 13.556Z" fill="#BDE377" /> <path d="M30.3048 11.0355C29.7745 10.8793 29.4894 10.3217 29.6728 9.79385C29.8538 9.26349 30.4312 8.96113 30.964 9.11727C31.4944 9.2734 31.7794 9.82854 31.596 10.3589C31.4151 10.8893 30.8377 11.1916 30.3048 11.0355Z" fill="#6BA638" /> <path d="M8.63685 9.94808C8.10649 9.79195 7.82148 9.23433 8.00488 8.70644C8.18579 8.17609 8.76324 7.87373 9.29608 8.02986C9.82644 8.186 10.109 8.74114 9.92805 9.2715C9.74713 9.80186 9.16721 10.1042 8.63685 9.94808Z" fill="#6BA638" /> </svg>
                                            </button>
                                            <span className={`text-sm font-medium ${paymentOption === 'CASH' ? 'text-[#FE4E10]' : 'text-gray-400'}`}>Cash</span>
                                        </div>

                                        {/* QRIS */}
                                        <div className="flex flex-col items-center gap-2">
                                            <button
                                                onClick={() => setPaymentOption('QRIS')}
                                                className={`w-full h-14 rounded-2xl flex items-center justify-center border transition-all duration-200 ${paymentOption === "QRIS"
                                                    ? "border-[#FE4E10] bg-white shadow-sm"
                                                    : "border-gray-200 bg-gray-50 opacity-50"
                                                    }`}
                                            >
                                                <svg viewBox="0 0 80 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[20px] w-auto" > <path d="M76.7227 10.4773H64.024V7.936H76.7227V2.856H56.4053V15.5547H69.104V18.096H56.4053V23.176H76.7227V10.4773Z" fill="black" /> <path d="M53.8667 2.856H48.7867V23.1733H53.8667V2.856Z" fill="black" /> <path d="M25.9307 2.856V7.936H41.168V10.4773H25.9307V23.176H31.008V15.632L38.6293 23.176H46.248L38.2987 15.5547H46.248V2.856H25.9307Z" fill="black" /> <path d="M10.6907 15.5547H15.7573V10.488H10.6907V15.5547ZM11.9627 11.7467H14.5013V14.2853H11.9627V11.7467Z" fill="black" /> <path d="M8.152 2.856H3.70667C3.53867 2.85728 3.37786 2.92428 3.25867 3.04267C3.19937 3.10176 3.15234 3.172 3.12031 3.24935C3.08827 3.3267 3.07185 3.40962 3.072 3.49333V22.5387C3.07185 22.6224 3.08827 22.7053 3.12031 22.7827C3.15234 22.86 3.19937 22.9302 3.25867 22.9893C3.37813 23.107 3.539 23.1731 3.70667 23.1733H15.7707V18.1067H8.152V2.856Z" fill="black" /> <path d="M22.7547 2.856H10.6907V7.936H18.312V15.5547H23.3787V3.49333C23.3802 3.32555 23.3161 3.16381 23.2 3.04267C23.081 2.92563 22.9216 2.8588 22.7547 2.856Z" fill="black" /> <path d="M23.392 18.096H18.312V29.5253H23.392V18.096Z" fill="black" /> <path d="M10.16 0H0.634667C0.466559 0.000701921 0.305536 0.0677938 0.186665 0.186665C0.0677938 0.305536 0.000701921 0.466559 0 0.634667V10.16H1.26933V1.89333C1.27281 1.72708 1.34113 1.56878 1.4597 1.4522C1.57827 1.33562 1.73772 1.26999 1.904 1.26933H10.1707L10.16 0Z" fill="black" /> <path d="M78.7307 16.5067V24.7733C78.73 24.9414 78.6629 25.1025 78.544 25.2213C78.4251 25.3402 78.2641 25.4073 78.096 25.408H69.8293V26.6667H79.3547C79.4388 26.6677 79.5223 26.6521 79.6004 26.6207C79.6785 26.5893 79.7496 26.5428 79.8096 26.4838C79.8696 26.4248 79.9173 26.3545 79.95 26.2769C79.9997 26.1161 80 26.032V16.5067H78.7307Z" fill="black" /> </svg>
                                            </button>
                                            <span className={`text-sm font-medium ${paymentOption === 'QRIS' ? 'text-[#FE4E10]' : 'text-gray-400'}`}>Qris</span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Bottom Buttons */}
                            <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                                <button
                                    onClick={handleCancelOrder}
                                    className="p-2.5 border border-red-100 rounded-xl text-red-400 hover:bg-red-50 transition-colors"
                                    title="Batalkan Pesanan"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button
                                    onClick={() => setIsRightPanelOpen(false)}
                                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors"
                                >
                                    Tutup
                                </button>
                                <button
                                    onClick={handlePay}
                                    className="flex-1 py-2.5 bg-[#FE4E10] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E0450E] transition-all shadow-lg shadow-[#FE4E10]/20 flex items-center justify-center gap-2"
                                >
                                    Bayar <ShoppingBag size={14} />
                                </button>
                            </div>
                        </>
                    ) : (
                        // Placeholder when no order selected
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <ClipboardList size={32} className="opacity-50" />
                            </div>
                            <h3 className="text-gray-600 font-bold text-lg mb-1">Tidak ada pesanan dipilih</h3>
                            <p className="text-sm max-w-[200px]">Pilih salah satu pesanan di sebelah kiri untuk melihat detail atau melakukan pembayaran.</p>
                        </div>
                    )}
                </div>,
                rightPanelTarget
            )}


            {/* Modals are fine staying here */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={closePaymentModal}
                items={selectedOrder?.items || []}
                subtotal={selectedOrder?.subtotal || 0}
                tax={selectedOrder?.tax || 0}
                total={selectedOrder?.totalPrice || 0}
                discount={selectedOrder?.discount || 0}
                manualDiscount={selectedOrder?.manualDiscount || null}
                discountAmount={selectedOrder?.discountAmount || 0}
                taxDetails={selectedOrder?.taxDetails}
                onPaymentSuccess={handlePaymentSuccess}
            />

            <QRISPaymentModal
                isOpen={isQRISModalOpen}
                onClose={closeQRISModal}
                total={selectedOrder?.totalPrice || 0}
                onPaymentConfirm={handleQRISPaymentConfirm}
            />

            <PaymentSuccessModal
                isOpen={isSuccessModalOpen}
                onClose={closeSuccessModal}
                transaction={lastTransaction}
                onPrintReceipt={() => alert("Printing receipt...")}
                onNewOrder={closeSuccessModal}
            />


            <AddMenuModal
                isOpen={showAddMenu}
                onClose={() => setShowAddMenu(false)}
                onAddProduct={handleAddProduct}
            />
        </>
    );
}