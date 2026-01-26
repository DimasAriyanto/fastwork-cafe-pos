import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import type { CashierContextType } from "../../layouts/CashierLayout";

export default function Riwayat() {
  const { transactions } = useOutletContext<CashierContextType>();
  const [localSearch, setLocalSearch] = useState("");
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [overlayMode, setOverlayMode] = useState<"print" | "view" | null>(null);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = t.customerName.toLowerCase().includes(localSearch.toLowerCase()) ||
        t.id.toLowerCase().includes(localSearch.toLowerCase());
      return matchSearch;
    });
  }, [transactions, localSearch]);

  const selectedTx = useMemo(() =>
    transactions.find(t => t.id === selectedTxId),
    [transactions, selectedTxId]);

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

  const formatCurrency = (val: number) =>
    "Rp" + val.toLocaleString("id-ID") + ",00";

  // Reusable Receipt Content Render
  const renderReceiptContent = (tx: typeof transactions[0]) => (
    <>
      {/* Detail Transaksi */}
      <div className="border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-gray-700 text-sm">Detail Transaksi</span>
          <span className="text-xs text-gray-400 font-mono">{tx.id}</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Tipe Pembayaran</span>
            <span className="font-medium text-gray-900">Tunai</span>
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

      {/* Detail Pembayaran */}
      <div className="border border-gray-200 rounded-xl p-4 mb-4">
        <h4 className="font-bold text-gray-700 text-sm mb-3">Detail Pembayaran</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Sub Total</span>
            <span className="font-medium text-gray-900">{formatCurrency(tx.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tax(11%)</span>
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

      {/* Detail Pembelian */}
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

  return (
    <div className="flex h-full bg-white overflow-hidden relative">
      {/* LEFT SIDE: Transaction List */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-gray-200">
        <div className="p-6 pb-2">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Riwayat</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Daftar transaksi hari ini dengan status, pembayaran, dan pelanggan
            </p>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 text-sm"
              />
            </div>
            <button className="px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
              <SlidersHorizontal size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 scroll-area">
          {filteredTransactions.map((tx) => {
            const isSelected = selectedTxId === tx.id;
            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTxId(tx.id)}
                className={`
                            group rounded-xl p-5 border transition-all duration-200 cursor-pointer relative
                            ${isSelected
                    ? "border-orange-500 bg-white"
                    : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm"
                  }
                        `}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">Order: {tx.id}</h3>
                  <span className="text-gray-500 text-sm">{formatDate(tx.date)}</span>
                </div>
                <div className="text-gray-800 font-medium mb-3">
                  {tx.customerName}
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-gray-500 text-sm">
                    Jumlah: {tx.totalItems}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900 text-lg">
                      {formatCurrency(tx.totalPrice)}
                    </span>
                    <button className={`
                                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                    ${isSelected
                        ? "bg-orange-500 text-white"
                        : "bg-orange-500 text-white"
                      }
                                `}>
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDE: Receipt Panel */}
      {selectedTx ? (
        <div className="w-[400px] flex flex-col h-full bg-white overflow-hidden animate-slideInRight">
          <div className="p-6 flex-1 overflow-y-auto scroll-area">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{selectedTx.id}</h2>
            {renderReceiptContent(selectedTx)}
          </div>

          {/* Footer Buttons */}
          <div className="p-6 border-t border-gray-200 bg-white">
            <div className="flex gap-3">
              <button
                onClick={() => setOverlayMode("print")}
                className={`flex-1 font-bold py-3 rounded-xl transition-colors ${overlayMode ? 'bg-orange-500 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
              >
                Cetak Struk
              </button>
              <button
                onClick={() => setOverlayMode("view")}
                className={`flex-1 border font-bold py-3 rounded-xl transition-colors ${overlayMode ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'}`}
              >
                Lihat Struk
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State for Right Side */
        <div className="w-[400px] border-l border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
          Pilih transaksi untuk melihat detail
        </div>
      )}

      {/* Full Page Overlay */}
      {overlayMode && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop Blur */}
          <div
            className="absolute inset-0 bg-white/60 backdrop-blur-md"
            onClick={() => setOverlayMode(null)}
          />

          {/* Overlay Content */}
          <div className="bg-white w-[420px] rounded-2xl shadow-2xl relative z-10 max-h-[90vh] flex flex-col animate-scaleIn border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
              <h3 className="font-bold text-gray-800 text-lg">
                {overlayMode === "print" ? "Print Receipt" : "View Receipt"}
              </h3>
              <button
                onClick={() => setOverlayMode(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto scroll-area">
              <div className="text-center mb-6">
                <h2 className="font-bold text-2xl text-gray-900 mb-1">{selectedTx.id}</h2>
                <p className="text-gray-500 text-sm">Receipt Preview</p>
              </div>
              {renderReceiptContent(selectedTx)}
            </div>

            {overlayMode === "print" && (
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-end">
                <button
                  onClick={() => window.print()}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2 rounded-xl transition-colors shadow-lg shadow-orange-500/20"
                >
                  Print Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
