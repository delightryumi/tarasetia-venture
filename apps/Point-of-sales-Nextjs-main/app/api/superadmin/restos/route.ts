import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

export async function GET() {
  try {
    const restosSnap = await getDocs(collection(db, 'pos_restos'));
    const usersSnap = await getDocs(collection(db, 'pos_users'));
    const productsSnap = await getDocs(collection(db, 'pos_products'));
    const revenueSnap = await getDocs(collection(db, 'daily_revenue'));

    const users = usersSnap.docs.map(d => d.data());
    const products = productsSnap.docs.map(d => d.data());
    
    // Count transactions from daily_revenue entries
    let transactionCount = 0;
    revenueSnap.forEach(docSnap => {
      const entries = docSnap.data().entries || [];
      transactionCount += entries.length;
    });

    const restos = restosSnap.docs.map((docSnap) => {
      const r = docSnap.data();
      const rId = docSnap.id;
      const userCount = users.filter((u: any) => u.restoId === rId).length;
      const productCount = products.length;

      return {
        id: rId,
        name: r.name,
        address: r.address || '',
        createdAt: r.createdAt || new Date().toISOString(),
        _count: {
          User: userCount,
          ProductStock: productCount,
          Transaction: transactionCount,
        },
      };
    });

    return NextResponse.json(restos);
  } catch (error: any) {
    console.error('Superadmin restos GET error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data resto: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, address } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Nama resto wajib diisi' },
        { status: 400 }
      );
    }

    const restoId = `resto-${Math.random().toString(36).substring(2, 10)}`;
    const newResto = {
      name,
      address: address || '',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'pos_restos', restoId), newResto);

    return NextResponse.json({ success: true, resto: { id: restoId, ...newResto } }, { status: 201 });
  } catch (error: any) {
    console.error('Superadmin restos POST error:', error);
    return NextResponse.json(
      { error: 'Gagal membuat resto baru: ' + error.message },
      { status: 500 }
    );
  }
}
