import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const hotelCode = formData.get('hotelCode') as string;

    if (!file) {
      return NextResponse.json({ error: 'File is required.' }, { status: 400 });
    }
    if (!hotelCode) {
      return NextResponse.json({ error: 'hotelCode is required.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload path
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const filename = `hotels/${hotelCode}/products/${timestamp}-${cleanFileName}`;
    
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(filename);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
      public: true,
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error: any) {
    console.error('File upload failed:', error);
    return NextResponse.json({ error: 'File upload failed: ' + error.message }, { status: 500 });
  }
}
