import { useState, useEffect } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { getHotelCollection } from "@/lib/firestoreHelper";

export const usePayrollData = (month: string, viewMode: "monthly" | "yearly") => {
    const [loadingPayroll, setLoadingPayroll] = useState(false);
    const [payrollExpense, setPayrollExpense] = useState(0);
    const [payrollDetails, setPayrollDetails] = useState<any[]>([]);

    const fetchPayrollData = async () => {
        setLoadingPayroll(true);
        try {
            const [y, m] = month.split('-');
            
            let hotelCode = '';
            if (typeof window !== 'undefined') {
              try {
                const activeCode = localStorage.getItem('active_hotel_code');
                if (activeCode) {
                  hotelCode = activeCode;
                } else {
                  const storedUser = localStorage.getItem('auth_user');
                  if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    hotelCode = parsed.hotelCode || '';
                  }
                }
              } catch (e) {}
            }

            let totalExp = 0;
            let detailsArr: any[] = [];

            if (viewMode === "monthly") {
                const summaryRef = doc(getHotelCollection(db, 'payroll_summaries', hotelCode), month);
                const summarySnap = await getDoc(summaryRef);
                if (summarySnap.exists()) {
                    totalExp = Number(summarySnap.data().totalPayrollExpense || 0);
                    if (Array.isArray(summarySnap.data().details)) {
                        detailsArr = summarySnap.data().details;
                    }
                }
            } else {
                const summariesRef = getHotelCollection(db, 'payroll_summaries', hotelCode);
                const q = query(summariesRef, 
                            where("__name__", ">=", `${y}-01`), 
                            where("__name__", "<=", `${y}-12`));
                const snap = await getDocs(q);
                snap.forEach(d => {
                    totalExp += Number(d.data().totalPayrollExpense || 0);
                    if (Array.isArray(d.data().details)) {
                        detailsArr = [...detailsArr, ...d.data().details];
                    }
                });
            }

            setPayrollExpense(totalExp);
            setPayrollDetails(detailsArr);
        } catch (error) {
            console.error("Error fetching Payroll data:", error);
        } finally {
            setLoadingPayroll(false);
        }
    };

    useEffect(() => {
        fetchPayrollData();
    }, [month, viewMode]);

    return {
        loadingPayroll,
        payrollExpense,
        payrollDetails,
        refetchPayrollData: fetchPayrollData
    };
};
