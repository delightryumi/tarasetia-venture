/* eslint-disable react/no-unescaped-entities */
'use client';
import { cn } from '@/lib/utils';
import React from 'react';
import { BentoGrid, BentoGridItem } from '../ui/bento-grid';
import {
  IconWifi,
  IconClock,
  IconCloud,
  IconCalendarMonth,
  IconTableColumn,
} from '@tabler/icons-react';
import DigitalClock from '../clock/clock';
import ActiveShiftSummary from '../card/shiftsummary';
import ChartOne from '../charts/chartone';

export function BentoGridHome() {
  return (
    <BentoGrid className="w-full mx-auto md:auto-rows-auto">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          className={cn('[&>p:text-lg]', item.className)}
          icon={item.icon}
        />
      ))}
    </BentoGrid>
  );
}

const getTodayString = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const items = [
  {
    title: "Don't Forget To Rest Your Soul",
    description: <span className="text-sm">Experience the power of time.</span>,
    header: <DigitalClock />,
    className: 'md:col-span-1 h-full min-h-[16rem]',
    icon: <IconClock className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: 'Shift Aktif',
    description: <span className="text-sm">Ringkasan kasir yang sedang bertugas.</span>,
    header: <ActiveShiftSummary />,
    className: 'md:col-span-2 h-full min-h-[16rem]',
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Today's Income",
    description: <span className="text-sm">Grafik Pendapatan Hari Ini.</span>,
    header: (
      <div className="w-full rounded-xl">
        <ChartOne defaultStartDate={getTodayString()} defaultEndDate={getTodayString()} />
      </div>
    ),
    className: 'md:col-span-3',
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },
];
