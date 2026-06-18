import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// POST: Karyawan ajukan Izin/Sakit/Cuti
export async function POST(request: Request) {
  try {
    const { staffId, staffName, hotelCode, type, date, dateEnd, reason, attachmentUrl } = await request.json();

    if (!staffId || !hotelCode || !type || !date || !reason) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const leaveRef = adminDb.collection(`hotels/${hotelCode}/leave_requests`).doc();
    await leaveRef.set({
      staffId,
      staffName,
      type,       // "izin" | "sakit" | "cuti"
      date,
      dateEnd: dateEnd || date,
      reason,
      attachmentUrl: attachmentUrl || null,
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id: leaveRef.id });
  } catch (error: any) {
    console.error("Error creating leave request:", error);
    return NextResponse.json({ error: error.message || "Gagal mengajukan izin" }, { status: 500 });
  }
}

// PUT: HRD approve/reject pengajuan
export async function PUT(request: Request) {
  try {
    const { requestId, hotelCode, status, reviewedBy } = await request.json();
    // status: "approved" | "rejected"

    if (!requestId || !hotelCode || !status || !reviewedBy) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const leaveRef = adminDb.doc(`hotels/${hotelCode}/leave_requests/${requestId}`);
    const leaveSnap = await leaveRef.get();
    if (!leaveSnap.exists) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
    }

    await leaveRef.update({
      status,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    });

    // Jika approved, buat/update attendance log untuk tanggal izin
    if (status === "approved") {
      const { staffId, staffName, type, date, dateEnd } = leaveSnap.data()!;
      const attendanceStatus = type === "sakit" ? "sakit" : type === "cuti" ? "cuti" : "izin";

      // Proses per tanggal (support multi-hari untuk cuti)
      const start = new Date(date);
      const end = new Date(dateEnd || date);
      const current = new Date(start);

      while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];
        const yyyyMM = dateStr.slice(0, 7);
        const logId = `${staffId}_${dateStr}`;
        const logRef = adminDb.doc(`hotels/${hotelCode}/attendance/${yyyyMM}/logs/${logId}`);

        await logRef.set({
          staffId,
          staffName,
          date: dateStr,
          shiftId: "",
          status: attendanceStatus,
          durationMinutes: 0,
          overtimeMinutes: 0,
          overtimeApproved: false,
          leaveRequestId: requestId,
        }, { merge: true });

        current.setDate(current.getDate() + 1);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating leave request:", error);
    return NextResponse.json({ error: error.message || "Gagal update pengajuan" }, { status: 500 });
  }
}

// GET: Ambil semua pengajuan pending
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelCode = searchParams.get("hotelCode");
    const statusFilter = searchParams.get("status") || "pending";
    const staffId = searchParams.get("staffId");

    if (!hotelCode) {
      return NextResponse.json({ error: "hotelCode wajib diisi" }, { status: 400 });
    }

    let query: FirebaseFirestore.Query = adminDb
      .collection(`hotels/${hotelCode}/leave_requests`)
      .where("status", "==", statusFilter)
      .orderBy("createdAt", "desc");

    if (staffId) query = query.where("staffId", "==", staffId);

    const snap = await query.get();
    const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
