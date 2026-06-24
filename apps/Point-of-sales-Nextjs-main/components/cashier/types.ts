export interface TransactionLog {
  id: string;
  amount: number;
  method: 'cash' | 'qris' | 'card';
  timestamp: string;
  items?: any[];
  revenueType?: string;
  category?: string;
}

export interface CashFlowEntry {
  id: string;
  amount: number;
  note: string;
  timestamp: string;
  type: 'in' | 'out';
}

export interface ShiftData {
  id: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  houseBank: number;
  transactions: TransactionLog[];
  countedCash?: number;
  notes?: string;
  status: 'open' | 'closed';
  cashIn?: number;
  cashOut?: number;
  cashInNotes?: string;
  cashOutNotes?: string;
  cashFlows?: CashFlowEntry[];
}
