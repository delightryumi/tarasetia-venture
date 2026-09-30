/**
 * E-Receipt Payload Encoder/Decoder
 * Client-Side Payload Compression
 */

export interface StatelessReceiptData {
  shopInfo: {
    name: string;
    address?: string;
    phone?: string;
    npwp?: string;
  };
  transactionInfo: {
    id: string;
    date: string;
    customerName?: string;
    cashierName?: string;
    tableName?: string;
    paymentMethod?: string;
    status?: string;
    cancelReason?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    addons?: string;
    note?: string;
  }>;
  totals: {
    subtotal: number;
    discount?: number;
    taxRate?: number;
    taxAmount?: number;
    serviceRate?: number;
    serviceAmount?: number;
    payableAmount: number;
    cashAmount?: number;
    changeAmount?: number;
  };
  footer?: {
    message?: string;
    socialMedia?: string;
    wifiInfo?: string;
  };
}

export function encodeReceiptData(data: StatelessReceiptData): string {
  try {
    const compact: Record<string, any> = {
      s: data.shopInfo?.name || '',
      id: data.transactionInfo?.id || '',
      d: data.transactionInfo?.date || '',
      m: data.transactionInfo?.paymentMethod || '',
      st: data.transactionInfo?.status || 'PAID',
      tot: data.totals?.payableAmount || 0,
      i: (data.items || []).map(it => {
        const row: any[] = [it.name, it.quantity, it.price];
        if (it.addons || it.note) {
          row.push(it.addons || '');
          if (it.note) row.push(it.note);
        }
        return row;
      })
    };

    if (data.shopInfo?.address) compact.a = data.shopInfo.address;
    if (data.shopInfo?.phone) compact.p = data.shopInfo.phone;
    if (data.shopInfo?.npwp) compact.n = data.shopInfo.npwp;
    if (data.transactionInfo?.customerName) compact.c = data.transactionInfo.customerName;
    if (data.transactionInfo?.cashierName) compact.k = data.transactionInfo.cashierName;
    if (data.transactionInfo?.tableName) compact.t = data.transactionInfo.tableName;
    if (data.totals?.subtotal) compact.sub = data.totals.subtotal;
    if (data.totals?.discount) compact.disc = data.totals.discount;
    if (data.totals?.taxAmount) compact.tax = data.totals.taxAmount;
    if (data.totals?.taxRate) compact.txr = data.totals.taxRate;
    if (data.totals?.serviceAmount) compact.srv = data.totals.serviceAmount;
    if (data.totals?.serviceRate) compact.srvr = data.totals.serviceRate;
    if (data.totals?.cashAmount) compact.cash = data.totals.cashAmount;
    if (data.totals?.changeAmount) compact.chg = data.totals.changeAmount;
    if (data.footer?.message) compact.msg = data.footer.message;
    if (data.footer?.socialMedia) compact.sm = data.footer.socialMedia;
    if (data.footer?.wifiInfo) compact.w = data.footer.wifiInfo;

    const jsonStr = JSON.stringify(compact);
    if (typeof window !== 'undefined') {
      const bytes = new TextEncoder().encode(jsonStr);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return encodeURIComponent(urlSafe);
    } else {
      const base64 = Buffer.from(jsonStr, 'utf-8').toString('base64');
      const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return encodeURIComponent(urlSafe);
    }
  } catch (err) {
    console.error('Error encoding receipt payload:', err);
    return '';
  }
}

export function decodeReceiptData(encoded: string): StatelessReceiptData | null {
  try {
    if (!encoded) return null;
    let cleanStr = decodeURIComponent(encoded).trim();
    // Normalize spaces (+ replaced by browser query string parsing) and URL-safe characters
    cleanStr = cleanStr.replace(/-/g, '+').replace(/_/g, '/').replace(/ /g, '+');
    while (cleanStr.length % 4 !== 0) {
      cleanStr += '=';
    }

    let jsonStr = '';
    if (typeof window !== 'undefined') {
      try {
        const binary = atob(cleanStr);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        jsonStr = new TextDecoder().decode(bytes);
      } catch {
        // Fallback for legacy escape/unescape strings
        jsonStr = decodeURIComponent(escape(atob(cleanStr)));
      }
    } else {
      jsonStr = Buffer.from(cleanStr, 'base64').toString('utf-8');
    }

    const c = JSON.parse(jsonStr);
    return {
      shopInfo: {
        name: c.s || '',
        address: c.a || '',
        phone: c.p || '',
        npwp: c.n || ''
      },
      transactionInfo: {
        id: c.id || '',
        date: c.d || '',
        customerName: c.c || '',
        cashierName: c.k || '',
        tableName: c.t || '',
        paymentMethod: c.m || '',
        status: c.st || 'PAID'
      },
      items: (c.i || []).map((it: any) => ({
        name: it[0] || '',
        quantity: Number(it[1]) || 1,
        price: Number(it[2]) || 0,
        addons: it[3] || '',
        note: it[4] || ''
      })),
      totals: {
        subtotal: Number(c.sub) || 0,
        discount: Number(c.disc) || 0,
        taxAmount: Number(c.tax) || 0,
        taxRate: Number(c.txr) || 0,
        serviceAmount: Number(c.srv) || 0,
        serviceRate: Number(c.srvr) || 0,
        payableAmount: Number(c.tot) || 0,
        cashAmount: Number(c.cash) || 0,
        changeAmount: Number(c.chg) || 0
      },
      footer: {
        message: c.msg || '',
        socialMedia: c.sm || '',
        wifiInfo: c.w || ''
      }
    };
  } catch (err) {
    console.error('Error decoding receipt payload:', err);
    return null;
  }
}
