"use client";

import React, { useState } from "react";
import { 
  CreditCard, 
  X, 
  Check, 
  Building2, 
  QrCode, 
  Banknote, 
  Landmark, 
  Globe, 
  RotateCw, 
  AlertTriangle,
  Hotel,
  Receipt
} from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { useAuth } from "@/context/AuthContext";

interface PaymentMethodEditModalProps {
  isOpen: boolean;
  guest: any;
  onClose: () => void;
  onSuccess?: () => void;
}

type QuickMethod = "transfer" | "qris" | "edc" | "cash" | "ota" | "split";
type CollectType = "property" | "channel";

const cleanUndefined = (obj: any): any => {
  if (!obj || typeof obj !== "object") return obj;
  const cleaned: any = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    if (val !== undefined) {
      if (val && typeof val === "object" && !val.toDate && !(val instanceof Date)) {
        cleaned[key] = cleanUndefined(val);
      } else {
        cleaned[key] = val;
      }
    }
  });
  return cleaned;
};

export function PaymentMethodEditModal({
  isOpen,
  guest,
  onClose,
  onSuccess
}: PaymentMethodEditModalProps) {
  const { activeHotelCode } = useAuth();
  const [loading, setLoading] = useState(false);

  const totalAmount = Number(guest?.totalAmount || guest?.amount || 0);

  // Determine initial paymentCollect type
  const initialCollect: CollectType = (() => {
    if (!guest) return "property";
    if (guest.paymentCollect === "channel" || Number(guest.paidOta || 0) > 0 || (guest.isOTA && guest.paymentCollect !== "property")) {
      return "channel";
    }
    return "property";
  })();

  // Determine initial payment method based on current guest data
  const initialMethod: QuickMethod = (() => {
    if (!guest) return "transfer";
    if (Number(guest.paidOta || 0) > 0 || (guest.isOTA && guest.paymentCollect === "channel")) return "ota";
    if (Number(guest.paidTransfer || 0) > 0 && !guest.paidCash && !guest.paidEdc && !guest.paidQris) return "transfer";
    if (Number(guest.paidQris || 0) > 0 && !guest.paidCash && !guest.paidEdc && !guest.paidTransfer) return "qris";
    if (Number(guest.paidEdc || 0) > 0 && !guest.paidCash && !guest.paidQris && !guest.paidTransfer) return "edc";
    if (Number(guest.paidCash || 0) > 0 && !guest.paidEdc && !guest.paidQris && !guest.paidTransfer) return "cash";
    
    const pm = (guest.paymentMethod || "").toLowerCase();
    if (pm.includes("qris")) return "qris";
    if (pm.includes("edc") || pm.includes("card")) return "edc";
    if (pm.includes("cash") || pm.includes("tunai")) return "cash";
    if (pm.includes("ota") || pm.includes("ledger") || pm.includes("virtual")) return "ota";
    return initialCollect === "channel" ? "ota" : "transfer";
  })();

  const [selectedCollect, setSelectedCollect] = useState<CollectType>(initialCollect);
  const [selectedMethod, setSelectedMethod] = useState<QuickMethod>(initialMethod);
  const [paymentStatus, setPaymentStatus] = useState<string>(guest?.paymentStatus || "Lunas");
  const [paymentNote, setPaymentNote] = useState<string>(guest?.paymentNote || "");

  // Custom split payment fields
  const [splitTransfer, setSplitTransfer] = useState<number>(Number(guest?.paidTransfer || 0));
  const [splitQris, setSplitQris] = useState<number>(Number(guest?.paidQris || 0));
  const [splitEdc, setSplitEdc] = useState<number>(Number(guest?.paidEdc || 0));
  const [splitCash, setSplitCash] = useState<number>(Number(guest?.paidCash || 0));
  const [splitOta, setSplitOta] = useState<number>(Number(guest?.paidOta || 0));

  if (!isOpen || !guest) return null;

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("id-ID").format(num);
  };

  // When Collect Type toggles, auto-adjust standard method if desired
  const handleCollectChange = (type: CollectType) => {
    setSelectedCollect(type);
    if (type === "channel" && selectedMethod !== "split") {
      setSelectedMethod("ota");
    } else if (type === "property" && selectedMethod === "ota") {
      setSelectedMethod("transfer");
    }
  };

  // Helper to match booking cleanly
  const isTargetBooking = (e: any): boolean => {
    if (!e) return false;
    const gBookingId = (guest.bookingId || guest.voucherCode || "").trim();
    const eBookingId = (e.bookingId || e.voucherCode || "").trim();
    if (gBookingId && eBookingId) {
      if (gBookingId === eBookingId || `${gBookingId}-BFT` === eBookingId || `${eBookingId}-BFT` === gBookingId) {
        return true;
      }
      return false;
    }

    const gTimestamp = guest.timestamp ? String(guest.timestamp).trim() : "";
    const eTimestamp = e.timestamp ? String(e.timestamp).trim() : "";
    if (gTimestamp && eTimestamp && gTimestamp === eTimestamp) return true;

    const gId = guest.id ? String(guest.id).trim() : "";
    const eId = e.id ? String(e.id).trim() : "";
    if (gId && eId && gId === eId) return true;

    const gName = (guest.guestName || "").trim().toLowerCase();
    const eName = (e.guestName || "").trim().toLowerCase();
    const gRoom = String(guest.roomNumber || "").trim();
    const eRoom = String(e.roomNumber || "").trim();
    if (gName && eName && gName === eName) {
      if (gRoom && eRoom) return gRoom === eRoom;
      return true;
    }
    return false;
  };

  // Collect all cascade dates where this booking may be stored
  const getCascadeDates = (): string[] => {
    const dates = new Set<string>();
    const addDate = (d?: string) => {
      if (d && typeof d === "string" && d.includes("-") && d.length === 10) {
        dates.add(d);
      }
    };

    addDate(guest.checkInDate || guest.checkIn);
    addDate(guest.checkOutDate || guest.checkOut);
    addDate(guest.effectiveDate);
    addDate(guest._docDate);

    // Add dates between checkin and checkout
    const cIn = guest.checkInDate || guest.checkIn;
    const cOut = guest.checkOutDate || guest.checkOut;
    if (cIn && cOut && cOut > cIn) {
      let curr = new Date(cIn);
      const end = new Date(cOut);
      while (curr <= end) {
        dates.add(curr.toISOString().split("T")[0]);
        curr.setDate(curr.getDate() + 1);
      }
    }

    if (guest.timestamp) {
      try {
        const tStr = typeof guest.timestamp === "string" && guest.timestamp.includes("T")
          ? guest.timestamp.split("T")[0]
          : new Date(guest.timestamp).toISOString().split("T")[0];
        addDate(tStr);
      } catch {}
    }

    return Array.from(dates).filter(Boolean).sort();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const hotelId = activeHotelCode || localStorage.getItem("active_hotel_code") || "";
      if (!hotelId) {
        toast.error("Kode hotel tidak ditemukan.");
        setLoading(false);
        return;
      }

      // 1. Calculate final payment fields
      let finalPaidCash = 0;
      let finalPaidEdc = 0;
      let finalPaidQris = 0;
      let finalPaidTransfer = 0;
      let finalPaidOta = 0;
      let finalPaymentMethod = "Bank Transfer";
      const finalPaymentCollect = selectedCollect;
      let finalIsOTA = selectedCollect === "channel";

      if (selectedMethod === "transfer") {
        finalPaidTransfer = totalAmount;
        finalPaymentMethod = "Bank Transfer";
      } else if (selectedMethod === "qris") {
        finalPaidQris = totalAmount;
        finalPaymentMethod = "QRIS Payment";
      } else if (selectedMethod === "edc") {
        finalPaidEdc = totalAmount;
        finalPaymentMethod = "EDC / Mesin Kartu";
      } else if (selectedMethod === "cash") {
        finalPaidCash = totalAmount;
        finalPaymentMethod = "Kas / Tunai";
      } else if (selectedMethod === "ota") {
        finalPaidOta = totalAmount;
        finalPaymentMethod = "OTA Virtual / City Ledger";
        finalIsOTA = true;
      } else if (selectedMethod === "split") {
        finalPaidCash = Number(splitCash) || 0;
        finalPaidEdc = Number(splitEdc) || 0;
        finalPaidQris = Number(splitQris) || 0;
        finalPaidTransfer = Number(splitTransfer) || 0;
        finalPaidOta = Number(splitOta) || 0;
        finalPaymentMethod = "Split Payment";
        finalIsOTA = finalPaidOta > 0 || selectedCollect === "channel";
      }

      const finalPayHotel = finalPaidCash + finalPaidEdc + finalPaidQris + finalPaidTransfer;
      const finalPayTransfer = finalPaidOta + finalPaidTransfer;

      // 2. Locate all daily_revenue documents where this reservation lives
      const sweepDates = getCascadeDates();
      let matchCount = 0;

      // Calculate nights to distribute daily amounts evenly across multi-night stays
      const cIn = guest.checkInDate || guest.checkIn;
      const cOut = guest.checkOutDate || guest.checkOut;
      let nights = 1;
      if (cIn && cOut && cOut > cIn) {
        const diff = Math.round((new Date(cOut).getTime() - new Date(cIn).getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 0) nights = diff;
      }

      // 3. IN-PLACE UPDATE ONLY: Update existing entries, NEVER create double postings
      for (const d of sweepDates) {
        const docRef = doc(getHotelCollection(db, "daily_revenue", hotelId), `${hotelId}_${d}`);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) continue;

        const data = docSnap.data();
        const currentEntries = data.entries || [];
        let hasModified = false;

        const updatedEntries = currentEntries.map((e: any) => {
          if (isTargetBooking(e)) {
            hasModified = true;
            matchCount++;

            const dailyCash = Math.round(finalPaidCash / nights);
            const dailyEdc = Math.round(finalPaidEdc / nights);
            const dailyQris = Math.round(finalPaidQris / nights);
            const dailyTransfer = Math.round(finalPaidTransfer / nights);
            const dailyOta = Math.round(finalPaidOta / nights);
            const dPayHotel = dailyCash + dailyEdc + dailyQris + dailyTransfer;
            const dPayTransfer = dailyOta + dailyTransfer;

            return {
              ...e,
              paymentMethod: finalPaymentMethod,
              paymentCollect: finalPaymentCollect,
              paymentStatus: paymentStatus,
              paidCash: dailyCash,
              paidEdc: dailyEdc,
              paidQris: dailyQris,
              paidTransfer: dailyTransfer,
              paidOta: dailyOta,
              payHotel: dPayHotel,
              payTransfer: dPayTransfer,
              paidAmount1: dPayHotel,
              paidAmount2: dPayTransfer,
              isOTA: finalIsOTA,
              // If booking engine was falsely tagged, keep or correct channel
              channel: finalIsOTA ? (e.channel || "OTA") : (e.channel?.toLowerCase().includes("booking engine") ? "Booking Engine" : (e.channel || "Direct Web")),
              paymentNote: paymentNote || e.paymentNote || "",
              lastUpdated: new Date().toISOString()
            };
          }
          return e;
        });

        if (hasModified) {
          const sanitizedEntries = updatedEntries.map((item: any) => cleanUndefined(item));
          await updateDoc(docRef, { entries: sanitizedEntries });
        }
      }

      if (matchCount > 0) {
        toast.success(`Metode pembayaran & penagihan berhasil disinkronkan ke Accounting (${finalPaymentMethod} • ${finalPaymentCollect === "channel" ? "OTA Collect" : "Hotel Collect"})!`);
      } else {
        toast.info("Catatan: Data pembayaran berhasil disesuaikan pada sesi ini.");
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating payment method:", err);
      toast.error("Gagal memperbarui metode pembayaran.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      backdropFilter: "blur(4px)",
      zIndex: 250,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "540px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Modal Header ala Hotel PMS */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#f8fafc"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "rgba(2, 132, 199, 0.12)",
              color: "#0284c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Receipt size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                Modify Folio Billing & Payment Settlement
              </h3>
              <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                Reservation #{guest.bookingId || guest.voucherCode || "Ref"} • {guest.guestName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "80vh", overflowY: "auto" }}>
          {/* Total Amount Pill */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 14px",
            backgroundColor: "#f1f5f9",
            borderRadius: "8px",
            fontSize: "12px"
          }}>
            <span style={{ color: "#64748b", fontWeight: 600 }}>Total Reservation Folio Value:</span>
            <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
              IDR {formatNumber(totalAmount)}
            </span>
          </div>

          {/* Section 1: Saluran Penagihan (Payment Collect) */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#475569", marginBottom: "8px", letterSpacing: "0.3px" }}>
              1. Settlement & Billing Channel (Payment Collect):
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {/* Hotel / Property Collect */}
              <div
                onClick={() => handleCollectChange("property")}
                style={{
                  border: selectedCollect === "property" ? "2px solid #0284c7" : "1px solid #e2e8f0",
                  backgroundColor: selectedCollect === "property" ? "#f0f9ff" : "#ffffff",
                  padding: "12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "12px", color: selectedCollect === "property" ? "#0284c7" : "#1e293b" }}>
                    <Hotel size={16} />
                    <span>Hotel Collect</span>
                  </div>
                  {selectedCollect === "property" && <Check size={16} color="#0284c7" />}
                </div>
                <div style={{ fontSize: "10px", color: "#64748b", lineHeight: "1.3" }}>
                  Property Collect (Direct Cash/Card settled at front desk)
                </div>
              </div>

              {/* OTA / Channel Collect */}
              <div
                onClick={() => handleCollectChange("channel")}
                style={{
                  border: selectedCollect === "channel" ? "2px solid #d97706" : "1px solid #e2e8f0",
                  backgroundColor: selectedCollect === "channel" ? "#fffbeb" : "#ffffff",
                  padding: "12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "12px", color: selectedCollect === "channel" ? "#d97706" : "#1e293b" }}>
                    <Globe size={16} />
                    <span>OTA Collect</span>
                  </div>
                  {selectedCollect === "channel" && <Check size={16} color="#d97706" />}
                </div>
                <div style={{ fontSize: "10px", color: "#64748b", lineHeight: "1.3" }}>
                  Channel Collect (City Ledger AR / OTA Virtual Card)
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Quick Payment Options Grid */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#475569", marginBottom: "8px", letterSpacing: "0.3px" }}>
              2. Settlement Tender / Method:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              {/* Bank Transfer */}
              <button
                type="button"
                onClick={() => setSelectedMethod("transfer")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: selectedMethod === "transfer" ? "2px solid #0284c7" : "1px solid #e2e8f0",
                  backgroundColor: selectedMethod === "transfer" ? "#f0f9ff" : "#ffffff",
                  color: selectedMethod === "transfer" ? "#0284c7" : "#334155",
                  fontWeight: selectedMethod === "transfer" ? 700 : 500,
                  fontSize: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease"
                }}
              >
                <Landmark size={16} />
                <div>
                  <div>Bank Transfer</div>
                  <div style={{ fontSize: "9.5px", color: "#64748b", fontWeight: 400 }}>Direct Hotel Account BCA / Mandiri</div>
                </div>
              </button>

              {/* QRIS Payment */}
              <button
                type="button"
                onClick={() => setSelectedMethod("qris")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: selectedMethod === "qris" ? "2px solid #0284c7" : "1px solid #e2e8f0",
                  backgroundColor: selectedMethod === "qris" ? "#f0f9ff" : "#ffffff",
                  color: selectedMethod === "qris" ? "#0284c7" : "#334155",
                  fontWeight: selectedMethod === "qris" ? 700 : 500,
                  fontSize: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease"
                }}
              >
                <QrCode size={16} />
                <div>
                  <div>QRIS / Digital Tender</div>
                  <div style={{ fontSize: "9.5px", color: "#64748b", fontWeight: 400 }}>Dynamic & Static QRIS</div>
                </div>
              </button>

              {/* EDC / Card */}
              <button
                type="button"
                onClick={() => setSelectedMethod("edc")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: selectedMethod === "edc" ? "2px solid #0284c7" : "1px solid #e2e8f0",
                  backgroundColor: selectedMethod === "edc" ? "#f0f9ff" : "#ffffff",
                  color: selectedMethod === "edc" ? "#0284c7" : "#334155",
                  fontWeight: selectedMethod === "edc" ? 700 : 500,
                  fontSize: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease"
                }}
              >
                <CreditCard size={16} />
                <div>
                  <div>EDC / Card Settlement</div>
                  <div style={{ fontSize: "9.5px", color: "#64748b", fontWeight: 400 }}>Credit & Debit Card Terminal</div>
                </div>
              </button>

              {/* Cash / Tunai */}
              <button
                type="button"
                onClick={() => setSelectedMethod("cash")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: selectedMethod === "cash" ? "2px solid #0284c7" : "1px solid #e2e8f0",
                  backgroundColor: selectedMethod === "cash" ? "#f0f9ff" : "#ffffff",
                  color: selectedMethod === "cash" ? "#0284c7" : "#334155",
                  fontWeight: selectedMethod === "cash" ? 700 : 500,
                  fontSize: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease"
                }}
              >
                <Banknote size={16} />
                <div>
                  <div>Cash at Front Desk</div>
                  <div style={{ fontSize: "9.5px", color: "#64748b", fontWeight: 400 }}>Physical Cash at Front Office</div>
                </div>
              </button>

              {/* OTA Virtual / City Ledger */}
              <button
                type="button"
                onClick={() => {
                  setSelectedMethod("ota");
                  setSelectedCollect("channel");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: selectedMethod === "ota" ? "2px solid #d97706" : "1px solid #e2e8f0",
                  backgroundColor: selectedMethod === "ota" ? "#fffbeb" : "#ffffff",
                  color: selectedMethod === "ota" ? "#d97706" : "#334155",
                  fontWeight: selectedMethod === "ota" ? 700 : 500,
                  fontSize: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease"
                }}
              >
                <Globe size={16} />
                <div>
                  <div>OTA City Ledger</div>
                  <div style={{ fontSize: "9.5px", color: "#64748b", fontWeight: 400 }}>Virtual Card / Channel Manager AR</div>
                </div>
              </button>

              {/* Split Payment */}
              <button
                type="button"
                onClick={() => setSelectedMethod("split")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: selectedMethod === "split" ? "2px solid #0284c7" : "1px solid #e2e8f0",
                  backgroundColor: selectedMethod === "split" ? "#f0f9ff" : "#ffffff",
                  color: selectedMethod === "split" ? "#0284c7" : "#334155",
                  fontWeight: selectedMethod === "split" ? 700 : 500,
                  fontSize: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease"
                }}
              >
                <Building2 size={16} />
                <div>
                  <div>Split Payment</div>
                  <div style={{ fontSize: "9.5px", color: "#64748b", fontWeight: 400 }}>Multi-Tender Mixed Settlement</div>
                </div>
              </button>
            </div>
          </div>

          {/* Split Payment Inputs (if split selected) */}
          {selectedMethod === "split" && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "8px",
              padding: "12px",
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0"
            }}>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 600, color: "#64748b" }}>Transfer (IDR):</label>
                <input
                  type="number"
                  value={splitTransfer}
                  onChange={(e) => setSplitTransfer(Number(e.target.value) || 0)}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 600, color: "#64748b" }}>QRIS (IDR):</label>
                <input
                  type="number"
                  value={splitQris}
                  onChange={(e) => setSplitQris(Number(e.target.value) || 0)}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 600, color: "#64748b" }}>EDC / Card (IDR):</label>
                <input
                  type="number"
                  value={splitEdc}
                  onChange={(e) => setSplitEdc(Number(e.target.value) || 0)}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 600, color: "#64748b" }}>Cash (IDR):</label>
                <input
                  type="number"
                  value={splitCash}
                  onChange={(e) => setSplitCash(Number(e.target.value) || 0)}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: "10px", fontWeight: 600, color: "#64748b" }}>OTA City Ledger (IDR):</label>
                <input
                  type="number"
                  value={splitOta}
                  onChange={(e) => setSplitOta(Number(e.target.value) || 0)}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>
          )}

          {/* Section 3: Status Penagihan & Catatan Kasir */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                Folio Settlement Status:
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#0f172a"
                }}
              >
                <option value="Lunas">Paid / Settled in Full</option>
                <option value="Pending">Pending / Pay at Hotel</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                Cashier & Audit Remarks (Optional):
              </label>
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="e.g. Booking Engine guest bank transfer verified, updated by FO supervisor"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  color: "#0f172a"
                }}
              />
            </div>
          </div>

          {/* Info Notice: Anti Double-Posting & Accounting Push */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            padding: "10px 12px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            fontSize: "11px",
            color: "#166534",
            lineHeight: 1.4
          }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: "2px", color: "#16a34a" }} />
            <span>
              <strong>Direct Accounting Synchronization:</strong> Updates push directly to General Ledger, P&L, Cash Flow, and DSR in-place with zero double-posting.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "8px",
          padding: "14px 20px",
          borderTop: "1px solid #e2e8f0",
          backgroundColor: "#f8fafc"
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "7px 16px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 18px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#0284c7",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 1px 2px rgba(2, 132, 199, 0.3)"
            }}
          >
            {loading ? (
              <>
                <RotateCw size={14} className="animate-spin" />
                <span>Synchronizing...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Save & Synchronize to Accounting</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
