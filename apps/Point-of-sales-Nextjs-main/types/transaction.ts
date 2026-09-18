export interface ProductStock {
  name: string;
  cat: string;
  subcategory?: string;
}

export interface Product {
  sellprice: number;
  productstock: ProductStock;
  name?: string;
  price?: number;
  category?: string;
  subcategory?: string;
}

export interface TransactionData {
  id: string;
  productId: string;
  quantity: number;
  transactionId: string;
  product: Product;
  saledate?: string | Date;
  discount?: number;
  isCompliment?: boolean;
  complimentReason?: string;
  paymethod?: string;
  paymentMethod?: string;
  status?: string;
  cancelReason?: string;
  tableNumber?: string;
  table?: string;
  customerName?: string;
  cashierName?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  cashAmount?: number;
  changeAmount?: number;
  notes?: string;
  selectedAddons?: any[];
  note?: string;
}