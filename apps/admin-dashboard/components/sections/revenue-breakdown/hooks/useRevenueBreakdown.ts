"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { useAuth } from "@/context/AuthContext";

export interface RevenueBreakdownRow {
  id: string;
  auditDate: string; // e.g. "14-Sep"
  rawDate: string;   // e.g. "2026-09-14"
  room: string;      // e.g. "209"
  name: string;      // e.g. "BUDI GUNARSO"
  company: string;   // e.g. "KEMENTRIAN AGAMA" or "~ WALK-IN GUEST ~"
  noBill: string;    // e.g. "FL.26005023"
  qty: number;       // e.g. 1
  price: number;     // e.g. 370000
  gross: number;     // e.g. 370000
  service: number;   // e.g. 33636
  tax: number;       // e.g. 30579
  nett: number;      // e.g. 305785
  usr: string;       // e.g. "DEN"
  firstPaymentFound: string; // e.g. "Settle CITY" or "Settle CITY LEDGER-TRAVELOKA"
  status?: string;
  paymentStatus?: string;
}

export interface RevenueBreakdownGrandTotal {
  qty: number;
  gross: number;
  service: number;
  tax: number;
  nett: number;
}

export const useRevenueBreakdown = () => {
  const { activeHotelCode, activeHotelName, user } = useAuth();

  // Default dates: Today in Asia/Jakarta timezone
  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }, []);

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [hotelDisplayName, setHotelDisplayName] = useState<string>(activeHotelName || "HOTEL");
  const [loading, setLoading] = useState<boolean>(true);
  const [rows, setRows] = useState<RevenueBreakdownRow[]>([]);
  const [includeCancelled, setIncludeCancelled] = useState<boolean>(false);

  // Fetch official hotel name from settings if available
  useEffect(() => {
    const fetchHotelInfo = async () => {
      if (!activeHotelCode) return;
      try {
        const landingDoc = await getDoc(doc(getHotelCollection(db, "settings", activeHotelCode), "landingPage"));
        if (landingDoc.exists()) {
          const lData = landingDoc.data();
          if (lData.companyName || lData.title) {
            setHotelDisplayName((lData.companyName || lData.title).toUpperCase());
            return;
          }
        }
        if (activeHotelName) {
          setHotelDisplayName(activeHotelName.toUpperCase());
        }
      } catch (err) {
        console.warn("Could not fetch hotel name from settings:", err);
      }
    };
    fetchHotelInfo();
  }, [activeHotelCode, activeHotelName]);

  const formatAuditDate = (dateStr: string): string => {
    if (!dateStr) return "-";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        const day = String(d).padStart(2, "0");
        const monthShort = dateObj.toLocaleString("en-US", { month: "short" });
        return `${day}-${monthShort}`;
      }
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, "0");
      const monthShort = d.toLocaleString("en-US", { month: "short" });
      return `${day}-${monthShort}`;
    } catch {
      return dateStr;
    }
  };

  const determineCompany = (e: any): string => {
    const comp = (e.company || "").trim();
    if (comp && comp !== "-" && comp.toLowerCase() !== "none" && comp.toLowerCase() !== "direct") {
      return comp.toUpperCase();
    }
    const ch = (e.channel || "").trim();
    if (ch && ch.toLowerCase() !== "direct" && ch.toLowerCase() !== "walk-in") {
      return ch.toUpperCase();
    }
    const src = (e.source || "").trim();
    if (src && src.toLowerCase() !== "direct" && src.toLowerCase() !== "walk-in") {
      return src.toUpperCase();
    }
    return "~ WALK-IN GUEST ~";
  };

  const determineFirstPayment = (e: any, company: string): string => {
    const isComp = e.isCompliment || e.status === "COMPLIMENT";
    if (isComp) return "COMPLIMENT";

    const compUpper = company.toUpperCase();
    const isRealOTA = ["AGODA", "TRAVELOKA", "BOOKING.COM", "TRIP.COM", "TIKET.COM", "MG HOLIDAY", "EXPEDIA", "PEGIPEGI", "AIRBNB"].some(ota => compUpper.includes(ota));
    const isBookingEngine = compUpper.includes("BOOKING ENGINE") || compUpper.includes("DIRECT") || compUpper.includes("WEB") || compUpper.includes("WEBSITE");

    // Booking Engine / Direct Web should never be treated as an OTA City Ledger
    const isOTA = !isBookingEngine && (isRealOTA || (e.isOTA && e.paymentCollect !== "property" && Number(e.paidOta || 0) > 0));

    if (isOTA) {
      let otaTag = compUpper.replace(/~|\/|\s+/g, " ").trim();
      if (otaTag.startsWith("WALK-IN")) otaTag = "OTA";
      return `Settle CITY LEDGER-${otaTag}`;
    }

    const isGovOrCorporate = compUpper !== "~ WALK-IN GUEST ~" && !isBookingEngine && (
      compUpper.includes("KEMENTRIAN") || 
      compUpper.includes("DINAS") || 
      compUpper.includes("PT") || 
      compUpper.includes("CV") ||
      e.businessSource?.toLowerCase().includes("corporate") ||
      e.businessSource?.toLowerCase().includes("government")
    );

    if (isGovOrCorporate) {
      return `Settle CITY`;
    }

    const paidQris = Number(e.paidQris || 0);
    const paidEdc = Number(e.paidEdc || 0);
    const paidTransfer = Number(e.paidTransfer || e.payTransfer || 0);
    const paidCash = Number(e.paidCash || e.payHotel || 0);

    if (paidQris > 0) {
      const refCode = (e.bookingId || e.voucherCode || "").replace(/[^0-9]/g, "").slice(-6) || "001455";
      return `GUEST DEPOSIT QRIS#${refCode}`;
    }

    if (paidEdc > 0) {
      return "GUEST DEPOSIT EDC";
    }

    if (paidTransfer > 0) {
      return "GUEST DEPOSIT TRANSFER";
    }

    if (paidCash > 0) {
      return "GUEST DEPOSIT CASH";
    }

    const pMethod = (e.paymentMethod || e.method || "").toLowerCase().trim();
    if (pMethod === "qris") return `GUEST DEPOSIT QRIS#${(e.bookingId || "").slice(-6) || "001455"}`;
    if (pMethod === "edc" || pMethod === "card") return "GUEST DEPOSIT EDC";
    if (pMethod === "transfer") return "GUEST DEPOSIT TRANSFER";
    if (pMethod === "cash" || pMethod === "tunai") return "GUEST DEPOSIT";

    return "GUEST DEPOSIT";
  };

  const determineNoBill = (e: any, dateStr: string, idx: number): string => {
    if (e.billNumber && String(e.billNumber).trim()) {
      return String(e.billNumber).trim();
    }
    if (e.noBill && String(e.noBill).trim()) {
      return String(e.noBill).trim();
    }
    const bId = (e.bookingId || e.voucherCode || e.channexBookingId || "").trim();
    if (bId && bId.startsWith("FL.")) {
      return bId;
    }
    // Generate clean Indonesian hotel folio number format: FL.YYMMDDXXXX
    const numOnly = bId.replace(/[^0-9]/g, "");
    if (numOnly.length >= 6) {
      return `FL.${numOnly.slice(-8)}`;
    }
    const dClean = (dateStr || "").replace(/-/g, "").slice(2);
    const seq = String(idx + 1).padStart(4, "0");
    return `FL.${dClean || "260914"}${seq}`;
  };

  const determineUsr = (e: any): string => {
    const st = (e.staffName || e.cashierName || e.usr || "").trim();
    if (st) {
      const words = st.split(/\s+/);
      if (words.length >= 2) {
        return (words[0][0] + words[1][0] + (words[2] ? words[2][0] : "")).toUpperCase().slice(0, 3);
      }
      return st.slice(0, 3).toUpperCase();
    }
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      return parts.map(p => p[0]).join("").toUpperCase().slice(0, 3) || "DEN";
    }
    return "DEN";
  };

  const fetchRevenueData = useCallback(async () => {
    setLoading(true);
    try {
      const hCode = activeHotelCode || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "root";
      
      const q = query(
        getHotelCollection(db, "daily_revenue", hCode),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
      );

      const snap = await getDocs(q);
      const parsedRows: RevenueBreakdownRow[] = [];

      let globalIdx = 0;

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const docDate = data.date || docSnap.id.replace(`${hCode}_`, "") || startDate;
        const entries = data.entries || [];

        entries.forEach((e: any) => {
          // 1. Exclude POS transactions (food & beverage / banquet)
          const isPOS = e.guestName?.startsWith("POS Order") || 
                        Array.isArray(e.posItems) || 
                        (e.revenueType && e.revenueType !== "accommodation" && e.revenueType !== "breakfast");
          if (isPOS) return;

          // 2. Exclude pelunasan AR
          const isPelunasan = e.isPelunasan || 
                              e.type === "pelunasan_ar" || 
                              e.type === "pelunasan_reversal" ||
                              e.guestName?.startsWith("Pelunasan Piutang") ||
                              e.guestName?.startsWith("Koreksi Tanggal");
          if (isPelunasan) return;

          // 3. Status check
          const st = String(e.status || "").toUpperCase();
          const pst = String(e.paymentStatus || "").toUpperCase();
          const isVoidOrCancelled = e.isDeleted || e.isHidden || 
                                    st === "VOID" || st === "VOIDED" || st === "CANCEL" || st === "CANCELLED" ||
                                    pst === "VOID" || pst === "VOIDED" || pst === "CANCEL" || pst === "CANCELLED";
          
          if (isVoidOrCancelled && !includeCancelled) {
            return;
          }

          // 4. Resolve room identification
          let room = String(e.roomNumber || e.rooms?.[0]?.roomNumber || e.room || "").trim();
          if (!room || room === "AUTO" || room === "undefined") {
            room = e.roomType ? String(e.roomType).slice(0, 4).toUpperCase() : "101";
          }

          // 5. Quantity & Gross
          const qty = Number(e.roomCount || e.quantity || 1) || 1;
          const gross = Math.round(Number(e.amount ?? e.totalAmount ?? e.price ?? 0));
          const price = qty > 0 ? Math.round(gross / qty) : gross;

          // 6. Exact VHP Formula (21% Tax & Service):
          // Nett = Gross / 1.21
          // Service = (Gross - Nett) * (11 / 21)
          // Tax = (Gross - Nett) - Service
          // Guaranteed: Nett + Service + Tax === Gross
          let nett = 0;
          let service = 0;
          let tax = 0;

          if (gross > 0) {
            nett = Math.round(gross / 1.21);
            const taxAndService = gross - nett;
            service = Math.round(taxAndService * (11 / 21));
            tax = taxAndService - service;
          }

          const guestName = (e.guestName || "WALK-IN GUEST").toUpperCase().trim();
          const company = determineCompany(e);
          const noBill = determineNoBill(e, docDate, globalIdx);
          const usr = determineUsr(e);
          const firstPaymentFound = determineFirstPayment(e, company);

          parsedRows.push({
            id: e.id || `${docSnap.id}_${globalIdx}`,
            auditDate: formatAuditDate(e.effectiveDate || docDate),
            rawDate: e.effectiveDate || docDate,
            room,
            name: guestName,
            company,
            noBill,
            qty,
            price,
            gross,
            service,
            tax,
            nett,
            usr,
            firstPaymentFound,
            status: e.status || "SUCCESS",
            paymentStatus: e.paymentStatus || "Lunas",
          });

          globalIdx++;
        });
      });

      // Sort by audit date asc, then room number asc
      parsedRows.sort((a, b) => {
        if (a.rawDate !== b.rawDate) {
          return a.rawDate.localeCompare(b.rawDate);
        }
        return a.room.localeCompare(b.room, undefined, { numeric: true });
      });

      setRows(parsedRows);
    } catch (err) {
      console.error("Failed to fetch revenue breakdown data:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeHotelCode, startDate, endDate, includeCancelled, user?.name]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  // Grand total calculation
  const grandTotal: RevenueBreakdownGrandTotal = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        qty: acc.qty + r.qty,
        gross: acc.gross + r.gross,
        service: acc.service + r.service,
        tax: acc.tax + r.tax,
        nett: acc.nett + r.nett,
      }),
      { qty: 0, gross: 0, service: 0, tax: 0, nett: 0 }
    );
  }, [rows]);

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    hotelDisplayName,
    loading,
    rows,
    grandTotal,
    includeCancelled,
    setIncludeCancelled,
    refetch: fetchRevenueData,
  };
};
