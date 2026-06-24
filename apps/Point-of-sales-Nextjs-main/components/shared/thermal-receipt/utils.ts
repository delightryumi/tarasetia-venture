import { ReceiptItemData, GroupedItems, CategoryTotals } from './types';

// ─── Beverage Detection ──────────────────────────────────────────────────────
const BEVERAGE_KEYWORDS = [
  'beverage', 'minuman', 'drink', 'bar', 'kopi', 'coffee', 'juice', 'tea',
];

export function isBeverage(category: string, subcategory: string): boolean {
  const c = (category || '').toLowerCase();
  const s = (subcategory || '').toLowerCase();
  return BEVERAGE_KEYWORDS.some(kw => c.includes(kw) || s.includes(kw));
}

// ─── Filter by Print Mode ────────────────────────────────────────────────────
export function filterItemsByMode(
  items: ReceiptItemData[],
  mode: 'all' | 'kitchen' | 'bar'
): ReceiptItemData[] {
  if (mode === 'kitchen') return items.filter(i => !isBeverage(i.category, i.subcategory));
  if (mode === 'bar') return items.filter(i => isBeverage(i.category, i.subcategory));
  return items;
}

// ─── Group & Aggregate ───────────────────────────────────────────────────────
export function groupAndAggregate(items: ReceiptItemData[]): {
  grouped: GroupedItems;
  categoryTotals: CategoryTotals;
  sortedCats: string[];
} {
  const grouped: GroupedItems = {};
  const categoryTotals: CategoryTotals = {};

  items.forEach(item => {
    const cat = item.category || 'Lainnya';
    const sub = item.subcategory || '—';
    if (!grouped[cat]) {
      grouped[cat] = {};
      categoryTotals[cat] = 0;
    }
    if (!grouped[cat][sub]) grouped[cat][sub] = [];
    grouped[cat][sub].push(item);

    if (!item.isCompliment) {
      const addonsTotal = item.selectedAddons
        ? item.selectedAddons.reduce((sum, a) => sum + a.price, 0)
        : 0;
      categoryTotals[cat] += (item.price + addonsTotal) * item.quantity;
    }
  });

  return { grouped, categoryTotals, sortedCats: Object.keys(grouped).sort() };
}

// ─── Payment Method Label ────────────────────────────────────────────────────
export function paymentLabel(method: string): string {
  const map: Record<string, string> = {
    cash: 'TUNAI',
    qris: 'QRIS',
    card: 'KARTU',
    compliment: 'COMPLIMENT',
  };
  return map[method] ?? method;
}
