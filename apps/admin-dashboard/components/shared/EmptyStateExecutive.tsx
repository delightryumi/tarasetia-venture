"use client";

import React from "react";
import styles from "./EmptyStateExecutive.module.css";

export interface EmptyStateExecutiveProps {
  illustrationSrc?: string;
  illustrationAlt?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  className?: string;
}

export const EmptyStateExecutive: React.FC<EmptyStateExecutiveProps> = ({
  illustrationSrc = "/images/illustrations-3d/3d-biz-05.webp",
  illustrationAlt = "Status Kosong",
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
  className = "",
}) => {
  return (
    <div
      className={`${styles.emptyContainer} ${compact ? styles.emptyContainerCompact : ""} ${className}`}
      role="status"
    >


      {/* Main Content */}
      <div className={styles.contentWrapper}>
        <div className={styles.illustrationWrap}>
          <div className={styles.pedestalAura} aria-hidden="true" />
          <div className={styles.pedestalShadow} aria-hidden="true" />
          <img
            src={illustrationSrc}
            alt={illustrationAlt}
            className={`${styles.illustrationImg} ${compact ? styles.illustrationImgCompact : ""}`}
            loading="lazy"
          />
        </div>

        <h3 className={styles.emptyTitle}>{title}</h3>
        <p className={styles.emptyDescription}>{description}</p>

        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className={styles.actionButton}
          >
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyStateExecutive;
