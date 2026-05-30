import * as z from 'zod';

// Dynamic categories allowed

export const productSchema = z
  .object({
    productName: z
      .string()
      .min(2, 'Product name must be at least 2 characters')
      .min(1, 'Product name cannot be empty'),
    buyPrice: z
      .number()
      .optional()
      .default(0),
    sellPrice: z
      .number()
      .positive('Sell price must be a positive number')
      .min(0.01, 'Sell price min $0.01'),
    stockProduct: z
      .number()
      .positive('Stock must be a positive number')
      .min(1, 'Stock min 1'),
    category: z
      .string()
      .min(1, 'Category cannot be empty'),
    subcategory: z
      .string()
      .optional(),
    imageProduct: z
      .string()
      .optional(),
  })
  .refine(
    (data) =>
      data.buyPrice == null ||
      data.buyPrice === 0 ||
      data.sellPrice == null ||
      data.sellPrice > data.buyPrice,
    {
      message: 'Sell price must be greater than buy price',
      path: ['sellPrice'],
    }
  );
export const onsaleSchema = z.object({
  productId: z.string().min(1, 'Select Product'),
  qTy: z.number().positive('Qty must be a positive number').min(1, 'Qty min 1'),
  transactionId: z.string().min(1, 'Transaction Id is Empty'),
});
export const orderSchema = z.object({
  qTy: z.number().positive('Qty must be a positive number').min(1, 'Qty min 1'),
});
export const taxSchema = z.object({
  tax: z.number().min(0, 'Tax min 0').max(100, 'Tax max 100'),
  service: z.number().min(0, 'Service min 0').max(100, 'Service max 100').optional(),
  lostBreakage: z.number().min(0, 'Lost Breakage min 0').max(100, 'Lost Breakage max 100').optional(),
});
export const shopnameSchema = z.object({
  storeName: z
    .string()
    .min(1, 'Store Name is Empty')
    .min(2, 'Store Name min 2 characters'),
  address: z.string().optional(),
  phone: z.string().optional(),
});
export const restockSchema = z.object({
  category: z.string().min(1, 'Category must be selected'),
  productId: z.string().min(1, 'Product must be selected'),
  stock: z
    .number()
    .positive('stock must be a positive number')
    .min(1, 'stock min 1'),
});
