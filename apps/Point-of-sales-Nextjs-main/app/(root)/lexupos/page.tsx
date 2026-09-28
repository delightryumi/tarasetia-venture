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
import styles from '@/components/lexupos/LexuPos.module.css';

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
    splitPaidCredit,
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
    handleConfirmSplitPayment,
    handleCloseReceipt,
    checkActiveShift,
    transactionId,
    receiptStatus,
    setReceiptStatus,
    heldOrderToPrint,
    setHeldOrderToPrint,
    activeSplitData
  } = useLexuPos();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden print:hidden">
      <div className="flex flex-1 flex-col w-full h-full overflow-hidden">
        <div className={styles.posContainer}>
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
            customerName={receiptStatus === 'UNPAID' && heldOrderToPrint ? heldOrderToPrint.customerName : (activeSplitData?.customerName || customerName)}
            tableNumber={receiptStatus === 'UNPAID' && heldOrderToPrint ? heldOrderToPrint.tableNumber : tableNumber}
            notes={activeSplitData ? (notes ? `${notes} | ${activeSplitData.splitLabel}` : activeSplitData.splitLabel) : (receiptStatus === 'UNPAID' && heldOrderToPrint ? heldOrderToPrint.notes : notes)}
            paymentMethod={activeSplitData ? activeSplitData.paymentMethod : (receiptStatus === 'UNPAID' ? 'unpaid' : paymentMethod)}
            cart={activeSplitData ? activeSplitData.paidItems : (receiptStatus === 'UNPAID' && heldOrderToPrint ? heldOrderToPrint.cart : cart)}
            subtotal={activeSplitData ? activeSplitData.subtotal : (receiptStatus === 'UNPAID' && heldOrderToPrint ? heldOrderToPrint.subtotal : subtotal)}
            tax={activeSplitData ? activeSplitData.tax : (receiptStatus === 'UNPAID' && heldOrderToPrint ? heldOrderToPrint.tax : tax)}
            discount={activeSplitData ? 0 : (receiptStatus === 'UNPAID' && heldOrderToPrint ? heldOrderToPrint.discount : discount)}
            payableAmount={activeSplitData ? activeSplitData.payableAmount : (receiptStatus === 'UNPAID' && heldOrderToPrint ? heldOrderToPrint.payableAmount : payableAmount)}
            cashAmount={receiptStatus === 'UNPAID' ? '0' : cashAmount}
            cashierName={receiptStatus === 'UNPAID' && heldOrderToPrint ? heldOrderToPrint.cashierName : cashierName}
            status={receiptStatus}
            onClose={handleCloseReceipt}
            transactionId={receiptStatus === 'UNPAID' && heldOrderToPrint ? heldOrderToPrint.id : transactionId}
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
              <div className={`${styles.catalogColumn} ${showCart ? 'hidden lg:flex' : 'flex'}`}>
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
              <div className={`${styles.cartSidebarColumn} ${showCart ? 'flex w-full lg:w-[380px]' : 'hidden lg:flex'}`}>
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
                  splitPaidCredit={splitPaidCredit}
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
              splitPaidCredit={splitPaidCredit}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              cashAmount={cashAmount}
              setCashAmount={setCashAmount}
              onBackToPOS={() => setStep('pos')}
              onConfirmPayment={executePayment}
              onConfirmSplitPayment={handleConfirmSplitPayment}
              taxRatePercent={taxRatePercent}
              revenueType={revenueType}
              setRevenueType={setRevenueType}
            />
          )}
        </div>
      </div>
    </div>
  );
}
