import React, { Suspense } from "react";
import ConfirmationLetterSection from "@/components/sections/confirmation-letter/ConfirmationLetterSection";

export const metadata = {
    title: "Confirmation Letter (CL) | My Tara PMS",
    description: "Penerbitan surat konfirmasi resmi untuk reservasi Group, Corporate (B2B), dan Instansi Pemerintah berstandar industri perhotelan."
};

export default function ConfirmationLetterPage() {
    return (
        <Suspense fallback={<div style={{ padding: "2rem", color: "var(--text-muted, #94a3b8)" }}>Memuat Confirmation Letter...</div>}>
            <ConfirmationLetterSection />
        </Suspense>
    );
}
