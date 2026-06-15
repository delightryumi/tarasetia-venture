import { db } from "../../../lib/firebase";
import { getHotelCollection } from "../../../lib/firestoreHelper";
import { addDoc, getDocs, deleteDoc } from "firebase/firestore";

const sampleProducts = [
    { name: "Coffee Latte", price: 35000, category: "Beverage", image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=2037&auto=format&fit=crop" },
    { name: "Avocado Toast", price: 65000, category: "Food", image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=2080&auto=format&fit=crop" },
    { name: "Meeting Room A", price: 500000, category: "Meeting Room", image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?q=80&w=2070&auto=format&fit=crop" },
    { name: "Meeting Room B", price: 750000, category: "Meeting Room", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop" },
    { name: "Fried Rice Special", price: 45000, category: "Food", image: "https://images.unsplash.com/photo-1512058560366-cd2427ffeb6d?q=80&w=2070&auto=format&fit=crop" },
    { name: "Iced Tea", price: 15000, category: "Beverage", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=1964&auto=format&fit=crop" },
];

export async function seedPOSProducts() {
    console.log("Seeding POS Products...");
    const colRef = getHotelCollection(db, "pos_products");
    
    // Clear existing
    const snap = await getDocs(colRef);
    for (const d of snap.docs) {
        await deleteDoc(d.ref);
    }

    // Add new
    for (const p of sampleProducts) {
        await addDoc(colRef, p);
    }
    console.log("Seeding complete!");
}
