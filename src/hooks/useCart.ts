import { useState, useMemo } from "react";
import type { CartItem } from "../types/cashier";

export const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Helpers
    const addToCart = (product: CartItem) => {
        setCart((prev) => [...prev, product]);
    };

    const updateCartItem = (index: number, updatedItem: CartItem) => {
        setCart((prev) => {
            const updated = [...prev];
            updated[index] = updatedItem;
            return updated;
        });
    };

    const removeFromCart = (index: number) => {
        setCart((prev) => prev.filter((_, i) => i !== index));
    };

    const updateQuantity = (index: number, delta: number) => {
        setCart((prev) => {
            return prev.map((item, i) => {
                if (i === index) {
                    const newQty = item.qty + delta;
                    if (newQty < 1) return item;
                    return { ...item, qty: newQty };
                }
                return item;
            });
        });
    };

    const clearCart = () => setCart([]);

    const [appliedDiscount, setAppliedDiscount] = useState<{
        code: string;
        percentage: number;
        minSpend: number;
    } | null>(null);

    const subtotal = useMemo(() => {
        return cart.reduce((acc, item) => {
            let itemTotal = item.price * item.qty;
            if (item.selectedToppings && item.toppings) {
                item.selectedToppings.forEach((toppingName) => {
                    const topping = item.toppings?.find((t) => t.name === toppingName);
                    if (topping) itemTotal += topping.price * item.qty;
                });
            }
            return acc + itemTotal;
        }, 0);
    }, [cart]);

    const discountAmount = useMemo(() => {
        if (!appliedDiscount || subtotal < appliedDiscount.minSpend) return 0;
        return subtotal * (appliedDiscount.percentage / 100);
    }, [subtotal, appliedDiscount]);

    const totalAfterDiscount = subtotal - discountAmount;
    const tax = totalAfterDiscount * 0.10;
    const total = totalAfterDiscount + tax;

    // Mock discount validation (in real app, this would be an API call)
    const applyDiscountCode = (code: string) => {
        const mockDiscounts = [
            { code: "DISKON10", percentage: 10, minSpend: 50000 },
            { code: "HEMAT5", percentage: 5, minSpend: 20000 },
            { code: "SPECIAL", percentage: 20, minSpend: 100000 }
        ];

        const found = mockDiscounts.find(d => d.code.toUpperCase() === code.toUpperCase());
        if (found) {
            setAppliedDiscount(found);
            return { success: true, message: "Diskon berhasil digunakan!" };
        }
        return { success: false, message: "Kode diskon tidak valid." };
    };

    const removeDiscount = () => setAppliedDiscount(null);

    return {
        cart,
        addToCart,
        updateCartItem,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        tax,
        total,
        appliedDiscount,
        applyDiscountCode,
        removeDiscount,
        discountAmount,
        totalAfterDiscount
    };
};
