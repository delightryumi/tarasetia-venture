import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query, where, limit, getDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { name, username, password, role, restoId } = await req.json();

    if (!name || !username || !password || !role || !restoId) {
      return NextResponse.json(
        { error: 'Semua kolom (name, username, password, role, restoId) wajib diisi' },
        { status: 400 }
      );
    }

    // Check if username is already taken in Firestore
    const userQuery = query(collection(db, 'pos_users'), where('username', '==', username), limit(1));
    const userSnap = await getDocs(userQuery);

    if (!userSnap.empty) {
      return NextResponse.json(
        { error: 'Username sudah digunakan oleh akun lain' },
        { status: 400 }
      );
    }

    // Verify resto exists in Firestore
    const restoDoc = await getDoc(doc(db, 'pos_restos', restoId));
    if (!restoDoc.exists()) {
      return NextResponse.json(
        { error: 'Restaurant tidak ditemukan' },
        { status: 404 }
      );
    }

    const userId = `user-${Math.random().toString(36).substring(2, 10)}`;
    const newUser = {
      id: userId,
      name,
      username,
      password,
      role,
      restoId,
    };

    await setDoc(doc(db, 'pos_users', userId), newUser);

    return NextResponse.json({ success: true, user: { id: userId, username } }, { status: 201 });
  } catch (error: any) {
    console.error('Superadmin users POST error:', error);
    return NextResponse.json(
      { error: 'Gagal membuat user baru: ' + error.message },
      { status: 500 }
    );
  }
}
