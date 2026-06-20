"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { useOverview } from "./useOverview";

import styles from "./OverviewStyles.module.css";
import { InventoryCalendar } from "./InventoryCalendar";
import { GuestListDrawer } from "./GuestListDrawer";

const SAGE = "var(--sidebar-link-active-bg, #181d26)";

export function InventoryControlSection() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentModule = searchParams.get("module") || "front-office";
    const isReadOnly = currentModule === "housekeeping";

    const todayStr = React.useMemo(() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    const tomorrowStr = React.useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    const initialEndStr = React.useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 13);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    const [startDate, setStartDate] = React.useState(todayStr);
    const [endDate, setEndDate] = React.useState(initialEndStr);

    const isTodayActive = startDate === todayStr && endDate === todayStr;
    const isTomorrowActive = startDate === tomorrowStr && endDate === tomorrowStr;

    const { 
        loading, 
        roomStatus, dailyData, roomTypesData
    } = useOverview(startDate, endDate);

    const [calendarContext, setCalendarContext] = React.useState<{ bookings: any[], date: string, type: string } | null>(null);

    const handleUpdatePhysicalRooms = async (typeId: string, physicalRooms: any[]) => {
        try {
            const docRef = doc(getHotelCollection(db, "roomTypes"), typeId);
            await updateDoc(docRef, { physicalRooms });
            toast.success("Room mapping updated successfully!");
        } catch (error: any) {
            console.error("Error updating room physical metadata:", error);
            toast.error("Failed to update room mapping: " + error.message);
        }
    };

    return (
        <div className={styles.overviewRoot}>

            <main className={styles.mainContainer}>
                <div className={styles.twoColumnLayout}>
                    <div style={{ flex: 1, width: '100%', minWidth: 0 }}>
                        <InventoryCalendar 
                            targetDate={isTodayActive ? 'today' : (isTomorrowActive ? 'tomorrow' : 'today')}
                            data={dailyData} 
                            roomTypes={roomTypesData}
                            totalRooms={roomStatus.total} 
                            onDateSelect={(date) => {
                                router.push(`/forecast/add?date=${date}&module=${currentModule}`);
                            }}
                            onAddTransaction={isReadOnly ? undefined : () => {
                                router.push(`/forecast/add?date=${startDate}&module=${currentModule}`);
                            }}
                            onCellClick={(bookings, date, type) => setCalendarContext({ bookings, date, type })}
                            onUpdatePhysicalRooms={handleUpdatePhysicalRooms}
                            onDateRangeChange={(start, end) => {
                                setStartDate(start);
                                setEndDate(end);
                            }}
                        />
                    </div>
                    <GuestListDrawer 
                        isOpen={!!calendarContext}
                        onClose={() => setCalendarContext(null)}
                        date={calendarContext?.date || ""}
                        roomType={calendarContext?.type || ""}
                        bookings={calendarContext?.bookings || []}
                        onAdd={(date) => router.push(`/forecast/add?date=${date}&module=${currentModule}`)}
                    />
                </div>
            </main>
        </div>
    );
}
