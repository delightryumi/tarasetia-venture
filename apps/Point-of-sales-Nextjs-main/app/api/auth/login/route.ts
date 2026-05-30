import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query, where, limit, getDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

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

      // Seed default users
      const defaultUsers = [
        {
          id: 'user-owner',
          name: 'Owner Bumi Cafe',
          username: 'owner1',
          password: 'owner123',
          role: 'OWNER',
          restoId: defaultRestoId,
        },
        {
          id: 'user-kasir',
          name: 'Kasir Bumi Cafe',
          username: 'kasir1',
          password: 'kasir123',
          role: 'WORKER',
          restoId: defaultRestoId,
        },
        {
          id: 'user-superadmin',
          name: 'Superadmin Korporat',
          username: 'superadmin1',
          password: 'admin123',
          role: 'SUPERADMIN',
          restoId: '',
        },
      ];

      for (const u of defaultUsers) {
        await setDoc(doc(db, 'pos_users', u.id), u);
      }

      // Seed default products in pos_products
      const defaultProducts = [
        { name: 'Nasi Goreng Spesial', category: 'FOOD', buyPrice: 15000, price: 20000, stock: 50 },
        { name: 'Es Teh Manis', category: 'DRINK', buyPrice: 3000, price: 5000, stock: 100 },
        { name: 'Kopi Susu Gula Aren', category: 'DRINK', buyPrice: 8000, price: 15000, stock: 80 },
        { name: 'Kaos Nexura Pro', category: 'FASHION', buyPrice: 50000, price: 85000, stock: 20 },
      ];

      for (let i = 0; i < defaultProducts.length; i++) {
        const p = defaultProducts[i];
        const customId = `PRD-DEMO-${i + 1}`;
        await setDoc(doc(db, 'pos_products', customId), {
          name: p.name,
          category: p.category,
          buyPrice: p.buyPrice,
          price: p.price,
          stock: p.stock,
          image: '',
        });
      }

      console.log('Seeded default multi-tenant Resto, Users, and Products to Firestore successfully');
    }

    // 2. Find user in Firestore by username
    const userQuery = query(collection(db, 'pos_users'), where('username', '==', username), limit(1));
    const userSnap = await getDocs(userQuery);

    if (userSnap.empty) {
      return NextResponse.json(
        { error: 'Username tidak ditemukan' },
        { status: 404 }
      );
    }

    const userDoc = userSnap.docs[0];
    const user = userDoc.data();

    // 3. Verify password
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      );
    }

    // Fetch resto name if any
    let restoName = 'Belum Terhubung ke Resto';
    if (user.restoId) {
      const restoDoc = await getDoc(doc(db, 'pos_restos', user.restoId));
      if (restoDoc.exists()) {
        restoName = restoDoc.data().name || 'Restaurant';
      }
    }

    // 4. Return user profile and tenant ID
    return NextResponse.json({
      success: true,
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
      { error: 'Terjadi kesalahan internal server: ' + error.message },
      { status: 500 }
    );
  }
}
