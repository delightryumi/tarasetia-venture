import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, query, where, limit, getDoc } from 'firebase/firestore';
import { hashPassword, verifyPassword, generateSessionSignature } from '@/lib/auth/passwordHash';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    // 1. Check if restos exists in Firestore
    const restosSnap = await getDocs(collection(db, 'pos_restos'));
    if (restosSnap.empty) {
      // Seed default restaurant
      const defaultRestoId = 'default-resto';
      await setDoc(doc(db, 'pos_restos', defaultRestoId), {
        name: 'Bumi Cafe & Bistro',
        address: 'Jl. Raya Anyom No. 42',
        createdAt: new Date().toISOString(),
      });

      // Seed default shopdata config in settings/pos
      await setDoc(doc(db, 'settings', 'pos'), {
        name: 'Bumi Cafe & Bistro',
        tax: 10,
        address: 'Jl. Raya Anyom No. 42',
        phone: '+62 123-4567-890',
      });

      // Seed default users WITH PBKDF2 HASHED PASSWORDS
      const defaultUsers = [
        {
          id: 'user-owner',
          name: 'Owner Bumi Cafe',
          username: 'owner1',
          password: hashPassword('owner123'),
          role: 'OWNER',
          restoId: defaultRestoId,
        },
        {
          id: 'user-kasir',
          name: 'Kasir Bumi Cafe',
          username: 'kasir1',
          password: hashPassword('kasir123'),
          role: 'WORKER',
          restoId: defaultRestoId,
        },
        {
          id: 'user-superadmin',
          name: 'Superadmin Korporat',
          username: 'superadmin1',
          password: hashPassword('admin123'),
          role: 'SUPERADMIN',
          restoId: '',
        },
      ];

      for (const u of defaultUsers) {
        await setDoc(doc(db, 'pos_users', u.id), u);
      }

      console.log('Seeded default POS multi-tenant users with PBKDF2 hashed passwords successfully');
    }

    // 2. Find user in Firestore by username
    const userQuery = query(collection(db, 'pos_users'), where('username', '==', String(username).trim()), limit(1));
    const userSnap = await getDocs(userQuery);

    if (userSnap.empty) {
      return NextResponse.json(
        { error: 'Kredensial tidak valid' },
        { status: 401 }
      );
    }

    const userDoc = userSnap.docs[0];
    const user = userDoc.data();

    // 3. Cryptographically verify password with auto-rehash support
    const { isValid, needsRehash } = verifyPassword(String(password), user.password || '');
    if (!isValid) {
      return NextResponse.json(
        { error: 'Kredensial tidak valid' },
        { status: 401 }
      );
    }

    // Auto-upgrade legacy plaintext password to secure PBKDF2 hash in Firestore!
    if (needsRehash) {
      try {
        const secureHash = hashPassword(String(password));
        await updateDoc(doc(db, 'pos_users', userDoc.id), {
          password: secureHash,
          securityUpgradedAt: new Date().toISOString(),
        });
        console.log(`[POS Security] Upgraded password for user ${user.username} to PBKDF2 hash.`);
      } catch (err) {
        console.warn('Could not upgrade password hash:', err);
      }
    }

    // Fetch resto name if any
    let restoName = 'Belum Terhubung ke Resto';
    if (user.restoId) {
      const restoDoc = await getDoc(doc(db, 'pos_restos', user.restoId));
      if (restoDoc.exists()) {
        restoName = restoDoc.data().name || 'Restaurant';
      }
    }

    // 4. Generate signed session token
    const sessionToken = generateSessionSignature({
      id: userDoc.id,
      username: user.username,
      role: user.role,
      restoId: user.restoId || '',
    });

    // 5. Return user profile and session token
    return NextResponse.json({
      success: true,
      token: sessionToken,
      user: {
        id: userDoc.id,
        name: user.name,
        username: user.username,
        role: user.role,
        restoId: user.restoId || '',
        restoName,
      },
    });
  } catch (error: any) {
    console.error('Error in login API:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses login.' },
      { status: 500 }
    );
  }
}
