'use client';

import React, { useState } from 'react';
import { MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './innalytics.module.css';

export interface LegendDef {
  label: string;
  color: string;
}

interface WidgetCardProps {
  title: string;
  dateRangeText?: string;
  isTableView: boolean;
  hasData: boolean;
  chartComponent: React.ReactNode;
  tableComponent: React.ReactNode;
  legends?: LegendDef[];
}

export const WidgetCard: React.FC<WidgetCardProps> = ({
  title,
  dateRangeText,
  isTableView,
  hasData,
  chartComponent,
  tableComponent,
  legends = []
}) => {
  const [legendPage, setLegendPage] = useState(1);
  const itemsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(legends.length / itemsPerPage));

  const visibleLegends = legends.slice(
    (legendPage - 1) * itemsPerPage,
    legendPage * itemsPerPage
  );

  return (
    <div className={styles.widgetCard}>
      {/* Card Header */}
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{title}</span>
        <button className={styles.cardMenuBtn} title="Options">
          <MoreVertical size={14} />
        </button>
      </div>

      {/* Date Subheader */}
      {dateRangeText && !isTableView && (
        <div className={styles.cardSubheader}>{dateRangeText}</div>
      )}

      {/* Card Body */}
      <div className={styles.cardBody}>
        {!hasData ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateRing} />
            <span className={styles.emptyStateText}>DATA NOT FOUND</span>
          </div>
        ) : isTableView ? (
          tableComponent
        ) : (
          chartComponent
        )}
      </div>

      {/* Card Footer: Legends & Pagination */}
      {!isTableView && hasData && legends.length > 0 && (
        <div className={styles.cardFooter}>
          <div className={styles.legendList}>
            {visibleLegends.map((leg, idx) => (
              <div key={idx} className={styles.legendItem}>
                <span
                  className={styles.legendSquare}
                  style={{ backgroundColor: leg.color }}
                />
                <span>{leg.label}</span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.legendPagination}>
              <button
                className={styles.pageArrow}
                disabled={legendPage <= 1}
                onClick={() => setLegendPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={12} />
              </button>
              <span>{`${legendPage}/${totalPages}`}</span>
              <button
                className={styles.pageArrow}
                disabled={legendPage >= totalPages}
                onClick={() => setLegendPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
