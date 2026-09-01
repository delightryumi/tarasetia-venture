import { Suspense } from "react";
import { GRCSection } from "@/components/sections/grc/GRCSection";

export default function DigitalCheckinPage() {
    return (
        <Suspense fallback={<div className="p-8 text-sm text-gray-500">Memuat GRC...</div>}>
            <GRCSection />
        </Suspense>
    );
}
