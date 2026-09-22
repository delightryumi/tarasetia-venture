'use client';

import React from 'react';
import styles from './innalytics.module.css';
import { ChannelMetric, DistributionMetric } from './useInnalyticsData';

interface SingleMetricTableProps {
  labelCol: string;
  valCol: string;
  data: ChannelMetric[];
  isCurrency?: boolean;
  isPercent?: boolean;
  totalLabel?: string;
  totalValue?: number;
}

export const SingleMetricTable: React.FC<SingleMetricTableProps> = ({
  labelCol,
  valCol,
  data,
  isCurrency = false,
  isPercent = false,
  totalLabel = 'Total',
  totalValue
}) => {
  const calculatedTotal = totalValue !== undefined
    ? totalValue
    : data.reduce((acc, row) => acc + (row.value || 0), 0);

  const formatValue = (val: number) => {
    if (isCurrency) {
      return val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (isPercent) {
      return `${val.toFixed(1)}%`;
    }
    return val.toLocaleString('id-ID');
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.cleanTable}>
        <thead>
          <tr>
            <th>{labelCol}</th>
            <th>{valCol}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={`${row.channel}_${idx}`}>
              <td>{row.channel}</td>
              <td>{formatValue(row.value)}</td>
            </tr>
          ))}
          <tr className={styles.totalRow}>
            <td>{totalLabel}</td>
            <td>{formatValue(calculatedTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

interface DualMetricTableProps {
  labelCol: string;
  data: DistributionMetric[];
}

export const DualMetricTable: React.FC<DualMetricTableProps> = ({ labelCol, data }) => {
  const totalNights = data.reduce((acc, row) => acc + row.roomNights, 0);
  const totalRev = data.reduce((acc, row) => acc + row.revenue, 0);

  return (
    <div className={styles.tableContainer}>
      <table className={styles.cleanTable}>
        <thead>
          <tr>
            <th>{labelCol}</th>
            <th>Room Nights</th>
            <th>Revenue ( Rp )</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={`${row.name}_${idx}`}>
              <td title={row.name}>{row.name.length > 18 ? `${row.name.slice(0, 16)}...` : row.name}</td>
              <td>{row.roomNights}</td>
              <td>{row.revenue.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          ))}
          <tr className={styles.totalRow}>
            <td>Total</td>
            <td>{totalNights}</td>
            <td>{totalRev.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
