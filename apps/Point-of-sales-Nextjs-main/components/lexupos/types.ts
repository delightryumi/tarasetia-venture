export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  subcategory?: string;
  image: string;
  description?: string;
  addons?: {name: string, price: number}[];
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  isCompliment?: boolean;
  complimentReason?: string;
  selectedAddons?: {name: string, price: number}[];
  note?: string;
}

export type PaymentMethodType = 'cash' | 'qris' | 'card' | 'compliment';

