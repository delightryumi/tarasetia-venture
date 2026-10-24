"use client";

import React from "react";
import type { ChannelMappingConfig } from "./ChannelManagerSection";
import { RateParityMatrixDesktopView } from "./RateParityMatrixDesktopView";
import { RateParityMatrixMobileView } from "./RateParityMatrixMobileView";
import styles from "./RateParityMatrix.module.css";

interface RateParityMatrixTabProps {
    hotelCode: string;
    hotelCurrency: string;
    ratePlans: any[];
    activeChannelsList: ChannelMappingConfig[];
}

export const RateParityMatrixTab: React.FC<RateParityMatrixTabProps> = (props) => {
    return (
        <div className={styles.matrixContainer}>
            {/* Desktop View: Multi-column Table with Sticky Columns */}
            <div className={styles.desktopOnly}>
                <RateParityMatrixDesktopView {...props} />
            </div>

            {/* Mobile View: Card-Reflow with Zero Horizontal Scroll */}
            <div className={styles.mobileOnly}>
                <RateParityMatrixMobileView {...props} />
            </div>
        </div>
    );
};
