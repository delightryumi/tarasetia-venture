export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  subcategory?: string;
  image: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethodType = 'cash' | 'qris' | 'card';
