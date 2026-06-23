import { NextResponse } from "next/server";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebaseAdmin";

// Helper: hitung jarak antara 2 koordinat GPS (Haversine formula) dalam meter
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST: Clock In / Clock Out
export async function POST(request: Request) {
  try {
    const { type, staffId, hotelCode, gps, selfieBase64, date, lateReason } = await request.json();
    // type: "clock_in" | "clock_out"

    if (!type || !staffId || !hotelCode || !gps || !selfieBase64 || !date) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 0. Validasi status aktif & keberadaan karyawan
    const staffRef = adminDb.doc(`hotels/${hotelCode}/staff/${staffId}`);
    const staffSnap = await staffRef.get();
    if (!staffSnap.exists || staffSnap.data()?.isActive === false) {
      return NextResponse.json({ error: "Akun karyawan tidak ditemukan atau telah dinonaktifkan." }, { status: 403 });
    }

    const staffData = staffSnap.data();
    let resolvedShiftId = staffData?.shiftId || "";
    try {
      const overrideRef = adminDb.doc(`hotels/${hotelCode}/staff/${staffId}/schedules/${date}`);
      const overrideSnap = await overrideRef.get();
      if (overrideSnap.exists && overrideSnap.data()?.shiftId) {
        resolvedShiftId = overrideSnap.data()?.shiftId;
      }
    } catch (err) {
      console.error("Error fetching schedule override:", err);
    }

    let shiftData: any = null;
    if (resolvedShiftId && resolvedShiftId !== "OFF" && resolvedShiftId !== "NONE" && resolvedShiftId !== "NOT_FOUND") {
      try {
        const shiftSnap = await adminDb.doc(`hotels/${hotelCode}/shifts/${resolvedShiftId}`).get();
        if (shiftSnap.exists) {
          shiftData = shiftSnap.data();
        }
      } catch (err) {
        console.error("Error fetching shift doc:", err);
      }
    }

    // 1. Validasi GPS terhadap koordinat hotel
    const geoRef = adminDb.doc(`hotels/${hotelCode}/settings/attendance_geo`);
    const geoSnap = await geoRef.get();
    if (!geoSnap.exists) {
      return NextResponse.json({ error: "Koordinat lokasi perusahaan belum diatur. Hubungi HRD." }, { status: 400 });
    }
    const geoData = geoSnap.data()!;
    const distance = haversineDistance(gps.lat, gps.lng, geoData.lat, geoData.lng);
    if (distance > geoData.radiusMeters) {
      return NextResponse.json({
        error: `Anda berada ${Math.round(distance)}m dari lokasi perusahaan. Batas absensi: ${geoData.radiusMeters}m.`,
        distance: Math.round(distance)
      }, { status: 403 });
    }

    // 2. Upload selfie ke Firebase Storage
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error("Storage bucket name is not configured.");
    }
    const bucket = adminStorage.bucket(bucketName);
    const fileName = `attendance/${hotelCode}/${date}/${staffId}_${type}_${Date.now()}.jpg`;
    const file = bucket.file(fileName);
    const base64Data = selfieBase64.replace(/^data:image\/\w+;base64,/, "");
    await file.save(Buffer.from(base64Data, "base64"), { contentType: "image/jpeg", resumable: false });
    await file.makePublic();
    const selfieUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // 3. Simpan ke Firestore
    const yyyyMM = date.slice(0, 7); // yyyy-mm
    const logId = `${staffId}_${date}`;
    const logRef = adminDb.doc(`hotels/${hotelCode}/attendance/${yyyyMM}/logs/${logId}`);
    const logSnap = await logRef.get();
    const now = new Date().toISOString();

    if (type === "clock_in") {
      if (logSnap.exists && logSnap.data()?.clockIn) {
        return NextResponse.json({ error: "Anda sudah Clock In hari ini." }, { status: 409 });
      }

      let status: "hadir" | "terlambat" = "hadir";
      let lateMinutes = 0;
      if (shiftData) {
        const [shH, shM] = shiftData.startTime.split(":").map(Number);
        
        // Buat string tanggal lokal Jakarta (format: YYYY-MM-DDTtt:mm:ss)
        // new Date(now) adalah waktu server (UTC). Kita perlu membandingkannya dengan shiftStart lokal
        const shiftStartWithTolerance = new Date(`${date}T${String(shH).padStart(2, "0")}:${String(shM + (shiftData.toleranceMinutes || 0)).padStart(2, "0")}:00`);
        const nowTime = new Date(now);
        
        if (nowTime > shiftStartWithTolerance) {
          status = "terlambat";
          
          const shiftStartOriginal = new Date(`${date}T${String(shH).padStart(2, "0")}:${String(shM).padStart(2, "0")}:00`);
          const diffMs = nowTime.getTime() - shiftStartOriginal.getTime();
          lateMinutes = Math.max(0, Math.round(diffMs / 60000));
        }
      }

      await logRef.set({
        staffId,
        staffName: staffData?.name || "",
        date,
        shiftId: resolvedShiftId || "",
        clockIn: { time: now, selfieUrl, gps },
        durationMinutes: 0,
        status,
        overtimeMinutes: 0,
        overtimeApproved: null,
        lateMinutes,
        lateReason: lateReason || "",
      }, { merge: true });

    } else if (type === "clock_out") {
      if (!logSnap.exists || !logSnap.data()?.clockIn) {
        return NextResponse.json({ error: "Anda belum Clock In hari ini." }, { status: 409 });
      }
      if (logSnap.data()?.clockOut) {
        return NextResponse.json({ error: "Anda sudah Clock Out hari ini." }, { status: 409 });
      }

      const clockInTime = new Date(logSnap.data()!.clockIn.time);
      const clockOutTime = new Date(now);
      const durationMinutes = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / 60000);

      // Hitung lembur
      let overtimeMinutes = 0;
      if (shiftData) {
        const minWorkMinutes = ((shiftData as any).minimumWorkHours ?? 8) * 60;
        // Lembur dihitung jika durasi kerja riil melebihi masa jam kerja wajib (minWorkMinutes)
        const extraMinutes = durationMinutes - minWorkMinutes;
        if (extraMinutes > 0) {
          overtimeMinutes = extraMinutes;
        }
      }

      await logRef.update({
        clockOut: { time: now, selfieUrl, gps },
        durationMinutes,
        overtimeMinutes,
        overtimeApproved: overtimeMinutes > 0 ? null : false,
      });
    }

    return NextResponse.json({ success: true, selfieUrl });
  } catch (error: any) {
    console.error("Error attendance:", error);
    return NextResponse.json({ error: error.message || "Gagal menyimpan absensi" }, { status: 500 });
  }
}

// GET: Ambil log absensi
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelCode = searchParams.get("hotelCode");
    const yyyyMM = searchParams.get("month"); // yyyy-mm
    const staffId = searchParams.get("staffId");

    if (!hotelCode || !yyyyMM) {
      return NextResponse.json({ error: "hotelCode dan month wajib diisi" }, { status: 400 });
    }

    const colRef = adminDb.collection(`hotels/${hotelCode}/attendance/${yyyyMM}/logs`);
    let query: FirebaseFirestore.Query = colRef;
    if (staffId) query = query.where("staffId", "==", staffId);

    const snap = await query.get();
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Koreksi manual oleh HRD
export async function PATCH(request: Request) {
  try {
    const { hotelCode, yyyyMM, logId, correctedBy, correctionNote, overrides } = await request.json();
    if (!hotelCode || !yyyyMM || !logId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const logRef = adminDb.doc(`hotels/${hotelCode}/attendance/${yyyyMM}/logs/${logId}`);
    await logRef.update({
      ...overrides,
      correctedBy,
      correctionNote,
      correctedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
