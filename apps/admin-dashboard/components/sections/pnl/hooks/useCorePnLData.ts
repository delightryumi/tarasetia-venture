import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { HotelMaster } from "@/lib/pnl-logic";
import { PnlIncomeItem, PnlExpenseItem, InvestorItem } from "@/lib/pnl-utils";

export const useCorePnLData = (month: string, viewMode: "monthly" | "yearly") => {
    const [loadingCore, setLoadingCore] = useState(false);
    const [allHotels, setAllHotels] = useState<HotelMaster[]>([]);
    const [customIncomes, setCustomIncomes] = useState<PnlIncomeItem[]>([]);
    const [nonCommissionRevenue, setNonCommissionRevenue] = useState<PnlIncomeItem[]>([]);
    const [expenses, setExpenses] = useState<PnlExpenseItem[]>([]);
    const [investors, setInvestors] = useState<InvestorItem[]>([]);
    const [vatPercentage, setVatPercentage] = useState(11);
    const [mgmtFeePercentage, setMgmtFeePercentage] = useState(10);
    const [serviceChargePercentage, setServiceChargePercentage] = useState(10);
    const [lostBreakagePercentage, setLostBreakagePercentage] = useState(1);
    const [hotelGopPercentages, setHotelGopPercentages] = useState<Record<string, number>>({});

    const fetchCoreData = async () => {
        setLoadingCore(true);
        try {
            // Fetch properties (hotels)
            const propertiesSnap = await getDocs(collection(db, "properties"));
            const hotelList: HotelMaster[] = [];
            propertiesSnap.forEach((docSnap) => {
                const d = docSnap.data();
                hotelList.push({ id: docSnap.id, name: d.Nama || d.name || `Property ${docSnap.id}` });
            });
            setAllHotels(hotelList);

            // Fetch global PnL reports
            if (viewMode === "monthly") {
                const docRef = doc(db, "global_pnl_reports", month);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCustomIncomes(data.customIncomes || []);
                    setNonCommissionRevenue(data.nonCommissionRevenue || []);
                    setExpenses(data.expenses || []);
                    setInvestors(data.investors || []);
                    setVatPercentage(data.vatPercentage ?? 11);
                    setMgmtFeePercentage(data.mgmtFeePercentage ?? 10);
                    setServiceChargePercentage(data.serviceChargePercentage ?? 10);
                    setLostBreakagePercentage(data.lostBreakagePercentage ?? 1);
                    setHotelGopPercentages(data.hotelGopPercentages || {});
                } else {
                    setCustomIncomes([]); setNonCommissionRevenue([]); setExpenses([]); setInvestors([]); 
                    setVatPercentage(11); setMgmtFeePercentage(10); setHotelGopPercentages({});
                    setServiceChargePercentage(10); setLostBreakagePercentage(1);
                }
            } else {
                const [y] = month.split('-');
                const yearlyCustomIncomes: PnlIncomeItem[] = [];
                const yearlyNonComm: PnlIncomeItem[] = [];
                const yearlyExpenses: PnlExpenseItem[] = [];
                const yearlyInvestors: InvestorItem[] = [];
                let latestVat = 11;
                let latestMgmt = 10;
                let latestService = 10;
                let latestLost = 1;

                const pnlQ = query(collection(db, "global_pnl_reports"), 
                            where("__name__", ">=", `${y}-01`), 
                            where("__name__", "<=", `${y}-12`));
                const pnlSnap = await getDocs(pnlQ);
                
                pnlSnap.forEach(d => {
                    const data = d.data();
                    yearlyCustomIncomes.push(...(data.customIncomes || []));
                    yearlyNonComm.push(...(data.nonCommissionRevenue || []));
                    yearlyExpenses.push(...(data.expenses || []));
                    if (yearlyInvestors.length === 0) yearlyInvestors.push(...(data.investors || []));
                    if (d.id === month) {
                        latestVat = data.vatPercentage ?? 11;
                        latestMgmt = data.mgmtFeePercentage ?? 10;
                        latestService = data.serviceChargePercentage ?? 10;
                        latestLost = data.lostBreakagePercentage ?? 1;
                    }
                });

                setCustomIncomes(yearlyCustomIncomes);
                setNonCommissionRevenue(yearlyNonComm);
                setExpenses(yearlyExpenses);
                setInvestors(yearlyInvestors);
                setVatPercentage(latestVat);
                setMgmtFeePercentage(latestMgmt);
                setServiceChargePercentage(latestService);
                setLostBreakagePercentage(latestLost);
            }
        } catch (error) {
            console.error("Error fetching core PnL data:", error);
        } finally {
            setLoadingCore(false);
        }
    };

    useEffect(() => {
        fetchCoreData();
    }, [month, viewMode]);

    const updateVat = async (val: number) => {
        setVatPercentage(val);
        try {
            const docRef = doc(db, "global_pnl_reports", month);
            await updateDoc(docRef, { vatPercentage: val });
        } catch (error) { console.error("Failed to save VAT:", error); }
    };

    const updateMgmtFee = async (val: number) => {
        setMgmtFeePercentage(val);
        try {
            const docRef = doc(db, "global_pnl_reports", month);
            await updateDoc(docRef, { mgmtFeePercentage: val });
        } catch (error) { console.error("Failed to save Fee:", error); }
    };

    const updateServiceCharge = async (val: number) => {
        setServiceChargePercentage(val);
        try {
            const docRef = doc(db, "global_pnl_reports", month);
            await updateDoc(docRef, { serviceChargePercentage: val });
        } catch (error) { console.error("Failed to save Service Charge:", error); }
    };

    const updateLostBreakage = async (val: number) => {
        setLostBreakagePercentage(val);
        try {
            const docRef = doc(db, "global_pnl_reports", month);
            await updateDoc(docRef, { lostBreakagePercentage: val });
        } catch (error) { console.error("Failed to save Lost Breakage:", error); }
    };

    const updateHotelGop = async (hotelId: string, val: number) => {
        const updated = { ...hotelGopPercentages, [hotelId]: val };
        setHotelGopPercentages(updated);
        try {
            const docRef = doc(db, "global_pnl_reports", month);
            await updateDoc(docRef, { hotelGopPercentages: updated });
        } catch (error) { console.error("Failed to save Hotel GOP:", error); }
    };

    return {
        loadingCore,
        allHotels,
        customIncomes,
        nonCommissionRevenue,
        expenses,
        investors,
        vatPercentage,
        mgmtFeePercentage,
        serviceChargePercentage,
        lostBreakagePercentage,
        hotelGopPercentages,
        updateVat,
        updateMgmtFee,
        updateServiceCharge,
        updateLostBreakage,
        updateHotelGop,
        refetchCoreData: fetchCoreData
    };
};
