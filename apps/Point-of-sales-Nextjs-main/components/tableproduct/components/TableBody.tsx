'use client';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import Dropdown from './btn/Dropdown';
import { Badge } from '@/components/ui/badge';
import SkeletonRow from '@/components/skeleton/products';
import { useState, useEffect } from 'react';
import { useCurrency } from '@/hooks/useCurrency';

interface ProductData {
  id: string;
  sellprice: number;
  productstock: {
    id: string;
    name: string;
    cat: string;
    subcategory?: string;
    stock: number;
    price: number;
    imageProduct?: string;
  };
}

// Define the props for the TableBodyProduct component
interface TableBodyProductProps {
  data: ProductData[];
}

// TableBodyProduct component to render the table body for products
const TableBodyProduct: React.FC<TableBodyProductProps> = ({ data }) => {
  const { formatCurrency } = useCurrency();
  // State to manage loading state
  const [loading, setLoading] = useState<boolean>(true);
  // State to manage product data
  const [productData, setProductData] = useState<ProductData[]>([]);

  // useEffect to simulate data fetching
  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      setProductData(data);
      setLoading(false);
    }, 1000); // Simulate a delay of 1 second
  }, [data]);

  return (
    <TableBody>
      {/* Render skeleton rows if loading */}
      {loading
        ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        : // Render product data if not loading
          productData.map((item) => (
            <TableRow key={item.id}>
              {/* Render product image */}
              <TableCell className="p-4">
                {item.productstock.imageProduct ? (
                  <img
                    src={item.productstock.imageProduct}
                    alt={item.productstock.name}
                    className="w-10 h-10 object-cover rounded-md border"
                  />
                ) : (
                  <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-md border text-muted-foreground font-bold text-xs">
                    N/A
                  </div>
                )}
              </TableCell>
              {/* Render product name */}
              <TableCell className="font-medium pl-4">
                {item.productstock.name}
              </TableCell>
              {/* Render product category */}
              <TableCell className="pl-4">
                <Badge variant="outline">
                  {item.productstock.cat.charAt(0).toUpperCase() +
                    item.productstock.cat.slice(1).toLowerCase()}
                </Badge>
              </TableCell>
              {/* Render product sub category */}
              <TableCell className="pl-4">
                {item.productstock.subcategory ? (
                  <Badge variant="secondary" className="text-[10px] font-medium">
                    {item.productstock.subcategory.charAt(0).toUpperCase() +
                      item.productstock.subcategory.slice(1).toLowerCase()}
                  </Badge>
                ) : (
                  <span className="text-xs text-neutral-400">—</span>
                )}
              </TableCell>
              {/* Render product sell price */}
              <TableCell className="pl-5">{formatCurrency(item.sellprice)}</TableCell>
              {/* Render product stock */}
              <TableCell className="hidden md:table-cell pl-6">
                {item.productstock.stock}
              </TableCell>
              {/* Render dropdown for product actions */}
              <TableCell>
                <Dropdown product={item} />
              </TableCell>
            </TableRow>
          ))}
    </TableBody>
  );
};

export default TableBodyProduct;
