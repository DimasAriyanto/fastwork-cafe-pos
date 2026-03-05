import React from "react";
import type { Transaction } from "../../types/cashier";

type PrintableReceiptProps = {
    transaction: Transaction;
};

export const PrintableReceipt = React.forwardRef<HTMLDivElement, PrintableReceiptProps>(
    ({ transaction }, ref) => {
        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
            }).format(amount);
        };

        const formatDate = (dateStr: any) => {
            if (!dateStr) return "-";
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "-";

            // Kompensasi jika browser otomatis menambah 7 jam (WIB) ke data yang sudah waktu lokal
            d.setHours(d.getHours() - 7);

            const day = d.getDate().toString().padStart(2, "0");
            const month = (d.getMonth() + 1).toString().padStart(2, "0");
            const year = d.getFullYear();
            const hours = d.getHours().toString().padStart(2, "0");
            const mins = d.getMinutes().toString().padStart(2, "0");
            return `${day}/${month}/${year} ${hours}:${mins}`;
        };

        return (
            <div ref={ref} className="bg-white w-[80mm] p-4 font-mono text-[10px] text-black">
                <div className="text-center mb-4">
                    <h2 className="text-sm font-bold uppercase mb-1">POS CAFE</h2>
                    <p className="text-[8px] uppercase">Jl. Contoh No. 123, Jakarta</p>
                    <p className="text-[8px]">Telp: 021-12345678</p>
                    <p className="border-b border-dashed border-black my-2"></p>
                </div>

                <div className="space-y-1 mb-4">
                    <div className="flex justify-between">
                        <span>No. Transaksi:</span>
                        <span>#{transaction.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tanggal:</span>
                        <span>{formatDate(transaction.date)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Kasir:</span>
                        <span>{transaction.cashierName || "-"}</span>
                    </div>
                    <p className="border-b border-dashed border-black my-2"></p>
                </div>

                <div className="space-y-3 mb-4">
                    {(transaction.items || []).map((item, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between font-bold">
                                <span className="flex-1 pr-2">{item.name} {item.variant ? `(${item.variant})` : ""}</span>
                                <span>{formatCurrency(item.price * item.qty)}</span>
                            </div>
                            <div className="flex justify-between pl-2">
                                <span>{item.qty} x {formatCurrency(item.price)}</span>
                            </div>
                            {item.toppings && item.toppings.length > 0 && (
                                <div className="pl-2 italic text-[8px]">
                                    + {item.toppings.map(t => `${t.name} (${formatCurrency(t.price)})`).join(", ")}
                                </div>
                            )}
                            {item.note && (
                                <div className="pl-2 italic text-[8px]">
                                    Note: {item.note}
                                </div>
                            )}
                        </div>
                    ))}
                    <p className="border-b border-dashed border-black my-2"></p>
                </div>

                <div className="space-y-1 mb-4 uppercase">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(transaction.subtotal || 0)}</span>
                    </div>
                    {!!transaction.discount && transaction.discount > 0 && (
                        <div className="flex justify-between">
                            <span>Promo ({transaction.discount}%)</span>
                            <span>-{formatCurrency((transaction.subtotal || 0) * (transaction.discount / 100))}</span>
                        </div>
                    )}
                    {transaction.manualDiscount && (
                        <div className="flex justify-between">
                            <span>Diskon</span>
                            <span>-{formatCurrency(
                                transaction.manualDiscount.type === 'percentage' 
                                    ? Math.round((transaction.subtotal || 0) * (transaction.manualDiscount.value / 100)) 
                                    : transaction.manualDiscount.value
                            )}</span>
                        </div>
                    )}
                    {transaction.taxDetails && transaction.taxDetails.length > 0 ? (
                        transaction.taxDetails.map((td, i) => (
                            <div key={i} className="flex justify-between">
                                <span>{td.name} ({td.percentage}%)</span>
                                <span>{formatCurrency(td.amount)}</span>
                            </div>
                        ))
                    ) : (
                        <div className="flex justify-between">
                            <span>Pajak ({((transaction.taxRate || 0.1) * 100).toFixed(0)}%)</span>
                            <span>{formatCurrency(transaction.tax || 0)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-sm pt-1 mt-1 border-t border-black">
                        <span>TOTAL</span>
                        <span>{formatCurrency(transaction.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                        <span>{transaction.paymentMethod === "CASH" ? "Tunai" : transaction.paymentMethod}</span>
                        <span>{formatCurrency(transaction.paidAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                        <span>Kembalian</span>
                        <span>{formatCurrency(transaction.change || 0)}</span>
                    </div>
                </div>

                <div className="text-center italic mt-6 border-t border-black pt-4">
                    <p>Terima kasih atas kunjungan Anda</p>
                    <p>Barang yang sudah dibeli</p>
                    <p>tidak dapat ditukar/dikembalikan</p>
                </div>
            </div>
        );
    }
);

PrintableReceipt.displayName = "PrintableReceipt";
