"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";

export interface Transaction {
  amount: number;
  paidCash: number;
  paidTransfer: number;
  feePercentage: number;
  status: string;
  channel: string;
  penaltyType: string;
  penaltyAmount: number;
  penaltyMethod?: string;
  propertyId: string;
  date: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  roomType: string;
  bookingId: string;
}

export function useTransactions(month?: number, year?: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      try {
        const currentMonth = month !== undefined ? month + 1 : new Date().getMonth() + 1;
        const currentYear = year !== undefined ? year : new Date().getFullYear();
        
        const monthStr = String(currentMonth).padStart(2, '0');
        const startStr = `${currentYear}-${monthStr}-01`;
        const lastDay = new Date(currentYear, currentMonth, 0).getDate();
        const endStr = `${currentYear}-${monthStr}-${lastDay}`;

        const q = query(
          getHotelCollection(db, "daily_revenue"),
          where("date", ">=", startStr),
          where("date", "<=", endStr)
        );

        const querySnapshot = await getDocs(q);
        const results: Transaction[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const hotelId = data.hotelId || "";
          const docDate = data.date || "-";
          
          (data.entries || []).forEach((t: any) => {
            results.push({
              amount: Number(t.amount) || 0,
              paidCash: Number(t.paidCash || t.paidAmount1) || 0,
              paidTransfer: Number(t.paidTransfer || t.paidAmount2) || 0,
              feePercentage: Number(t.feePercentage) || 0,
              status: t.status || "CONFIRMED",
              channel: t.channel || "Walk-in",
              penaltyType: t.penaltyType || "NONE",
              penaltyAmount: Number(t.penaltyAmount) || 0,
              penaltyMethod: t.penaltyMethod,
              propertyId: hotelId,
              date: docDate,
              guestName: t.guestName || "Unknown",
              checkInDate: t.checkInDate || docDate,
              checkOutDate: t.checkOutDate || docDate,
              roomType: t.roomType || "-",
              bookingId: t.bookingId || "-"
            });
          });
        });

        setTransactions(results);
        setError(null);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [month, year]);

  return { transactions, loading, error };
}
