import {
  House,
  Package,
  ShoppingCart,
  Archive,
  Gear,
  Storefront,
  User,
} from '@phosphor-icons/react';
import { NavItem } from '@/types/Navbar';

export const NAVBAR_ITEMS: NavItem[] = [
  {
    title: 'Home',
    path: '/home',
    icon: <House size={18} weight="bold" />,
  },
  {
    title: 'LexuPos',
    path: '/lexupos',
    icon: <Storefront size={18} weight="bold" />,
  },
  {
    title: 'Cashier',
    path: '/cashier',
    icon: <User size={18} weight="bold" />,
  },
  {
    title: 'Product',
    path: '/product',
    icon: <Package size={18} weight="bold" />,
  },
  {
    title: 'Records',
    path: '/records',
    icon: <Archive size={18} weight="bold" />,
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: <Gear size={18} weight="bold" />,
  },
];
