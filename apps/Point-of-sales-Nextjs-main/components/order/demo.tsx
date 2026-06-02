'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import TableHeadOrders from './components/Thead';
import TableBodyOrders from './components/Tbody';
import FullscreenButton from '@/components/fullscreen/fullscreen';
import Detail from './components/detail';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ReceiptText, Sheet, Plus, Trash2, Delete, LogOut } from 'lucide-react';
import { DialogAdd } from './components/dialogAdd';
import axios from 'axios';
import { TransactionData } from '@/types/transaction';
import eventBus from '@/lib/even';
import { ReloadIcon } from '@radix-ui/react-icons';
import { AlertDialogDeletetransaction } from './components/dialogDelete';
import { toast } from 'react-toastify';
import { localDb as dexieDb } from '@/lib/dexie';

export function Orders() {
  const router = useRouter();
  const [dialogAddOpen, setDialogAddOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    let dashboardUrl = '';
    
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
      if (isLocal) {
        dashboardUrl = 'http://localhost:3000/select-module';
      }
    }

    if (!dashboardUrl) {
      dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || (typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname.replace('pos.', 'dashboard.').replace(':3001', ':3000')}/select-module`
        : 'http://localhost:3000/select-module');
    }
    window.location.href = `${dashboardUrl}?logout=true`;
  };

  const [dialogDeleteOpen, setDialogDeleteOpen] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [transactionData, setTransactionData] = useState<TransactionData[]>([]);
  const [showTable, setShowTable] = useState(true);
  const [loading, setLoading] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedTransactionId = localStorage.getItem('transactionId');
    if (typeof window !== 'undefined' && storedTransactionId) {
      setTransactionId(storedTransactionId);
    }
  }, []);

  useEffect(() => {
    // Fetch transaction data when component mounts or transactionId changes
    const fetchTransactionData = async () => {
      try {
        if (!transactionId) {
          setTransactionData([]);
          return;
        }

        // Check local Dexie status first
        const localTx = await dexieDb.transactions.get(transactionId);
        const isOnline = navigator.onLine;

        if (localTx && (localTx.isSynced === 0 || !isOnline)) {
          const items = await dexieDb.transactionItems
            .where('transactionId')
            .equals(transactionId)
            .toArray();

          const mappedItems: TransactionData[] = [];
          for (const item of items) {
            const prod = await dexieDb.products.get(item.productId);
            mappedItems.push({
              id: item.id?.toString() || Math.random().toString(),
              productId: item.productId,
              quantity: item.quantity,
              transactionId: item.transactionId,
              product: {
                sellprice: item.price,
                productstock: {
                  name: prod?.name || item.name || 'Produk',
                  cat: prod?.cat || 'FOOD',
                },
              },
            });
          }

          setTransactionData(mappedItems);
          return;
        }

        // Otherwise load from server
        if (!isOnline) {
          toast.error(
            'You are offline. Please check your internet connection.'
          );
          return;
        }

        const response = await axios.get(`/api/transactions/${transactionId}`);
        if (response.status === 200) {
          const data = response.data;
          setTransactionData(Array.isArray(data) ? data : [data]);
        } else {
          console.error('Failed to fetch transaction data');
        }
      } catch (error: any) {
        if (error.response && error.response.status === 405) {
          // Data not found, remove transactionId from localStorage
          localStorage.removeItem('transactionId');
          setTransactionId(null);
          toast.warn('Transaction not found in the database.');
        } else if (error.response && error.response.status === 404) {
          // Data not found, no need to show error
          setTransactionData([]);
        } else {
          toast.error(
            'An error occurred while fetching transaction data:' + error
          );
        }
      }
    };

    fetchTransactionData();

    const handleEventBusEvent = () => {
      fetchTransactionData();
    };

    const handleEventBusEventClear = () => {
      setTransactionData([]);
    };

    // Subscribe to eventBus event to fetch transaction data
    eventBus.on('fetchTransactionData', handleEventBusEvent);

    // Subscribe to eventBus event to fetch transaction data
    eventBus.on('clearTransactionData', handleEventBusEventClear);

    // Clean up event listener
    return () => {
      eventBus.removeListener('fetchTransactionData', handleEventBusEvent);
    };
  }, [transactionId]);

  const createTransaction = async () => {
    // Create new transaction if transactionId is not set
    if (!transactionId) {
      setLoading(true);
      try {
        const userJson = localStorage.getItem('user');
        const restoId = userJson ? JSON.parse(userJson).restoId : '';

        // Generate clean client-side UUID format
        const generatedId = `TRS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

        // Save locally to Dexie IndexedDB
        await dexieDb.transactions.add({
          id: generatedId,
          restoId: restoId || 'default-resto',
          totalPrice: 0,
          createdAt: new Date().toISOString(),
          isSynced: 0,
        });

        localStorage.setItem('transactionId', generatedId);
        setTransactionId(generatedId);
        setLoading(false);
      } catch (error) {
        toast.error('An error occurred: ' + error);
        setLoading(false);
        return;
      }
    }

    setDialogAddOpen(true);
  };

  const handleDialogAddOpen = () => {
    createTransaction();
  };

  const handleDialogDeleteOpen = () => {
    setDialogDeleteOpen(true);
  };

  const handleDialogAddClose = () => {
    setDialogAddOpen(false);
  };

  const handleDialogDeleteClose = async () => {
    setDialogDeleteOpen(false);
  };

  return (
    <div ref={tableRef} className="w-full h-full">
      <Card className="h-full w-full flex flex-col">
        <div className="relative">
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>{transactionId}</CardDescription>
            <FullscreenButton targetRef={tableRef} />
            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
              className="absolute top-2 right-12 p-2 border-red-900/20 hover:bg-red-950/20 text-red-500 hover:text-red-400"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-start">
              <div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowTable(!showTable)}
                >
                  {showTable ? <ReceiptText /> : <Sheet />}
                </Button>
              </div>
              <div className="pl-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={loading}
                  onClick={handleDialogAddOpen}
                >
                  {loading ? <ReloadIcon className="animate-spin" /> : <Plus />}
                </Button>
              </div>
              <div className="pl-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDialogDeleteOpen}
                  disabled={!transactionId}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          </CardHeader>
        </div>
        <CardContent className="overflow-auto z-0">
          {showTable ? (
            <Table>
              <TableHeadOrders />
              <TableBodyOrders data={transactionData} />
            </Table>
          ) : (
            <Detail
              data={transactionData}
              transactionId={transactionId}
              setTransactionId={setTransactionId}
            />
          )}
          <DialogAdd
            open={dialogAddOpen}
            onClose={handleDialogAddClose}
            transactionId={transactionId}
          />
          <AlertDialogDeletetransaction
            open={dialogDeleteOpen}
            onClose={handleDialogDeleteClose}
            transactionId={transactionId}
            setTransactionId={setTransactionId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
