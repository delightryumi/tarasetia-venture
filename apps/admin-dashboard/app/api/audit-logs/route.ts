import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { emailToDocId } from "@/lib/security/inputSanitizer";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hotelCode = searchParams.get("hotelCode") || "";
    const category = searchParams.get("category") || "";
    const limitNum = Math.min(parseInt(searchParams.get("limit") || "100", 10), 200);
    const userEmail = searchParams.get("userEmail") || "";

    // Auth verification: ensure requester has admin/owner/superadmin privileges
    if (userEmail) {
      const isSuper = userEmail.toLowerCase() === "superadmin@setara.co.id" || userEmail.toLowerCase() === "admin@setara.co.id";
      if (!isSuper) {
        const docId = emailToDocId(userEmail);
        let userSnap = await adminDb.doc(`users_master/${docId}`).get();
        if (!userSnap.exists && hotelCode && hotelCode !== "0") {
          userSnap = await adminDb.doc(`hotels/${hotelCode}/users_master/${docId}`).get();
        }
        if (userSnap.exists) {
          const uData = userSnap.data() || {};
          const role = (uData.role || "").toLowerCase();
          const allowedRoles = ["superadmin", "super admin", "admin", "owner", "general manager", "gm"];
          if (!allowedRoles.includes(role)) {
            return NextResponse.json(
              { error: "Akses ditolak: Hanya Administrator dan Pemilik yang memiliki wewenang melihat Audit Log." },
              { status: 403 }
            );
          }
        }
      }
    }

    let logs: any[] = [];

    if (hotelCode && hotelCode !== "all" && hotelCode !== "0") {
      let queryRef: any = adminDb
        .collection(`hotels/${hotelCode}/audit_logs`)
        .orderBy("createdAt", "desc")
        .limit(limitNum);

      if (category && category !== "ALL") {
        queryRef = queryRef.where("category", "==", category.toUpperCase());
      }

      const snap = await queryRef.get();
      logs = snap.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.isoTimestamp || new Date().toISOString(),
        };
      });
    } else {
      // Superadmin global query across all hotels
      try {
        let queryRef: any = adminDb
          .collectionGroup("audit_logs")
          .orderBy("createdAt", "desc")
          .limit(limitNum);

        if (category && category !== "ALL") {
          queryRef = queryRef.where("category", "==", category.toUpperCase());
        }

        const snap = await queryRef.get();
        logs = snap.docs.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.isoTimestamp || new Date().toISOString(),
          };
        });
      } catch (groupErr: any) {
        // Fallback if collectionGroup index is not yet built in Firestore
        console.warn("CollectionGroup fallback triggered:", groupErr.message);
        if (hotelCode && hotelCode !== "all") {
          const snap = await adminDb
            .collection(`hotels/${hotelCode}/audit_logs`)
            .limit(limitNum)
            .get();
          logs = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    console.error("Audit Logs API Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengambil data audit log." },
      { status: 500 }
    );
  }
}
