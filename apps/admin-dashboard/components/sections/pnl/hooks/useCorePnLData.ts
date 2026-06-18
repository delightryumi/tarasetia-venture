import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
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
    const [mgmtFeeRoomPercentage, setMgmtFeeRoomPercentage] = useState(10);
    const [mgmtFeeFnbPercentage, setMgmtFeeFnbPercentage] = useState(10);
    const [serviceChargePercentage, setServiceChargePercentage] = useState(10);
    const [lostBreakagePercentage, setLostBreakagePercentage] = useState(1);
    const [startingBalance, setStartingBalance] = useState(0);
    const [fixedAssetsValue, setFixedAssetsValue] = useState(0);
    const [vatPaid, setVatPaid] = useState(0);
    const [feePaid, setFeePaid] = useState(0);
    const [scPaid, setScPaid] = useState(0);
    const [lbPaid, setLbPaid] = useState(0);
    const [hotelGopPercentages, setHotelGopPercentages] = useState<Record<string, number>>({});

    const fetchCoreData = async () => {
        setLoadingCore(true);
        try {
            // Fetch properties (hotels)
            const propertiesSnap = await getDocs(collection(db, "properties"));
            const hotelList: HotelMaster[] = [];
            propertiesSnap.forEach((docSnap) => {
                const d = docSnap.data();
                // Tambahkan roomCount jika tersedia di dokumen properti
                const roomCount = typeof d.roomCount === 'number' ? d.roomCount : (typeof d.totalRooms === 'number' ? d.totalRooms : 0);
                hotelList.push({
                  id: docSnap.id,
                  name: d.Nama || d.name || `Property ${docSnap.id}`,
                  roomCount,
                });
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
                    const baseMgmt = data.mgmtFeePercentage ?? 10;
                    setMgmtFeePercentage(baseMgmt);
                    setMgmtFeeRoomPercentage(data.mgmtFeeRoomPercentage ?? baseMgmt);
                    setMgmtFeeFnbPercentage(data.mgmtFeeFnbPercentage ?? baseMgmt);
                    setServiceChargePercentage(data.serviceChargePercentage ?? 10);
                    setLostBreakagePercentage(data.lostBreakagePercentage ?? 1);
                    setStartingBalance(data.startingBalance ?? 0);
                    setFixedAssetsValue(data.fixedAssetsValue ?? 0);
                    setVatPaid(data.vatPaid ?? 0);
                    setFeePaid(data.feePaid ?? 0);
                    setScPaid(data.scPaid ?? 0);
                    setLbPaid(data.lbPaid ?? 0);
                    setHotelGopPercentages(data.hotelGopPercentages || {});
                } else {
                    setCustomIncomes([]); setNonCommissionRevenue([]); setExpenses([]); setInvestors([]); 
                    setVatPercentage(11); setMgmtFeePercentage(10); setMgmtFeeRoomPercentage(10); setMgmtFeeFnbPercentage(10); setHotelGopPercentages({});
                    setServiceChargePercentage(10); setLostBreakagePercentage(1); setStartingBalance(0); setFixedAssetsValue(0);
                    setVatPaid(0); setFeePaid(0); setScPaid(0); setLbPaid(0);
                }
            } else {
                const [y] = month.split('-');
                const yearlyCustomIncomes: PnlIncomeItem[] = [];
                const yearlyNonComm: PnlIncomeItem[] = [];
                const yearlyExpenses: PnlExpenseItem[] = [];
                const yearlyInvestors: InvestorItem[] = [];
                let latestVat = 11;
                let latestMgmt = 10;
                let latestMgmtRoom = 10;
                let latestMgmtFnb = 10;
                let latestService = 10;
                let latestLost = 1;
                let latestStartingBalance = 0;
                let latestFixedAssets = 0;
                let latestVatPaid = 0;
                let latestFeePaid = 0;
                let latestScPaid = 0;
                let latestLbPaid = 0;

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
                    
                    // Accumulate payments across the whole year
                    latestVatPaid += data.vatPaid ?? 0;
                    latestFeePaid += data.feePaid ?? 0;
                    latestScPaid += data.scPaid ?? 0;
                    latestLbPaid += data.lbPaid ?? 0;

                    // Saldo Awal is taken from January of that year (beginning of year)
                    if (d.id === `${y}-01`) {
                        latestStartingBalance = data.startingBalance ?? 0;
                    }

                    // Aktiva Tetap is taken from the selected month or December (end of year)
                    if (d.id === month || d.id === `${y}-12`) {
                        if (data.fixedAssetsValue) {
                            latestFixedAssets = data.fixedAssetsValue;
                        }
                    }

                    if (d.id === month) {
                        latestVat = data.vatPercentage ?? 11;
                        const baseMgmt = data.mgmtFeePercentage ?? 10;
                        latestMgmt = baseMgmt;
                        latestMgmtRoom = data.mgmtFeeRoomPercentage ?? baseMgmt;
                        latestMgmtFnb = data.mgmtFeeFnbPercentage ?? baseMgmt;
                        latestService = data.serviceChargePercentage ?? 10;
                        latestLost = data.lostBreakagePercentage ?? 1;

                        if (latestStartingBalance === 0) {
                            latestStartingBalance = data.startingBalance ?? 0;
                        }
                        if (latestFixedAssets === 0) {
                            latestFixedAssets = data.fixedAssetsValue ?? 0;
                        }
                    }
                });

                setCustomIncomes(yearlyCustomIncomes);
                setNonCommissionRevenue(yearlyNonComm);
                setExpenses(yearlyExpenses);
                setInvestors(yearlyInvestors);
                setVatPercentage(latestVat);
                setMgmtFeePercentage(latestMgmt);
                setMgmtFeeRoomPercentage(latestMgmtRoom);
                setMgmtFeeFnbPercentage(latestMgmtFnb);
                setServiceChargePercentage(latestService);
                setLostBreakagePercentage(latestLost);
                setStartingBalance(latestStartingBalance);
                setFixedAssetsValue(latestFixedAssets);
                setVatPaid(latestVatPaid);
                setFeePaid(latestFeePaid);
                setScPaid(latestScPaid);
                setLbPaid(latestLbPaid);
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

    const updateMgmtFeeRoom = async (val: number) => {
        setMgmtFeeRoomPercentage(val);
        try {
            const docRef = doc(db, "global_pnl_reports", month);
            await updateDoc(docRef, { mgmtFeeRoomPercentage: val });
        } catch (error) { console.error("Failed to save Room Fee:", error); }
    };

    const updateMgmtFeeFnb = async (val: number) => {
        setMgmtFeeFnbPercentage(val);
        try {
            const docRef = doc(db, "global_pnl_reports", month);
            await updateDoc(docRef, { mgmtFeeFnbPercentage: val });
        } catch (error) { console.error("Failed to save F&B Fee:", error); }
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

    const updateStartingBalance = async (val: number) => {
        setStartingBalance(val);
        try {
            const docRef = doc(db, "global_pnl_reports", month);
            await setDoc(docRef, { startingBalance: val }, { merge: true });
        } catch (error) { console.error("Failed to save Starting Balance:", error); }
    };

    const updateFixedAssetsValue = async (val: number) => {
        setFixedAssetsValue(val);
        try {
            const docRef = doc(db, "global_pnl_reports", month);
            await setDoc(docRef, { fixedAssetsValue: val }, { merge: true });
        } catch (error) { console.error("Failed to save Fixed Assets Value:", error); }
    };

    const updateVatPaid = async (val: number) => {
        setVatPaid(val);
        try {
            const docRef = doc(db, "global_pnl_reports", month);
            await setDoc(docRef, { vatPaid: val }, { merge: true });
        } catch (error) { console.error("Failed to save VAT Paid:", error); }
    };

    const updateFeePaid = async (val: number) => {
        setFeePaid(val);
        try {
            const docRef = doc(db, "global_pnl_reports", month);
            await setDoc(docRef, { feePaid: val }, { merge: true });
        } catch (error) { console.error("Failed to save Fee Paid:", error); }
    };

    const updateScPaid = async (val: number) => {
        setScPaid(val);
        try {
            const docRef = doc(db, "global_pnl_reports", month);
            await setDoc(docRef, { scPaid: val }, { merge: true });
        } catch (error) { console.error("Failed to save Service Charge Paid:", error); }
    };

    const updateLbPaid = async (val: number) => {
        setLbPaid(val);
        try {
            const docRef = doc(db, "global_pnl_reports", month);
            await setDoc(docRef, { lbPaid: val }, { merge: true });
        } catch (error) { console.error("Failed to save Lost & Breakage Paid:", error); }
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
        mgmtFeeRoomPercentage,
        mgmtFeeFnbPercentage,
        serviceChargePercentage,
        lostBreakagePercentage,
        startingBalance,
        fixedAssetsValue,
        vatPaid,
        feePaid,
        scPaid,
        lbPaid,
        hotelGopPercentages,
        updateVat,
        updateMgmtFee,
        updateMgmtFeeRoom,
        updateMgmtFeeFnb,
        updateServiceCharge,
        updateLostBreakage,
        updateStartingBalance,
        updateFixedAssetsValue,
        updateVatPaid,
        updateFeePaid,
        updateScPaid,
        updateLbPaid,
        updateHotelGop,
        refetchCoreData: fetchCoreData
    };
};
