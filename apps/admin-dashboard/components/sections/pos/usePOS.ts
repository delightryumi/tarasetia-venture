import { useState, useEffect, useMemo } from "react";
import { 
    collection, onSnapshot, query, 
    orderBy, addDoc, serverTimestamp 
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { POSProduct, CartItem, POSCategory, POSOrder } from "./types";
import { seedPOSProducts } from "./seedPOS";

export const usePOS = () => {
    const [products, setProducts] = useState<POSProduct[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [activeCategory, setActiveCategory] = useState<POSCategory>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // 1. Fetch Products
    useEffect(() => {
        const q = query(getHotelCollection(db, "pos_products"), orderBy("name"));
        const unsub = onSnapshot(q, async (snap) => {
            const list: POSProduct[] = [];
            snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as POSProduct));
            
            if (list.length === 0 && !snap.metadata.hasPendingWrites) {
                await seedPOSProducts();
            } else {
                setProducts(list);
                setLoading(false);
            }
        });

        return unsub;
    }, []);

    const initializeSampleProducts = async () => {
        // Sample data logic if needed
    };

    // 2. Filtered Products
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = activeCategory === "All" || p.category === activeCategory;
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [products, activeCategory, searchQuery]);

    // 3. Cart Logic
    const addToCart = (product: POSProduct) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => 
                    item.id === product.id 
                        ? { ...item, quantity: item.quantity + 1 } 
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1, cartItemId: crypto.randomUUID() }];
        });
    };

    const updateQuantity = (cartItemId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.cartItemId === cartItemId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const clearCart = () => setCart([]);

    // 4. Totals
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
    const tax = useMemo(() => subtotal * 0.1, [subtotal]); // 10% Default
    const total = subtotal + tax;

    // 5. Checkout
    const processCheckout = async (paymentMethod: POSOrder["paymentMethod"], customerName?: string) => {
        if (cart.length === 0) return;

        try {
            const orderData = {
                items: cart,
                subtotal,
                tax,
                total,
                paymentMethod,
                customerName: customerName || "Guest",
                timestamp: serverTimestamp(),
                staffId: auth.currentUser?.uid || "system",
                staffName: auth.currentUser?.displayName || "Staff"
            };

            // Save to POS Orders
            const orderRef = await addDoc(getHotelCollection(db, "pos_orders"), orderData);

            // Sync to Revenue Transactions for PNL
            await addDoc(getHotelCollection(db, "revenue_transactions"), {
                date: new Date().toISOString().split('T')[0],
                category: "Other Revenue", // Or F&B
                description: `POS Order #${orderRef.id.slice(-6)} - ${customerName || 'Guest'}`,
                amount: total,
                type: "Nexura Collect",
                timestamp: serverTimestamp()
            });

            clearCart();
            setIsPaymentModalOpen(false);
            return orderRef.id;
        } catch (err) {
            console.error("Checkout failed:", err);
            throw err;
        }
    };

    return {
        products: filteredProducts,
        cart,
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
        loading,
        addToCart,
        updateQuantity,
        clearCart,
        subtotal,
        tax,
        total,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        processCheckout
    };
};
