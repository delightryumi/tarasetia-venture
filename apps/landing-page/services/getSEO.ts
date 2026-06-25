import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { getServerSideHotel } from "@/lib/hotelResolverServer";

export interface SEOData {
    title: string;
    description: string;
    keywords: string;
    ogImage: string;
    ogTitle?: string;
    ogDescription?: string;
    dashboardFavicon?: string;
    landingFavicon?: string;
    twitterCard?: "summary" | "summary_large_image";
    twitterHandle?: string;
    canonicalUrl?: string;
    googleSiteVerification?: string;
    author?: string;
}

export const getSEO = async (): Promise<SEOData> => {
    const defaultSEO: SEOData = {
        title: "Bumi Anyom Resort | Resort & Hotel Terbaik di Temanggung",
        description: "Bumi Anyom Resort adalah hotel & resort terbaik di Temanggung yang menawarkan kemewahan di tengah alam asri. Destinasi peristirahatan tenang dengan pemandangan pegunungan dan fasilitas premium.",
        keywords: "bumi anyom, bumi anyom resort, best resort temanggung, hotel terbaik temanggung, resort temanggung, hotel di temanggung, penginapan temanggung, luxury resort temanggung, tempat wisata temanggung",
        ogImage: "",
        twitterCard: "summary_large_image",
    };

    try {
        const hotel = await getServerSideHotel();
        const hotelCode = hotel?.hotelCode || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "1";
        const docRef = doc(getHotelCollection(db, "settings", hotelCode), "seo");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const merged = { ...defaultSEO };
            Object.keys(data).forEach((key) => {
                const val = data[key];
                if (val !== undefined && val !== null && val !== "") {
                    (merged as any)[key] = val;
                }
            });
            return merged as SEOData;
        }
    } catch (err) {
        console.error("Error fetching SEO:", err);
    }

    return defaultSEO;
};
