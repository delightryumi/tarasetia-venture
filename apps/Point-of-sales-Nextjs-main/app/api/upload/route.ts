import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function validateMagicBytes(buffer: Buffer): { isValid: boolean; extension: string } {
  if (buffer.length < 12) return { isValid: false, extension: '' };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { isValid: true, extension: 'jpg' };
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { isValid: true, extension: 'png' };
  }
  // WebP: RIFF .... WEBP
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { isValid: true, extension: 'webp' };
  }

  return { isValid: false, extension: '' };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawHotelCode = (formData.get('hotelCode') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'File wajib disertakan.' }, { status: 400 });
    }

    const hotelCode = rawHotelCode.trim().replace(/[^a-zA-Z0-9_\-]/g, '');
    if (!hotelCode) {
      return NextResponse.json({ error: 'hotelCode tidak valid.' }, { status: 400 });
    }

    // 1. File size enforcement (Anti-DoS / Quota protection)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 5 MB.' },
        { status: 413 }
      );
    }

    // 2. MIME type whitelist validation
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Tipe file tidak diizinkan. Hanya format JPG, PNG, dan WebP yang didukung.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 3. Deep Magic-Bytes binary inspection (Anti-XSS & Anti-Polyglot Malware)
    const { isValid, extension } = validateMagicBytes(buffer);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Isi file tidak sesuai dengan format gambar yang valid.' },
        { status: 400 }
      );
    }

    // 4. Secure randomized path (Anti-Path Traversal)
    const randomId = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const filename = `hotels/${hotelCode}/products/${timestamp}-${randomId}.${extension}`;

    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(filename);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: 'pos_system',
          originalName: file.name.slice(0, 50).replace(/[^a-zA-Z0-9.\-_]/g, ''),
        },
      },
      public: true,
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error: any) {
    console.error('File upload failed:', error);
    return NextResponse.json({ error: 'Gagal mengunggah file gambar ke penyimpanan.' }, { status: 500 });
  }
}
