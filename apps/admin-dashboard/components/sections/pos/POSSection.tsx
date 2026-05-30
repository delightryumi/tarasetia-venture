"use client";

import React, { useState } from "react";
import { usePOS } from "./usePOS";
import { ProductGrid } from "./components/ProductGrid";
import { CartSidebar } from "./components/CartSidebar";
import { PaymentModal } from "./components/PaymentModal";
import "./POSStyles.css";

/**
 * Nexura POS Section - Main Orchestrator
 * High-Fidelity Terminal Interface for Bumi Anyom Resort
 */
export const POSSection: React.FC = () => {
    const {
        products, cart, activeCategory, setActiveCategory,
        loading, addToCart,
        updateQuantity, subtotal, tax, total, 
        isPaymentModalOpen, setIsPaymentModalOpen, processCheckout, clearCart
    } = usePOS();

    const [customerName, setCustomerName] = useState("");

    return (
        <div className="flex flex-col lg:flex-row h-full w-full max-w-[1440px] mx-auto pos-canvas">
            {/* ── LEFT: Product Navigation & Grid ── */}
            <ProductGrid 
                products={products}
                loading={loading}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                addToCart={addToCart}
            />

            {/* ── RIGHT: Transaction & Checkout Sidebar ── */}
            <CartSidebar 
                cart={cart}
                customerName={customerName}
                setCustomerName={setCustomerName}
                clearCart={clearCart}
                updateQuantity={updateQuantity}
                subtotal={subtotal}
                tax={tax}
                total={total}
                onCheckout={() => setIsPaymentModalOpen(true)}
            />

            {/* ── Payment Overlay ── */}
            <PaymentModal 
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                total={total}
                customerName={customerName}
                setCustomerName={setCustomerName}
                onConfirm={processCheckout}
            />
        </div>
    );
};
