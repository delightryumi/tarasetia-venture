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

import { getHotelCollection } from '@/lib/firestoreHelper';

export function SheetAdd({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [productName, setProductName] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stockProduct, setStockProduct] = useState('');
  const [categoryProduct, setCategories] = useState<string>('');
  const [subcategoryProduct, setSubcategories] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [subSearchTerm, setSubSearchTerm] = useState<string>('');
  const [imageProductUrl, setImageProductUrl] = useState('');
  const [description, setDescription] = useState('');
  const [addons, setAddons] = useState<{name: string, price: number}[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<{ [key: string]: string }>({});
  const stockProductNumber = parseFloat(stockProduct) || 0;
  const sellPriceNumber = parseFloat(sellPrice) || 0;
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
          const catSnap = await getDocs(getHotelCollection(db, 'pos_categories'));
          const dbCats = catSnap.docs.map(doc => ({
            name: doc.data().name,
            subcategories: doc.data().subcategories || []
          }));
          
          setCatProductValues(dbCats.sort((a,b) => a.name.localeCompare(b.name)));
        } catch (error) {
          console.error(error);
        }
      };
      loadCategories();
    }
  }, [open]);
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
      setProductName('');
      setSellPrice('');
      setStockProduct('');
      setCategories('');
      setSubcategories('');
      setImageProductUrl('');
      setDescription('');
      setAddons([]);
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
      const validatedData = productSchema.parse({
        productName: productName,
        buyPrice: 0,
        sellPrice: sellPriceNumber,
        stockProduct: stockProductNumber,
        category: categoryProduct,
        subcategory: subcategoryProduct === 'none' ? undefined : (subcategoryProduct || undefined),
        imageProduct: imageProductUrl || undefined,
        description: description,
        addons: addons,
      });

      // Send validated data using axios
      const response = await axios.post('/api/product', validatedData);

      // If no errors, close the dialog and refresh the page
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
        // Handle other types of errors here
        toast.error('An error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add product</SheetTitle>
          <SheetDescription>Add your product here.</SheetDescription>
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
              onWheel={(e) => e.currentTarget.blur()}
              onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
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
              onWheel={(e) => e.currentTarget.blur()}
              onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
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

            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product description..."
              className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />

            <Label className="text-right">
              Add-ons (Modifiers)
            </Label>
            <div className="col-span-3 flex flex-col gap-2">
              {addons.map((addon, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Name (e.g. Extra Shot)"
                    value={addon.name}
                    onChange={(e) => {
                      const newAddons = [...addons];
                      newAddons[index].name = e.target.value;
                      setAddons(newAddons);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Price (e.g. 5000)"
                    value={addon.price}
                    onChange={(e) => {
                      const newAddons = [...addons];
                      newAddons[index].price = parseInt(e.target.value) || 0;
                      setAddons(newAddons);
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                  />
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => {
                      const newAddons = [...addons];
                      newAddons.splice(index, 1);
                      setAddons(newAddons);
                    }}
                  >
                    <Cross2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddons([...addons, { name: '', price: 0 }])}
              >
                + Add Modifier
              </Button>
            </div>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button
              onClick={handleAdd}
              type="submit"
              disabled={loading}
              className="bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              {loading ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                'Add Product'
              )}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
