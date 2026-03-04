import { useState } from "react";
import type { Transaction, PaymentMethod } from "../types/cashier";

export const usePayment = () => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isQRISModalOpen, setIsQRISModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

    const openPaymentModal = () => {
        setPaymentMethod("CASH");
        setIsPaymentModalOpen(true);
    };
    const closePaymentModal = () => setIsPaymentModalOpen(false);

    const openQRISModal = () => {
        setPaymentMethod("QRIS");
        setIsQRISModalOpen(true);
    };
    const closeQRISModal = () => setIsQRISModalOpen(false);

    const openSuccessModal = (transaction: Transaction) => {
        setLastTransaction(transaction);
        setIsSuccessModalOpen(true);
    };

    const closeSuccessModal = () => {
        setIsSuccessModalOpen(false);
        setLastTransaction(null);
        setPaymentMethod(null);
    };

    return {
        isPaymentModalOpen,
        openPaymentModal,
        closePaymentModal,
        isQRISModalOpen,
        openQRISModal,
        closeQRISModal,
        isSuccessModalOpen,
        openSuccessModal,
        closeSuccessModal,
        paymentMethod,
        lastTransaction,
    };
};


