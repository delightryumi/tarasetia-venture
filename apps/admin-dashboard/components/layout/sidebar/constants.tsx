import React from "react";
import {
    House, Camera, TrendUp, SquaresFour, FileText,
    ChartPie, BookOpen, Image, Gear, MapPin,
    Gift, Package, Globe, Users, ClipboardText,
    Coffee, Pulse, Storefront, FileImage,
    Notebook, UsersThree, Bed, Info, ShoppingCart,
    IdentificationCard, FileXls, ChartBar, SlidersHorizontal, Receipt
} from "@phosphor-icons/react";
import { NavItemType } from "./types";
import { SpringOptions } from "framer-motion";

export const DOCK_SPRING: SpringOptions = { mass: 0.1, stiffness: 150, damping: 12 };
export const BASE_SIZE = 50;
export const MAGNIFIED_SIZE = 80;
export const DISTANCE = 200;

export const allNavItems: NavItemType[] = [
    { id: "overview", label: "Overview", icon: <ChartPie size={18} weight="bold" /> },
    { id: "forecast", label: "Forecast", icon: <TrendUp size={18} weight="bold" /> },
    { id: "revenue-breakdown", label: "Revenue Breakdown", icon: <Receipt size={18} weight="bold" /> },
    { id: "rate-inventory", label: "Rate & Inventory", icon: <SlidersHorizontal size={18} weight="bold" /> },
    { id: "invoice", label: "Invoice", icon: <FileText size={18} weight="bold" /> },
    { id: "digital-checkin", label: "GRC (Guest Card)", icon: <IdentificationCard size={18} weight="bold" /> },
    { id: "confirmation-letter", label: "Confirmation Letter (CL)", icon: <FileText size={18} weight="bold" /> },
    { id: "channel-manager", label: "Channel Manager", icon: <Globe size={18} weight="bold" /> },
    { id: "innalytics", label: "Inalytics", icon: <TrendUp size={18} weight="bold" /> },
    { id: "pos", label: "POS Terminal", icon: <Storefront size={18} weight="bold" /> },
    { id: "pnl", label: "P&L Statement", icon: <Notebook size={18} weight="bold" /> },
    { id: "pnl-budget", label: "P&L Actual vs Budget", icon: <ChartBar size={18} weight="bold" /> },
    { id: "dsr", label: "Daily Sales Report (DSR)", icon: <TrendUp size={18} weight="bold" /> },
    { id: "budgeting", label: "Budgeting", icon: <FileXls size={18} weight="bold" /> },
    { id: "statements", label: "Laporan Keuangan", icon: <BookOpen size={18} weight="bold" /> },
    { id: "logo", label: "Logo (Terang/Gelap)", icon: <FileImage size={18} weight="bold" /> },
    { id: "hero", label: "Manajemen Hero", icon: <House size={18} weight="bold" /> },
    { id: "room-type", label: "Kategori Kamar", icon: <Bed size={18} weight="bold" /> },
    { id: "about", label: "Tentang Kami", icon: <Info size={18} weight="bold" /> },
    { id: "gallery", label: "Galeri", icon: <Image size={18} weight="bold" /> },
    { id: "cpanel", label: "CPanel", icon: <Gear size={18} weight="bold" /> },
    { id: "footer", label: "Info Footer", icon: <Notebook size={18} weight="bold" /> },
    { id: "attractions", label: "Atraksi Sekitar", icon: <MapPin size={18} weight="bold" /> },
    { id: "promo", label: "Manajemen Promo", icon: <Gift size={18} weight="bold" /> },
    { id: "packages", label: "Paket Kustom", icon: <Package size={18} weight="bold" /> },
    { id: "seo", label: "SEO & Metadata", icon: <Globe size={18} weight="bold" /> },
    { id: "users", label: "Manajemen User", icon: <Users size={18} weight="bold" /> },
    { id: "superadmin", label: "Super Admin", icon: <Gear size={18} weight="bold" /> },
    { id: "hrd", label: "HRD & Absensi", icon: <ClipboardText size={18} weight="bold" /> },

    { id: "purchasing", label: "Dasbor", icon: <House size={18} weight="bold" /> },
    { id: "store-requisition", label: "Store Requisition", icon: <FileText size={18} weight="bold" /> },
    { id: "purchase-requisition", label: "Purchase Requisition", icon: <ShoppingCart size={18} weight="bold" /> },
    { id: "daily-market-list", label: "Daily Market List", icon: <Coffee size={18} weight="bold" /> },
    { id: "stock-opname", label: "Stock Opname", icon: <ClipboardText size={18} weight="bold" /> },
    { id: "items", label: "Master Barang", icon: <Package size={18} weight="bold" /> },
    { id: "suppliers", label: "Supplier", icon: <UsersThree size={18} weight="bold" /> },
    { id: "purchase-order", label: "Purchase Order", icon: <ClipboardText size={18} weight="bold" /> },
    { id: "food-beverage-product", label: "F&B Product", icon: <Coffee size={18} weight="bold" /> },
    { id: "food-beverage-realtime", label: "POS Real-time", icon: <Pulse size={18} weight="bold" /> },
];
