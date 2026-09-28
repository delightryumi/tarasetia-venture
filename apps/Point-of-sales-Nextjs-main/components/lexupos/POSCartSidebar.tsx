'use client';

import React from 'react';
import { Trash2, Plus, Minus, Pause, ArrowRight, ShoppingBag, ArrowLeft, Utensils, Settings, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem } from './types';
import { useCurrency } from '@/hooks/useCurrency';
import TableSelectorModal from './TableSelectorModal';
import styles from './LexuPos.module.css';

interface POSCartSidebarProps {
  customerName: string;
  setCustomerName: (name: string) => void;
  tableNumber: string;
  setTableNumber: (table: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  cart: CartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onClearCart: () => void;
  subtotal: number;
  tax: number;
  discount: number;
  discountPercent: number;
  setDiscountPercent: (percent: number) => void;
  payableAmount: number;
  splitPaidCredit?: number;
  onHoldOrder: () => void;
  onProceed: () => void;
  onBackToCatalog?: () => void;
}

export default function POSCartSidebar({
  customerName,
  setCustomerName,
  tableNumber,
  setTableNumber,
  notes,
  setNotes,
  cart,
  onUpdateQuantity,
  onClearCart,
  subtotal,
  tax,
  discount,
  discountPercent,
  setDiscountPercent,
  payableAmount,
  splitPaidCredit,
  onHoldOrder,
  onProceed,
  onBackToCatalog,
  onToggleCompliment,
  onSetComplimentReason
}: POSCartSidebarProps & {
  onToggleCompliment?: (cartItemId: string) => void;
  onSetComplimentReason?: (cartItemId: string, reason: string) => void;
}) {
  const { formatCurrency } = useCurrency();
  const [isTableModalOpen, setIsTableModalOpen] = React.useState(false);

  return (
    <div className={styles.cartSidebarColumn}>
      {onBackToCatalog && (
        <div className={styles.cartBackHeader}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToCatalog}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1.5 text-xs font-semibold px-2 py-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Katalog</span>
          </Button>
        </div>
      )}
      
      {/* Customer & Table Inputs Header */}
      <div className={styles.cartHeaderSection}>
        <div className={styles.cartInputsGrid}>
          <div className={styles.inputFieldGroup}>
            <label className={styles.inputLabel}>
              Nama Pelanggan
            </label>
            <input
              type="text"
              placeholder="E.g. Budi"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={styles.cartInput}
            />
          </div>
          
          <div className={styles.inputFieldGroup}>
            <div className={styles.inputLabel}>
              <span>Meja (Table Layout)</span>
              {tableNumber && (
                <button
                  type="button"
                  onClick={() => setTableNumber('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '9px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0
                  }}
                  title="Kosongkan meja"
                >
                  Reset
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsTableModalOpen(true)}
              className={tableNumber ? styles.tableSelectorBtnActive : styles.tableSelectorBtn}
              title="Buka Table Layout"
            >
              <div className={styles.tableSelectorContent}>
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span className={styles.tableSelectorText}>
                  {tableNumber ? tableNumber : 'Pilih Meja'}
                </span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8 }}>
                {tableNumber ? 'Ganti ▾' : '+'}
              </span>
            </button>
          </div>
        </div>

        <div className={styles.cartInputsGrid}>
          <div className={styles.inputFieldGroup}>
            <label className={styles.inputLabel}>
              Catatan / Notes
            </label>
            <input
              type="text"
              placeholder="E.g. Less sugar, extra ice..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={styles.cartInput}
            />
          </div>

          <div className={styles.inputFieldGroup}>
            <label className={styles.inputLabel}>
              Diskon (%)
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={discountPercent || ''}
                onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                className={styles.cartInput}
                style={{ paddingRight: '26px' }}
              />
              <span style={{ position: 'absolute', right: '10px', top: '9px', fontSize: '11px', fontWeight: 700, color: '#71717a' }}>%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Item List */}
      <div className={styles.cartList}>
        <div className={styles.cartListHeader}>
          <h3 className={styles.cartListTitle}>
            Daftar Belanja ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </h3>
          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className={styles.cartClearBtn}
              title="Bersihkan Keranjang"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cart.map((item) => {
            const addonsTotal = item.selectedAddons ? item.selectedAddons.reduce((sum, a) => sum + a.price, 0) : 0;
            const itemPrice = item.product.price + addonsTotal;
            return (
              <div 
                key={item.cartItemId}
                className={styles.cartItemCard}
              >
                <div className={styles.cartItemTop}>
                  <div className={styles.cartItemDetails}>
                    {item.product.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className={styles.cartItemImg}
                      />
                    ) : (
                      <div className={styles.cartItemImg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
                        <Utensils className="w-4 h-4" />
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h4 className={styles.cartItemName}>
                        {item.product.name}
                      </h4>
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <p className={styles.cartItemAddons}>
                          {item.selectedAddons.map(a => a.name).join(', ')}
                        </p>
                      )}
                      {item.note && (
                        <p className={styles.cartItemNote}>
                          &quot;{item.note}&quot;
                        </p>
                      )}
                      <p className={styles.cartItemPrice}>
                        {item.isCompliment ? (
                          <>
                            <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{formatCurrency(itemPrice)}</span>
                            <span className={styles.complimentBadge}>Gratis</span>
                          </>
                        ) : (
                          formatCurrency(itemPrice)
                        )}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                    <div className={styles.cartQtyControl}>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                        className={styles.qtyBtn}
                        aria-label="Kurangi kuantitas"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className={styles.qtyNum}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                        className={styles.qtyBtn}
                        aria-label="Tambah kuantitas"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className={styles.cartItemTotal}>
                      {item.isCompliment ? formatCurrency(0) : formatCurrency(itemPrice * item.quantity)}
                    </span>
                  </div>
                </div>

                {/* Compliment Section */}
                <div className={styles.complimentRow}>
                  <button
                    type="button"
                    onClick={() => onToggleCompliment && onToggleCompliment(item.cartItemId)}
                    className={`${styles.complimentToggleBtn} ${item.isCompliment ? styles.complimentToggleBtnActive : ''}`}
                  >
                    {item.isCompliment ? '✓ Compliment' : 'Compliment?'}
                  </button>

                  {item.isCompliment && (
                    <select
                      value={item.complimentReason || 'Service Recovery'}
                      onChange={(e) => onSetComplimentReason && onSetComplimentReason(item.cartItemId, e.target.value)}
                      className={styles.complimentSelect}
                    >
                      <option value="Service Recovery">Service Recovery</option>
                      <option value="VIP Guest">VIP Guest</option>
                      <option value="Owner Benefit">Owner Benefit</option>
                      <option value="Event Promo">Event Promo</option>
                      <option value="Staff Meal">Staff Meal</option>
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {cart.length === 0 && (
          <div className={styles.cartEmptyBox}>
            <ShoppingBag className="w-10 h-10 stroke-[1.5] mb-2 opacity-30" />
            <p style={{ fontSize: '11.5px', fontWeight: 600 }}>Belum ada item ditambahkan.</p>
          </div>
        )}
      </div>

      {/* Pricing Summary Actions */}
      <div className={styles.cartFooter}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span className={styles.summaryVal}>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <>
              <div className={styles.summaryRow}>
                <span>Diskon</span>
                <span className={styles.summaryVal} style={{ color: '#ef4444' }}>-{formatCurrency(discount)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Total Setelah Diskon</span>
                <span className={styles.summaryVal}>{formatCurrency(subtotal - discount)}</span>
              </div>
            </>
          )}
          <div className={styles.summaryRow}>
            <span>Pajak ({subtotal - discount > 0 ? Math.round((tax / (subtotal - discount)) * 100) : 10}% Service TAX)</span>
            <span className={styles.summaryVal}>{formatCurrency(tax)}</span>
          </div>

          {splitPaidCredit && splitPaidCredit > 0 ? (
            <div className={styles.summaryRow}>
              <span style={{ color: '#10b981', fontWeight: 600 }}>Telah Dibayar (Split)</span>
              <span className={styles.summaryVal} style={{ color: '#10b981' }}>-{formatCurrency(splitPaidCredit)}</span>
            </div>
          ) : null}
          
          <div className={styles.divider} />

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>
              {splitPaidCredit && splitPaidCredit > 0 ? 'Sisa Kurangan' : 'Payable Amount'}
            </span>
            <span className={styles.totalVal} style={splitPaidCredit && splitPaidCredit > 0 ? { color: '#ef4444' } : {}}>
              {formatCurrency(payableAmount)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtonsGrid}>
          <button
            type="button"
            onClick={onHoldOrder}
            className={styles.holdBtn}
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Hold Order</span>
          </button>

          <button
            type="button"
            onClick={onProceed}
            className={styles.proceedBtn}
          >
            <span>Proceed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isTableModalOpen && (
        <TableSelectorModal
          isOpen={isTableModalOpen}
          onClose={() => setIsTableModalOpen(false)}
          selectedTable={tableNumber}
          onSelectTable={(name) => setTableNumber(name)}
        />
      )}
    </div>
  );
}
