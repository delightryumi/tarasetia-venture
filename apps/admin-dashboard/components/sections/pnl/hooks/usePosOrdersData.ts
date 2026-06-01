import { useState, useEffect } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; 

export const usePosOrdersData = (month: string, viewMode: "monthly" | "yearly") => {
    const [loadingPOS, setLoadingPOS] = useState(false);

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

    const fetchPOSData = async () => {
        setLoadingPOS(true);
        try {
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

                const dbSubtotal = Number(data.subtotal || 0);
                const dbTax = Number(data.tax || 0);
                const dbTotal = Number(data.total || 0);
                let dbDiscount = Number(data.discount || 0);
                if (!dbDiscount && dbTotal > 0 && dbSubtotal > 0) {
                  dbDiscount = Math.max(0, dbSubtotal + dbTax - dbTotal);
                }

                const items = data.items || [];
                if (items.length > 0) {
                  let calcSubtotal = 0;
                  items.forEach((item: any) => {
                    calcSubtotal += Number(item.price || 0) * Number(item.quantity || 0);
                  });
                  calcSubtotal = calcSubtotal || 1;

                  items.forEach((item: any) => {
                    const qty = Number(item.quantity || 0);
                    const sellPrice = Number(item.price || 0) * qty;
                    const itemDiscount = dbDiscount * (sellPrice / calcSubtotal);
                    const nettSell = sellPrice - itemDiscount;
                    const tax = nettSell * (taxRate / 100);
                    const finalSell = nettSell + tax;
                    
                    const prodInfo = productMap[item.id] || { buyPrice: 0, category: "", name: item.name || "Item" };
                    const buyPrice = 0; // Disabled as per user request (hotel setup)
                    
                    sellPriceTotal += finalSell; // Accumulate GROSS revenue (includes tax)
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

                  let desc = `${data.customerName || 'Customer'} - ${prodInfo.name || item.name || 'POS Item'} (x${qty})`;
                  if (itemDiscount > 0) {
                    desc += ` (Termasuk Diskon -Rp${Math.round(itemDiscount).toLocaleString('id-ID')})`;
                  }

                  // Push the base nett revenue
                  fetchedPosOrders.push({
                      id: `${orderId}-${item.id}`,
                      type: 'income',
                      source: isBanquet ? 'POS - Banquet' : 'POS - Alacarte',
                      description: desc,
                      department: 'Food & Beverage',
                      docType: isBanquet ? 'Banquet' : 'POS Order',
                      amount: nettSell,
                      date: docDateStr,
                      category: itemCategory,
                      discount: itemDiscount > 0 ? itemDiscount : undefined
                  });

                  // Push the tax/service as a separate item if exists
                  if (tax > 0) {
                      fetchedPosOrders.push({
                          id: `${orderId}-${item.id}-tax`,
                          type: 'income',
                          source: isBanquet ? 'POS - Banquet' : 'POS - Alacarte',
                          description: `Tax, Service & PB1 - ${prodInfo.name || item.name || 'POS Item'} (x${qty})`,
                          department: 'Food & Beverage',
                          docType: isBanquet ? 'Banquet' : 'POS Order',
                          amount: tax,
                          date: docDateStr,
                          category: itemCategory
                      });
                  }
                });
                } else if (data.quantity !== undefined || data.price !== undefined) {
                  try {
                    const qty = Number(data.quantity || 1);
                    const sellPrice = Number(data.price || data.subtotal || 0) * (data.price ? qty : 1);
                    const tax = Number(data.tax || (sellPrice * (taxRate / 100)));
                    const itemDiscount = dbDiscount;
                    const nettSell = sellPrice - itemDiscount;
                    const finalSell = nettSell + tax;
                    
                    const prodInfo = productMap[data.id || ""] || { buyPrice: 0, category: "" };
                    const buyPrice = 0; // Disabled as per user request (hotel setup)
                    
                    sellPriceTotal += finalSell; // Accumulate GROSS
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

                    let desc = `${data.customerName || 'Customer'} - ${data.name || 'POS Order'} (x${qty})`;
                    if (itemDiscount > 0) {
                      desc += ` (Termasuk Diskon -Rp${Math.round(itemDiscount).toLocaleString('id-ID')})`;
                    }

                    // Push base nett revenue
                    fetchedPosOrders.push({
                      id: orderId,
                      type: 'income',
                      source: isBanquet ? 'POS - Banquet' : 'POS - Alacarte',
                      description: desc,
                      department: 'Food & Beverage',
                      docType: isBanquet ? 'Banquet' : 'POS Order',
                      amount: nettSell,
                      date: docDateStr,
                      category: itemCategory,
                      discount: itemDiscount > 0 ? itemDiscount : undefined
                    });

                    // Push tax as separate item
                    if (tax > 0) {
                        fetchedPosOrders.push({
                          id: `${orderId}-tax`,
                          type: 'income',
                          source: isBanquet ? 'POS - Banquet' : 'POS - Alacarte',
                          description: `Tax, Service & PB1 - ${data.name || 'POS Order'} (x${qty})`,
                          department: 'Food & Beverage',
                          docType: isBanquet ? 'Banquet' : 'POS Order',
                          amount: tax,
                          date: docDateStr,
                          category: itemCategory
                        });
                    }
                  } catch (err) {
                    console.error("Error processing POS item:", err);
                  }
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

            const posNett = alacarteCalc + banquetCalc; // alacarteCalc and banquetCalc are NETT (wait, no, they accumulate finalSell which is Gross)
            // Wait, we reverted it back to accumulating finalSell! So alacarteCalc is Gross.
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

        } catch (error) {
            console.error("Error fetching POS data:", error);
        } finally {
            setLoadingPOS(false);
        }
    };

    useEffect(() => {
        fetchPOSData();
    }, [month, viewMode]);

    return {
        loadingPOS,
        posOrders,
        posRevAlacarte,
        posRevBanquet,
        posRevFood,
        posRevBeverage,
        posExpAlacarte,
        posExpBanquet,
        posExpFood,
        posExpBeverage,
        posGrossRevenue,
        posNettRevenue,
        posServiceCharge,
        posTaxAmount,
        posLostBreakageAmount,
        posTotalServiceTax,
        posServiceRate,
        posTaxRateIndividual,
        posLostBreakageRate,
        posTaxRateCombined,
        refetchPOSData: fetchPOSData
    };
};
