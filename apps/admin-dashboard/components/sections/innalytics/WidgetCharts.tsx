'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TimeSeriesPoint, DistributionMetric } from './useInnalyticsData';

export const CHANNEL_COLORS: Record<string, string> = {
  'Direct Cashless': '#0284c7',       // Sky Blue (EDC/QRIS/Transfer)
  'Direct Cash': '#16a34a',           // Green (Cash)
  'Booking Engine': '#10b981',        // Emerald Green
  'Booking Engine (Direct Web)': '#059669', // Darker Emerald
  'Traveloka': '#f97316',             // Vibrant Orange
  'Tiket.com': '#eab308',             // Warm Yellow
  'Booking.com': '#14b8a6',           // Teal
  'Agoda': '#3b82f6',                 // Royal Blue
  'Expedia': '#ec4899',               // Vibrant Pink
  'MG Bedbank': '#a855f7',            // Purple / Bedbank
  'Direct / Walk-in': '#8b5cf6',      // Purple
  'Airbnb': '#f43f5e',                // Coral Red
  'Other': '#64748b'
};

const PALETTE = [
  '#0284c7', '#16a34a', '#10b981', '#f97316', '#eab308',
  '#14b8a6', '#3b82f6', '#ec4899', '#a855f7', '#8b5cf6',
  '#f43f5e', '#06b6d4', '#84cc16', '#d97706', '#6366f1'
];

export const getChannelColor = (channel: string, idx?: number): string => {
  if (CHANNEL_COLORS[channel]) return CHANNEL_COLORS[channel];
  if (idx !== undefined && idx >= 0) return PALETTE[idx % PALETTE.length];
  let hash = 0;
  for (let i = 0; i < channel.length; i++) {
    hash = channel.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

const formatCurrencyShort = (val: number) => {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${Math.round(val / 1_000)}k`;
  return String(val);
};

// ============================================================================
// Multi-Channel Line Chart (Used for Revenue, Bookings, Room Nights, Lead Time, ADR)
// ============================================================================
interface MultiLineChartProps {
  data: TimeSeriesPoint[];
  metricPrefix: 'rev' | 'book' | 'nights' | 'lead' | 'adr';
  channels: string[];
  isCurrency?: boolean;
}

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  data,
  metricPrefix,
  channels,
  isCurrency = false
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          stroke="#718096"
          fontSize={10}
          tickLine={false}
          angle={-45}
          textAnchor="end"
          dy={5}
        />
        <YAxis
          stroke="#718096"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => (isCurrency ? formatCurrencyShort(v) : v)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            border: '1px solid #cbd5e0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            fontSize: '11px',
            padding: '8px 12px'
          }}
          formatter={(value: any, name: any) => {
            const cleanName = String(name).replace(`${metricPrefix}_`, '');
            const formatted = isCurrency
              ? `Rp ${Number(value).toLocaleString('id-ID')}`
              : Number(value).toLocaleString('id-ID');
            return [formatted, cleanName];
          }}
        />
        {channels.map((ch, idx) => {
          const color = getChannelColor(ch, idx);
          const key = `${metricPrefix}_${ch}`;
          return (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
};

// ============================================================================
// Dual-Axis Combo Chart (Used for Room Type, Rate Plan, Rate Type)
// ============================================================================
interface DualAxisChartProps {
  data: DistributionMetric[];
}

export const DualAxisChart: React.FC<DualAxisChartProps> = ({ data }) => {
  const chartData = data.map((d) => ({
    name: d.name.length > 12 ? `${d.name.slice(0, 10)}...` : d.name,
    fullName: d.name,
    'Room Nights': d.roomNights,
    'Revenue': d.revenue
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="name"
          stroke="#718096"
          fontSize={10}
          tickLine={false}
          angle={-25}
          textAnchor="end"
        />
        {/* Left YAxis: Revenue */}
        <YAxis
          yAxisId="left"
          stroke="#718096"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatCurrencyShort(v)}
        />
        {/* Right YAxis: Room Nights */}
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#718096"
          fontSize={10}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            border: '1px solid #cbd5e0',
            fontSize: '11px'
          }}
          formatter={(value: any, name: any) => {
            if (name === 'Revenue') return [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Revenue'];
            return [`${value} nights`, 'Room Nights'];
          }}
        />
        <Bar yAxisId="left" dataKey="Revenue" fill="#f97316" radius={[3, 3, 0, 0]} maxBarSize={30} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="Room Nights"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4, fill: '#3b82f6' }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// ============================================================================
// Donut / Pie Chart (Used for Cancellation %, Bookings %)
// ============================================================================
interface DonutChartProps {
  data: { name: string; value: number }[];
  isPercent?: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, isPercent = true }) => {
  const PIE_COLORS = ['#f97316', '#3b82f6', '#14b8a6', '#eab308', '#ec4899', '#8b5cf6'];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={75}
          paddingAngle={2}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            border: '1px solid #cbd5e0',
            fontSize: '11px'
          }}
          formatter={(value: any) => (isPercent ? `${value}%` : value)}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
