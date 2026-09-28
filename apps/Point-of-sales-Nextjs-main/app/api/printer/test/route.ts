import { NextRequest, NextResponse } from 'next/server';
import net from 'net';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { printerIp, printerPort = 9100 } = await req.json();

    if (!printerIp) {
      return NextResponse.json({ success: false, error: 'IP Address Printer belum diisi.' }, { status: 400 });
    }

    const testPromise = new Promise<{ success: boolean; message: string; latency?: number }>((resolve) => {
      const startTime = Date.now();
      const client = new net.Socket();
      client.setTimeout(3000);

      client.connect(Number(printerPort), String(printerIp), () => {
        const latency = Date.now() - startTime;
        // Send a tiny ESC @ initialization and line feed to test
        client.write(Buffer.from('\x1b@\n=== TEST KONEKSI PRINTER POS OK ===\n\x1dV\x41\x03', 'latin1'), () => {
          client.end();
          resolve({
            success: true,
            latency,
            message: `Printer IP ${printerIp}:${printerPort} Terhubung Normal (${latency}ms)`
          });
        });
      });

      client.on('timeout', () => {
        client.destroy();
        resolve({
          success: false,
          message: `Koneksi ke Printer ${printerIp}:${printerPort} Timeout (3s). Printer tidak merespons.`
        });
      });

      client.on('error', (err: any) => {
        client.destroy();
        resolve({
          success: false,
          message: `Gagal koneksi ke Printer ${printerIp}:${printerPort}: ${err.code || err.message}`
        });
      });
    });

    const result = await testPromise;
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
