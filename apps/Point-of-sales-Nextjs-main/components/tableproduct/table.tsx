import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Table } from '@/components/ui/table';
import TableHeadProduct from './components/TableHead';
import TableBodyProduct from './components/TableBody';
import { PaginationDemo } from '@/components/paginations/pagination';
import { fetchProduct } from '@/data/product';
import { PageProps } from '@/types/paginations';
import AddButtonComponent from './components/btn/addProduct';
import RestockButtonComponent from './components/btn/restockProduct';
import ManageCategoryComponent from './components/btn/manageCategory';
import { SearchInput } from '@/components/search/search';
import { toast } from 'react-toastify';
// TableProduct component to display a table of products
export default async function TableProduct(props: PageProps) {
  // Calculate pagination values
  const searchParams = await props.searchParams;
  const pageNumber = Number(searchParams?.page || 1); // Get the page number. Default to 1 if not provided.
  const take = 5;
  const skip = (pageNumber - 1) * take;
  const search =
    typeof searchParams?.search === 'string'
      ? searchParams?.search
      : undefined;
  const result = await fetchProduct({ take, skip, query: search });
  if (!result) {
    // Handle the case where fetchProduct returns undefined, e.g., show an error message
    toast.error('Failed to fetch product data');
    return;
  }
  // Fetch product data based on pagination and search parameters
  const { data, metadata } = result;

  return (
    // Card container for the table
    <Card className="flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full pr-0 sm:pr-6">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle>Products</CardTitle>
          <CardDescription>Manage your products.</CardDescription>
        </CardHeader>
        <div className="flex items-center gap-2 px-6 sm:px-0 pb-4 sm:pb-0">
          <div className="relative flex-1 sm:w-64">
            <SearchInput search={search} />
          </div>
          <ManageCategoryComponent />
          <AddButtonComponent />
          <RestockButtonComponent />
        </div>
      </div>
      {/* Card content with table of products */}
      <CardContent>
        <Table>
          <TableHeadProduct />
          <TableBodyProduct data={data as any} />
        </Table>
      </CardContent>
      {/* Card footer with pagination */}
      <CardFooter className="mt-auto">
        <PaginationDemo {...metadata} />
      </CardFooter>
    </Card>
  );
}
