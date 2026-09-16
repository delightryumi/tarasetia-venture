import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  query, 
  where 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXkuVRloHHbBYpKungDNWKCgNiqeVudqc",
  authDomain: "crs-nexura.firebaseapp.com",
  projectId: "crs-nexura",
  storageBucket: "crs-nexura.firebasestorage.app",
  messagingSenderId: "105295874197",
  appId: "1:105295874197:web:c10fe9ce787f21699bf39c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function repairPosShiftTransactions() {
  console.log("=== Memulai Audit & Pemulihan Transaksi POS dan Shift ===");

  const hotelsSnap = await getDocs(collection(db, "hotels"));
  const hotelCodes = hotelsSnap.docs.map(d => d.id);
  console.log("Ditemukan hotel codes:", hotelCodes);

  let totalOrdersRepaired = 0;
  let totalRevTxsCreated = 0;

  for (const hotelCode of hotelCodes) {
    console.log(`\n--- Memeriksa Hotel: ${hotelCode} ---`);
    const shiftsSnap = await getDocs(collection(db, "hotels", hotelCode, "cashier_shifts"));
    console.log(`Total shift ditemukan: ${shiftsSnap.size}`);

    for (const shiftDoc of shiftsSnap.docs) {
      const shiftData = shiftDoc.data();
      const shiftId = shiftDoc.id;
      const txs = shiftData.transactions || [];

      if (txs.length === 0) continue;

      for (const t of txs) {
        if (!t.id) continue;

        let orderDocRef = doc(db, "hotels", hotelCode, "pos_orders", t.id);
        let orderSnap = await getDoc(orderDocRef);

        if (!orderSnap.exists()) {
          // Coba cari by transactionId
          const qOrder = query(
            collection(db, "hotels", hotelCode, "pos_orders"), 
            where("transactionId", "==", t.id)
          );
          const qSnap = await getDocs(qOrder);
          if (!qSnap.empty) {
            orderDocRef = qSnap.docs[0].ref;
            orderSnap = qSnap.docs[0];
          }
        }

        if (orderSnap.exists()) {
          const od = orderSnap.data();
          const updates = {};

          // 1. Perbaiki shiftId yang null/hilang
          if (!od.shiftId) {
            updates.shiftId = shiftId;
          }

          // 2. Normalisasi paymentMethod jika kosong atau 'Cashier' padahal t.method terdefinisi
          const orderMethod = (od.paymentMethod || "").toLowerCase();
          const txMethod = (t.method || "").toLowerCase();
          if ((!orderMethod || orderMethod === "cashier") && txMethod) {
            updates.paymentMethod = txMethod;
          }

          // 3. Pastikan cashAmount dan changeAmount tidak undefined
          if (od.cashAmount === undefined) {
            updates.cashAmount = (od.paymentMethod === "cash" || txMethod === "cash") ? Number(od.total || t.amount || 0) : 0;
          }
          if (od.changeAmount === undefined) {
            updates.changeAmount = 0;
          }

          if (Object.keys(updates).length > 0) {
            await updateDoc(orderDocRef, updates);
            totalOrdersRepaired++;
            console.log(`[REPAIRED ORDER] ${t.id} -> shiftId: ${shiftId}, method: ${updates.paymentMethod || od.paymentMethod}`);
          }

          // 4. Pastikan revenue_transactions ada untuk pesanan ini
          const revTxRef = doc(db, "hotels", hotelCode, "revenue_transactions", t.id);
          const revSnap = await getDoc(revTxRef);
          if (!revSnap.exists()) {
            const txDate = t.timestamp ? new Date(t.timestamp) : new Date();
            const dateStr = new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Asia/Jakarta',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }).format(txDate);

            await setDoc(revTxRef, {
              date: dateStr,
              category: (od.revenueType === 'banquet' || t.revenueType === 'banquet') ? 'Banquet Revenue' : 'Ala Carte Revenue',
              description: `POS Order #${t.id.slice(-6)} - ${od.customerName || 'Guest'}`,
              amount: Number(od.total ?? t.amount ?? 0),
              type: (od.paymentMethod === 'compliment' || t.method === 'compliment') ? 'Compliment' : 'Nexura Collect',
              revenueType: (od.paymentMethod === 'compliment' || t.method === 'compliment') ? 'compliment' : 'pos',
              complimentValue: od.complimentValue || 0,
              timestamp: txDate,
              transactionId: t.id
            });
            totalRevTxsCreated++;
            console.log(`[CREATED REV_TX] ${t.id} -> date: ${dateStr}, amount: ${Number(od.total ?? t.amount ?? 0)}`);
          }
        } else {
          // Dokumen pos_orders belum ada sama sekali di Firestore
          const txDate = t.timestamp ? new Date(t.timestamp) : new Date();
          const orderData = {
            transactionId: t.id,
            items: t.items || [],
            subtotal: Number(t.amount || 0),
            tax: 0,
            discount: 0,
            total: Number(t.amount || 0),
            paymentMethod: t.method || 'cash',
            cashAmount: (t.method === 'cash') ? Number(t.amount || 0) : 0,
            changeAmount: 0,
            customerName: 'Guest',
            cashierName: shiftData.cashierName || 'Kasir',
            tableNumber: '-',
            notes: 'Recovered from Shift Log',
            timestamp: txDate,
            revenueType: t.revenueType || 'alacarte',
            shiftId: shiftId,
            isCompliment: t.method === 'compliment',
            complimentValue: 0
          };
          await setDoc(orderDocRef, orderData);
          totalOrdersRepaired++;
          console.log(`[RESTORED POS_ORDER] ${t.id} -> shiftId: ${shiftId}, method: ${t.method}`);

          // Buat revenue_transactions
          const revTxRef = doc(db, "hotels", hotelCode, "revenue_transactions", t.id);
          const dateStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(txDate);

          await setDoc(revTxRef, {
            date: dateStr,
            category: t.revenueType === 'banquet' ? 'Banquet Revenue' : 'Ala Carte Revenue',
            description: `POS Order #${t.id.slice(-6)} - Recovered`,
            amount: Number(t.amount || 0),
            type: t.method === 'compliment' ? 'Compliment' : 'Nexura Collect',
            revenueType: t.method === 'compliment' ? 'compliment' : 'pos',
            complimentValue: 0,
            timestamp: txDate,
            transactionId: t.id
          });
          totalRevTxsCreated++;
          console.log(`[CREATED REV_TX] ${t.id} -> date: ${dateStr}`);
        }
      }
    }
  }

  console.log("\n==========================================");
  console.log(`SELESAI!`);
  console.log(`Total pesanan pos_orders diperbaiki: ${totalOrdersRepaired}`);
  console.log(`Total revenue_transactions disinkronkan: ${totalRevTxsCreated}`);
  console.log("==========================================");
  process.exit(0);
}

repairPosShiftTransactions().catch(err => {
  console.error("Fatal error saat pemulihan:", err);
  process.exit(1);
});
