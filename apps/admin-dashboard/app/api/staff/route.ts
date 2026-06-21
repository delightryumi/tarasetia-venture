import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";

function generatePIN() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST: Buat akun karyawan baru (Firestore /staff/ - tanpa Firebase Auth)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, nik, position, division, shiftId, hotelCode, employmentType, payrollConfig } = body;

    if (!name || !phone || !nik || !position || !division || !hotelCode) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    const staffRef = adminDb.collection(`hotels/${hotelCode}/staff`);
    
    // Check jika NIK sudah ada
    const existing = await staffRef.where("nik", "==", nik.trim()).get();
    if (!existing.empty) {
      return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 400 });
    }

    const pin = generatePIN();
    const newDoc = staffRef.doc();
    
    await newDoc.set({
      id: newDoc.id,
      name: name.trim(),
      phone: phone.trim(),
      nik: nik.trim(),
      pin,
      position: position.trim(),
      division: division.trim(),
      shiftId: shiftId || "",
      hotelCode,
      employmentType: employmentType || "staff",
      payrollConfig: payrollConfig || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, nik: nik.trim(), pin });
  } catch (error: any) {
    console.error("Error creating staff:", error);
    return NextResponse.json({ error: error.message || "Gagal membuat akun karyawan" }, { status: 500 });
  }
}

// PUT: Update data staf
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, position, division, shiftId, isActive, hotelCode, employmentType, payrollConfig } = body;
    const uid = id || body.uid; // backwards compatibility if needed

    if (!uid || !hotelCode) {
      return NextResponse.json({ error: "id/uid dan hotelCode wajib diisi" }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date().toISOString() };
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (position !== undefined) updateData.position = position.trim();
    if (division !== undefined) updateData.division = division.trim();
    if (shiftId !== undefined) updateData.shiftId = shiftId;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (employmentType !== undefined) updateData.employmentType = employmentType;
    if (payrollConfig !== undefined) updateData.payrollConfig = payrollConfig;
    if (body.pin !== undefined) updateData.pin = body.pin;

    const staffRef = adminDb.doc(`hotels/${hotelCode}/staff/${uid}`);
    await staffRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating staff:", error);
    return NextResponse.json({ error: error.message || "Gagal update data staf" }, { status: 500 });
  }
}

// Helper to get storage path from URL
function getStoragePathFromUrl(url: string, bucketName: string): string | null {
  try {
    const parts = url.split(`/${bucketName}/`);
    if (parts.length > 1) {
      return decodeURIComponent(parts[1]);
    }
    return null;
  } catch (err) {
    return null;
  }
}

// DELETE: Hapus permanen karyawan beserta seluruh datanya (cascade delete)
export async function DELETE(request: Request) {
  try {
    const { id, hotelCode } = await request.json();
    const uid = id;

    if (!uid || !hotelCode) {
      return NextResponse.json({ error: "id/uid dan hotelCode wajib diisi" }, { status: 400 });
    }

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const bucket = bucketName ? getStorage().bucket(bucketName) : null;

    // 1. Cari & hapus log presensi (attendance logs) dan foto selfie terkait (looping 6 bulan terakhir untuk menghindari kebutuhan index collectionGroup)
    const monthsToCheck: string[] = [];
    const d = new Date();
    for (let i = 0; i < 6; i++) {
      const temp = new Date();
      temp.setMonth(d.getMonth() - i);
      const ym = temp.toISOString().slice(0, 7);
      monthsToCheck.push(ym);
    }

    for (const ym of monthsToCheck) {
      const logColRef = adminDb.collection(`hotels/${hotelCode}/attendance/${ym}/logs`);
      const logsSnap = await logColRef.where("staffId", "==", uid).get();

      for (const doc of logsSnap.docs) {
        const logData = doc.data();
        
        // Hapus selfie clockIn
        if (bucket && logData.clockIn?.selfieUrl) {
          const path = getStoragePathFromUrl(logData.clockIn.selfieUrl, bucketName!);
          if (path) {
            await bucket.file(path).delete().catch((e) => {
              console.warn(`Failed to delete clock-in selfie ${path}:`, e.message);
            });
          }
        }
        
        // Hapus selfie clockOut
        if (bucket && logData.clockOut?.selfieUrl) {
          const path = getStoragePathFromUrl(logData.clockOut.selfieUrl, bucketName!);
          if (path) {
            await bucket.file(path).delete().catch((e) => {
              console.warn(`Failed to delete clock-out selfie ${path}:`, e.message);
            });
          }
        }

        // Hapus dokumen log
        await doc.ref.delete();
      }
    }

    // 2. Cari & hapus pengajuan izin (leave_requests) dan lampiran terkait
    const leaveColRef = adminDb.collection(`hotels/${hotelCode}/leave_requests`);
    const leaveSnap = await leaveColRef.where("staffId", "==", uid).get();
    for (const doc of leaveSnap.docs) {
      const leaveData = doc.data();
      
      // Hapus file lampiran jika ada
      if (bucket && leaveData.attachmentUrl) {
        const path = getStoragePathFromUrl(leaveData.attachmentUrl, bucketName!);
        if (path) {
          await bucket.file(path).delete().catch((e) => {
            console.warn(`Failed to delete leave attachment ${path}:`, e.message);
          });
        }
      }

      // Hapus dokumen leave request
      await doc.ref.delete();
    }

    // 3. Hapus profil karyawan utama
    const staffRef = adminDb.doc(`hotels/${hotelCode}/staff/${uid}`);
    await staffRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error performing cascade delete on staff:", error);
    return NextResponse.json({ error: error.message || "Gagal menghapus karyawan" }, { status: 500 });
  }
}
