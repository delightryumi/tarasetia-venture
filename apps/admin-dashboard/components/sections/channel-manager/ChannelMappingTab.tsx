"use client";

import React from "react";
import type { ChannelMappingConfig } from "./ChannelManagerSection";
import { ChannelMappingDesktopView, type ChannelMappingDesktopViewProps } from "./ChannelMappingDesktopView";
import { ChannelMappingMobileView, type ChannelMappingMobileViewProps } from "./ChannelMappingMobileView";
import styles from "./ChannelMapping.module.css";

export interface ChannelMappingTabProps extends ChannelMappingDesktopViewProps {
    onOpenNotificationModal?: () => void;
}

export const ChannelMappingTab: React.FC<ChannelMappingTabProps> = (props) => {
    return (
        <div className={styles.container}>
            {/* Desktop View: Master-Detail Two-Column Split Layout */}
            <div className={styles.desktopOnly}>
                <ChannelMappingDesktopView {...props} />
            </div>

            {/* Mobile View: Card-Reflow with Swipeable Channel Pills & Sticky Save Bar */}
            <div className={styles.mobileOnly}>
                <ChannelMappingMobileView {...props} />
            </div>
        </div>
    );
};
