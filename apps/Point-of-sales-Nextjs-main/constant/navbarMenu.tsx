import {
  Home,
  Package,
  ShoppingCart,
  Archive,
  Settings,
  Star,
  Store,
  User,
} from 'lucide-react';
import { NavItem } from '@/types/Navbar';

export const NAVBAR_ITEMS: NavItem[] = [
  {
    title: 'Home',
    path: '/home',
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: 'LexuPos',
    path: '/lexupos',
    icon: <Store className="h-4 w-4" />,
  },
  {
    title: 'Cashier',
    path: '/cashier',
    icon: <User className="h-4 w-4" />,
  },
  {
    title: 'Product',
    path: '/product',
    icon: <Package className="h-4 w-4" />,
  },
  {
    title: 'Records',
    path: '/records',
    icon: <Archive className="h-4 w-4" />,
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: <Settings className="h-4 w-4" />,
  },
  {
    title: 'Technologies',
    path: '/technologies',
    icon: <Star className="h-4 w-4" />,
  },
];
