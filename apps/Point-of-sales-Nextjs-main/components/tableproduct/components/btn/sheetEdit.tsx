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
import { productSchema } from '@/schema';
import { z } from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
type Data = {
  id: string;
  sellprice: number;
  productstock: {
    id: string;
    name: string;
    cat: string;
    subcategory?: string;
    stock: number;
    price: number;
    imageProduct?: string | null;
  };
};

export function SheetEdit({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: Data;
}) {
  const [productName, setProductName] = useState(data.productstock.name || '');
  const [categoryProduct, setCategories] = useState<string>(
    data.productstock.cat ?? ''
  );
  const [subcategoryProduct, setSubcategories] = useState<string>(
    data.productstock.subcategory ?? ''
  );
  const [sellPrice, setSellPrice] = useState(data.sellprice || '');
  const [stockProduct, setStockProduct] = useState(
    data.productstock.stock || ''
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [subSearchTerm, setSubSearchTerm] = useState<string>('');
  const [imageProductUrl, setImageProductUrl] = useState(data.productstock.imageProduct || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<{ [key: string]: string }>({});

  const stockProductNumber = parseFloat(String(stockProduct)) || 0;
  const sellPriceNumber = parseFloat(String(sellPrice)) || 0;

  const [catProductValues, setCatProductValues] = useState<{name: string, subcategories: string[]}[]>([]);
  const filteredCatProducts = catProductValues.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCatObj = catProductValues.find(c => c.name === categoryProduct);
  const availableSubcats = selectedCatObj ? selectedCatObj.subcategories : [];
  const filteredSubcatProducts = availableSubcats.filter((sub) =>
    sub.toLowerCase().includes(subSearchTerm.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      const loadCategories = async () => {
        try {
          const catSnap = await getDocs(collection(db, 'pos_categories'));
          const dbCats = catSnap.docs.map(doc => ({
            name: doc.data().name,
            subcategories: doc.data().subcategories || []
          }));

          // Ensure current category is in list
          if (categoryProduct && !dbCats.find(c => c.name === categoryProduct)) {
            dbCats.push({ name: categoryProduct, subcategories: [] });
          }
          
          setCatProductValues(dbCats.sort((a,b) => a.name.localeCompare(b.name)));
        } catch (error) {
          console.error('Failed to load categories', error);
        }
      };
      loadCategories();
    }
  }, [open, categoryProduct]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImageProductUrl(response.data.url);
      toast.success('Image uploaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    if (!open) {
      // Reset input value when sheet is closed
      setSearchTerm('');
      setProductName(data.productstock.name || '');
      setSellPrice(data.sellprice || '');
      setStockProduct(data.productstock.stock || '');
      setCategories(data.productstock.cat ?? '');
      setSubcategories(data.productstock.subcategory ?? '');
      setImageProductUrl(data.productstock.imageProduct || '');
    }
  }, [
    open,
    data.productstock.name,
    data.sellprice,
    data.productstock.stock,
    data.productstock.cat,
    data.productstock.imageProduct,
  ]);

  const handleCancel = () => {
    onClose();
    setError({});
  };

  const handleEdit = async () => {
    setLoading(true);

    // Check if the user is online
    const isOnline = navigator.onLine;

    if (!isOnline) {
      toast.error('You are offline. Please check your internet connection.');
      setLoading(false);
      return;
    }

    // Check if any changes were made
    if (
      productName === data.productstock.name &&
      sellPriceNumber === data.sellprice &&
      stockProductNumber === data.productstock.stock &&
      categoryProduct === data.productstock.cat &&
      subcategoryProduct === (data.productstock.subcategory || '') &&
      imageProductUrl === (data.productstock.imageProduct || '')
    ) {
      toast.info('No changes made.');
      setLoading(false);
      onClose();
      return;
    }

    try {
      const validatedData = productSchema.parse({
        productName: productName,
        buyPrice: data.productstock.price,
        sellPrice: sellPriceNumber,
        stockProduct: stockProductNumber,
        category: categoryProduct,
        subcategory: subcategoryProduct === 'none' ? undefined : (subcategoryProduct || undefined),
        imageProduct: imageProductUrl || undefined,
      });

      // Send validated data using axios
      await axios.patch(`/api/product/${data.productstock.id}`, validatedData);
      onClose();
      router.refresh();
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
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit product</SheetTitle>
          <SheetDescription>
            Make changes to your product here. Click save when you're done.
          </SheetDescription>
          <div
            onClick={handleCancel}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
          >
            <Cross2Icon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </div>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="productName" className="text-right">
              Product Name
            </Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                setError((prevError) => ({ ...prevError, productName: '' }));
              }}
              className="col-span-3"
            />
            {error?.productName && (
              <div className="col-start-2 col-span-3 text-red-500">
                {error.productName}
              </div>
            )}

            <Label htmlFor="sellPrice" className="text-right">
              Sell Price
            </Label>
            <Input
              id="sellPrice"
              value={sellPrice}
              onChange={(e) => {
                setSellPrice(e.target.value);
                setError((prevError) => ({ ...prevError, sellPrice: '' }));
              }}
              className="col-span-3"
              type="number"
            />
            {error?.sellPrice && (
              <div className="col-start-2 col-span-3 text-red-500">
                {error.sellPrice}
              </div>
            )}
            <Label htmlFor="stockProduct" className="text-right">
              Stock
            </Label>
            <Input
              id="stockProduct"
              value={stockProduct}
              onChange={(e) => {
                setStockProduct(e.target.value);
                setError((prevError) => ({ ...prevError, stockProduct: '' }));
              }}
              className="col-span-3"
              type="number"
            />
            {error?.stockProduct && (
              <div className="col-start-2 col-span-3 text-red-500">
                {error.stockProduct}
              </div>
            )}
            <Label htmlFor="categoryProduct" className="text-right">
              Category
            </Label>
            <div className="col-span-3 flex flex-col gap-1">
              <Select
                value={categoryProduct}
                onValueChange={(newValue) => {
                  setCategories(newValue);
                  setError((prevError) => ({
                    ...prevError,
                    category: '',
                  }));
                }}
              >
                <SelectTrigger id="categoryProduct" className="w-full">
                  <SelectValue
                    placeholder={
                      searchTerm
                        ? searchTerm.charAt(0).toUpperCase() +
                          searchTerm.slice(1).toLowerCase()
                        : 'Select Category'
                    }
                    onClick={() => setSearchTerm('')}
                  />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[250px] overflow-y-auto thin-scrollbar">
                  <input
                    type="text"
                    value={
                      searchTerm.charAt(0).toUpperCase() +
                      searchTerm.slice(1).toLowerCase()
                    }
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search Category"
                    style={{ padding: '5px', margin: '5px 0', width: '100%' }}
                  />
                  {filteredCatProducts.map((product) => (
                    <SelectItem key={product.name} value={product.name}>
                      {product.name.charAt(0).toUpperCase() +
                        product.name.slice(1).toLowerCase()}
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

            <Label htmlFor="subcategoryProduct" className="text-right">
              Subcategory
            </Label>
            <div className="col-span-3 flex flex-col gap-1">
              <Select
                value={subcategoryProduct}
                onValueChange={(newValue) => setSubcategories(newValue)}
                disabled={!categoryProduct}
              >
                <SelectTrigger id="subcategoryProduct" className="w-full">
                  <SelectValue
                    placeholder={
                      subSearchTerm
                        ? subSearchTerm.charAt(0).toUpperCase() +
                          subSearchTerm.slice(1).toLowerCase()
                        : 'Select Subcategory (Optional)'
                    }
                    onClick={() => setSubSearchTerm('')}
                  />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[250px] overflow-y-auto thin-scrollbar">
                  <input
                    type="text"
                    value={
                      subSearchTerm.charAt(0).toUpperCase() +
                      subSearchTerm.slice(1).toLowerCase()
                    }
                    onChange={(e) => setSubSearchTerm(e.target.value)}
                    placeholder="Search Subcategory"
                    style={{ padding: '5px', margin: '5px 0', width: '100%' }}
                  />
                  {filteredSubcatProducts.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub.charAt(0).toUpperCase() +
                        sub.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                  <SelectItem value="none" className="text-muted-foreground italic">None (Clear)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Label htmlFor="imageProduct" className="text-right">
              Photo
            </Label>
            <div className="col-span-3 space-y-2">
              {imageProductUrl ? (
                <div className="relative w-24 h-24 border rounded-md overflow-hidden bg-muted">
                  <img src={imageProductUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageProductUrl('')}
                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 hover:bg-destructive/80"
                  >
                    <Cross2Icon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="imageProduct"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="cursor-pointer"
                  />
                  {uploadingImage && <ReloadIcon className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              )}
            </div>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button
              onClick={handleEdit}
              type="submit"
              disabled={loading}
              className="text-gray-100"
            >
              {loading ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                'Save change'
              )}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
