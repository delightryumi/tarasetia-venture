const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // assuming it exists

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function check() {
  const shiftDoc = await db.doc('hotels/1/shifts/shift_malam').get();
  console.log('hotels/1/shifts/shift_malam exists:', shiftDoc.exists);
  if (shiftDoc.exists) {
    console.log('Data:', shiftDoc.data());
  }

  const shiftsSnap = await db.collection('hotels/1/shifts').get();
  console.log('All shifts in hotels/1/shifts:');
  shiftsSnap.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

check().catch(console.error);
