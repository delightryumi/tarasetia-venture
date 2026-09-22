import { Metadata } from 'next';
import InnalyticsModule from '@/components/sections/innalytics/InnalyticsModule';

export const metadata: Metadata = {
  title: 'Inalytics | Hotel Intelligence & Reports',
  description: 'Performance analytics, channel distributions, and comprehensive statistical reports',
};

export default function InnalyticsPage() {
  return <InnalyticsModule />;
}
