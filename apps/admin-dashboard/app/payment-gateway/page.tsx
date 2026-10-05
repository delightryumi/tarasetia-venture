"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PaymentGatewaySection } from "@/components/sections/payment-gateway/PaymentGatewaySection";

export default function PaymentGatewayPage() {
    return (
        <DashboardLayout>
            <div className="p-4 md:p-8">
                <PaymentGatewaySection />
            </div>
        </DashboardLayout>
    );
}
