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

    const [discount, setDiscount] = useState<number>(0);

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

    const totalAfterDiscount = useMemo(() => {
        return subtotal * (1 - discount / 100);
    }, [subtotal, discount]);

    const tax = totalAfterDiscount * 0.10;
    const total = totalAfterDiscount + tax;

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
        discount,
        setDiscount,
        totalAfterDiscount
    };
};
