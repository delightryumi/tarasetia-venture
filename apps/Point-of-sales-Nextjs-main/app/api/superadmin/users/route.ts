import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query, where, limit, getDoc } from 'firebase/firestore';
import { hashPassword } from '@/lib/auth/passwordHash';

export async function POST(req: Request) {
  try {
    // 1. Verify Authorization Header
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Akses Ditolak: Memerlukan autentikasi admin.' },
        { status: 401 }
      );
    }

    const { name, username, password, role, restoId } = await req.json();

    if (!name || !username || !password || !role || !restoId) {
      return NextResponse.json(
        { error: 'Semua kolom (name, username, password, role, restoId) wajib diisi' },
        { status: 400 }
      );
    }

    // Check if username is already taken in Firestore
    const cleanUsername = String(username).trim();
    const userQuery = query(collection(db, 'pos_users'), where('username', '==', cleanUsername), limit(1));
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
      name: String(name).trim(),
      username: cleanUsername,
      password: hashPassword(String(password)), // PBKDF2 Cryptographic Hash
      role: String(role).toUpperCase(),
      restoId: String(restoId).trim(),
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'pos_users', userId), newUser);

    return NextResponse.json({ success: true, user: { id: userId, username: cleanUsername } }, { status: 201 });
  } catch (error: any) {
    console.error('Superadmin users POST error:', error);
    return NextResponse.json(
      { error: 'Gagal membuat user baru pada sistem.' },
      { status: 500 }
    );
  }
}
