import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useOutletContext } from "react-router-dom";
import { Search, X } from "lucide-react";
import DateFilter from "../../components/cashier/DateFilter";
import type { CashierContextType } from "../../layouts/CashierLayout";
import type { Transaction } from "../../types/cashier";
import { apiClient } from "../../api/client";

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
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);

        txDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        matchDate = txDate >= startDate && txDate <= endDate;
      } else if (dateRange.start) {
        const txDate = new Date(t.date);
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
        setFetchedDetails(prev => ({
          ...prev,
          [id]: {
            ...detail,
            id: String(detail.id),
            date: detail.createdAt,
            tax: detail.taxAmount,
            change: detail.changeAmount,
            customerName: detail.customerName || detail.notes || "Pelanggan",
            items: (detail.items || []).map((item: any) => ({
              name: item.name, // contains combined "Name (Variant)"
              qty: item.qty,
              price: item.price,
              variant: undefined, // avoid redundant "Rasa: ..." display
              note: undefined // item-level notes not supported in schema
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
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}.${mins}`;
  };

  const formatCurrency = (val: number | undefined | null) =>
    "Rp" + (val || 0).toLocaleString("id-ID") + ",00";

  // Reusable Receipt Content Render
  const renderReceiptContent = (tx: typeof transactions[0]) => (
    <>
      <div className="border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-gray-700 text-sm">Detail Transaksi</span>
          <span className="text-xs text-gray-400 font-mono">{tx.id}</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Tipe Pembayaran</span>
            <span className="font-medium text-gray-900">
              {tx.paymentMethod === "CASH" ? "Tunai" : tx.paymentMethod || "ERROR"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nama Pelanggan</span>
            <span className="font-medium text-gray-900">{tx.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tanggal Transaksi</span>
            <span className="font-medium text-gray-900 text-right w-32">
              {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}, {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Jenis Layanan</span>
            <span className="font-medium text-gray-900">{tx.serviceType === "Dine In" ? "Makan di Tempat" : "Bawa Pulang"}</span>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl p-4 mb-4">
        <h4 className="font-bold text-gray-700 text-sm mb-3">Detail Pembayaran</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Sub Total</span>
            <span className="font-medium text-gray-900">{formatCurrency(tx.subtotal)}</span>
          </div>
          {(tx.discount || 0) > 0 && (
            <div className="flex justify-between text-orange-500 italic">
              <span className="text-gray-500">Potongan ({tx.discount}%)</span>
              <span className="font-medium">- {formatCurrency((tx.subtotal || 0) * (tx.discount || 0) / 100)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Tax(10%)</span>
            <span className="font-medium text-gray-900">{formatCurrency(tx.tax)}</span>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-3 pt-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900">Total({tx.totalItems})</span>
            <span className="font-bold text-gray-900">{formatCurrency(tx.totalPrice)}</span>
          </div>
        </div>
        <div className="space-y-2 text-sm mt-3 pt-2 border-t border-dashed border-gray-200">
          <div className="flex justify-between">
            <span className="text-gray-400">Dibayar</span>
            <span className="font-medium text-gray-600">{formatCurrency(tx.paidAmount || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Kembalian</span>
            <span className="font-medium text-gray-600">{formatCurrency(tx.change || 0)}</span>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl p-4">
        <h4 className="font-bold text-gray-700 text-sm mb-3">Detail Pembelian</h4>
        <div className="flex text-xs text-gray-400 mb-2">
          <span className="flex-1">Nama Item</span>
          <span className="w-12 text-center">Jumlah</span>
          <span className="w-20 text-right">Harga</span>
        </div>
        <div className="space-y-4">
          {tx.items.map((item, idx) => (
            <div key={idx} className="text-sm">
              <div className="flex items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  {item.variant && <div className="text-xs text-gray-500 mt-0.5">Rasa: {item.variant}</div>}
                  {item.note && <div className="text-xs text-orange-500 mt-0.5">Catatan: {item.note}</div>}
                </div>
                <div className="w-12 text-center text-gray-900">{item.qty}</div>
                <div className="w-20 text-right text-gray-900">{formatCurrency(item.price)}</div>
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
                Daftar transaksi hari ini dengan status, pembayaran, dan pelanggan
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
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">Order: {tx.id}</h3>
                    <span className="text-gray-500 text-xs sm:text-sm">{formatDate(tx.date)}</span>
                  </div>
                  <div className="text-gray-800 font-medium mb-3 text-sm sm:text-base">
                    {tx.customerName}
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
                    className="flex-1 font-bold py-2.5 sm:py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 transition-colors text-center"
                  >
                    Cetak Sekarang
                  </button>
                  <button
                    onClick={() => setOverlayMode("view")}
                    className="flex-1 border border-gray-200 font-bold py-2.5 sm:py-3 rounded-xl bg-white hover:border-gray-300 text-gray-700 transition-colors text-center"
                  >
                    Lihat Sekarang
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
          <div className="bg-white w-full max-w-[420px] rounded-2xl shadow-2xl relative z-10 max-h-[90vh] flex flex-col border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
              <h3 className="font-bold text-gray-800 text-lg">
                {overlayMode === "print" ? "Cetak Struk" : "Lihat Struk"}
              </h3>
              <button onClick={() => setOverlayMode(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto scroll-area">
              <div className="text-center mb-6">
                <h2 className="font-bold text-2xl text-gray-900 mb-1">{selectedTx.id}</h2>
                <p className="text-gray-500 text-sm">Pratinjau Struk</p>
              </div>
              {renderReceiptContent(selectedTx)}
            </div>
            {overlayMode === "print" && (
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-center">
                <button
                  onClick={() => window.print()}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                >
                  Cetak Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}