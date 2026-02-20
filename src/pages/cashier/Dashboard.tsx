import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useOutletContext } from "react-router-dom";
import type { CashierContextType } from "../../layouts/CashierLayout";
import { PRODUCTS_BY_CATEGORY } from "../../constants/products";
import type { Product, CartItem, PaymentMethod, Transaction, UnpaidOrder } from "../../types/cashier";

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

export default function Dashboard() {
  const { search, addTransaction, addUnpaidOrder, setIsRightPanelOpen, setCartCount } = useOutletContext<CashierContextType>();

  // Local State
  const [selectedCategory, setSelectedCategory] = useState("Semua Menu");
  const [customer, setCustomer] = useState("");
  const [dineType, setDineType] = useState<"dinein" | "takeaway">("dinein");
  const [selectedProductForModal, setSelectedProductForModal] = useState<CartItem | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | undefined>();

  // Hooks
  const {
    cart, addToCart, updateCartItem, removeFromCart, updateQuantity, clearCart,
    subtotal, tax, total,
    appliedDiscount, applyDiscountCode, removeDiscount, totalAfterDiscount
  } = useCart();
  const {
    isPaymentModalOpen, openPaymentModal, closePaymentModal,
    isQRISModalOpen, openQRISModal, closeQRISModal,
    isSuccessModalOpen, openSuccessModal, closeSuccessModal,
    lastTransaction
  } = usePayment();

  // Sync cartCount to context
  useMemo(() => {
    setCartCount(cart.length);
  }, [cart, setCartCount]);

  // Derived Data
  const currentProducts = useMemo(() => {
    return PRODUCTS_BY_CATEGORY[selectedCategory] || [];
  }, [selectedCategory]);

  const filteredProducts = useMemo(() => {
    if (!search) return currentProducts;
    return currentProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [currentProducts, search]);

  // Handlers
  const handleProductClick = (product: Product) => {
    setSelectedProductForModal({ ...product, qty: 1 });
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

  const handleCheckout = (payType: "payNow" | "payLater", method?: string) => {
    if (payType === "payNow") {
      if (method === "CASH") {
        openPaymentModal();
      } else if (method === "QRIS") {
        openQRISModal();
      }
    } else if (payType === "payLater") {
      createUnpaidOrder(method as PaymentMethod);
    }
  };

  const onPaymentConfirm = (paidAmount: number, change: number, method: PaymentMethod) => {
    const now = new Date();
    const newTransaction: Transaction = {
      id: `#${Math.floor(1000 + Math.random() * 9000)}`,
      date: now.toISOString(),
      customerName: customer || "Pelanggan",
      totalItems: cart.reduce((acc, item) => acc + item.qty, 0),
      totalPrice: totalAfterDiscount, // Use discounted price
      paymentMethod: method,
      serviceType: dineType === "dinein" ? "Dine In" : "Take Away",
      items: cart.map(c => ({
        name: c.name,
        qty: c.qty,
        price: c.price,
        variant: c.selectedVariant,
        note: c.note
      })),
      subtotal: subtotal,
      tax: tax,
      discount: appliedDiscount?.percentage || 0,
      paidAmount: paidAmount,
      change: method === "QRIS" ? 0 : change
    };

    addTransaction(newTransaction);
    openSuccessModal(newTransaction);
    clearCart();
    removeDiscount(); // Clear discount
    setCustomer("");
    closePaymentModal();
    closeQRISModal();
    setIsRightPanelOpen(false); // Close drawer on mobile
  };

  const handleQRISPaymentConfirm = () => {
    onPaymentConfirm(totalAfterDiscount, 0, "QRIS");
  };

  const createUnpaidOrder = (method?: PaymentMethod) => {
    const now = new Date();
    const newUnpaidOrder: UnpaidOrder = {
      id: `#${Math.floor(1000 + Math.random() * 9000)}`,
      date: now.toISOString(),
      customerName: customer || "Pelanggan",
      totalItems: cart.reduce((acc, item) => acc + item.qty, 0),
      totalPrice: totalAfterDiscount,
      paymentMethod: method || "CASH",
      serviceType: dineType === "dinein" ? "Dine In" : "Take Away",
      items: cart.map(c => ({
        name: c.name,
        qty: c.qty,
        price: c.price,
        variant: c.selectedVariant,
        note: c.note
      })),
      subtotal: subtotal,
      tax: tax,
      discount: appliedDiscount?.percentage || 0,
      paidAmount: 0,
      change: 0,
      status: "unpaid"
    };

    addUnpaidOrder(newUnpaidOrder);
    alert(`Pesanan ${customer || "tanpa nama"} disimpan sebagai Bayar Nanti!`);
    clearCart();
    removeDiscount(); // Clear discount
    setCustomer("");
    setIsRightPanelOpen(false); // Close drawer on mobile
  };

  // Portal Target
  const rightPanelTarget = usePortalTarget("cashier-right-panel-slot");

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Content Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto hide-scrollbar pb-24">
        <CategoryTabs
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <ProductList
          products={filteredProducts}
          onProductClick={handleProductClick}
        />
      </div>

      {/* Right Cart Panel via Portal */}
      {rightPanelTarget && createPortal(
        <div className="h-full w-full">
          <CartPanel
            cart={cart}
            customer={customer}
            setCustomer={setCustomer}
            dineType={dineType}
            setDineType={setDineType}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onEditItem={(item, index) => {
              setSelectedProductForModal(item);
              setEditingIndex(index);
            }}
            tax={tax}
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
          note: c.note
        }))}
        subtotal={subtotal}
        tax={0} // Tax removed in new summary flow
        total={totalAfterDiscount}
        onPaymentSuccess={(paid, change) => onPaymentConfirm(paid, change, "CASH")}
      />

      <QRISPaymentModal
        isOpen={isQRISModalOpen}
        onClose={closeQRISModal}
        total={totalAfterDiscount}
        onPaymentConfirm={handleQRISPaymentConfirm}
      />

      <PaymentSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={closeSuccessModal}
        transaction={lastTransaction}
        onPrintReceipt={() => alert("Printing receipt...")}
        onNewOrder={closeSuccessModal}
      />
    </div >
  );
}