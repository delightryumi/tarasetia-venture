/* eslint-disable react/no-unescaped-entities */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Cross2Icon, ReloadIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { restockSchema } from '@/schema';
import { z } from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { getHotelCollection } from '@/lib/firestoreHelper';

export function SheetRestock({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [stockProduct, setStockProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [searchCatTerm, setSearchCatTerm] = useState('');
  const [searchProdTerm, setSearchProdTerm] = useState('');

  const [error, setError] = useState<{ [key: string]: string }>({});
  const stockProductNumber = parseFloat(stockProduct) || 0;

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      const loadData = async () => {
        try {
          const snap = await getDocs(getHotelCollection(db, 'pos_products'));
          const prods = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setProducts(prods);
          
          let dbCats: string[] = [];
          const catSnap = await getDocs(getHotelCollection(db, 'pos_categories'));
          dbCats = catSnap.docs.map(doc => doc.data().name);
          
          const prodCats = prods.map((p: any) => p.category);
          const allCats = Array.from(new Set([...dbCats, ...prodCats])).filter(c => typeof c === 'string' && c.trim() !== '');
          setCategories(allCats.sort());
        } catch (error) {
          console.error('Error fetching products:', error);
        }
      };
      loadData();
    } else {
      // Reset input values when sheet is closed
      setStockProduct('');
      setSelectedCategory('');
      setSelectedProductId('');
      setSearchCatTerm('');
      setSearchProdTerm('');
      setError({});
    }
  }, [open]);

  const handleCancel = () => {
    onClose();
    setError({});
  };

  const handleAdd = async () => {
    setLoading(true);
    // Check if the user is online
    const isOnline = navigator.onLine;

    if (!isOnline) {
      toast.error('You are offline. Please check your internet connection.');
      setLoading(false);
      return;
    }

    try {
      const validatedData = restockSchema.parse({
        category: selectedCategory,
        productId: selectedProductId,
        stock: stockProductNumber,
      });

      // Send validated data using axios
      const response = await axios.post('/api/restock', validatedData);

      // If no errors, close the dialog and refresh the page
      onClose();
      router.refresh();
      toast.success('Stock updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          fieldErrors[path] = err.message;
        });
        setError((prevError) => ({
          ...prevError,
          ...fieldErrors,
        }));
      } else {
        console.error(error);
        toast.error('An error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(searchCatTerm.toLowerCase())
  );

  const filteredProducts = products
    .filter(p => p.category === selectedCategory)
    .filter(p => (p.name || '').toLowerCase().includes(searchProdTerm.toLowerCase()));

  return (
    <Sheet open={open}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Restock product</SheetTitle>
          <SheetDescription>Restock your product here.</SheetDescription>
          <div
            onClick={handleCancel}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary cursor-pointer"
          >
            <Cross2Icon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </div>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            
            <Label htmlFor="categorySelect" className="text-right">
              Category
            </Label>
            <div className="col-span-3 flex flex-col gap-1">
              <Select
                value={selectedCategory}
                onValueChange={(newValue) => {
                  setSelectedCategory(newValue);
                  setSelectedProductId(''); // reset product when category changes
                  setError((prev) => ({ ...prev, category: '', productId: '' }));
                }}
              >
                <SelectTrigger id="categorySelect" className="w-full">
                  <SelectValue
                    placeholder={
                      searchCatTerm
                        ? searchCatTerm.charAt(0).toUpperCase() +
                          searchCatTerm.slice(1).toLowerCase()
                        : 'Select Category'
                    }
                    onClick={() => setSearchCatTerm('')}
                  />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[250px] overflow-y-auto thin-scrollbar">
                  <input
                    type="text"
                    value={
                      searchCatTerm.charAt(0).toUpperCase() +
                      searchCatTerm.slice(1).toLowerCase()
                    }
                    onChange={(e) => setSearchCatTerm(e.target.value)}
                    placeholder="Search Category"
                    style={{ padding: '5px', margin: '5px 0', width: '100%' }}
                  />
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error?.category && (
                <div className="text-red-500 text-sm">
                  {error.category}
                </div>
              )}
            </div>

            <Label htmlFor="productSelect" className="text-right">
              Product
            </Label>
            <div className="col-span-3 flex flex-col gap-1">
              <Select
                value={selectedProductId}
                onValueChange={(newValue) => {
                  setSelectedProductId(newValue);
                  setError((prev) => ({ ...prev, productId: '' }));
                }}
                disabled={!selectedCategory}
              >
                <SelectTrigger id="productSelect" className="w-full">
                  <SelectValue
                    placeholder={
                      !selectedCategory 
                        ? 'Select Category First' 
                        : (searchProdTerm || 'Select Product')
                    }
                    onClick={() => setSearchProdTerm('')}
                  />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[250px] overflow-y-auto thin-scrollbar">
                  <input
                    type="text"
                    value={searchProdTerm}
                    onChange={(e) => setSearchProdTerm(e.target.value)}
                    placeholder="Search Product"
                    style={{ padding: '5px', margin: '5px 0', width: '100%' }}
                  />
                  {filteredProducts.length === 0 ? (
                    <div className="p-2 text-sm text-neutral-500">No products found</div>
                  ) : (
                    filteredProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {error?.productId && (
                <div className="text-red-500 text-sm">
                  {error.productId}
                </div>
              )}
            </div>

            <Label htmlFor="stockProduct" className="text-right">
              Add Stock
            </Label>
            <div className="col-span-3 flex flex-col gap-1">
              <Input
                id="stockProduct"
                value={stockProduct}
                onChange={(e) => {
                  setStockProduct(e.target.value);
                  setError((prevError) => ({ ...prevError, stock: '' }));
                }}
                className="w-full"
                type="number"
                placeholder="0"
                disabled={!selectedProductId}
              />
              {error?.stock && (
                <div className="text-red-500 text-sm">
                  {error.stock}
                </div>
              )}
            </div>
            
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button
              onClick={handleAdd}
              type="submit"
              disabled={loading || !selectedProductId || !stockProduct}
              className="text-gray-100"
            >
              {loading ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                'Add Stock'
              )}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
