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

    const [manualDiscount, setManualDiscount] = useState<{
        type: 'fixed' | 'percentage';
        value: number;
    } | null>(null);

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
        let totalDiscount = 0;
        
        // 1. Applied Coupon/Code Discount
        if (appliedDiscount && subtotal >= appliedDiscount.minSpend) {
            totalDiscount += subtotal * (appliedDiscount.percentage / 100);
        }

        // 2. Manual Discount
        if (manualDiscount) {
            if (manualDiscount.type === 'percentage') {
                totalDiscount += subtotal * (manualDiscount.value / 100);
            } else {
                totalDiscount += manualDiscount.value;
            }
        }

        return Math.min(totalDiscount, subtotal); // Cannot discount more than subtotal
    }, [subtotal, appliedDiscount, manualDiscount]);

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

    // Real discount validation using API
    const applyDiscountCode = async (code: string) => {
        try {
            const { apiClient } = await import("../api/client");
            const discount = await apiClient.verifyDiscount(code);
            
            if (discount && discount.isActive) {
                setAppliedDiscount({
                    code: discount.code,
                    percentage: parseFloat(discount.percentage),
                    minSpend: discount.minSpend
                });
                return { success: true, message: "Diskon berhasil digunakan!" };
            }
            return { success: false, message: "Diskon tidak aktif atau tidak ditemukan." };
        } catch (error: any) {
            return { success: false, message: error.message || "Kode diskon tidak valid." };
        }
    };

    const removeDiscount = () => setAppliedDiscount(null);
    const removeManualDiscount = () => setManualDiscount(null);

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
        applyDiscountCode,
        removeDiscount,
        manualDiscount,
        setManualDiscount,
        removeManualDiscount,
        discountAmount,
        totalAfterDiscount
    };
};
