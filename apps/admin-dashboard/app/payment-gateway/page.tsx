"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PaymentGatewayRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/channel-manager?tab=payment_gateway");
    }, [router]);

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>Mengalihkan ke Channel Manager &gt; Payment Gateway...</span>
        </div>
    );
}
