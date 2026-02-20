import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "../../api/client";
import type { CashierContextType } from "../../layouts/CashierLayout";
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
  const [categories, setCategories] = useState<{ name: string; icon: string; count: number }[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua Menu");
  const [isLoading, setIsLoading] = useState(true);
  const [customer, setCustomer] = useState("");
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
                image: m.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`,
                isAvailable: m.isAvailable,
                variants: m.variants?.map((v: any) => v.name) || [],
                toppings: [] 
            }));

            setAllProducts(productsData);

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