import { useState, useEffect } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { getHotelCollection } from "@/lib/firestoreHelper"; 

export const usePosOrdersData = (month: string, viewMode: "monthly" | "yearly") => {
    const [loadingPOS, setLoadingPOS] = useState(false);

    const [posRevAlacarte, setPosRevAlacarte] = useState(0);
    const [posRevBanquet, setPosRevBanquet] = useState(0);
    const [posRevFood, setPosRevFood] = useState(0);
    const [posRevBeverage, setPosRevBeverage] = useState(0);
    const [posRevOther, setPosRevOther] = useState(0);
    const [posExpAlacarte, setPosExpAlacarte] = useState(0);
    const [posExpBanquet, setPosExpBanquet] = useState(0);
    const [posExpFood, setPosExpFood] = useState(0);
    const [posExpBeverage, setPosExpBeverage] = useState(0);
    const [posExpOther, setPosExpOther] = useState(0);
    const [posOrders, setPosOrders] = useState<any[]>([]);

    const [posGrossRevenue, setPosGrossRevenue] = useState(0);
    const [posNettRevenue, setPosNettRevenue] = useState(0);
    const [posServiceCharge, setPosServiceCharge] = useState(0);
    const [posTaxAmount, setPosTaxAmount] = useState(0);
    const [posLostBreakageAmount, setPosLostBreakageAmount] = useState(0);
    const [posTotalServiceTax, setPosTotalServiceTax] = useState(0);
    const [posComplimentValue, setPosComplimentValue] = useState(0);

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
            let otherRevCalc = 0;
            let alacarteExpCalc = 0;
            let banquetExpCalc = 0;
            let foodExpCalc = 0;
            let bevExpCalc = 0;
            let otherExpCalc = 0;
            let taxTotalCalc = 0;
            
            // 0. Resolve hotelCode
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

            // 1. Fetch settings, categories, and products
            const posSettingsRef = doc(getHotelCollection(db, 'settings', hotelCode), 'pos');
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
            
            const catSnap = await getDocs(getHotelCollection(db, 'pos_categories', hotelCode));
            const categoryPnlMap: Record<string, string> = {};
            catSnap.forEach((doc) => {
              const name = (doc.data().name || '').toLowerCase().trim();
              const pnlTarget = doc.data().pnlTarget || (name === 'food' ? 'FOOD' : name === 'beverage' ? 'BEVERAGE' : name === 'banquet' ? 'BANQUET' : 'FOOD');
              categoryPnlMap[name] = pnlTarget;
            });

            const prodSnap = await getDocs(getHotelCollection(db, 'pos_products', hotelCode));
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
            const posOrdersSnap = await getDocs(getHotelCollection(db, "pos_orders", hotelCode));
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
                let orderOtherRev = 0;
                let orderFoodExp = 0;
                let orderBevExp = 0;
                let orderOtherExp = 0;

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
                    const buyPrice = 0; 
                    
                    sellPriceTotal += finalSell; 
                    cogsTotal += buyPrice;
                    taxTotalCalc += tax;

                    const prodCatName = (prodInfo.category || '').toLowerCase().trim();
                    const resolvedTarget = categoryPnlMap[prodCatName] || 
                      (prodCatName.includes('drink') || prodCatName.includes('beverage') || prodCatName.includes('minuman') ? 'BEVERAGE' : 
                       prodCatName.includes('banquet') ? 'BANQUET' : 'FOOD');

                    let itemCategory: 'food' | 'beverage' | 'banquet' | 'other' = 'food';
                    if (isBanquet || resolvedTarget === 'BANQUET') {
                      itemCategory = 'banquet';
                    } else if (resolvedTarget === 'BEVERAGE') {
                      itemCategory = 'beverage';
                    } else if (resolvedTarget === 'OTHER') {
                      itemCategory = 'other';
                    }

                    if (!isBanquet) {
                      if (itemCategory === 'beverage') {
                        orderBevRev += finalSell;
                        orderBevExp += buyPrice;
                      } else if (itemCategory === 'other') {
                        orderOtherRev += finalSell;
                        orderOtherExp += buyPrice;
                      } else {
                        orderFoodRev += finalSell;
                        orderFoodExp += buyPrice;
                      }
                    }

                  let desc = `${data.customerName || 'Customer'} - ${prodInfo.name || item.name || 'POS Item'} (x${qty})`;
                  if (itemDiscount > 0) {
                    desc += ` (Termasuk Diskon -Rp${Math.round(itemDiscount).toLocaleString('id-ID')})`;
                  }
                  if (item.isCompliment) {
                    desc += ` [COMPLIMENT: ${item.complimentReason || 'Service Recovery'}]`;
                  }

                  fetchedPosOrders.push({
                      id: `${orderId}-${item.id}`,
                      type: 'income',
                      source: isBanquet ? 'POS - Banquet' : 'POS - Alacarte',
                      description: desc,
                      department: 'Food & Beverage',
                      docType: isBanquet ? 'Banquet' : 'POS Order',
                      amount: item.isCompliment ? 0 : (nettSell + tax),
                      nettAmount: item.isCompliment ? 0 : nettSell,
                      taxAmount: item.isCompliment ? 0 : tax,
                      date: docDateStr,
                      category: itemCategory,
                      discount: itemDiscount > 0 ? itemDiscount : undefined,
                      isCompliment: item.isCompliment || false,
                      complimentReason: item.complimentReason || undefined,
                      originalPrice: item.isCompliment ? ((item.originalPrice || prodInfo.sellPrice || 0) * qty) : undefined
                  });
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
                    const buyPrice = 0; 
                    
                    sellPriceTotal += finalSell;
                    cogsTotal += buyPrice;
                    taxTotalCalc += tax;
                    
                    const prodCatName = (prodInfo.category || '').toLowerCase().trim();
                    const resolvedTarget = categoryPnlMap[prodCatName] || 
                      (prodCatName.includes('drink') || prodCatName.includes('beverage') || prodCatName.includes('minuman') ? 'BEVERAGE' : 
                       prodCatName.includes('banquet') ? 'BANQUET' : 'FOOD');

                    let itemCategory: 'food' | 'beverage' | 'banquet' | 'other' = 'food';
                    if (isBanquet || resolvedTarget === 'BANQUET') {
                      itemCategory = 'banquet';
                    } else if (resolvedTarget === 'BEVERAGE') {
                      itemCategory = 'beverage';
                    } else if (resolvedTarget === 'OTHER') {
                      itemCategory = 'other';
                    }

                    if (!isBanquet) {
                      if (itemCategory === 'beverage') {
                        orderBevRev += finalSell;
                        orderBevExp += buyPrice;
                      } else if (itemCategory === 'other') {
                        orderOtherRev += finalSell;
                        orderOtherExp += buyPrice;
                      } else {
                        orderFoodRev += finalSell;
                        orderFoodExp += buyPrice;
                      }
                    }

                    let desc = `${data.customerName || 'Customer'} - ${data.name || 'POS Order'} (x${qty})`;
                    if (itemDiscount > 0) {
                      desc += ` (Termasuk Diskon -Rp${Math.round(itemDiscount).toLocaleString('id-ID')})`;
                    }
                    if (data.isCompliment) {
                      desc += ` [COMPLIMENT: ${data.complimentReason || 'Service Recovery'}]`;
                    }

                    fetchedPosOrders.push({
                      id: orderId,
                      type: 'income',
                      source: isBanquet ? 'POS - Banquet' : 'POS - Alacarte',
                      description: desc,
                      department: 'Food & Beverage',
                      docType: isBanquet ? 'Banquet' : 'POS Order',
                      amount: data.isCompliment ? 0 : (nettSell + tax),
                      nettAmount: data.isCompliment ? 0 : nettSell,
                      taxAmount: data.isCompliment ? 0 : tax,
                      date: docDateStr,
                      category: itemCategory,
                      discount: itemDiscount > 0 ? itemDiscount : undefined,
                      isCompliment: data.isCompliment || false,
                      complimentReason: data.complimentReason || undefined,
                      originalPrice: data.isCompliment ? ((data.originalPrice || prodInfo.sellPrice || 0) * qty) : undefined
                    });
                  } catch (err) {
                    console.error("Error processing POS item:", err);
                  }
                }

                if (isBanquet) {
                  banquetCalc += sellPriceTotal;
                  banquetExpCalc += cogsTotal;
                } else {
                  alacarteCalc += (orderFoodRev + orderBevRev);
                  alacarteExpCalc += (orderFoodExp + orderBevExp);
                }
                
                foodRevCalc += orderFoodRev;
                bevRevCalc += orderBevRev;
                otherRevCalc += orderOtherRev;
                foodExpCalc += orderFoodExp;
                bevExpCalc += orderBevExp;
                otherExpCalc += orderOtherExp;
              }
            });
            
            setPosOrders(fetchedPosOrders);
            
            setPosRevAlacarte(alacarteCalc);
            setPosRevBanquet(banquetCalc);
            setPosRevFood(foodRevCalc);
            setPosRevBeverage(bevRevCalc);
            setPosRevOther(otherRevCalc);
            setPosExpAlacarte(alacarteExpCalc);
            setPosExpBanquet(banquetExpCalc);
            setPosExpFood(foodExpCalc);
            setPosExpBeverage(bevExpCalc);
            setPosExpOther(otherExpCalc);

             const grossRevenue = alacarteCalc + banquetCalc + otherRevCalc; 
             const nettRevenue = grossRevenue - taxTotalCalc;
             const serviceCharge = taxRate > 0 ? (taxTotalCalc * serviceRate) / taxRate : 0;
             const taxAmount = taxRate > 0 ? (taxTotalCalc * taxRateIndividual) / taxRate : 0;
             const lostBreakageAmount = taxRate > 0 ? (taxTotalCalc * lostBreakageRate) / taxRate : 0;
             const totalServiceTax = serviceCharge + taxAmount + lostBreakageAmount;

             const complimentsSum = fetchedPosOrders
               .filter(o => o.isCompliment)
               .reduce((sum, o) => sum + (o.originalPrice || 0), 0);

             setPosGrossRevenue(grossRevenue);
             setPosNettRevenue(nettRevenue);
             setPosServiceCharge(serviceCharge);
             setPosTaxAmount(taxAmount);
             setPosLostBreakageAmount(lostBreakageAmount);
             setPosTotalServiceTax(totalServiceTax);
             setPosComplimentValue(complimentsSum);

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
         posRevOther,
         posExpAlacarte,
         posExpBanquet,
         posExpFood,
         posExpBeverage,
         posExpOther,
         posGrossRevenue,
         posNettRevenue,
         posServiceCharge,
         posTaxAmount,
         posLostBreakageAmount,
         posTotalServiceTax,
         posComplimentValue,
         posServiceRate,
         posTaxRateIndividual,
         posLostBreakageRate,
         posTaxRateCombined,
         refetchPOSData: fetchPOSData
     };
 };
