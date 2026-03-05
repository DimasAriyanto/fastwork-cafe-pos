import { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useOutletContext } from "react-router-dom";
import { Search, X, ClipboardList } from "lucide-react";
import DateFilter from "../../components/cashier/DateFilter";
import type { CashierContextType } from "../../layouts/CashierLayout";
import type { Transaction } from "../../types/cashier";
import { apiClient } from "../../api/client";
import { PrintableReceipt } from "../../components/cashier/PrintableReceipt";

// Hooks
import { usePortalTarget } from "../../hooks/usePortalTarget";
import { useResponsive } from "../../hooks/useResponsive";

export default function Riwayat() {
  const { transactions, setIsRightPanelOpen } = useOutletContext<CashierContextType>();
  const { isDesktop } = useResponsive();
  const [localSearch, setLocalSearch] = useState("");
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [fetchedDetails, setFetchedDetails] = useState<Record<string, Transaction>>({});
  const [overlayMode, setOverlayMode] = useState<"print" | "view" | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Filter State
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = t.customerName.toLowerCase().includes(localSearch.toLowerCase()) ||
        t.id.toLowerCase().includes(localSearch.toLowerCase());

      let matchDate = true;
      if (dateRange.start && dateRange.end) {
        const txDate = new Date(t.date);
        txDate.setHours(txDate.getHours() - 7); // Kompensasi shift agar filter match dengan tampilan

        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);

        txDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        matchDate = txDate >= startDate && txDate <= endDate;
      } else if (dateRange.start) {
        const txDate = new Date(t.date);
        txDate.setHours(txDate.getHours() - 7); // Kompensasi shift

        const startDate = new Date(dateRange.start);
        txDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        matchDate = txDate >= startDate;
      }

      return matchSearch && matchDate;
    });
  }, [transactions, localSearch, dateRange]);

  const selectedTx = useMemo(() => {
    if (!selectedTxId) return null;
    return fetchedDetails[selectedTxId] || transactions.find(t => t.id === selectedTxId);
  }, [transactions, selectedTxId, fetchedDetails]);

  // Selection handler for responsiveness
  const handleTxSelect = async (id: string) => {
    setSelectedTxId(id);
    if (!isDesktop) {
      setIsRightPanelOpen(true);
    }

    if (!fetchedDetails[id]) {
      try {
        const detail = await apiClient.getTransactionDetail(Number(id));
        
        // Build manualDiscount object from flat fields
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
            change: detail.changeAmount,
            customerName: detail.customerName || detail.notes || "Pelanggan",
            manualDiscount: manualDiscount,
            discountAmount: detail.discountAmount || 0,
            items: (detail.items || []).map((item: any) => ({
              name: item.name,
              qty: item.qty,
              price: item.finalPrice || item.price || 0,
              variant: undefined,
              note: undefined
            })),
            serviceType: detail.orderType === 'take_away' ? 'Take Away' : 'Dine In'
          } as Transaction
        }));
      } catch (err) {
        console.error("Gagal memuat detail transaksi:", err);
      }
    }
  };

  // Format Helpers
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    // Kompensasi jika browser otomatis menambah 7 jam (WIB) ke data yang sudah waktu lokal
    d.setHours(d.getHours() - 7);
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}.${minutes}`;
  };

  const formatCurrency = (val: number | undefined | null) => "Rp" + (val || 0).toLocaleString("id-ID");

  const handlePrintReceipt = () => {
    if (receiptRef.current) {
        window.print();
    }
  };

  // Reusable Receipt Content Render
  const renderReceiptContent = (tx: Transaction) => (
    <>
      <div className="border border-gray-100 bg-white rounded-xl p-3 mb-3 shadow-sm">
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-50">
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-400 shrink-0">
            <ClipboardList size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm truncate">Order #{tx.id}</h3>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">
              {tx.cashierName || 'Kasir'} • {tx.customerName || 'Pelanggan'}
            </div>
          </div>
        </div>
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-gray-400 uppercase font-black tracking-widest text-[8px]">ID Transaksi</span>
            <span className="font-mono text-gray-900">#{tx.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 uppercase font-black tracking-widest text-[8px]">Waktu</span>
            <span className="font-medium text-gray-900">{formatDate(tx.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 uppercase font-black tracking-widest text-[8px]">Layanan</span>
            <span className="font-medium text-gray-900">{tx.serviceType === "Dine In" ? "Dine In" : "Take Away"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 uppercase font-black tracking-widest text-[8px]">Pembayaran</span>
            <span className="font-medium text-gray-900">
              {tx.paymentMethod === "CASH" ? "Tunai" : tx.paymentMethod || "ERROR"}
            </span>
          </div>
        </div>
      </div>
      <div className="border border-gray-100 bg-gray-50/50 rounded-xl p-3 mb-2">
        <h4 className="font-black text-gray-400 text-[9px] uppercase tracking-widest mb-2 pb-1 border-b border-gray-100">Detail Pembayaran</h4>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-gray-500">Sub Total</span>
            <span className="font-medium text-gray-900">{formatCurrency(tx.subtotal)}</span>
          </div>
          {(tx.discount || 0) > 0 && (
            <div className="flex justify-between text-orange-500 italic font-medium">
              <span className="text-gray-400">Promo ({tx.discount}%)</span>
              <span className="font-bold">- {formatCurrency((tx.subtotal || 0) * (tx.discount || 0) / 100)}</span>
            </div>
          )}
          {(tx as any).manualDiscount && (
            <div className="flex justify-between text-orange-600 italic font-bold">
              <span className="text-gray-400">
                Diskon ({(tx as any).manualDiscount.type === 'percentage' 
                  ? `${(tx as any).manualDiscount.value}%` 
                  : `Rp${((tx as any).manualDiscount?.value || 0).toLocaleString('id-ID')}`})
              </span>
              <span>- {formatCurrency(
                (tx as any).manualDiscount.type === 'percentage'
                  ? Math.round((tx.subtotal || 0) * ((tx as any).manualDiscount.value / 100))
                  : (tx as any).manualDiscount.value
              )}</span>
            </div>
          )}
          {tx.taxDetails && tx.taxDetails.length > 0 ? (
            tx.taxDetails.map((td: any, idx: number) => (
              <div key={idx} className="flex justify-between">
                <span className="text-gray-500">{td.name}({td.percentage}%)</span>
                <span className="font-medium text-gray-900">{formatCurrency(td.amount)}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between">
              <span className="text-gray-500">Tax</span>
              <span className="font-medium text-gray-900">{formatCurrency(tx.taxAmount || tx.tax)}</span>
            </div>
          )}
        </div>
        <div className="border-t border-gray-100 mt-2.5 pt-2.5">
          <div className="flex justify-between items-center">
            <span className="font-black text-gray-700 text-xs">TOTAL ({tx.totalItems})</span>
            <span className="font-black text-[#FE4E10] text-lg font-mono">{formatCurrency(tx.totalPrice)}</span>
          </div>
        </div>
        <div className="space-y-1 text-[10px] mt-2 pt-2 border-t border-dashed border-gray-200">
          <div className="flex justify-between">
            <span className="text-gray-400">Dibayar</span>
            <span className="font-bold text-gray-600 font-mono">{formatCurrency(tx.paidAmount || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Kembalian</span>
            <span className="font-bold text-gray-600 font-mono">{formatCurrency(tx.change || 0)}</span>
          </div>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl p-3">
        <h4 className="font-black text-gray-400 text-[9px] uppercase tracking-widest mb-2 pb-1 border-b border-gray-100">Detail Pembelian</h4>
        <div className="flex text-[9px] font-bold text-gray-400 mb-2 uppercase tracking-tight">
          <span className="flex-1">Nama Item</span>
          <span className="w-10 text-center">Qty</span>
          <span className="w-16 text-right">Harga</span>
        </div>
        <div className="space-y-3">
          {tx.items.map((item, idx) => (
            <div key={idx} className="text-[11px]">
              <div className="flex items-start gap-1">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate">{item.name}</div>
                  {item.variant && <div className="text-[9px] text-gray-400 mt-0.5">Varian: {item.variant}</div>}
                </div>
                <div className="w-10 text-center text-gray-900 font-medium">{item.qty}x</div>
                <div className="w-16 text-right text-gray-900 font-bold font-mono">{formatCurrency(item.price)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const rightPanelTarget = usePortalTarget("cashier-right-panel-slot");

  return (
    <>
      <div className="flex flex-col h-full bg-white overflow-hidden w-full border-r border-gray-200">
        <div className="px-4 sm:px-6 py-5">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Riwayat</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Daftar transaksi hari ini dengan status dan pembayaran
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full xl:w-auto">
              <div className="relative group w-full xl:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Cari Order ID..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-all text-sm"
                />
              </div>
              <DateFilter onFilterChange={setDateRange} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-24 space-y-3 scroll-area hide-scrollbar">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
              <p>Belum ada riwayat transaksi</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isSelected = selectedTxId === tx.id;
              return (
                <div
                  key={tx.id}
                  onClick={() => handleTxSelect(tx.id)}
                  className={`
                    group rounded-xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer relative
                    ${isSelected
                      ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
                      : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm"
                    }
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg">Order: {tx.id}</h3>
                      <p className="text-xs text-orange-600 font-bold">{tx.customerName || "Pelanggan"}</p>
                    </div>
                    <span className="text-gray-500 text-xs sm:text-sm">{formatDate(tx.date)}</span>
                  </div>
                  <div className="flex justify-between items-end gap-2">
                    <div className="text-gray-500 text-xs sm:text-sm">
                      {tx.totalItems} item | {tx.paymentMethod}
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="font-bold text-gray-900 text-base sm:text-lg">
                        {formatCurrency(tx.totalPrice)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTxSelect(tx.id);
                        }}
                        className={`
                          px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors
                          ${isSelected
                            ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                            : "bg-gray-100 text-gray-600 hover:bg-orange-100"
                          }
                        `}>
                        Detail
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {rightPanelTarget && createPortal(
        <div className="h-full flex flex-col bg-white">
          {selectedTx ? (
            <>
              <div className="p-4 sm:p-6 flex-1 overflow-y-auto scroll-area hide-scrollbar">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">{selectedTx.id}</h2>
                {renderReceiptContent(selectedTx)}
              </div>
              <div className="p-4 sm:p-6 border-t border-gray-200 bg-white">
                <div className="flex gap-3">
                  <button
                    onClick={() => setOverlayMode("print")}
                    className="flex-1 font-black py-2 rounded-xl bg-[#FE4E10] text-white shadow-lg shadow-[#FE4E10]/20 transition-all text-[10px] uppercase tracking-widest active:scale-95"
                  >
                    Cetak Struk
                  </button>
                  <button
                    onClick={() => setOverlayMode("view")}
                    className="flex-1 border border-gray-200 font-black py-2 rounded-xl bg-white text-gray-400 transition-all text-[10px] uppercase tracking-widest hover:bg-gray-50 active:scale-95"
                  >
                    Lihat Struk
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <X size={32} className="opacity-50" />
              </div>
              <h3 className="text-gray-600 font-bold text-lg mb-1">Pilih Transaksi</h3>
              <p className="text-sm max-w-[200px]">Pilih transaksi dari daftar untuk melihat detail struk.</p>
            </div>
          )}
        </div>,
        rightPanelTarget
      )}

      {overlayMode && selectedTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md" onClick={() => setOverlayMode(null)} />
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative z-10 max-h-[92vh] flex flex-col border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="p-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
              <h3 className="font-black text-gray-400 text-[10px] uppercase tracking-widest">
                {overlayMode === "print" ? "Cetak Struk" : "Lihat Struk"}
              </h3>
              <button onClick={() => setOverlayMode(null)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto scroll-area scrollbar-hide">
              <div className="text-center mb-4 pb-2 border-b border-gray-100 border-dashed">
                <h2 className="font-black text-2xl text-[#FE4E10] mb-0.5 font-mono">{selectedTx.id}</h2>
                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Pratinjau Struk</p>
              </div>
              {renderReceiptContent(selectedTx)}
            </div>
            {overlayMode === "print" && (
              <div className="p-3 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-center">
                <button
                  onClick={handlePrintReceipt}
                  className="w-full bg-[#FE4E10] text-white font-black py-2.5 rounded-xl shadow-lg shadow-[#FE4E10]/20 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                >
                  Cetak Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {createPortal(
        <div className="final-print-container">
          <div className="text-center py-2 font-mono text-[10px] border-b border-dashed mb-4">--- RECEIPT ---</div>
          {selectedTx && (
            <PrintableReceipt ref={receiptRef} transaction={selectedTx} />
          )}
        </div>,
        document.body
      )}
    </>
  );
}