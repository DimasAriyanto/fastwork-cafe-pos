
export type Product = {
    id: number;
    name: string;
    category: string;
    price: number;
    image: string;
    isAvailable?: boolean;
    variants?: string[];
    toppings?: { name: string; price: number }[];
};

export type CartItem = Product & {
    qty: number;
    selectedVariant?: string;
    selectedToppings?: string[];
    note?: string;
};

export type TransactionItem = {
    menuId?: number;
    variantId?: number;
    name: string;
    qty: number;
    price: number; // Unit price (including toppings)
    basePrice?: number; // Original base price from menu
    variant?: string;
    toppings?: { name: string; price: number; toppingId?: number }[];
    note?: string;
};

export type PaymentMethod = "CASH" | "QRIS";
export type OrderType = "Dine In" | "Take Away";
export type PaymentStatus = "paid" | "unpaid";

export type Transaction = {
    id: string;
    date: string;
    customerName: string;
    serviceType?: OrderType;
    orderType?: string;
    items: TransactionItem[];
    totalItems?: number;
    subtotal?: number;
    tax?: number;
    taxAmount?: number;
    taxRate?: number;
    taxDetails?: { name: string; amount: number; percentage: number }[];
    totalPrice: number;
    paymentMethod?: PaymentMethod;
    paidAmount?: number;
    change?: number;
    discount?: number;
    manualDiscount?: { type: "fixed" | "percentage"; value: number } | null;
    discountAmount?: number;
    cashierName?: string; // employee who created the transaction
};

export type UnpaidOrder = Transaction & {
    status: "unpaid";
};
