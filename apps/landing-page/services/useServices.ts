"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";

export interface PackageItem {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: string;
  maxPax: number;
  price: number;
  imageUrl: string;
  vendorName: string;
  features: string[];
}

export interface AttractionItem {
  id: string;
  name: string;
  description: string;
  distance: string;
  imageUrl: string;
  images?: { url: string; isProfile: boolean }[];
}

export const useServices = () => {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const q = query(getHotelCollection(db, "packages"), limit(10));
        const querySnapshot = await getDocs(q);
        
        const results: PackageItem[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          let img = "https://images.unsplash.com/photo-1533646549887-17559ebc3411?auto=format&fit=crop&q=80"; 
          if (data.imageUrl && typeof data.imageUrl === "string" && data.imageUrl.length > 5) {
             img = data.imageUrl;
          }

          results.push({
            id: doc.id,
            name: data.name || "Unnamed Package",
            category: data.packageType || "PACKAGE",
            description: data.description || "",
            duration: "-", 
            maxPax: 2,     
            price: Number(data.price) || 0,
            imageUrl: img,
            vendorName: "Bumi Anyom",
            features: Array.isArray(data.features) ? data.features : []
          });
        });
        
        setPackages(results);
      } catch (error) {
        console.error("Error fetching packages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  return { packages, loading };
};

export const usePackage = (id: string | null) => {
  const [pkg, setPkg] = useState<PackageItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackage = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const docRef = doc(getHotelCollection(db, "packages"), id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          let img = "https://images.unsplash.com/photo-1533646549887-17559ebc3411?auto=format&fit=crop&q=80"; 
          if (data.imageUrl && typeof data.imageUrl === "string" && data.imageUrl.length > 5) {
             img = data.imageUrl;
          }

          setPkg({
            id: docSnap.id,
            name: data.name || "Unnamed Package",
            category: data.packageType || "PACKAGE",
            description: data.description || "",
            duration: "-",
            maxPax: 2,
            price: Number(data.price) || 0,
            imageUrl: img,
            vendorName: "Bumi Anyom",
            features: Array.isArray(data.features) ? data.features : []
          });
        }
      } catch (error) {
        console.error("Error fetching package:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [id]);

  return { pkg, loading };
};

export const useAttractions = () => {
  const [attractions, setAttractions] = useState<AttractionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttractions = async () => {
      try {
        const snap = await getDocs(getHotelCollection(db, "attractions"));
        setAttractions(snap.docs.map(d => ({ 
          id: d.id, 
          ...d.data() 
        })) as AttractionItem[]);
      } catch (err) {
        console.error("Error fetching attractions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttractions();
  }, []);

  return { attractions, loading };
};

export const useAttraction = (id: string | null) => {
  const [attraction, setAttraction] = useState<AttractionItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttraction = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const docRef = doc(getHotelCollection(db, "attractions"), id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAttraction({
            id: docSnap.id,
            ...docSnap.data()
          } as AttractionItem);
        }
      } catch (error) {
        console.error("Error fetching attraction:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttraction();
  }, [id]);

  return { attraction, loading };
};
