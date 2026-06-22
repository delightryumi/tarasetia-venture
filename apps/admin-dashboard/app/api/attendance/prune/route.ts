import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebaseAdmin";

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelCode = searchParams.get("hotelCode");

    if (!hotelCode) {
      return NextResponse.json({ error: "hotelCode wajib diisi" }, { status: 400 });
    }

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error("Storage bucket name is not configured.");
    }
    const bucket = adminStorage.bucket(bucketName);

    // Calculate threshold (3 months ago)
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() - 3);
    const thresholdStr = thresholdDate.toISOString().split("T")[0]; // yyyy-mm-dd

    // Gather months to prune: from 3 months ago (offset -3) to 8 months ago (offset -8)
    const monthsToCheck: string[] = [];
    const d = new Date();
    for (let i = 3; i <= 8; i++) {
      const temp = new Date();
      temp.setMonth(d.getMonth() - i);
      const ym = temp.toISOString().slice(0, 7);
      if (!monthsToCheck.includes(ym)) {
        monthsToCheck.push(ym);
      }
    }

    let prunedCount = 0;
    const maxPrunedPerCall = 50; // Limit deletions per request to prevent timeouts

    for (const ym of monthsToCheck) {
      if (prunedCount >= maxPrunedPerCall) break;

      const colRef = adminDb.collection(`hotels/${hotelCode}/attendance/${ym}/logs`);
      const snap = await colRef.get();

      for (const doc of snap.docs) {
        if (prunedCount >= maxPrunedPerCall) break;

        const data = doc.data();
        const date = data.date;

        // Delete if the date is older than 3 months
        if (date < thresholdStr) {
          // 1. Delete selfies from Firebase Storage if they exist
          if (data.clockIn?.selfieUrl) {
            const path = getStoragePathFromUrl(data.clockIn.selfieUrl, bucketName);
            if (path) {
              await bucket.file(path).delete().catch((e) => {
                console.warn(`Failed to delete clock-in selfie ${path}:`, e.message);
              });
            }
          }

          if (data.clockOut?.selfieUrl) {
            const path = getStoragePathFromUrl(data.clockOut.selfieUrl, bucketName);
            if (path) {
              await bucket.file(path).delete().catch((e) => {
                console.warn(`Failed to delete clock-out selfie ${path}:`, e.message);
              });
            }
          }

          // 2. Delete Firestore document
          await doc.ref.delete();
          prunedCount++;
        }
      }
    }

    return NextResponse.json({ success: true, prunedCount, thresholdDate: thresholdStr });
  } catch (error: any) {
    console.error("Error pruning attendance data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
