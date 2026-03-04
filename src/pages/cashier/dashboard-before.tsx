import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "../../api/client";
import type { CashierContextType } from "../../layouts/CashierLayout";
import type { Product, CartItem, PaymentMethod } from "../../types/cashier";

// Hooks
import { useCart } from "../../hooks/useCart";
import { usePayment } from "../../hooks/usePayment";
import { usePortalTarget } from "../../hooks/usePortalTarget";

// Components
import CategoryTabs from "../../components/cashier/CategoryTabs";
import ProductList from "../../components/cashier/ProductList";
import CartPanel from "../../components/cashier/CartPanel";

// Modals
import ProductNoteModal from "../../components/cashier/modals/ProductNoteModal";
import PaymentModal from "../../components/cashier/modals/PaymentModal";
import QRISPaymentModal from "../../components/cashier/modals/QRISPaymentModal";
import PaymentSuccessModal from "../../components/cashier/modals/PaymentSuccessModal";
import { PrintableReceipt } from "../../components/cashier/PrintableReceipt";

export default function Dashboard() {
  const { search, createOrder, refreshData, setIsRightPanelOpen, setCartCount } = useOutletContext<CashierContextType>();
  const savedUser = localStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : null;

  // Local State
  const [categories, setCategories] = useState<{ name: string; icon: string; count: number }[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua Menu");
  const [isLoading, setIsLoading] = useState(true);
  const [customer, setCustomer] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [dineType, setDineType] = useState<"dinein" | "takeaway">("dinein");
  const [selectedProductForModal, setSelectedProductForModal] = useState<CartItem | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | undefined>();

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [productsDataArr, categoriesDataArr] = await Promise.all([
                apiClient.getMenus({ limit: 100 }),
                apiClient.getCategories()
            ]);

            const productsData = productsDataArr.map((m: any) => ({
                id: m.id,
                name: m.name,
                category: m.categoryName,
                price: m.price,
                image: m.image ? apiClient.getImageUrl(m.image) : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`,
                isAvailable: m.isAvailable,
                variants: m.variants?.map((v: any) => v.name) || [],
                // Use per-menu toppings from the API response
                toppings: (m.toppings || []).map((t: any) => ({
                    id: Number(t.id),
                    name: t.name,
                    price: Number(t.price)
                }))
            }));

            setAllProducts(productsData);

            // Fetch Tax Rate
            const taxResponse = await apiClient.getTaxes();
            if (taxResponse && taxResponse.totalRate !== undefined) {
                setTaxRate(Number(taxResponse.totalRate));
            }
            if (taxResponse && taxResponse.taxes) {
                setTaxes(taxResponse.taxes.map((t: any) => ({
                    name: t.name,
                    percentage: Number(t.percentage)
                })));
            }

            // Group categories with counts
            const cats = categoriesDataArr.map((c: any) => ({
                name: c.name,
                icon: c.name.includes("Minuman") ? "🥤" : c.name.includes("Kopi") ? "☕" : "🍽️",
                count: productsData.filter((p: any) => p.category === c.name).length
            }));

            setCategories([
                { name: "Semua Menu", icon: "📋", count: productsData.length },
                ...cats
            ]);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, []);

  // Hooks
  const {
    cart, addToCart, updateCartItem, removeFromCart, updateQuantity, clearCart,
    subtotal, tax, total, taxRate, setTaxRate, setTaxes, taxDetails,
    appliedDiscount, applyDiscountCode, removeDiscount, totalAfterDiscount
  } = useCart();
  const {
    isPaymentModalOpen, openPaymentModal, closePaymentModal,
    isQRISModalOpen, openQRISModal, closeQRISModal,
    isSuccessModalOpen, openSuccessModal, closeSuccessModal,
    lastTransaction
  } = usePayment();
  const receiptRef = useRef<HTMLDivElement>(null);

  // Sync cartCount to context
  useMemo(() => {
    setCartCount(cart.length);
  }, [cart, setCartCount]);

  const handlePrintReceipt = () => {
    if (receiptRef.current) {
        window.print();
    }
  };

  // Derived Data
  const filteredProducts = useMemo(() => {
    let result = allProducts;
    
    if (selectedCategory !== "Semua Menu") {
        result = result.filter(p => p.category === selectedCategory);
    }

    if (search) {
        result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    
    return result;
  }, [allProducts, selectedCategory, search]);

  // Handlers
  const handleProductClick = (product: Product) => {
    setSelectedProductForModal({ 
        ...product, 
        qty: 1
        // product.toppings already has the correct per-menu toppings from the API
    });
    setEditingIndex(undefined);
  };

  const handleSaveProductNote = (item: CartItem, index?: number) => {
    if (index !== undefined) {
      updateCartItem(index, item);
    } else {
      addToCart(item);
    }
    setSelectedProductForModal(null);
  };

  const handleCheckout = async (payType: "payNow" | "payLater", method?: string) => {
    if (payType === "payNow") {
      if (method === "CASH") {
        openPaymentModal();
      } else if (method === "QRIS") {
        openQRISModal();
      }
    } else if (payType === "payLater") {
      await createUnpaidOrder();
    }
  };

  const onPaymentConfirm = async (paidAmount: number, change: number, method: PaymentMethod) => {
    try {
      const orderData = {
        customerName: customer || "Pelanggan",
        orderType: dineType === "dinein" ? "dine_in" : "take_away",
        notes: customer || "Pelanggan",
        customerId: customerId || undefined,
        items: cart.map(c => ({
          menuId: c.id,
          qty: c.qty,
          price: c.price,
          variantId: undefined, 
          toppings: (c.selectedToppings || []).map(tName => {
              const t = (c as any).toppings?.find((top: any) => top.name === tName);
              return t ? { toppingId: t.id, price: t.price } : null;
          }).filter(Boolean)
        }))
      };

      // Create order first
      const orderResult = await createOrder(orderData);
      
      // Immediately pay it
      const transaction = await apiClient.payOrder(orderResult.transactionId, {
        paymentMethod: method,
        paidAmount: paidAmount
      });

      // Show success modal (normalize the data for modal)
      openSuccessModal({
        id: String(transaction.id),
        customerName: customer || "Pelanggan",
        totalPrice: total,
        paymentMethod: method,
        paidAmount: paidAmount,
        change: method === "QRIS" ? 0 : change,
        date: new Date().toISOString(),
        subtotal: subtotal,
        tax: tax,
        taxRate: taxRate,
        taxDetails: taxDetails,
        discount: appliedDiscount?.percentage || 0,
        cashierName: user?.name || user?.username || "Kasir",
        items: cart.map(c => ({ 
          name: c.name, 
          qty: c.qty, 
          price: c.price,
          variant: c.selectedVariant,
          toppings: (c.selectedToppings || []).map(tName => {
            const t = (c as any).toppings?.find((top: any) => top.name === tName);
            return { name: tName, price: t?.price || 0 };
          }),
          note: c.note
        })) as any
      } as any);

      clearCart();
      removeDiscount();
      setCustomer("");
      setCustomerId(null);
      closePaymentModal();
      closeQRISModal();
      setIsRightPanelOpen(false);
      refreshData();
    } catch (err: any) {
      alert(err.message || "Gagal memproses transaksi");
    }
  };

  const handleQRISPaymentConfirm = () => {
    onPaymentConfirm(totalAfterDiscount, 0, "QRIS");
  };

  const createUnpaidOrder = async () => {
    try {
      const orderData = {
        customerName: customer || "Pelanggan",
        orderType: dineType === "dinein" ? "dine_in" : "take_away",
        notes: customer || "Pelanggan",
        customerId: customerId || undefined,
        items: cart.map(c => ({
          menuId: c.id,
          qty: c.qty,
          price: c.price,
          variantId: undefined, // variant selection not yet fully integrated with IDs
          toppings: (c.selectedToppings || []).map(tName => {
              const t = (c as any).toppings?.find((top: any) => top.name === tName);
              return t ? { toppingId: t.id, price: t.price } : null;
          }).filter(Boolean)
        }))
      };

      await createOrder(orderData);
      alert(`Pesanan ${customer || "tanpa nama"} disimpan sebagai Bayar Nanti!`);
      clearCart();
      removeDiscount();
      setCustomer("");
      setCustomerId(null);
      setIsRightPanelOpen(false);
      refreshData();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan pesanan");
    }
  };

  // Portal Target
  const rightPanelTarget = usePortalTarget("cashier-right-panel-slot");

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Content Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto hide-scrollbar pb-24">
        {isLoading ? (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        ) : (
            <>
                <CategoryTabs
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                />
                <ProductList
                    products={filteredProducts}
                    onProductClick={handleProductClick}
                />
            </>
        )}
      </div>

      {/* Right Cart Panel via Portal */}
      {rightPanelTarget && createPortal(
        <div className="h-full w-full">
          <CartPanel
            cart={cart}
            customer={customer}
            setCustomer={setCustomer}
            setCustomerId={setCustomerId}
            dineType={dineType}
            setDineType={setDineType}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onEditItem={(item, index) => {
              setSelectedProductForModal(item);
              setEditingIndex(index);
            }}
            tax={tax}
            taxRate={taxRate}
            taxDetails={taxDetails}
            total={total}
            appliedDiscount={appliedDiscount}
            applyDiscountCode={applyDiscountCode}
            removeDiscount={removeDiscount}
            subtotal={subtotal}
            onCheckout={handleCheckout}
          />
        </div>,
        rightPanelTarget
      )}

      {/* Modals */}
      {selectedProductForModal && (
        <ProductNoteModal
          item={selectedProductForModal}
          index={editingIndex}
          onClose={() => setSelectedProductForModal(null)}
          onSave={handleSaveProductNote}
        />
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        items={cart.map(c => ({
          name: c.name,
          qty: c.qty,
          price: c.price,
          variant: c.selectedVariant,
          toppings: (c.selectedToppings || []).map(tName => {
            const t = (c as any).toppings?.find((top: any) => top.name === tName);
            return { name: tName, price: t?.price || 0 };
          }),
          note: c.note
        }))}
        subtotal={subtotal}
        tax={tax}
        taxRate={taxRate}
        taxDetails={taxDetails}
        total={total}
        discount={appliedDiscount?.percentage || 0}
        onPaymentSuccess={(paid, change) => onPaymentConfirm(paid, change, "CASH")}
      />

      <QRISPaymentModal
        isOpen={isQRISModalOpen}
        onClose={closeQRISModal}
        total={total}
        onPaymentConfirm={handleQRISPaymentConfirm}
      />

      <PaymentSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={closeSuccessModal}
        transaction={lastTransaction}
        onPrintReceipt={handlePrintReceipt}
        onNewOrder={closeSuccessModal}
      />

      {createPortal(
        <div className="final-print-container">
          <div className="text-center py-2 border-b border-dashed mb-4">--- RECEIPT ---</div>
          {lastTransaction && (
            <PrintableReceipt ref={receiptRef} transaction={lastTransaction} />
          )}
        </div>,
        document.body
      )}
    </div >
  );
}