import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, Pencil, Trash2, Minus, X } from "lucide-react";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  variants?: string[];
  toppings?: { name: string; price: number }[];
};

type CartItem = Product & {
  qty: number;
  selectedVariant?: string;
  selectedToppings?: string[];
  note?: string;
};

// Data produk berdasarkan kategori
const PRODUCTS_BY_CATEGORY = {
  "Semua Menu": [
    { id: 1, name: "Es Teh", category: "Minuman Dingin", price: 5000, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=200" },
    { id: 2, name: "Es Lemon Teh", category: "Minuman Dingin", price: 7000, image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=200" },
    { id: 3, name: "Es Teh Tarik", category: "Minuman Dingin", price: 7000, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=200" },
    { id: 4, name: "Es Coklat Nusantara", category: "Minuman Dingin", price: 10000, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=200" },
    { id: 5, name: "Es Matcha Nusantara", category: "Minuman Dingin", price: 10000, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=200" },
    { id: 6, name: "Es Kopi Susu", category: "Minuman Dingin", price: 10000, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=200" },
    { id: 7, name: "Es Susu Nusantara", category: "Minuman Dingin", price: 8000, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=200" },
    { id: 8, name: "Jagung Bakar Serut", category: "Makanan", price: 12500, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=200" },
    { id: 9, name: "Roti Bakar Tipuk", category: "Makanan", price: 10000, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=200" },
    {
      id: 10, name: "Roti Maryam", category: "Makanan", price: 10000, image: "https://pasarbadung.com/wp-content/uploads/2025/05/katalog-100fresh-5.jpg",
      variants: ["Cokelat", "Tiramisu", "Matcha", "Keju", "Oreo"],
      toppings: [
        { name: "Keju", price: 500 },
        { name: "Oreo", price: 500 }
      ]
    },
    { id: 11, name: "Kopi Irong Jahe", category: "Minuman Panas - Kopi", price: 8000, image: "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=200" },
  ],
  "Minuman Dingin": [
    { id: 1, name: "Es Teh", category: "Minuman Dingin", price: 5000, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=200" },
    { id: 2, name: "Es Lemon Teh", category: "Minuman Dingin", price: 7000, image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=200" },
    { id: 3, name: "Es Teh Tarik", category: "Minuman Dingin", price: 7000, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=200" },
    { id: 4, name: "Es Coklat Nusantara", category: "Minuman Dingin", price: 10000, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=200" },
    { id: 5, name: "Es Matcha Nusantara", category: "Minuman Dingin", price: 10000, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=200" },
    { id: 6, name: "Es Kopi Susu", category: "Minuman Dingin", price: 10000, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=200" },
    { id: 7, name: "Es Susu Nusantara", category: "Minuman Dingin", price: 8000, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=200" },
  ],
  "Minuman Panas - Kopi": [
    { id: 11, name: "Kopi Irong Jahe", category: "Minuman Panas - Kopi", price: 8000, image: "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=200" },
  ],
  "Minuman Panas - Non Kopi": [
    { id: 12, name: "Teh Jahe", category: "Minuman Panas - Non Kopi", price: 7000, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=200" },
    { id: 13, name: "Susu Jahe", category: "Minuman Panas - Non Kopi", price: 8000, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=200" },
  ],
  "Makanan": [
    { id: 8, name: "Jagung Bakar Serut", category: "Makanan", price: 12500, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=200" },
    { id: 9, name: "Roti Bakar Tipuk", category: "Makanan", price: 10000, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=200" },
    {
      id: 10, name: "Roti Maryam", category: "Makanan", price: 10000, image: "https://pasarbadung.com/wp-content/uploads/2025/05/katalog-100fresh-5.jpg",
      variants: ["Cokelat", "Tiramisu", "Matcha", "Keju", "Oreo"],
      toppings: [
        { name: "Keju", price: 500 },
        { name: "Oreo", price: 500 }
      ]
    },
  ]
};

const CATEGORIES = [
  { name: "Semua Menu", count: 11, icon: "📋" },
  { name: "Minuman Dingin", count: 7, icon: "🥤" },
  { name: "Minuman Panas - Kopi", count: 1, icon: "☕" },
  { name: "Minuman Panas - Non Kopi", count: 2, icon: "🍵" },
  { name: "Makanan", count: 3, icon: "🍽️" },
];

type ModalType = "variant" | "topping" | "note" | null;

import type { CashierContextType, Transaction, UnpaidOrder } from "../../layouts/CashierLayout";

export default function Dashboard() {
  const { search, addTransaction, addUnpaidOrder } = useOutletContext<CashierContextType>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState("");
  const [dineType, setDineType] = useState<"dinein" | "takeaway">("dinein");
  const [payType, setPayType] = useState<"payNow" | "payLater">("payNow");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | null>(null);
  const [modalOpen, setModalOpen] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Semua Menu");

  const addToCart = (product: Product) => {
    if (product.variants) {
      setSelectedItem({ ...product, qty: 1, selectedToppings: [] });
      setModalOpen("variant");
    } else {
      setCart(prev => {
        const found = prev.find(p => p.id === product.id && !p.selectedVariant);
        if (found) return prev.map(p => p.id === product.id && !p.selectedVariant ? { ...p, qty: p.qty + 1 } : p);
        return [...prev, { ...product, qty: 1, selectedToppings: [] }];
      });
    }
  };

  const handleVariantSelect = (variant: string) => {
    if (selectedItem) {
      setSelectedItem({ ...selectedItem, selectedVariant: variant });
    }
  };

  const handleEditItem = (item: CartItem) => {
    setSelectedItem(item);
    setModalOpen("variant");
  };

  const handleToppingToggle = (toppingName: string) => {
    if (selectedItem) {
      const currentToppings = selectedItem.selectedToppings || [];
      const newToppings = currentToppings.includes(toppingName)
        ? currentToppings.filter(t => t !== toppingName)
        : [...currentToppings, toppingName];

      setSelectedItem({ ...selectedItem, selectedToppings: newToppings });
    }
  };

  const handleAddToCartFromModal = () => {
    if (selectedItem) {
      // Pastikan ada variant yang dipilih jika produk memiliki variants
      if (selectedItem.variants && !selectedItem.selectedVariant) {
        alert("Silakan pilih rasa terlebih dahulu!");
        return;
      }

      setCart(prev => {
        const existingIndex = prev.findIndex(item =>
          item.id === selectedItem.id &&
          item.selectedVariant === selectedItem.selectedVariant
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            qty: updated[existingIndex].qty + selectedItem.qty,
            selectedToppings: selectedItem.selectedToppings,
            note: selectedItem.note
          };
          return updated;
        } else {
          return [...prev, selectedItem];
        }
      });

      setModalOpen(null);
      setSelectedItem(null);
    }
  };

  const subtotal = cart.reduce((s, i) => {
    let itemTotal = i.price * i.qty;
    if (i.selectedToppings && i.selectedToppings.length > 0) {
      i.selectedToppings.forEach(toppingName => {
        const topping = i.toppings?.find(t => t.name === toppingName);
        if (topping) itemTotal += topping.price * i.qty;
      });
    }
    return s + itemTotal;
  }, 0);

  const tax = subtotal * 0.11;
  const total = subtotal + tax;


  const currentProducts = PRODUCTS_BY_CATEGORY[selectedCategory as keyof typeof PRODUCTS_BY_CATEGORY] || [];

  const renderContent = () => {
    return (
      <div className="flex-1 p-6">
        {/* Judul dan Kategori */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Semua Menu</h1>
          </div>

          {/* Kategori Menu */}
          <div className="flex gap-2 overflow-x-auto pb-3">
            {CATEGORIES.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl whitespace-nowrap transition-all border ${selectedCategory === category.name
                  ? "bg-orange-50 border-orange-300 text-orange-600 shadow-sm"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
              >
                <span className="text-lg">{category.icon}</span>
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm">{category.name}</span>
                  <span className="text-xs text-gray-500">
                    {category.count} menu
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {currentProducts
            .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
            .map(p => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-white rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-orange-200 group transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full flex items-center justify-center';
                          fallback.innerHTML = `<span class="text-2xl">
                                                            ${p.category.includes("Minuman") ? "🥤" : p.category.includes("Kopi") ? "☕" : "🍽️"}
                                                        </span>`;
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-lg">
                      {p.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{p.category}</p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="font-bold text-orange-600 text-lg">Rp{p.price.toLocaleString()}</p>
                      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full hover:bg-orange-500 hover:text-white transition transform hover:scale-110">
                        <Plus size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  // Hitung total untuk modal
  const calculateModalTotal = () => {
    if (!selectedItem) return 0;

    let itemTotal = selectedItem.price * selectedItem.qty;

    // Tambah harga topping jika ada
    if (selectedItem.selectedToppings && selectedItem.toppings) {
      selectedItem.selectedToppings.forEach(toppingName => {
        const topping = selectedItem.toppings?.find(t => t.name === toppingName);
        if (topping) {
          itemTotal += topping.price * selectedItem.qty;
        }
      });
    }

    return itemTotal;
  };

  return (
    <div className="flex h-full w-full">
      {/* Content Area */}
      {renderContent()}

      {/* Cart Panel */}
      <div className="w-[32vw] bg-white border-l border-gray-200 flex flex-col">
        <div className="scroll-area flex-1">
          <div className="p-6">
            {/* Customer Info */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">Nama Pelanggan</h3>
              <input
                type="text"
                placeholder="Tulis nama pelanggan"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Dine Type */}
            <div className="mb-8">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDineType("dinein")}
                  className={`p-3 rounded-lg text-center font-medium text-sm transition-all duration-200 ${dineType === "dinein"
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600"
                    }`}
                >
                  Makan di tempat
                </button>
                <button
                  onClick={() => setDineType("takeaway")}
                  className={`p-3 rounded-lg text-center font-medium text-sm transition-all duration-200 ${dineType === "takeaway"
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600"
                    }`}
                >
                  Bawa pulang
                </button>
              </div>
            </div>

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
                    <div key={`${item.id}-${item.selectedVariant || index}`} className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-lg">{item.name}</p>
                          {item.selectedVariant && (
                            <p className="text-sm text-gray-600 mt-1">Rasa: {item.selectedVariant}</p>
                          )}
                        </div>
                        <p className="font-bold text-orange-600 text-lg">Rp{(item.price * item.qty).toLocaleString()}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-2 hover:bg-gray-100 rounded-lg border border-gray-300 text-gray-600 hover:text-orange-600 transition transform hover:scale-105"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setCart(prev => prev.filter((_, i) => i !== index))}
                            className="p-2 hover:bg-gray-100 rounded-lg border border-gray-300 text-red-500 hover:bg-red-50 transition transform hover:scale-105"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="flex items-center gap-4 bg-white border border-gray-300 rounded-xl px-4 py-2">
                          <button
                            onClick={() => {
                              if (item.qty > 1) {
                                setCart(prev => prev.map((itm, idx) =>
                                  idx === index ? { ...itm, qty: itm.qty - 1 } : itm
                                ));
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition transform hover:scale-110"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-bold text-gray-800 text-xl min-w-[30px] text-center">{item.qty}</span>
                          <button
                            onClick={() => {
                              setCart(prev => prev.map((itm, idx) =>
                                idx === index ? { ...itm, qty: itm.qty + 1 } : itm
                              ));
                            }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition transform hover:scale-110"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6">
              <div className="space-y-3 mb-5">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Sub Total</span>
                  <span className="font-semibold text-lg text-gray-800">Rp{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Pajak (11%)</span>
                  <span className="font-semibold text-gray-800">Rp{tax.toLocaleString()}</span>
                </div>

                <div className="border-t border-gray-300 pt-4 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-800">Total</span>
                    <span className="text-2xl font-bold text-orange-600">Rp{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Options */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-3">Opsi Pembayaran</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPayType("payLater")}
                    className={`p-4 rounded-xl text-center font-medium border-2 transition-all duration-200 ${payType === "payLater"
                      ? "border-orange-500 text-orange-600 bg-white shadow-md transform scale-[0.98]"
                      : "border-gray-300 text-gray-700 bg-white hover:border-orange-300 hover:shadow-md"
                      }`}
                  >
                    Bayar Nanti
                  </button>
                  <button
                    onClick={() => setPayType("payNow")}
                    className={`p-4 rounded-xl text-center font-medium border-2 transition-all duration-200 ${payType === "payNow"
                      ? "border-orange-500 text-orange-600 bg-white shadow-md transform scale-[0.98]"
                      : "border-gray-300 text-gray-700 bg-white hover:border-orange-300 hover:shadow-md"
                      }`}
                  >
                    Bayar Sekarang
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              {payType === "payNow" && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-3">Metode Pembayaran</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod("cash")}
                      className={`p-4 rounded-xl text-center font-medium border-2 transition-all duration-200 ${paymentMethod === "cash"
                        ? "border-orange-500 text-orange-600 bg-white shadow-md transform scale-[0.98]"
                        : "border-gray-300 text-gray-700 bg-white hover:border-orange-300 hover:shadow-md"
                        }`}
                    >
                      Cash
                    </button>
                    <button
                      onClick={() => setPaymentMethod("qris")}
                      className={`p-4 rounded-xl text-center font-medium border-2 transition-all duration-200 ${paymentMethod === "qris"
                        ? "border-orange-500 text-orange-600 bg-white shadow-md transform scale-[0.98]"
                        : "border-gray-300 text-gray-700 bg-white hover:border-orange-300 hover:shadow-md"
                        }`}
                    >
                      QRIS
                    </button>
                  </div>
                </div>
              )}

              {/* Order Button */}
              <button
                onClick={() => {
                  if (cart.length === 0) {
                    alert("Keranjang kosong!");
                  } else if (payType === "payNow" && !paymentMethod) {
                    alert("Pilih metode pembayaran!");
                  } else {
                    if (payType === "payNow" && paymentMethod) {
                      const now = new Date();
                      const newTransaction: Transaction = {
                        id: `#${Math.floor(1000 + Math.random() * 9000)}`,
                        date: now.toISOString(),
                        customerName: customer || "Pelanggan",
                        totalItems: cart.reduce((acc, item) => acc + item.qty, 0),
                        totalPrice: total,
                        paymentMethod: paymentMethod === "cash" ? "Cash" : "QRIS",
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
                        paidAmount: total, // Asumsi pembayaran pas
                        change: 0
                      };
                      addTransaction(newTransaction);
                      alert(`Pesanan ${customer || "tanpa nama"} berhasil! Total: Rp${total.toLocaleString()}`);
                    } else if (payType === "payLater") {
                      const now = new Date();
                      const newUnpaidOrder: UnpaidOrder = {
                        id: `#${Math.floor(1000 + Math.random() * 9000)}`,
                        date: now.toISOString(),
                        customerName: customer || "Pelanggan",
                        totalItems: cart.reduce((acc, item) => acc + item.qty, 0),
                        totalPrice: total,
                        paymentMethod: "Cash", // Default or placeholder
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
                        paidAmount: 0,
                        change: 0,
                        status: "unpaid"
                      };
                      addUnpaidOrder(newUnpaidOrder);
                      alert(`Pesanan ${customer || "tanpa nama"} disimpan sebagai Bayar Nanti!`);
                    }


                    setCart([]);
                    setCustomer("");
                  }
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Pesan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Variant & Topping Selection */}
      {
        modalOpen && selectedItem && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scaleIn border border-gray-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                <div>
                  <h3 className="font-bold text-lg">{selectedItem.name}</h3>
                  <p className="text-orange-600 font-bold">Rp{calculateModalTotal().toLocaleString()}</p>
                </div>
                <button onClick={() => setModalOpen(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Variants */}
                {selectedItem.variants && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Pilih Varian (Wajib)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedItem.variants.map((variant) => (
                        <button
                          key={variant}
                          onClick={() => handleVariantSelect(variant)}
                          className={`p-3 rounded-xl border-2 font-medium transition-all duration-200 ${selectedItem.selectedVariant === variant
                            ? "border-orange-500 bg-orange-50 text-orange-600"
                            : "border-gray-200 hover:border-orange-200 text-gray-600"
                            }`}
                        >
                          {variant}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toppings */}
                {selectedItem.toppings && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Tambah Topping (Opsional)</h4>
                    <div className="space-y-2">
                      {selectedItem.toppings.map((topping) => (
                        <button
                          key={topping.name}
                          onClick={() => handleToppingToggle(topping.name)}
                          className={`w-full flex justify-between items-center p-3 rounded-xl border-2 transition-all duration-200 ${selectedItem.selectedToppings?.includes(topping.name)
                            ? "border-orange-500 bg-orange-50 text-orange-600"
                            : "border-gray-200 hover:border-orange-200 text-gray-600"
                            }`}
                        >
                          <span>{topping.name}</span>
                          <span>+Rp{topping.price.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCartFromModal}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Tambahkan - Rp{calculateModalTotal().toLocaleString()}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}