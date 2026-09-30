export type QrType = 'table' | 'takeaway' | 'menu_view' | 'booking' | 'site' | 'receipt_feedback' | 'custom';

export interface QrLink {
  id: string;
  type: QrType;
  label: string;
  tableId: string | null;
  tableName: string | null;
  menuId: string | null;
  menuName: string | null;
  targetUrl: string | null;
  url: string;
  token: string;
  isActive: boolean;
  scanCount: number;
  lastScannedAt: string | null;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export type QrPrintTemplate = 'tent' | 'sticker' | 'sheet';

export interface QrTabConfig {
  key: string;
  label: string;
  types: QrType[];
  description: string;
}
