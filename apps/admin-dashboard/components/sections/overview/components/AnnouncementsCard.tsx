"use client";

import React from "react";
import styles from "./AnnouncementsCard.module.css";

interface AnnouncementsCardProps {
  hotelName?: string;
  activeChannels?: string[];
}

export function AnnouncementsCard({ hotelName }: AnnouncementsCardProps) {
  return (
    <div className={styles.cardContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>Announcements</h3>
      </div>
      <div className={styles.body}>
        <p className={styles.announcementHeadline}>
          September Update 🚀 (Sep 2026)
        </p>
        <p className={styles.announcementSubhead}>Summary of Features</p>
        <ul className={styles.featureList}>
          <li className={styles.featureItem}>
            <span className={styles.featureBullet} />
            <span className={styles.featureItemText}>
              2-Way Realtime ARI (Availability, Rate, Inventory) synchronization active
            </span>
          </li>
          <li className={styles.featureItem}>
            <span className={styles.featureBullet} />
            <span className={styles.featureItemText}>
              Direct OTA Channel Connectivity: Traveloka, Booking.com, Tiket.com, Agoda, Expedia
            </span>
          </li>
          <li className={styles.featureItem}>
            <span className={styles.featureBullet} />
            <span className={styles.featureItemText}>
              Automated Front Desk Night Audit &amp; Multi-Payment Folio Settlements
            </span>
          </li>
          <li className={styles.featureItem}>
            <span className={styles.featureBullet} />
            <span className={styles.featureItemText}>
              Enterprise Revenue Ledger with Excel &amp; PDF official multi-table exports
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
