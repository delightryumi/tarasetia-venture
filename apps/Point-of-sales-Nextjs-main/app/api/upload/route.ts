import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Safe extraction of file extension from MIME type
    const fileExtension = file.type ? file.type.split('/')[1] : 'png';
    const cleanExtension = fileExtension.split('+')[0] || 'png'; // e.g. svg+xml -> svg
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${cleanExtension}`;

    const storageRef = ref(storage, `products/${filename}`);
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    await uploadBytes(storageRef, uint8Array, {
      contentType: file.type || 'image/png',
    });

    const fileUrl = await getDownloadURL(storageRef);
    return NextResponse.json({ url: fileUrl });
  } catch (error: any) {
    console.error('Error handling upload to Firebase Storage:', error);
    return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
  }
}
