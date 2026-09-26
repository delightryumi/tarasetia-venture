import {
  House,
  ForkKnife,
  Receipt,
  CashRegister,
  SlidersHorizontal,
  DeviceTablet,
  ClockCounterClockwise,
  ChartBar,
} from '@phosphor-icons/react';
import { NavItem } from '@/types/Navbar';

export const NAVBAR_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/home',
    icon: <House size={18} weight="bold" />,
    permissionKey: 'pos_home',
  },
  {
    title: 'Terminal POS',
    path: '/lexupos',
    icon: <DeviceTablet size={18} weight="bold" />,
    permissionKey: 'pos_lexupos',
  },
  {
    title: 'Kasir',
    path: '/cashier',
    icon: <CashRegister size={18} weight="bold" />,
    permissionKey: 'pos_cashier',
  },
  {
    title: 'Katalog Menu',
    path: '/product',
    icon: <ForkKnife size={18} weight="bold" />,
    permissionKey: 'pos_product',
  },
  {
    title: 'Records',
    path: '/records',
    icon: <Receipt size={18} weight="bold" />,
    permissionKey: 'pos_records',
  },
  {
    title: 'Shift Kasir',
    path: '/analytics/income/cashier',
    icon: <ClockCounterClockwise size={18} weight="bold" />,
    permissionKey: 'pos_settlement',
  },
  {
    title: 'Analitik Omset',
    path: '/analytics/income',
    icon: <ChartBar size={18} weight="bold" />,
    permissionKey: 'pos_home',
  },
  {
    title: 'Konfigurasi',
    path: '/settings',
    icon: <SlidersHorizontal size={18} weight="bold" />,
    permissionKey: 'pos_settings',
  },
];
