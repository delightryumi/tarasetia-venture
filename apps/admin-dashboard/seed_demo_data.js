const fs = require("fs");
const path = require("path");

// 1. Parse .env.local from the same directory
const envPath = path.resolve(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!privateKey || !clientEmail || !projectId) {
  console.error("Missing Firebase environment variables in .env.local.");
  process.exit(1);
}

const formattedKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: formattedKey,
    })
  });
}

const db = getFirestore();
const hotelCode = "1";

async function deleteCollection(collectionPath) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

async function run() {
  console.log("=== MEMULAI SEEDING DATA DUMMY AKUN DEMO (PARTNER CODE: 1) ===");

  // 1. CLEAR OPERATIONAL DATA FOR PARTNER CODE 1
  console.log("Pembersihan data lama...");
  await deleteCollection(`hotels/${hotelCode}/roomTypes`);
  await deleteCollection(`hotels/${hotelCode}/pos_products`);
  await deleteCollection(`hotels/${hotelCode}/pos_orders`);
  await deleteCollection(`hotels/${hotelCode}/revenue_transactions`);
  await deleteCollection(`hotels/${hotelCode}/daily_revenue`);
  await deleteCollection(`hotels/${hotelCode}/items`);
  await deleteCollection(`hotels/${hotelCode}/suppliers`);
  await deleteCollection(`hotels/${hotelCode}/store_requisitions`);
  await deleteCollection(`hotels/${hotelCode}/daily_market_lists`);
  await deleteCollection(`hotels/${hotelCode}/purchase_requisitions`);
  await deleteCollection(`hotels/${hotelCode}/shifts`);
  await deleteCollection(`hotels/${hotelCode}/staff`);
  await deleteCollection(`hotels/${hotelCode}/pos_held_orders`);
  await deleteCollection(`hotels/${hotelCode}/cashier_shifts`);
  
  // Clear root collections cashier_shifts and pos_held_orders (for backward compat)
  await deleteCollection("cashier_shifts");
  await deleteCollection("pos_held_orders");

  // Clear attendance logs for May to Dec 2026
  for (let m = 5; m <= 12; m++) {
    const ym = `2026-${String(m).padStart(2, "0")}`;
    await deleteCollection(`hotels/${hotelCode}/attendance/${ym}/logs`);
    await db.doc(`global_pnl_reports/${ym}`).delete();
  }
  await deleteCollection(`hotels/${hotelCode}/payroll_summaries`);
  await db.doc(`properties/${hotelCode}`).delete();
  console.log("Pembersihan selesai.");

  // 2. SEED SETTINGS
  console.log("Seeding settings...");
  await db.doc(`hotels/${hotelCode}/settings/pos`).set({
    tax: 10,
    service: 5,
    lostBreakage: 0
  });

  await db.doc(`hotels/${hotelCode}/settings/attendance_geo`).set({
    lat: -6.2088,
    lng: 106.8456,
    radiusMeters: 100,
    updatedAt: new Date().toISOString(),
    updatedBy: "System Seeder"
  });

  // 2B. SEED MASTER PROPERTY
  console.log("Seeding properties master document...");
  await db.doc(`properties/${hotelCode}`).set({
    name: "Setara Demo Partner",
    active: true,
    domain: "demo.setara.co.id",
    subdomain: "demo.crs.local",
    createdAt: new Date().toISOString(),
    address: "Demo Street No. 1",
    phone: "08123456789",
    email: "demo@setara.co.id",
    roomCount: 36
  });

  // 3. SEED ROOM TYPES
  console.log("Seeding roomTypes...");
  const rooms = [
    {
      id: "std",
      name: "Standard Room",
      description: "Kamar minimalis modern yang nyaman, cocok untuk pelancong bisnis maupun kasual. Dilengkapi area kerja fungsional dan kamar mandi bersih.",
      images: [{ url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=600", isProfile: true }],
      amenities: ["Wifi", "AC", "TV", "Coffee Maker", "Shower"],
      bookingUrl: "",
      beds: [{ type: "Single", quantity: 2, size: "Single" }],
      capacity: 2,
      roomSizeValue: 24,
      roomSizeUnit: "m2",
      roomCount: 18,
      createdAt: new Date().toISOString()
    },
    {
      id: "dlx",
      name: "Deluxe Room",
      description: "Kamar yang lebih luas dengan dekorasi sage-gold editorial premium dan area bersantai. Memiliki pemandangan kolam renang/taman yang asri.",
      images: [{ url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=600", isProfile: true }],
      amenities: ["Wifi", "AC", "TV", "Mini Bar", "Coffee Maker", "Safe Box"],
      bookingUrl: "",
      beds: [{ type: "Double", quantity: 1, size: "King" }],
      capacity: 2,
      roomSizeValue: 32,
      roomSizeUnit: "m2",
      roomCount: 12,
      createdAt: new Date().toISOString()
    },
    {
      id: "ste",
      name: "Family Suite",
      description: "Akomodasi keluarga premium dengan ruang tamu terpisah, dapur mini, dan bathtub mewah. Sentuhan estetika premium Bohemian Sage.",
      images: [{ url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=600", isProfile: true }],
      amenities: ["Wifi", "AC", "TV", "Mini Bar", "Kitchenette", "Bathtub", "Balcony"],
      bookingUrl: "",
      beds: [{ type: "Double", quantity: 1, size: "King" }, { type: "Single", quantity: 1, size: "Single" }],
      capacity: 4,
      roomSizeValue: 56,
      roomSizeUnit: "m2",
      roomCount: 6,
      createdAt: new Date().toISOString()
    }
  ];

  for (const r of rooms) {
    await db.collection(`hotels/${hotelCode}/roomTypes`).doc(r.id).set(r);
  }

  // 4. SEED SHIFTS
  console.log("Seeding shifts...");
  const shifts = [
    { id: "shift_pagi", name: "Shift Pagi", startTime: "07:00", endTime: "15:00", toleranceMinutes: 15 },
    { id: "shift_siang", name: "Shift Siang", startTime: "15:00", endTime: "23:00", toleranceMinutes: 15 },
    { id: "shift_malam", name: "Shift Malam", startTime: "23:00", endTime: "07:00", toleranceMinutes: 15 }
  ];
  for (const s of shifts) {
    await db.collection(`hotels/${hotelCode}/shifts`).doc(s.id).set(s);
  }

  // 5. SEED STAFF
  console.log("Seeding staff...");
  const staffMembers = [
    { id: "1001", name: "Executive Chef Marco", phone: "08122334455", nik: "1001", pin: "111111", position: "Head Chef", division: "Kitchen", shiftId: "shift_pagi", hotelCode, employmentType: "staff", payrollConfig: { baseSalary: 8500000, overtimeRatePerHour: 50000, lateDeductionPerMinute: 2000, bpjsPercentage: 2 }, isActive: true, createdAt: new Date().toISOString() },
    { id: "1002", name: "Adi Saputra", phone: "08122334456", nik: "1002", pin: "222222", position: "Bartender", division: "Food & Beverage", shiftId: "shift_siang", hotelCode, employmentType: "staff", payrollConfig: { baseSalary: 4200000, overtimeRatePerHour: 30000, lateDeductionPerMinute: 1000, bpjsPercentage: 2 }, isActive: true, createdAt: new Date().toISOString() },
    { id: "1003", name: "Sarah Amanda", phone: "08122334457", nik: "1003", pin: "333333", position: "Receptionist", division: "Front Office", shiftId: "shift_pagi", hotelCode, employmentType: "staff", payrollConfig: { baseSalary: 4800000, overtimeRatePerHour: 30000, lateDeductionPerMinute: 1000, bpjsPercentage: 2 }, isActive: true, createdAt: new Date().toISOString() },
    { id: "1004", name: "John Doe", phone: "08122334458", nik: "1004", pin: "444444", position: "Housekeeper", division: "Housekeeping", shiftId: "shift_pagi", hotelCode, employmentType: "staff", payrollConfig: { baseSalary: 4000000, overtimeRatePerHour: 25000, lateDeductionPerMinute: 1000, bpjsPercentage: 2 }, isActive: true, createdAt: new Date().toISOString() },
    { id: "1005", name: "Rina Wijaya", phone: "08122334459", nik: "1005", pin: "555555", position: "Cashier", division: "Finance", shiftId: "shift_siang", hotelCode, employmentType: "staff", payrollConfig: { baseSalary: 4500000, overtimeRatePerHour: 30000, lateDeductionPerMinute: 1000, bpjsPercentage: 2 }, isActive: true, createdAt: new Date().toISOString() }
  ];
  for (const st of staffMembers) {
    await db.collection(`hotels/${hotelCode}/staff`).doc(st.id).set(st);
  }

  // 6. SEED POS PRODUCTS
  console.log("Seeding pos_products...");
  const posProducts = [
    { id: "p1", name: "Coffee Latte", price: 35000, category: "Beverage", image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=300", pnlTarget: "BEVERAGE" },
    { id: "p2", name: "Cappuccino", price: 30000, category: "Beverage", image: "https://images.unsplash.com/photo-1534778101976-62847782c213?q=80&w=300", pnlTarget: "BEVERAGE" },
    { id: "p3", name: "Avocado Toast", price: 55000, category: "Food", image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=300", pnlTarget: "FOOD" },
    { id: "p4", name: "Fried Rice Special", price: 45000, category: "Food", image: "https://images.unsplash.com/photo-1512058560366-cd2427ffeb6d?q=80&w=300", pnlTarget: "FOOD" },
    { id: "p5", name: "Meeting Room A", price: 500000, category: "Meeting Room", image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?q=80&w=300", pnlTarget: "OTHER" },
    { id: "p6", name: "Meeting Room B", price: 750000, category: "Meeting Room", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=300", pnlTarget: "OTHER" },
    { id: "p7", name: "Iced Tea", price: 15000, category: "Beverage", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=300", pnlTarget: "BEVERAGE" }
  ];
  for (const p of posProducts) {
    await db.collection(`hotels/${hotelCode}/pos_products`).doc(p.id).set(p);
  }

  // 7. SEED PURCHASING ITEMS & SUPPLIERS
  console.log("Seeding items & suppliers...");
  const items = [
    { id: "itm1", item_code: "ITM-VEG-001", name: "Fresh Tomatoes", category: "Vegetables", unit: "kg", min_stock: 5, current_stock: 12, last_purchase_price: 15000, is_active: true, procurement_module: "DML", is_deleted: false },
    { id: "itm2", item_code: "ITM-VEG-002", name: "Organic Spinach", category: "Vegetables", unit: "kg", min_stock: 3, current_stock: 4, last_purchase_price: 18000, is_active: true, procurement_module: "DML", is_deleted: false },
    { id: "itm3", item_code: "ITM-DRY-001", name: "Jasmine Rice 20kg", category: "Dry Goods & Groceries", unit: "bag", min_stock: 2, current_stock: 5, last_purchase_price: 320000, is_active: true, procurement_module: "SR", is_deleted: false },
    { id: "itm4", item_code: "ITM-BEV-001", name: "Mineral Water 600ml", category: "Beverages", unit: "box", min_stock: 10, current_stock: 15, last_purchase_price: 48000, is_active: true, procurement_module: "SR", is_deleted: false },
    { id: "itm5", item_code: "ITM-HSK-001", name: "Liquid Bath Soap 5L", category: "Housekeeping Supplies", unit: "can", min_stock: 4, current_stock: 2, last_purchase_price: 125000, is_active: true, procurement_module: "SR", is_deleted: false },
    { id: "itm6", item_code: "ITM-AST-001", name: "Heavy Duty Kitchen Mixer", category: "Kitchen Equipment", unit: "unit", min_stock: 1, current_stock: 1, last_purchase_price: 3500000, is_active: true, procurement_module: "PR", is_deleted: false }
  ];
  for (const it of items) {
    await db.collection(`hotels/${hotelCode}/items`).doc(it.id).set(it);
  }

  const suppliers = [
    { id: "sup1", name: "Sinar Jaya Veggies", pic_name: "Budi Santoso", pic_contact: "081234567890", address: "Pasar Induk Blok C/12", payment_terms: "COD", is_active: true, is_deleted: false },
    { id: "sup2", name: "Mandiri Sembako", pic_name: "Dewi Lestari", pic_contact: "082199887766", address: "Jl. Hayam Wuruk No. 45", payment_terms: "Net 14", is_active: true, is_deleted: false },
    { id: "sup3", name: "Indo Clean Supplies", pic_name: "Anton Wijaya", pic_contact: "081122334455", address: "MM2100 Cibitung", payment_terms: "Net 30", is_active: true, is_deleted: false }
  ];
  for (const sup of suppliers) {
    await db.collection(`hotels/${hotelCode}/suppliers`).doc(sup.id).set(sup);
  }

  // Categories & Units
  const categories = ["Vegetables", "Dry Goods & Groceries", "Beverages", "Housekeeping Supplies", "Kitchen Equipment"];
  for (const cat of categories) {
    await db.collection(`hotels/${hotelCode}/item_categories`).doc(cat.toLowerCase()).set({ name: cat, created_at: FieldValue.serverTimestamp() });
  }
  const units = ["kg", "bag", "box", "can", "unit"];
  for (const un of units) {
    await db.collection(`hotels/${hotelCode}/item_units`).doc(un.toLowerCase()).set({ name: un, created_at: FieldValue.serverTimestamp() });
  }

  // 8. GENERATE MULTI-MONTH TRANSACTIONS (FO, POS, HRD, PURCHASING)
  const year = 2026;
  console.log("Generating monthly transaction streams...");

  for (let m = 5; m <= 12; m++) {
    const monthStr = String(m).padStart(2, "0");
    const yyyyMM = `${year}-${monthStr}`;
    console.log(`> Menulis data untuk bulan: ${yyyyMM}`);

    const daysInMonth = new Date(year, m, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, "0");
      const fullDate = `${yyyyMM}-${dayStr}`;

      // A. FRONT OFFICE (daily_revenue collection)
      const dailyRevenueDocId = `${hotelCode}_${fullDate}`;

      const guestNamesList = ["Rudi", "Dewi", "Budi", "Siti", "Hendra", "Amalia", "Joko", "Yanti", "Anto", "Rina"];
      const roomTypesList = ["std", "dlx", "ste"];
      const channelsList = ["Website", "Booking.com", "Walk-in", "Traveloka"];

      const guestIndex = (m * 31 + d) % guestNamesList.length;
      const roomIndex = (m * 31 + d) % roomTypesList.length;
      const channelIndex = (m * 31 + d) % channelsList.length;

      const guestName = guestNamesList[guestIndex];
      const roomType = roomTypesList[roomIndex] === "std" ? "Standard Room" : roomTypesList[roomIndex] === "dlx" ? "Deluxe Room" : "Family Suite";
      const roomNumber = `${roomIndex + 1}0${d % 10}`;
      const channel = channelsList[channelIndex];
      const amount = roomType === "Standard Room" ? 650000 : roomType === "Deluxe Room" ? 950000 : 1850000;

      const foEntries = [
        {
          bookingId: `TRX-${m}${d}01`,
          guestName: guestName,
          checkInDate: fullDate,
          checkOutDate: `${yyyyMM}-${String(d + 1).padStart(2, "0")}`,
          roomType: roomType,
          roomNumber: roomNumber,
          channel: channel,
          voucherCode: "",
          amount: amount,
          paidCash: channel === "Walk-in" ? amount : 0,
          paidTransfer: channel !== "Walk-in" ? amount : 0,
          feePercentage: channel === "Booking.com" ? 15 : 0,
          paymentStatus: "Pay at Hotel",
          status: "CONFIRMED",
          source: channel === "Walk-in" ? "Walk-in" : channel === "Website" ? "Direct" : "OTA",
          type: "accommodation",
          timestamp: `${fullDate}T14:15:00.000Z`
        }
      ];

      // Even days get another entry (other_income)
      if (d % 2 === 0) {
        foEntries.push({
          bookingId: `TRX-${m}${d}02`,
          guestName: "Secondary SPA Outlets",
          checkInDate: fullDate,
          checkOutDate: fullDate,
          roomType: "-",
          roomNumber: "-",
          channel: "Walk-in",
          voucherCode: "",
          amount: 350000,
          paidCash: 0,
          paidTransfer: 350000,
          feePercentage: 0,
          paymentStatus: "Pay at Hotel",
          status: "CONFIRMED",
          source: "Walk-in",
          type: "other_income",
          timestamp: `${fullDate}T18:45:00.000Z`
        });
      }

      // Special entries for June 19, 2026
      if (m === 6 && d === 19) {
        foEntries.push(
          {
            bookingId: `TRX-61905`,
            guestName: "Tamu Menginap 1 (Deluxe)",
            checkInDate: "2026-06-18",
            checkOutDate: "2026-06-20",
            roomType: "Deluxe Room",
            roomNumber: "208",
            channel: "Website",
            voucherCode: "",
            amount: 1900000,
            paidCash: 0,
            paidTransfer: 1900000,
            feePercentage: 0,
            paymentStatus: "Pay at Nexura",
            status: "CONFIRMED",
            source: "Direct",
            type: "accommodation",
            timestamp: `2026-06-18T14:15:00.000Z`
          },
          {
            bookingId: `TRX-61906`,
            guestName: "Tamu Checkout Hari Ini (Standard)",
            checkInDate: "2026-06-17",
            checkOutDate: "2026-06-19",
            roomType: "Standard Room",
            roomNumber: "108",
            channel: "Booking.com",
            voucherCode: "",
            amount: 1300000,
            paidCash: 1300000,
            paidTransfer: 0,
            feePercentage: 15,
            paymentStatus: "Pay at Hotel",
            status: "CONFIRMED",
            source: "OTA",
            type: "accommodation",
            timestamp: `2026-06-17T15:30:00.000Z`
          }
        );
      }

      const mappedFoEntries = foEntries.map(entry => ({
        ...entry,
        date: entry.date || entry.checkInDate || fullDate,
        createdAt: entry.createdAt || entry.timestamp || `${fullDate}T12:00:00.000Z`
      }));

      await db.collection(`hotels/${hotelCode}/daily_revenue`).doc(dailyRevenueDocId).set({
        entries: mappedFoEntries,
        date: fullDate,
        lastUpdated: new Date().toISOString()
      });

      // B. POS (pos_orders & revenue_transactions)
      const order1Id = `pos_ord_${m}_${d}_1`;
      const order1 = {
        transactionId: order1Id,
        items: [
          { id: "p1", name: "Coffee Latte", price: 35000, quantity: 2, category: "Beverage" },
          { id: "p3", name: "Avocado Toast", price: 55000, quantity: 1, category: "Food" }
        ],
        subtotal: 125000,
        tax: 12500,
        total: 137500,
        paymentMethod: "qris",
        revenueType: "alacarte",
        customerName: `Tamu Meja ${d % 10 || 1}`,
        tableNumber: `${d % 10 || 1}`,
        cashierName: "Rina Wijaya",
        timestamp: new Date(`${fullDate}T09:30:00.000Z`)
      };
      await db.collection(`hotels/${hotelCode}/pos_orders`).doc(order1Id).set(order1);

      await db.collection(`hotels/${hotelCode}/revenue_transactions`).add({
        date: fullDate,
        category: "Food & Beverage",
        description: `POS Order #${order1Id.slice(-6)} - Tamu Meja ${d % 10 || 1}`,
        amount: 137500,
        type: "Hotel Collect",
        timestamp: new Date(`${fullDate}T09:30:00.000Z`)
      });

      // C. HRD ATTENDANCE LOGS
      for (const st of staffMembers) {
        const logId = `${st.id}_${fullDate}`;
        const isLate = d === 15 && st.id === "1003"; // Sarah Amanda is late on the 15th
        const clockInTime = isLate ? `${fullDate}T07:35:00.000Z` : `${fullDate}T06:54:00.000Z`;
        const clockOutTime = `${fullDate}T15:02:00.000Z`;

        const log = {
          id: logId,
          staffId: st.id,
          staffName: st.name,
          date: fullDate,
          shiftId: st.shiftId,
          clockIn: {
            time: clockInTime,
            selfieUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100",
            gps: { lat: -6.20885, lng: 106.84565 }
          },
          clockOut: {
            time: clockOutTime,
            selfieUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100",
            gps: { lat: -6.20884, lng: 106.84564 }
          },
          durationMinutes: isLate ? 447 : 488,
          status: isLate ? "terlambat" : "hadir",
          overtimeMinutes: 0,
          overtimeApproved: null
        };
        await db.collection(`hotels/${hotelCode}/attendance/${yyyyMM}/logs`).doc(logId).set(log);
      }
    }

    // D. PURCHASING DOCUMENTS (Once per month)
    // 1. Store Requisition (SR) on the 5th
    const srId = `SR-${yyyyMM}-0001`;
    await db.collection(`hotels/${hotelCode}/store_requisitions`).doc(srId).set({
      sr_number: srId,
      department: "Housekeeping",
      requested_by: "1004",
      requested_by_name: "John Doe",
      status: "approved",
      items: [
        {
          item_id: "itm5",
          name: "Liquid Bath Soap 5L",
          unit: "can",
          qty_requested: 2,
          qty_fulfilled: 2,
          unit_price: 125000,
          total: 250000,
          notes: "Replenish toiletries stock"
        }
      ],
      total_cost: 250000,
      approved_by: "superadmin_id",
      notes: "Monthly housekeeping replenishes",
      is_deleted: false,
      created_at: new Date(`${yyyyMM}-05T08:00:00.000Z`).toISOString(),
      updated_at: new Date(`${yyyyMM}-05T10:00:00.000Z`).toISOString()
    });

    // 2. Purchase Requisition (PR) on the 15th
    const prId = `PR-${yyyyMM}-0001`;
    await db.collection(`hotels/${hotelCode}/purchase_requisitions`).doc(prId).set({
      pr_number: prId,
      linked_sr_id: null,
      linked_sr_number: null,
      status: "approved",
      items: [
        {
          item_id: "itm3",
          name: "Jasmine Rice 20kg",
          unit: "bag",
          qty: 10,
          estimated_price: 320000,
          actual_price: 320000,
          supplier_id: "sup2",
          supplier_name: "Mandiri Sembako"
        }
      ],
      total_estimated: 3200000,
      total_actual: 3200000,
      requested_by: "1001",
      requested_by_name: "Executive Chef Marco",
      approved_by: "superadmin_id",
      delivery_date: `${yyyyMM}-18`,
      notes: "Sembako restocking for Kitchen F&B",
      is_deleted: false,
      created_at: new Date(`${yyyyMM}-15T09:00:00.000Z`).toISOString(),
      updated_at: new Date(`${yyyyMM}-16T11:00:00.000Z`).toISOString()
    });

    // 3. Daily Market List (DML) on the 25th
    const dmlId = `DML-${yyyyMM}-0001`;
    await db.collection(`hotels/${hotelCode}/daily_market_lists`).doc(dmlId).set({
      dml_number: dmlId,
      date: new Date(`${yyyyMM}-25T07:00:00.000Z`),
      status: "completed",
      items: [
        {
          item_id: "itm1",
          category: "Vegetables",
          name: "Fresh Tomatoes",
          unit: "kg",
          qty_ordered: 10,
          qty_received: 10,
          unit_price: 15000,
          total: 150000
        },
        {
          item_id: "itm2",
          category: "Vegetables",
          name: "Organic Spinach",
          unit: "kg",
          qty_ordered: 5,
          qty_received: 5,
          unit_price: 18000,
          total: 90000
        }
      ],
      total_cost: 240000,
      submitted_by: "1001",
      submitted_by_name: "Executive Chef Marco",
      verified_by: "superadmin_id",
      notes: "Daily fresh veggies",
      is_deleted: false,
      created_at: new Date(`${yyyyMM}-25T07:00:00.000Z`).toISOString()
    });

    // E. PAYROLL SUMMARIES (Once per month)
    console.log(`> Seeding payroll summaries for month: ${yyyyMM}`);
    const payrollDetails = [
      { staffId: "1001", name: "Executive Chef Marco", staffName: "Executive Chef Marco", totalPay: 8500000, baseSalary: 8500000, overtimePay: 0, deductions: 0 },
      { staffId: "1002", name: "Adi Saputra", staffName: "Adi Saputra", totalPay: 4200000, baseSalary: 4200000, overtimePay: 0, deductions: 0 },
      { staffId: "1003", name: "Sarah Amanda", staffName: "Sarah Amanda", totalPay: 4800000, baseSalary: 4800000, overtimePay: 0, deductions: 0 },
      { staffId: "1004", name: "John Doe", staffName: "John Doe", totalPay: 4000000, baseSalary: 4000000, overtimePay: 0, deductions: 0 },
      { staffId: "1005", name: "Rina Wijaya", staffName: "Rina Wijaya", totalPay: 4500000, baseSalary: 4500000, overtimePay: 0, deductions: 0 }
    ];
    await db.doc(`hotels/${hotelCode}/payroll_summaries/${yyyyMM}`).set({
      totalPayrollExpense: 26000000,
      details: payrollDetails,
      updatedAt: new Date().toISOString()
    });

    // F. GLOBAL PNL REPORTS (Once per month)
    console.log(`> Seeding global PnL reports for month: ${yyyyMM}`);
    await db.doc(`global_pnl_reports/${yyyyMM}`).set({
      startingBalance: 50000000,
      fixedAssetsValue: 15000000,
      vatPercentage: 11,
      mgmtFeePercentage: 10,
      mgmtFeeRoomPercentage: 10,
      mgmtFeeFnbPercentage: 10,
      serviceChargePercentage: 10,
      lostBreakagePercentage: 1,
      vatPaid: 2500000,
      feePaid: 1500000,
      scPaid: 1200000,
      lbPaid: 300000,
      hotelGopPercentages: {
        [hotelCode]: 10
      },
      customIncomes: [
        {
          id: `inc-${m}-1`,
          name: "Sponsorship Event",
          amount: 5000000,
          category: "Event",
          paymentStatus: "paid",
          date: `${yyyyMM}-12`,
          description: "Pendapatan sponsorship event cafe"
        }
      ],
      nonCommissionRevenue: [
        {
          id: `nc-${m}-1`,
          name: "Sewa Lapangan Tennis",
          amount: 1500000,
          category: "Sport",
          paymentStatus: "paid",
          date: `${yyyyMM}-18`,
          description: "Sewa lapangan tennis bulanan"
        }
      ],
      expenses: [
        {
          id: `exp-${m}-01`,
          name: "Listrik & Air PLN",
          amount: 4500000,
          category: "Electricity",
          date: `${yyyyMM}-05`,
          description: "Tagihan listrik bulanan hotel",
          fbCategory: null,
          eventCategory: null,
          department: "Admin & General",
          paymentStatus: "paid",
          paymentDate: `${yyyyMM}-05`
        },
        {
          id: `exp-${m}-02`,
          name: "Bahan Makanan Sayur (Tempo)",
          amount: 2500000,
          category: "F&B",
          date: `${yyyyMM}-10`,
          description: "Pembelian bahan dapur tempo dari Supplier",
          fbCategory: "FOOD",
          eventCategory: null,
          department: "F&B",
          paymentStatus: "tempo",
          paymentDate: null
        },
        {
          id: `exp-${m}-03`,
          name: "Bahan Minuman Kopi (Tempo - Lunas)",
          amount: 3000000,
          category: "F&B",
          date: `${yyyyMM}-15`,
          description: "Pembelian biji kopi tempo lunas",
          fbCategory: "BEVERAGE",
          eventCategory: null,
          department: "F&B",
          paymentStatus: "tempo",
          paymentDate: `${yyyyMM}-28`
        }
      ]
    });
  }

  // 9. SEED ACTIVE HELD ORDERS (MEJA YANG ON) ON PORT 3001
  console.log("Seeding pos_held_orders (Meja yang on)...");
  const heldOrders = [
    {
      id: "HLD-MEJA2",
      customerName: "Agus Pratama",
      tableNumber: "Meja 2",
      notes: "Kopi less sugar",
      cart: [
        {
          product: { id: "p1", name: "Coffee Latte", price: 35000, category: "Beverage", subcategory: "", image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=300" },
          quantity: 1,
          cartItemId: "cart-item-1",
          selectedAddons: [],
          note: ""
        },
        {
          product: { id: "p4", name: "Fried Rice Special", price: 45000, category: "Food", subcategory: "", image: "https://images.unsplash.com/photo-1512058560366-cd2427ffeb6d?q=80&w=300" },
          quantity: 1,
          cartItemId: "cart-item-2",
          selectedAddons: [],
          note: ""
        }
      ],
      subtotal: 80000,
      discount: 0,
      discountPercent: 0,
      tax: 8000,
      payableAmount: 88000,
      createdAt: new Date().toISOString(),
      restoId: "default-resto",
      cashierName: "Rina Wijaya"
    },
    {
      id: "HLD-MEJA5",
      customerName: "Siska Amelia",
      tableNumber: "Meja 5",
      notes: "Hot Cap",
      cart: [
        {
          product: { id: "p2", name: "Cappuccino", price: 30000, category: "Beverage", subcategory: "", image: "https://images.unsplash.com/photo-1534778101976-62847782c213?q=80&w=300" },
          quantity: 2,
          cartItemId: "cart-item-3",
          selectedAddons: [],
          note: ""
        },
        {
          product: { id: "p3", name: "Avocado Toast", price: 55000, category: "Food", subcategory: "", image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=300" },
          quantity: 1,
          cartItemId: "cart-item-4",
          selectedAddons: [],
          note: ""
        }
      ],
      subtotal: 115000,
      discount: 0,
      discountPercent: 0,
      tax: 11500,
      payableAmount: 126500,
      createdAt: new Date().toISOString(),
      restoId: "default-resto",
      cashierName: "Rina Wijaya"
    }
  ];

  for (const ho of heldOrders) {
    // Seed to hotels dynamic sub-collection
    await db.collection(`hotels/${hotelCode}/pos_held_orders`).doc(ho.id).set(ho);
    // Seed to root for backward compat
    await db.collection("pos_held_orders").doc(ho.id).set(ho);
  }

  // 10. SEED CASHIER SHIFTS (OPEN AND CLOSED) FOR SHIFT RECORDS
  console.log("Seeding cashier_shifts (Shift records)...");
  const cashierShifts = [
    {
      id: "shift_open_today",
      cashierName: "Rina Wijaya",
      openedAt: new Date(new Date().setHours(7, 0, 0, 0)).toISOString(),
      houseBank: 500000,
      transactions: [
        { id: `TRS-TODAY01`, amount: 137500, method: "qris", timestamp: new Date(new Date().setHours(9, 30, 0, 0)).toISOString() },
        { id: `TRS-TODAY02`, amount: 66000, method: "cash", timestamp: new Date(new Date().setHours(13, 15, 0, 0)).toISOString() }
      ],
      status: "open",
      restoId: "default-resto"
    },
    {
      id: "shift_closed_yesterday",
      cashierName: "Rina Wijaya",
      openedAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
      closedAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
      houseBank: 500000,
      transactions: [
        { id: `TRS-YEST01`, amount: 250000, method: "qris", timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString() },
        { id: `TRS-YEST02`, amount: 480000, method: "cash", timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString() }
      ],
      countedCash: 980000, // 500k house + 480k cash
      notes: "Shift lancar, selisih pas.",
      status: "closed",
      restoId: "default-resto"
    }
  ];

  for (const cs of cashierShifts) {
    // Seed to hotels dynamic sub-collection
    await db.collection(`hotels/${hotelCode}/cashier_shifts`).doc(cs.id).set(cs);
    // Seed to root cashier_shifts for backward compat
    await db.collection("cashier_shifts").doc(cs.id).set(cs);
  }

  console.log("=== SEEDING SELESAI DENGAN SUKSES! ===");
  process.exit(0);
}

run().catch((err) => {
  console.error("TERJADI KESALAHAN SAAT SEEDING:", err);
  process.exit(1);
});
