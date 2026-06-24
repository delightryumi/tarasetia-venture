'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

// LexuPos UI Components
import HoldConfirmDialog from '@/components/lexupos/HoldConfirmDialog';
import ReceiptDialog from '@/components/lexupos/ReceiptDialog';
import POSCartSidebar from '@/components/lexupos/POSCartSidebar';
import PaymentWorkspace from '@/components/lexupos/PaymentWorkspace';
import ProductDetailModalLexupos from '@/components/lexupos/ProductDetailModalLexupos';
import POSCatalogView from '@/components/lexupos/POSCatalogView';

// Hook containing all state and business logic
import { useLexuPos } from './hooks/useLexuPos';

export default function LexuPosPage() {
  const { formatCurrency } = useCurrency();
  const {
    step,
    setStep,
    selectedCategory,
    handleCategoryChange,
    searchQuery,
    setSearchQuery,
    cart,
    discountPercent,
    setDiscountPercent,
    showCart,
    setShowCart,
    selectedProduct,
    isModalOpen,
    setIsModalOpen,
    customerName,
    setCustomerName,
    tableNumber,
    setTableNumber,
    notes,
    setNotes,
    revenueType,
    setRevenueType,
    paymentMethod,
    setPaymentMethod,
    cashAmount,
    setCashAmount,
    isReceiptOpen,
    setIsReceiptOpen,
    cashierName,
    taxRatePercent,
    selectedSubcategory,
    setSelectedSubcategory,
    isHoldConfirmOpen,
    setIsHoldConfirmOpen,
    dynamicCategories,
    dynamicSubcategories,
    filteredProducts,
    handleProductClick,
    handleAddToCart,
    updateQuantity,
    clearCart,
    subtotal,
    discount,
    tax,
    payableAmount,
    handleToggleCompliment,
    handleSetComplimentReason,
    handleHoldConfirm,
    handleProceed,
    executePayment,
    handleCloseReceipt,
    checkActiveShift,
    transactionId
  } = useLexuPos();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden print:hidden">
      <div className="flex flex-1 flex-col w-full h-full overflow-hidden">
        <div className="w-full h-full flex md:rounded-xl overflow-hidden bg-white dark:bg-zinc-950 border-0 md:border border-neutral-200 dark:border-white/[0.1] shadow-none md:shadow-sm relative">
          {/* Dynamic Style Tag to completely hide browser scrollbars */}
          <style>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none !important;
            }
            .no-scrollbar {
              -ms-overflow-style: none !important;  /* IE and Edge */
              scrollbar-width: none !important;  /* Firefox */
            }
          `}</style>

          {/* Confirmation Dialog Component */}
          <HoldConfirmDialog
            isOpen={isHoldConfirmOpen}
            onOpenChange={setIsHoldConfirmOpen}
            onConfirm={handleHoldConfirm}
          />

          {/* Receipt Dialog Component */}
          <ReceiptDialog
            isOpen={isReceiptOpen}
            onOpenChange={setIsReceiptOpen}
            customerName={customerName}
            tableNumber={tableNumber}
            notes={notes}
            paymentMethod={paymentMethod}
            cart={cart}
            subtotal={subtotal}
            tax={tax}
            discount={discount}
            payableAmount={payableAmount}
            cashAmount={cashAmount}
            cashierName={cashierName}
            onClose={handleCloseReceipt}
            transactionId={transactionId}
          />

          <ProductDetailModalLexupos 
            product={selectedProduct}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAddToCart={handleAddToCart}
            formatCurrency={formatCurrency}
          />

          {step === 'pos' ? (
            <>
              {/* Left Side: Product Selection */}
              <div className={`flex-1 h-full flex min-w-0 ${showCart ? 'hidden lg:flex' : 'flex'}`}>
                <POSCatalogView
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={handleCategoryChange}
                  categories={dynamicCategories}
                  subcategories={dynamicSubcategories}
                  selectedSubcategory={selectedSubcategory}
                  setSelectedSubcategory={setSelectedSubcategory}
                  filteredProducts={filteredProducts}
                  onAddToCart={handleProductClick}
                />
              </div>

              {/* Right Side: Cart Summary */}
              <div className={`h-full shrink-0 ${showCart ? 'flex w-full lg:w-auto' : 'hidden lg:flex'}`}>
                <POSCartSidebar
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  tableNumber={tableNumber}
                  setTableNumber={setTableNumber}
                  notes={notes}
                  setNotes={setNotes}
                  cart={cart}
                  onUpdateQuantity={updateQuantity}
                  onClearCart={clearCart}
                  subtotal={subtotal}
                  tax={tax}
                  discount={discount}
                  discountPercent={discountPercent}
                  setDiscountPercent={setDiscountPercent}
                  payableAmount={payableAmount}
                  onHoldOrder={() => {
                    if (!checkActiveShift()) return;
                    setIsHoldConfirmOpen(true);
                  }}
                  onProceed={handleProceed}
                  onBackToCatalog={() => setShowCart(false)}
                  onToggleCompliment={handleToggleCompliment}
                  onSetComplimentReason={handleSetComplimentReason}
                />
              </div>

              {/* Mobile Floating Cart Button */}
              {!showCart && cart.length > 0 && (
                <button
                  onClick={() => setShowCart(true)}
                  className="fixed bottom-24 right-6 z-50 lg:hidden bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <ShoppingBag size={18} />
                  <span className="bg-white text-emerald-600 font-bold text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                  <span className="text-[11px] font-extrabold">{formatCurrency(payableAmount)}</span>
                </button>
              )}
            </>
          ) : (
            /* Payment Step Interface */
            <PaymentWorkspace
              customerName={customerName}
              tableNumber={tableNumber}
              notes={notes}
              cart={cart}
              subtotal={subtotal}
              tax={tax}
              discount={discount}
              payableAmount={payableAmount}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              cashAmount={cashAmount}
              setCashAmount={setCashAmount}
              onBackToPOS={() => setStep('pos')}
              onConfirmPayment={executePayment}
              revenueType={revenueType}
              setRevenueType={setRevenueType}
            />
          )}
        </div>
      </div>
    </div>
  );
}
