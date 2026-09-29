import { NextRequest, NextResponse } from 'next/server';
import net from 'net';

export const runtime = 'nodejs';

// ESC/POS Command Byte definitions
const ESC = '\x1b';
const GS = '\x1d';

const CMD = {
  INIT: `${ESC}@`,
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  DOUBLE_ON: `${GS}!\x11`,
  DOUBLE_OFF: `${GS}!\x00`,
  UNDERLINE_ON: `${ESC}-\x01`,
  UNDERLINE_OFF: `${ESC}-\x00`,
  FEED_AND_CUT: `${GS}V\x41\x03`, // Feed paper and partial cut
  KICK_DRAWER: `${ESC}p\x00\x19\xfa`, // Standard cash drawer kick pulse
};

function formatTwoCols(left: string, right: string, width: number): string {
  const maxLeft = width - right.length - 1;
  const truncatedLeft = left.length > maxLeft ? left.substring(0, maxLeft) : left;
  const spaces = Math.max(1, width - truncatedLeft.length - right.length);
  return truncatedLeft + ' '.repeat(spaces) + right + '\n';
}

function formatCurrencyRaw(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val || 0);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      printerIp,
      printerPort = 9100,
      paperSize = '80mm',
      printMode = 'all',
      orderData
    } = body;

    if (!printerIp) {
      return NextResponse.json(
        { success: false, error: 'IP Address Printer belum diatur!' },
        { status: 400 }
      );
    }

    const width = paperSize === '58mm' ? 32 : 48;
    const divider = '-'.repeat(width) + '\n';
    const doubleDivider = '='.repeat(width) + '\n';

    // Build raw ESC/POS string
    let buffer = '';
    buffer += CMD.INIT;

    // Header: Store info
    buffer += CMD.ALIGN_CENTER;
    buffer += CMD.BOLD_ON;
    buffer += CMD.DOUBLE_ON;
    buffer += (orderData.storeName || 'LEXUPOS RESTO & LOUNGE') + '\n';
    buffer += CMD.DOUBLE_OFF;
    buffer += CMD.BOLD_OFF;

    if (orderData.storeAddress) {
      buffer += orderData.storeAddress + '\n';
    }
    if (orderData.storePhone) {
      buffer += `Telp: ${orderData.storePhone}\n`;
    }

    // Print Mode Title
    buffer += '\n';
    buffer += CMD.BOLD_ON;
    if (printMode === 'checker') {
      buffer += '*** STRUK CHECKER ***\n';
      buffer += '(BUKAN BUKTI PEMBAYARAN SAH)\n';
    } else if (printMode === 'kitchen') {
      buffer += '*** TIKET DAPUR / KITCHEN ***\n';
    } else if (printMode === 'bar') {
      buffer += '*** TIKET BAR / MINUMAN ***\n';
    } else {
      buffer += '*** STRUK PEMBAYARAN ***\n';
    }
    buffer += CMD.BOLD_OFF;
    buffer += doubleDivider;

    // Order Metadata
    buffer += CMD.ALIGN_LEFT;
    buffer += formatTwoCols(`No. Trx : ${orderData.transactionId || '-'}`, '', width);
    buffer += formatTwoCols(`Tanggal : ${orderData.date || new Date().toLocaleString('id-ID')}`, '', width);
    buffer += formatTwoCols(`Kasir   : ${orderData.cashierName || 'Kasir'}`, `Meja: ${orderData.tableNumber || 'Take Away'}`, width);
    buffer += formatTwoCols(`Tamu    : ${orderData.customerName || 'Guest'}`, `Metode: ${(orderData.paymentMethod || 'CASH').toUpperCase()}`, width);
    
    if (orderData.notes) {
      buffer += formatTwoCols(`Catatan : ${orderData.notes}`, '', width);
    }
    buffer += divider;

    // Items Section
    buffer += CMD.BOLD_ON;
    buffer += formatTwoCols('MENU / ITEM', 'TOTAL', width);
    buffer += CMD.BOLD_OFF;
    buffer += divider;

    const items = orderData.items || [];
    items.forEach((item: any) => {
      const qty = item.quantity || item.qty || 1;
      const price = Number(item.price || 0);
      const addonsTotal = (item.addons || []).reduce((sum: number, a: any) => sum + Number(a.price || 0), 0);
      const totalItem = (price + addonsTotal) * qty;

      buffer += CMD.BOLD_ON;
      buffer += formatTwoCols(`${qty}x ${item.name}`, formatCurrencyRaw(totalItem), width);
      buffer += CMD.BOLD_OFF;

      if (addonsTotal > 0 || (item.addons && item.addons.length > 0)) {
        item.addons.forEach((ad: any) => {
          buffer += formatTwoCols(`  + ${ad.name || ad}`, ad.price ? formatCurrencyRaw(Number(ad.price)) : '', width);
        });
      }

      if (item.note) {
        buffer += `  * Note: ${item.note}\n`;
      }
    });

    buffer += divider;

    // Financial Totals (Only in Kasir or Checker mode)
    if (printMode === 'all' || printMode === 'checker') {
      buffer += formatTwoCols('Subtotal', formatCurrencyRaw(orderData.subtotal || 0), width);
      
      if (orderData.discount > 0) {
        buffer += formatTwoCols('Diskon', `-${formatCurrencyRaw(orderData.discount)}`, width);
      }
      if (orderData.service > 0) {
        buffer += formatTwoCols(`Layanan (${orderData.serviceRate || 0}%)`, formatCurrencyRaw(orderData.service), width);
      }
      if (orderData.tax > 0) {
        buffer += formatTwoCols(`PB1 / Tax (${orderData.taxRate || 10}%)`, formatCurrencyRaw(orderData.tax), width);
      }

      buffer += doubleDivider;
      buffer += CMD.BOLD_ON;
      buffer += CMD.DOUBLE_ON;
      buffer += formatTwoCols('TOTAL', formatCurrencyRaw(orderData.payableAmount || 0), width);
      buffer += CMD.DOUBLE_OFF;
      buffer += CMD.BOLD_OFF;
      buffer += doubleDivider;

      if (orderData.cashAmount !== undefined && orderData.cashAmount !== null) {
        buffer += formatTwoCols('Tunai Diterima', formatCurrencyRaw(Number(orderData.cashAmount)), width);
        buffer += formatTwoCols('Kembalian', formatCurrencyRaw(Number(orderData.changeAmount || 0)), width);
      }
    }

    // Footer
    buffer += '\n';
    buffer += CMD.ALIGN_CENTER;
    if (printMode === 'checker') {
      buffer += '*** NOTED: BUKAN STRUK PEMBAYARAN SAH ***\n';
      buffer += 'Struk ini adalah lembar checker internal.\n';
    } else if (printMode === 'kitchen' || printMode === 'bar') {
      buffer += '--- SEGERA PROSES PESANAN DI ATAS ---\n';
    } else {
      buffer += 'Terima kasih atas kunjungan Anda\n';
      buffer += 'Struk ini adalah bukti pembayaran yang sah\n';
    }

    buffer += '\n';
    buffer += CMD.BOLD_ON;
    buffer += 'powered by\n';
    buffer += 'MY TARA\n';
    buffer += CMD.BOLD_OFF;

    buffer += '\n\n\n';
    buffer += CMD.FEED_AND_CUT;

    // Kick cash drawer open only on finalized payment receipt
    if (printMode === 'all' && orderData.status !== 'UNPAID') {
      buffer += CMD.KICK_DRAWER;
    }

    // Connect to thermal printer via TCP socket
    const printPromise = new Promise<{ success: boolean; message: string; error?: string }>((resolve) => {
      const client = new net.Socket();
      client.setTimeout(4000); // 4 seconds timeout

      client.connect(Number(printerPort), String(printerIp), () => {
        client.write(Buffer.from(buffer, 'latin1'), () => {
          client.end();
          resolve({
            success: true,
            message: `Struk berhasil dicetak ke Printer IP ${printerIp}:${printerPort}`
          });
        });
      });

      client.on('timeout', () => {
        client.destroy();
        resolve({
          success: false,
          message: `Koneksi ke Printer ${printerIp}:${printerPort} waktu habis.`,
          error: `Koneksi ke Printer ${printerIp}:${printerPort} waktu habis (Timeout 4s). Pastikan printer menyala dan kabel LAN terhubung.`
        });
      });

      client.on('error', (err: any) => {
        client.destroy();
        resolve({
          success: false,
          message: `Gagal menghubungkan ke Printer: ${err.message}`,
          error: `Gagal menghubungkan ke Printer ${printerIp}:${printerPort} (${err.code || err.message}).`
        });
      });
    });

    const result = await printPromise;

    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Direct IP print error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan sistem print.' },
      { status: 500 }
    );
  }
}
