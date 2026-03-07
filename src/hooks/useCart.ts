import { useState, useMemo } from "react";
import type { CartItem } from "../types/cashier";

export const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [taxRate, setTaxRate] = useState(0.10); // Total rate for compatibility
    const [taxes, setTaxes] = useState<{ name: string; percentage: number }[]>([]);

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
        id: number;
        name: string;
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
        if (appliedDiscount && subtotal >= appliedDiscount.minSpend) {
            return Math.min(subtotal * (appliedDiscount.percentage / 100), subtotal);
        }
        return 0;
    }, [subtotal, appliedDiscount]);

    const totalAfterDiscount = subtotal - discountAmount;
    
    // Detailed Tax Calculation
    const taxDetails = useMemo(() => {
        return taxes.map(t => ({
            name: t.name,
            percentage: t.percentage,
            amount: Math.round(totalAfterDiscount * (t.percentage / 100))
        }));
    }, [totalAfterDiscount, taxes]);

    const tax = taxDetails.reduce((sum, t) => sum + t.amount, 0);
    const total = totalAfterDiscount + tax;

    const applyDiscount = (discount: { id: number; name: string; percentage: number; minSpend: number } | null) => {
        setAppliedDiscount(discount);
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
        taxRate,
        setTaxRate,
        taxes,
        setTaxes,
        taxDetails,
        appliedDiscount,
        applyDiscount,
        removeDiscount,
        discountAmount,
        totalAfterDiscount
    };
};
