import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { processPnLData, ExtendedTransaction, HotelMaster } from "@/lib/pnl-logic";
import { GlobalPnLResult, PnlIncomeItem, PnlExpenseItem, InvestorItem } from "@/lib/pnl-utils";
import { TrendDataItem, MultiYearTrendDataItem } from "./types";

export const YEARS = [2024, 2025, 2026];
export const MONTHS = [
    { n: "Januari", v: "01" }, { n: "Februari", v: "02" }, { n: "Maret", v: "03" },
    { n: "April", v: "04" }, { n: "Mei", v: "05" }, { n: "Juni", v: "06" },
    { n: "Juli", v: "07" }, { n: "Agustus", v: "08" }, { n: "September", v: "09" },
    { n: "Oktober", v: "10" }, { n: "November", v: "11" }, { n: "Desember", v: "12" }
];

export const usePnL = () => {
    const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
    const [displayMode, setDisplayMode] = useState<"cards" | "charts">("cards");
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [loading, setLoading] = useState(false);
    const [pnlResult, setPnlResult] = useState<GlobalPnLResult | null>(null);
    const [rawTransactions, setRawTransactions] = useState<ExtendedTransaction[]>([]);
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
    const [yearTrendData, setYearTrendData] = useState<TrendDataItem[]>([]);
    const [multiYearTrendData, setMultiYearTrendData] = useState<MultiYearTrendDataItem[]>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [posRevAlacarte, setPosRevAlacarte] = useState(0);
    const [posRevBanquet, setPosRevBanquet] = useState(0);
    const [posRevFood, setPosRevFood] = useState(0);
    const [posRevBeverage, setPosRevBeverage] = useState(0);
    const [posExpAlacarte, setPosExpAlacarte] = useState(0);
    const [posExpBanquet, setPosExpBanquet] = useState(0);
    const [posExpFood, setPosExpFood] = useState(0);
    const [posExpBeverage, setPosExpBeverage] = useState(0);
    const [posOrders, setPosOrders] = useState<any[]>([]);

    const [posGrossRevenue, setPosGrossRevenue] = useState(0);
    const [posNettRevenue, setPosNettRevenue] = useState(0);
    const [posServiceCharge, setPosServiceCharge] = useState(0);
    const [posTaxAmount, setPosTaxAmount] = useState(0);
    const [posLostBreakageAmount, setPosLostBreakageAmount] = useState(0);
    const [posTotalServiceTax, setPosTotalServiceTax] = useState(0);

    const [posServiceRate, setPosServiceRate] = useState(10);
    const [posTaxRateIndividual, setPosTaxRateIndividual] = useState(10);
    const [posLostBreakageRate, setPosLostBreakageRate] = useState(1);
    const [posTaxRateCombined, setPosTaxRateCombined] = useState(21);

    const fetchData = async () => {
        setLoading(true);
        try {
            const propertiesSnap = await getDocs(collection(db, "properties"));
            const hotelList: HotelMaster[] = [];
            propertiesSnap.forEach((doc) => {
                const d = doc.data();
                hotelList.push({ id: doc.id, name: d.Nama || d.name || `Property ${doc.id}` });
            });
            setAllHotels(hotelList);

            const [y, m] = month.split('-');
            let startStr, endStr;
            
            if (viewMode === "monthly") {
                startStr = `${y}-${m}-01`;
                const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
                endStr = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
            } else {
                startStr = `${y}-01-01`;
                endStr = `${y}-12-31`;
            }

            const q = query(collection(db, "daily_revenue"), where("date", ">=", startStr), where("date", "<=", endStr));
            const querySnapshot = await getDocs(q);
            const transactions: ExtendedTransaction[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const hotelId = data.hotelId || "bumi-anyom-resort";
                (data.entries || []).forEach((t: any) => {
                    transactions.push({ 
                        ...t, 
                        propertyId: hotelId, 
                        amount: Number(t.amount) || 0, 
                        paidCash: Number(t.paidCash || t.paidAmount1) || 0, 
                        paidTransfer: Number(t.paidTransfer || t.paidAmount2) || 0 
                    });
                });
            });
            setRawTransactions(transactions);

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

            const currentYear = month.split('-')[0];
            const monthlyBuckets = Array(12).fill(0);
            const yearlyBuckets: Record<number, number> = {};
            YEARS.forEach(yr => yearlyBuckets[yr] = 0);

            const allRevenueQ = query(collection(db, "daily_revenue"));
            const allRevenueSnap = await getDocs(allRevenueQ);
            
            allRevenueSnap.forEach(doc => {
                const data = doc.data();
                const d = data.date || "";
                const [yrStr, moStr] = d.split('-');
                const yr = parseInt(yrStr);
                const moIdx = parseInt(moStr) - 1;

                if (yearlyBuckets[yr] !== undefined) {
                    (data.entries || []).forEach((t: any) => {
                        const amt = (Number(t.amount) || 0);
                        yearlyBuckets[yr] += amt;
                        if (yrStr === currentYear && moIdx >= 0 && moIdx < 12) {
                            monthlyBuckets[moIdx] += amt;
                        }
                    });
                }
            });
            
            setYearTrendData(monthlyBuckets.map((rev, i) => ({
                month: MONTHS[i].n.slice(0, 3),
                revenue: rev,
                fullMonth: MONTHS[i].v
            })));
            setMultiYearTrendData(YEARS.map(yr => ({
                year: yr.toString(),
                revenue: yearlyBuckets[yr]
            })));

            // Calculate POS Alacarte & Banquet
            let alacarteCalc = 0;
            let banquetCalc = 0;
            let foodRevCalc = 0;
            let bevRevCalc = 0;
            let alacarteExpCalc = 0;
            let banquetExpCalc = 0;
            let foodExpCalc = 0;
            let bevExpCalc = 0;

            let taxTotalCalc = 0;
            
            // 1. Fetch settings and products
            const posSettingsRef = doc(db, 'settings', 'pos');
            const posSettingsSnap = await getDoc(posSettingsRef);
            let serviceRate = 0;
            let taxRateIndividual = 10;
            let lostBreakageRate = 0;
            let taxRate = 10;
            if (posSettingsSnap.exists()) {
              const sData = posSettingsSnap.data();
              serviceRate = Number(sData.service || 0);
              taxRateIndividual = Number(sData.tax || 0);
              lostBreakageRate = Number(sData.lostBreakage || 0);
              taxRate = serviceRate + taxRateIndividual + lostBreakageRate;
            }
            
            const prodSnap = await getDocs(collection(db, 'pos_products'));
            const productMap: Record<string, { buyPrice: number; sellPrice: number; category: string; name?: string }> = {};
            prodSnap.forEach((d) => {
              productMap[d.id] = { 
                buyPrice: Number(d.data().buyPrice || 0), 
                sellPrice: Number(d.data().price || 0),
                category: (d.data().category || "").toLowerCase(),
                name: d.data().name || d.data().Nama || ""
              };
            });

            // 2. Fetch pos_orders
            const posOrdersSnap = await getDocs(collection(db, "pos_orders"));
            const fetchedPosOrders: any[] = [];
            posOrdersSnap.forEach((docSnap) => {
              const data = docSnap.data();
              const orderId = docSnap.id;
              
              let docDateStr: string = "";
              if (data.timestamp) {
                const docDate = typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate() : new Date(data.timestamp);
                docDateStr = docDate.toISOString().split('T')[0];
              }

              if (docDateStr >= startStr && docDateStr <= endStr) {
                let sellPriceTotal = 0;
                let cogsTotal = 0;
                
                let orderFoodRev = 0;
                let orderBevRev = 0;
                let orderFoodExp = 0;
                let orderBevExp = 0;

                const isBanquet = data.revenueType === 'banquet' || String(data.category || '').toLowerCase().includes('banquet');

                const items = data.items || [];
                if (items.length > 0) {
                  items.forEach((item: any) => {
                    const qty = Number(item.quantity || 0);
                    const sellPrice = Number(item.price || 0) * qty;
                    const tax = sellPrice * (taxRate / 100);
                    const finalSell = sellPrice + tax;
                    
                    const prodInfo = productMap[item.id] || { buyPrice: 0, category: "", name: item.name || "Item" };
                    const buyPrice = 0; // Disabled as per user request (hotel setup)
                    
                    sellPriceTotal += finalSell;
                    cogsTotal += buyPrice;
                    taxTotalCalc += tax;

                    let itemCategory: 'food' | 'beverage' | 'banquet' = 'food';
                    if (isBanquet) {
                      itemCategory = 'banquet';
                    } else if (prodInfo.category.includes('drink') || prodInfo.category.includes('beverage') || prodInfo.category.includes('minuman')) {
                      itemCategory = 'beverage';
                    }

                    if (!isBanquet) {
                      if (prodInfo.category.includes('drink') || prodInfo.category.includes('beverage') || prodInfo.category.includes('minuman')) {
                          orderBevRev += finalSell;
                          orderBevExp += buyPrice;
                      } else {
                          orderFoodRev += finalSell;
                          orderFoodExp += buyPrice;
                      }
                    }

                    fetchedPosOrders.push({
                      id: `${orderId}-${item.id}`,
                      type: 'income',
                      source: isBanquet ? 'POS - Banquet' : 'POS - Alacarte',
                      description: `${data.customerName || 'Customer'} - ${prodInfo.name || item.name || 'POS Item'} (x${qty})`,
                      department: 'Food & Beverage',
                      docType: isBanquet ? 'Banquet' : 'POS Order',
                      amount: finalSell,
                      date: docDateStr,
                      category: itemCategory
                    });
                  });
                } else if (data.quantity !== undefined || data.price !== undefined) {
                  const qty = Number(data.quantity || 1);
                  const sellPrice = Number(data.price || data.subtotal || 0) * (data.price ? qty : 1);
                  const tax = Number(data.tax || (sellPrice * (taxRate / 100)));
                  const finalSell = sellPrice + tax;
                  
                  const prodInfo = productMap[data.id || ""] || { buyPrice: 0, category: "" };
                  const buyPrice = 0; // Disabled as per user request (hotel setup)
                  
                  sellPriceTotal += finalSell;
                  cogsTotal += buyPrice;
                  taxTotalCalc += tax;
                  
                  let itemCategory: 'food' | 'beverage' | 'banquet' = 'food';
                  if (isBanquet) {
                    itemCategory = 'banquet';
                  } else if (prodInfo.category.includes('drink') || prodInfo.category.includes('beverage') || prodInfo.category.includes('minuman')) {
                    itemCategory = 'beverage';
                  }

                  if (!isBanquet) {
                    if (prodInfo.category.includes('drink') || prodInfo.category.includes('beverage') || prodInfo.category.includes('minuman')) {
                        orderBevRev += finalSell;
                        orderBevExp += buyPrice;
                    } else {
                        orderFoodRev += finalSell;
                        orderFoodExp += buyPrice;
                    }
                  }

                  fetchedPosOrders.push({
                    id: orderId,
                    type: 'income',
                    source: isBanquet ? 'POS - Banquet' : 'POS - Alacarte',
                    description: `${data.customerName || 'Customer'} - ${data.name || 'POS Order'} (x${qty})`,
                    department: 'Food & Beverage',
                    docType: isBanquet ? 'Banquet' : 'POS Order',
                    amount: finalSell,
                    date: docDateStr,
                    category: itemCategory
                  });
                }

                if (isBanquet) {
                  banquetCalc += sellPriceTotal;
                  banquetExpCalc += cogsTotal;
                } else {
                  alacarteCalc += sellPriceTotal;
                  alacarteExpCalc += cogsTotal;
                }
                
                foodRevCalc += orderFoodRev;
                bevRevCalc += orderBevRev;
                foodExpCalc += orderFoodExp;
                bevExpCalc += orderBevExp;
              }
            });
            
            setPosOrders(fetchedPosOrders);
            
            setPosRevAlacarte(alacarteCalc);
            setPosRevBanquet(banquetCalc);
            setPosRevFood(foodRevCalc);
            setPosRevBeverage(bevRevCalc);
            setPosExpAlacarte(alacarteExpCalc);
            setPosExpBanquet(banquetExpCalc);
            setPosExpFood(foodExpCalc);
            setPosExpBeverage(bevExpCalc);

            const grossRevenue = alacarteCalc + banquetCalc;
            const nettRevenue = grossRevenue - taxTotalCalc;
            const serviceCharge = taxRate > 0 ? (taxTotalCalc * serviceRate) / taxRate : 0;
            const taxAmount = taxRate > 0 ? (taxTotalCalc * taxRateIndividual) / taxRate : 0;
            const lostBreakageAmount = taxRate > 0 ? (taxTotalCalc * lostBreakageRate) / taxRate : 0;
            const totalServiceTax = serviceCharge + taxAmount + lostBreakageAmount;

            setPosGrossRevenue(grossRevenue);
            setPosNettRevenue(nettRevenue);
            setPosServiceCharge(serviceCharge);
            setPosTaxAmount(taxAmount);
            setPosLostBreakageAmount(lostBreakageAmount);
            setPosTotalServiceTax(totalServiceTax);

            setPosServiceRate(serviceRate);
            setPosTaxRateIndividual(taxRateIndividual);
            setPosLostBreakageRate(lostBreakageRate);
            setPosTaxRateCombined(taxRate);

        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
    }, [month, viewMode]);

    useEffect(() => {
        const result = processPnLData(
            rawTransactions, 
            customIncomes, 
            nonCommissionRevenue, 
            expenses, 
            investors, 
            vatPercentage, 
            hotelGopPercentages, 
            allHotels, 
            mgmtFeePercentage, 
            posRevAlacarte, 
            posRevBanquet, 
            posRevFood, 
            posRevBeverage, 
            posExpAlacarte, 
            posExpBanquet, 
            posExpFood, 
            posExpBeverage,
            serviceChargePercentage,
            lostBreakagePercentage
        );
        result.pnlResult.revAlacarte = posRevAlacarte;
        result.pnlResult.revBanquet = posRevBanquet;
        result.pnlResult.revFood = posRevFood;
        result.pnlResult.revBeverage = posRevBeverage;

        result.pnlResult.posGrossRevenue = posGrossRevenue;
        result.pnlResult.posNettRevenue = posNettRevenue;
        result.pnlResult.posServiceCharge = posServiceCharge;
        result.pnlResult.posTaxAmount = posTaxAmount;
        result.pnlResult.posLostBreakageAmount = posLostBreakageAmount;
        result.pnlResult.posTotalServiceTax = posTotalServiceTax;

        result.pnlResult.posServiceRate = posServiceRate;
        result.pnlResult.posTaxRateIndividual = posTaxRateIndividual;
        result.pnlResult.posLostBreakageRate = posLostBreakageRate;
        result.pnlResult.posTaxRateCombined = posTaxRateCombined;

        setPnlResult(result.pnlResult);
    }, [
        rawTransactions, customIncomes, nonCommissionRevenue, expenses, investors, vatPercentage, hotelGopPercentages, allHotels, mgmtFeePercentage,
        posRevAlacarte, posRevBanquet, posRevFood, posRevBeverage, posExpAlacarte, posExpBanquet, posExpFood, posExpBeverage,
        posGrossRevenue, posNettRevenue, posServiceCharge, posTaxAmount, posLostBreakageAmount, posTotalServiceTax,
        posServiceRate, posTaxRateIndividual, posLostBreakageRate, posTaxRateCombined,
        serviceChargePercentage, lostBreakagePercentage
    ]);

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
        } catch (error) { console.error("Failed to save Lost & Breakage:", error); }
    };

    return {
        viewMode, setViewMode,
        displayMode, setDisplayMode,
        month, setMonth,
        loading, pnlResult,
        expenses, vatPercentage, mgmtFeePercentage,
        serviceChargePercentage, lostBreakagePercentage,
        yearTrendData, multiYearTrendData,
        showDatePicker, setShowDatePicker,
        fetchData, updateVat, updateMgmtFee,
        updateServiceCharge, updateLostBreakage,
        rawTransactions, customIncomes, posOrders
    };
};
