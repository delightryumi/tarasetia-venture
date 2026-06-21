"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  query,
  orderBy,
  deleteDoc,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// ── Modular Components ──
import { HotelMasterDoc } from "./types";
import { SuperadminHeader } from "./SuperadminHeader";
import { SuperadminPageHeader } from "./SuperadminPageHeader";
import { SuperadminTabs } from "./SuperadminTabs";
import { RegistryKpiCards, BillingKpiCards } from "./KpiCards";
import { RegistryTable } from "./RegistryTable";
import { BillingTable } from "./BillingTable";
import { SystemCredentialsNotes } from "./SystemCredentialsNotes";
import { HotelFormModal } from "./HotelFormModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { BulkAlertModal } from "./BulkAlertModal";
import { AddPaymentModal } from "./AddPaymentModal";
import { PrintInvoice } from "./PrintInvoice";
import { MergeAccessModal } from "./MergeAccessModal";
import styles from "./superadmin.module.css";

export default function SuperadminPage() {
  const {
    user,
    loading: authLoading,
    signOutUser,
    activeHotelCode,
    activeHotelName,
    hotelsList,
    setActiveHotelCode,
  } = useAuth();
  const router = useRouter();

  // ── Core state ──
  const [hotels, setHotels] = useState<HotelMasterDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [mounted, setMounted] = useState(false);

  // ── UI state ──
  const [theme, setTheme] = useState<"dark" | "light" | "system">("system");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<"registry" | "billing">("registry");

  // ── Hotel form (add/edit) ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [currentHotelCode, setCurrentHotelCode] = useState("");
  const [name, setName] = useState("");
  const [hotelCode, setHotelCode] = useState("");
  const [domain, setDomain] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<any>("custom");
  const [cycle, setCycle] = useState<any>("monthly");
  const [billingStatus, setBillingStatus] = useState<any>("paid");
  const [nextDueDate, setNextDueDate] = useState("");
  const [showBillingAlert, setShowBillingAlert] = useState(false);
  const [showExpirationAlert, setShowExpirationAlert] = useState(false);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [mergeAccessHotel, setMergeAccessHotel] = useState<HotelMasterDoc | null>(null);

  // ── Delete modal ──
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState<HotelMasterDoc | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Billing / invoice state ──
  const [selectedHotelForBilling, setSelectedHotelForBilling] = useState<HotelMasterDoc | null>(null);
  const [billingRecords, setBillingRecords] = useState<any[]>([]);
  const [loadingBillingRecords, setLoadingBillingRecords] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [outstandingAmount, setOutstandingAmount] = useState(0);
  const [loadingGlobalBilling, setLoadingGlobalBilling] = useState(false);
  const [globalBillingRecords, setGlobalBillingRecords] = useState<any[]>([]);
  const [isSavingAlert, setIsSavingAlert] = useState(false);

  // ── Add payment modal ──
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<any>("paid");
  const [paymentPlan, setPaymentPlan] = useState<any>("basic");
  const [paymentCycle, setPaymentCycle] = useState<any>("monthly");
  const [paymentPeriodStart, setPaymentPeriodStart] = useState("");
  const [paymentPeriodEnd, setPaymentPeriodEnd] = useState("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // ── Bulk alert modal ──
  const [isBulkAlertModalOpen, setIsBulkAlertModalOpen] = useState(false);
  const [bulkAlertMsg, setBulkAlertMsg] = useState("");
  const [bulkAlertTarget, setBulkAlertTarget] = useState<"selected" | "all">("all");
  const [selectedHotelCodes, setSelectedHotelCodes] = useState<string[]>([]);

  // ── Print invoice ──
  const [activeInvoiceToPrint, setActiveInvoiceToPrint] = useState<any>(null);

  // ── Theme sync ──
  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem("theme") as any) || "system";
    setTheme(savedTheme);
    let resolved = savedTheme;
    if (savedTheme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (resolved === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    const syncThemeState = () => {
      const t = (localStorage.getItem("theme") as any) || "system";
      setTheme(t);
    };
    window.addEventListener("focus", syncThemeState);
    window.addEventListener("storage", syncThemeState);
    return () => {
      window.removeEventListener("focus", syncThemeState);
      window.removeEventListener("storage", syncThemeState);
    };
  }, []);

  const changeTheme = (newTheme: "dark" | "light" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.cookie = `shared_theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
    let resolved = newTheme;
    if (newTheme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (resolved === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  // ── Route protection ──
  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login?redirect=/superadmin");
      else if (user.role !== "superadmin") router.push("/select-module");
    }
  }, [user, authLoading, router]);

  // ── Real-time hotels list ──
  useEffect(() => {
    if (!user || user.role !== "superadmin") return;
    const q = query(collection(db, "hotels"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: HotelMasterDoc[] = [];
        snapshot.forEach((d) => list.push(d.data() as HotelMasterDoc));
        setHotels(list);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore read error:", err);
        setError("Gagal memuat daftar partner.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // ── Billing KPI stats ──
  useEffect(() => {
    if (activeMainTab === "billing" && hotels.length > 0) {
      const fetchStats = async () => {
        setLoadingGlobalBilling(true);
        let revenueSum = 0;
        let outstandingSum = 0;
        const allRecords: any[] = [];
        for (const hotel of hotels) {
          try {
            const snap = await getDocs(collection(db, "hotels", hotel.hotelCode, "billing_records"));
            snap.forEach((d) => {
              const data = d.data();
              allRecords.push({ id: d.id, hotelCode: hotel.hotelCode, hotelName: hotel.name, hotelEmail: hotel.email, hotelPhone: hotel.phone, hotelAddress: hotel.address, ...data });
              if (data.status === "paid") revenueSum += Number(data.amount || 0);
              else if (data.status === "unpaid") outstandingSum += Number(data.amount || 0);
            });
          } catch (e) {
            console.error("Error fetching stats for hotel:", hotel.hotelCode, e);
          }
        }
        allRecords.sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db2 - da;
        });
        setGlobalBillingRecords(allRecords);
        setTotalRevenue(revenueSum);
        setOutstandingAmount(outstandingSum);
        setLoadingGlobalBilling(false);
      };
      fetchStats();
    }
  }, [activeMainTab, hotels]);

  // ── Guards ──
  if (!mounted) return null;
  if (authLoading || loading) {
    return (
      <div className="flex h-[75vh] items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#181d26] dark:text-white animate-spin" />
          <span className="text-xs font-semibold tracking-wider text-neutral-450 uppercase animate-pulse">
            Memuat Data Superadmin...
          </span>
        </div>
      </div>
    );
  }
  if (user?.role !== "superadmin") return null;

  // ── Derived values ──
  const totalHotels = hotels.length;
  const activeHotels = hotels.filter((h) => h.active).length;
  const overdueHotels = hotels.filter((h) => h.billing?.status === "overdue").length;
  const isSuperadmin = user?.role === "superadmin" || user?.email?.toLowerCase() === "nexura.management@gmail.com";

  // ── Handlers ──
  const handleToggleActive = async (hotel: HotelMasterDoc) => {
    try {
      setError(""); setSuccessMsg("");
      const newActive = !hotel.active;
      await updateDoc(doc(db, "hotels", hotel.hotelCode), {
        active: newActive,
        suspendedAt: newActive ? null : new Date().toISOString(),
      });
      setSuccessMsg(`Status partner "${hotel.name}" berhasil diperbarui.`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Gagal merubah status partner.");
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    const randomId = Math.floor(10000 + Math.random() * 90000).toString();
    setHotelCode(randomId); setName(""); setDomain(""); setSubdomain("");
    setAddress(""); setPhone(""); setEmail(""); setPlan("startup");
    setActiveModules(["pos", "hrd", "cpanel-only"]); setCycle("monthly");
    setBillingStatus("paid");
    setNextDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setShowBillingAlert(false); setShowExpirationAlert(false);
    setIsModalOpen(true);
  };

  const openEditModal = (hotel: HotelMasterDoc) => {
    setIsEditing(true);
    setCurrentHotelCode(hotel.hotelCode); setHotelCode(hotel.hotelCode);
    setName(hotel.name); setDomain(hotel.domain || ""); setSubdomain(hotel.subdomain || "");
    setAddress(hotel.address || ""); setPhone(hotel.phone || ""); setEmail(hotel.email || "");
    setPlan(hotel.billing?.plan || "custom");
    let modules = hotel.billing?.activeModules || [];
    
    // Legacy migration
    if (modules.includes("cpanel")) {
      modules = modules.filter((m) => m !== "cpanel");
      if (hotel.billing?.plan === "basic" || hotel.billing?.plan === "startup") { if (!modules.includes("cpanel-only")) modules.push("cpanel-only"); }
      else { if (!modules.includes("cpanel-full")) modules.push("cpanel-full"); }
    }
    
    if (modules.length === 0) {
      if (hotel.billing?.plan === "basic" || hotel.billing?.plan === "startup") {
        modules = ["pos", "hrd", "cpanel-only"];
      } else if (hotel.billing?.plan === "bisnis") {
        modules = ["pos", "front-office", "housekeeping", "food-beverage", "purchasing", "accounting", "hrd", "cpanel-only"];
      } else {
        modules = ["pos", "front-office", "housekeeping", "food-beverage", "purchasing", "accounting", "hrd", "cpanel-full"];
      }
    }
    setActiveModules(modules);
    setCycle(hotel.billing?.cycle || "monthly");
    setBillingStatus(hotel.billing?.status || "paid");
    setNextDueDate(hotel.billing?.nextDueDate ? hotel.billing.nextDueDate.split("T")[0] : "");
    setShowBillingAlert(!!hotel.billing?.showBillingAlert);
    setShowExpirationAlert(!!hotel.billing?.showExpirationAlert);
    setIsModalOpen(true);
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !plan) {
      toast.error("Email dan Paket harus diisi.");
      return;
    }
    
    setIsSendingLink(true);
    try {
      const res = await fetch("/api/hotels/onboarding/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), plan, activeModules }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim link onboarding.");
      }
      
      toast.success(data.message || "Link onboarding terkirim!");
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan saat mengirim link.");
    } finally {
      setIsSendingLink(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccessMsg("");
    const code = hotelCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!code) { setError("Kode hotel tidak boleh kosong dan harus alphanumeric."); return; }

    try {
      let defaultPasswordInfo = "";
      if (email.trim()) {
        const res = await fetch("/api/hotels/register-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), hotelCode: isEditing ? currentHotelCode : code, hotelName: name.trim() }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Gagal mengautentikasi email admin."); return; }
        if (data.success) {
          const emailStatus = data.emailSent ? " & Email detail login telah dikirim!" : " (SMTP belum diset, email dilewati)";
          defaultPasswordInfo = data.defaultPassword
            ? ` User Admin dibuat (Password: ${data.defaultPassword})${emailStatus}`
            : ` User Admin ditautkan (Email sudah terdaftar)${emailStatus}`;
          const userDocId = email.trim().toLowerCase().replace(/[@.]/g, "_");
          await setDoc(doc(db, "hotels", isEditing ? currentHotelCode : code, "users_master", userDocId), {
            email: email.trim().toLowerCase(), name: `${name.trim()} Admin`, role: "admin",
            createdAt: new Date().toISOString(),
            permissions: {
              module_pos: true, module_front_office: true, module_housekeeping: true,
              module_food_beverage: true, module_purchasing: true, module_accounting: true, module_cpanel: true,
              overview: true, forecast: true, invoice: true, pnl: true, logo: true, hero: true,
              "room-type": true, about: true, gallery: true, footer: true, attractions: true,
              promo: true, packages: true, seo: true, users: true, purchasing: true,
              "store-requisition": true, "purchase-requisition": true, "daily-market-list": true,
              "stock-opname": true, items: true, suppliers: true, "purchase-order": true,
              "food-beverage-product": true,
              pos_home: true, pos_lexupos: true, pos_cashier: true, pos_product: true,
              pos_records: true, pos_settings: true, pos_self_order: true,
            },
          }, { merge: true });
        }
      }

      const dataPayload = {
        hotelCode: isEditing ? currentHotelCode : code,
        name: name.trim(), domain: domain.trim(),
        subdomain: subdomain.trim() || `${code}.crs.local`,
        address: address.trim(), phone: phone.trim(), email: email.trim(),
        billing: { plan, cycle, status: billingStatus, nextDueDate: nextDueDate ? new Date(nextDueDate).toISOString() : new Date().toISOString(), showBillingAlert, showExpirationAlert, activeModules },
        ...(isEditing ? {} : { active: true, createdAt: new Date().toISOString(), suspendedAt: null }),
      };

      await setDoc(doc(db, "hotels", isEditing ? currentHotelCode : code), dataPayload, { merge: true });
      setSuccessMsg(isEditing ? `Konfigurasi hotel "${name}" berhasil diubah.${defaultPasswordInfo}` : `Hotel baru "${name}" berhasil ditambahkan.${defaultPasswordInfo}`);
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(""), defaultPasswordInfo.includes("Password") ? 15000 : 4000);
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan data hotel.");
    }
  };

  const openDeleteConfirm = (hotel: HotelMasterDoc) => {
    setHotelToDelete(hotel); setDeleteConfirmInput(""); setIsDeleteModalOpen(true);
  };

  const handleDeleteHotel = async () => {
    if (!hotelToDelete || deleteConfirmInput !== hotelToDelete.hotelCode) {
      setError("Kode hotel yang dimasukkan tidak cocok."); return;
    }
    setIsDeleting(true); setError(""); setSuccessMsg("");
    try {
      const code = hotelToDelete.hotelCode;
      const subCollections = ["users_master", "roomTypes", "packages", "pos_orders", "daily_revenue", "revenue_transactions", "pos_products", "purchasing_counters", "items", "suppliers", "sections", "settings", "gallery", "attractions"];
      for (const subCol of subCollections) {
        const snap = await getDocs(collection(db, "hotels", code, subCol));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      }
      await deleteDoc(doc(db, "hotels", code));
      setSuccessMsg(`Hotel "${hotelToDelete.name}" beserta seluruh database operasionalnya berhasil dihapus secara permanen.`);
      setIsDeleteModalOpen(false); setHotelToDelete(null); setDeleteConfirmInput("");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      console.error("Error deleting hotel:", err);
      setError("Gagal menghapus database hotel. Silakan coba lagi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const loadBillingRecords = async (code: string) => {
    setLoadingBillingRecords(true);
    try {
      const q = query(collection(db, "hotels", code, "billing_records"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setBillingRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error loading billing records:", e);
      setError("Gagal memuat riwayat pembayaran.");
    } finally {
      setLoadingBillingRecords(false);
    }
  };

  const handleAddPaymentRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotelForBilling) return;
    setIsSavingPayment(true);
    try {
      const code = selectedHotelForBilling.hotelCode;
      const invoiceNum = `INV-${code}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
      const payload = {
        invoiceId: invoiceNum, amount: Number(paymentAmount), plan: paymentPlan, cycle: paymentCycle, status: paymentStatus,
        billingPeriodStart: paymentPeriodStart ? new Date(paymentPeriodStart).toISOString() : new Date().toISOString(),
        billingPeriodEnd: paymentPeriodEnd ? new Date(paymentPeriodEnd).toISOString() : new Date().toISOString(),
        paidAt: paymentStatus === "paid" ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(collection(db, "hotels", code, "billing_records"), invoiceNum), payload);
      if (paymentStatus === "paid") {
        await updateDoc(doc(db, "hotels", code), { "billing.nextDueDate": new Date(paymentPeriodEnd).toISOString(), "billing.status": "paid", "billing.showBillingAlert": false });
      }
      setSuccessMsg("Rekapan pembayaran baru berhasil dicatat.");
      setIsAddPaymentOpen(false); setPaymentAmount("");
      await loadBillingRecords(code);
      setGlobalBillingRecords((prev) => [{ id: invoiceNum, invoiceId: invoiceNum, hotelCode: code, hotelName: selectedHotelForBilling.name, hotelEmail: selectedHotelForBilling.email, hotelPhone: selectedHotelForBilling.phone, hotelAddress: selectedHotelForBilling.address, ...payload }, ...prev]);
      if (paymentStatus === "paid") setTotalRevenue((p) => p + Number(paymentAmount));
      else setOutstandingAmount((p) => p + Number(paymentAmount));
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err); setError("Gagal menyimpan rekapan pembayaran.");
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleTogglePaymentStatus = async (record: any) => {
    const code = record.hotelCode || selectedHotelForBilling?.hotelCode;
    if (!code) return;
    try {
      const newStatus = record.status === "paid" ? "unpaid" : "paid";
      await updateDoc(doc(db, "hotels", code, "billing_records", record.id), { status: newStatus, paidAt: newStatus === "paid" ? new Date().toISOString() : null });
      if (newStatus === "paid") {
        await updateDoc(doc(db, "hotels", code), { "billing.nextDueDate": record.billingPeriodEnd, "billing.status": "paid", "billing.showBillingAlert": false });
      }
      setSuccessMsg("Status pembayaran invoice berhasil diperbarui.");
      if (selectedHotelForBilling) await loadBillingRecords(code);
      setGlobalBillingRecords((prev) => prev.map((rec) => rec.id === record.id && rec.hotelCode === code ? { ...rec, status: newStatus, paidAt: newStatus === "paid" ? new Date().toISOString() : null } : rec));
      if (newStatus === "paid") { setTotalRevenue((p) => p + Number(record.amount || 0)); setOutstandingAmount((p) => Math.max(0, p - Number(record.amount || 0))); }
      else { setTotalRevenue((p) => Math.max(0, p - Number(record.amount || 0))); setOutstandingAmount((p) => p + Number(record.amount || 0)); }
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err); setError("Gagal memperbarui status invoice.");
    }
  };

  const handleSaveBulkAlert = async (actionType: "send" | "deactivate" | "delete") => {
    setIsSavingAlert(true);
    try {
      const targets = bulkAlertTarget === "selected" ? selectedHotelCodes : hotels.map((h) => h.hotelCode);
      if (targets.length === 0) { setError("Tidak ada properti target yang dipilih."); setIsSavingAlert(false); return; }
      const cleanMsg = bulkAlertMsg.trim();
      if (actionType === "send" && !cleanMsg) { setError("Pesan alert kustom tidak boleh kosong untuk mengirim."); setIsSavingAlert(false); return; }
      await Promise.all(targets.map((code) => {
        const ref = doc(db, "hotels", code);
        if (actionType === "send") return updateDoc(ref, { "billing.alertMessage": cleanMsg, "billing.showCustomAlert": true });
        if (actionType === "deactivate") return updateDoc(ref, { "billing.showCustomAlert": false });
        return updateDoc(ref, { "billing.alertMessage": null, "billing.showCustomAlert": false });
      }));
      const msg = actionType === "send" ? `Pesan alert kustom berhasil dikirim ke ${targets.length} properti.` : actionType === "deactivate" ? `Alert kustom berhasil dimatikan untuk ${targets.length} properti.` : `Pesan alert kustom berhasil dihapus dari ${targets.length} properti.`;
      setSuccessMsg(msg); setIsBulkAlertModalOpen(false); setBulkAlertMsg(""); setSelectedHotelCodes([]);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err); setError("Gagal memproses bulk alert.");
    } finally {
      setIsSavingAlert(false);
    }
  };

  const handleToggleExpirationAlert = async (hotel: HotelMasterDoc) => {
    try {
      await updateDoc(doc(db, "hotels", hotel.hotelCode), { "billing.showExpirationAlert": !hotel.billing?.showExpirationAlert });
      setSuccessMsg(`Status warning banner hotel "${hotel.name}" diperbarui.`);
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch { setError("Gagal mengubah status warning banner."); }
  };

  const handleToggleBillingAlert = async (hotel: HotelMasterDoc) => {
    try {
      await updateDoc(doc(db, "hotels", hotel.hotelCode), { "billing.showBillingAlert": !hotel.billing?.showBillingAlert });
      setSuccessMsg(`Status pop-up penangguhan hotel "${hotel.name}" diperbarui.`);
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch { setError("Gagal mengubah status pop-up penangguhan."); }
  };

  const handlePrintInvoice = (record: any, hotel: HotelMasterDoc) => {
    setActiveInvoiceToPrint({ ...record, hotelName: hotel.name, hotelEmail: hotel.email, hotelPhone: hotel.phone, hotelAddress: hotel.address });
    setTimeout(() => window.print(), 150);
  };

  // ── Render ──
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%", overflowX: "hidden", backgroundColor: "var(--s-canvas)" }}>
      {/* ── Fixed Global Header ── */}
      <SuperadminHeader
        theme={theme}
        changeTheme={changeTheme}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        activeHotelCode={activeHotelCode}
        activeHotelName={activeHotelName || ""}
        isSuperadmin={isSuperadmin}
        hotelsList={hotelsList as HotelMasterDoc[]}
        setActiveHotelCode={setActiveHotelCode}
        onLogoClick={() => { window.location.href = "/select-module"; }}
        onNavigate={(path) => router.push(path)}
        onSignOut={signOutUser}
      />

      {/* Spacer for fixed header */}
      <div className={styles.headerSpacer} />

      {/* ── Main Page Content ── */}
      <div className={styles.page}>
        <SuperadminPageHeader
          error={error}
          successMsg={successMsg}
          onAddHotel={openAddModal}
        />

        <SystemCredentialsNotes />

        <SuperadminTabs activeTab={activeMainTab} onChange={setActiveMainTab} />

        {activeMainTab === "registry" ? (
          <RegistryKpiCards totalHotels={totalHotels} activeHotels={activeHotels} overdueHotels={overdueHotels} />
        ) : (
          <BillingKpiCards totalRevenue={totalRevenue} outstandingAmount={outstandingAmount} overdueHotels={overdueHotels} />
        )}

        {activeMainTab === "registry" && (
          <RegistryTable
            hotels={hotels}
            onEdit={openEditModal}
            onDelete={openDeleteConfirm}
            onToggleActive={handleToggleActive}
            onMergeAccess={(hotel) => setMergeAccessHotel(hotel)}
          />
        )}

        {activeMainTab === "billing" && (
          <BillingTable
            hotels={hotels}
            selectedHotelCodes={selectedHotelCodes}
            setSelectedHotelCodes={setSelectedHotelCodes}
            onToggleExpirationAlert={handleToggleExpirationAlert}
            onToggleBillingAlert={handleToggleBillingAlert}
            onManageInvoice={(hotel) => {
              setSelectedHotelForBilling(hotel);
              loadBillingRecords(hotel.hotelCode);
              setTimeout(() => { document.getElementById("billing-history-section")?.scrollIntoView({ behavior: "smooth" }); }, 100);
            }}
            onOpenBulkAlert={() => { setBulkAlertMsg(""); setBulkAlertTarget(selectedHotelCodes.length > 0 ? "selected" : "all"); setIsBulkAlertModalOpen(true); }}
            selectedHotelForBilling={selectedHotelForBilling}
            setSelectedHotelForBilling={(h) => { setSelectedHotelForBilling(h); if (h) loadBillingRecords(h.hotelCode); else setBillingRecords([]); }}
            billingRecords={billingRecords}
            loadingBillingRecords={loadingBillingRecords}
            onTogglePaymentStatus={handleTogglePaymentStatus}
            onPrintInvoice={handlePrintInvoice}
            onOpenAddPayment={() => {
              setPaymentAmount(""); setPaymentPlan(selectedHotelForBilling?.billing?.plan || "basic");
              setPaymentCycle(selectedHotelForBilling?.billing?.cycle || "monthly");
              setPaymentPeriodStart(new Date().toISOString().split("T")[0]);
              setPaymentPeriodEnd(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
              setPaymentStatus("paid"); setIsAddPaymentOpen(true);
            }}
          />
        )}

        {/* ── Modals ── */}
        {isModalOpen && (
          <HotelFormModal
            isEditing={isEditing} hotelCode={hotelCode}
            name={name} setName={setName}
            domain={domain} setDomain={setDomain}
            subdomain={subdomain} setSubdomain={setSubdomain}
            address={address} setAddress={setAddress}
            phone={phone} setPhone={setPhone}
            email={email} setEmail={setEmail}
            plan={plan} setPlan={setPlan}
            cycle={cycle} setCycle={setCycle}
            billingStatus={billingStatus} setBillingStatus={setBillingStatus}
            nextDueDate={nextDueDate} setNextDueDate={setNextDueDate}
            activeModules={activeModules} setActiveModules={setActiveModules}
            onSubmit={handleSubmit}
            onSendLink={handleSendLink}
            isSendingLink={isSendingLink}
            onClose={() => setIsModalOpen(false)}
          />
        )}

        {isDeleteModalOpen && hotelToDelete && (
          <DeleteConfirmModal
            hotelToDelete={hotelToDelete}
            deleteConfirmInput={deleteConfirmInput}
            setDeleteConfirmInput={setDeleteConfirmInput}
            isDeleting={isDeleting}
            onConfirm={handleDeleteHotel}
            onClose={() => { setIsDeleteModalOpen(false); setHotelToDelete(null); }}
          />
        )}

        {isBulkAlertModalOpen && (
          <BulkAlertModal
            hotels={hotels}
            selectedHotelCodes={selectedHotelCodes}
            bulkAlertTarget={bulkAlertTarget}
            setBulkAlertTarget={setBulkAlertTarget}
            bulkAlertMsg={bulkAlertMsg}
            setBulkAlertMsg={setBulkAlertMsg}
            isSavingAlert={isSavingAlert}
            onSend={() => handleSaveBulkAlert("send")}
            onDeactivate={() => handleSaveBulkAlert("deactivate")}
            onDelete={() => handleSaveBulkAlert("delete")}
            onClose={() => setIsBulkAlertModalOpen(false)}
          />
        )}

        <MergeAccessModal
          isOpen={!!mergeAccessHotel}
          onClose={() => setMergeAccessHotel(null)}
          hotels={hotels}
          initialEmail={mergeAccessHotel?.email || ""}
        />

        {isAddPaymentOpen && selectedHotelForBilling && (
          <AddPaymentModal
            hotel={selectedHotelForBilling}
            paymentAmount={paymentAmount} setPaymentAmount={setPaymentAmount}
            paymentStatus={paymentStatus} setPaymentStatus={setPaymentStatus}
            paymentPlan={paymentPlan} setPaymentPlan={setPaymentPlan}
            paymentCycle={paymentCycle} setPaymentCycle={setPaymentCycle}
            paymentPeriodStart={paymentPeriodStart} setPaymentPeriodStart={setPaymentPeriodStart}
            paymentPeriodEnd={paymentPeriodEnd} setPaymentPeriodEnd={setPaymentPeriodEnd}
            isSavingPayment={isSavingPayment}
            onSubmit={handleAddPaymentRecord}
            onClose={() => setIsAddPaymentOpen(false)}
          />
        )}

        {/* ── Print Invoice ── */}
        {activeInvoiceToPrint && <PrintInvoice invoice={activeInvoiceToPrint} />}
      </div>
    </div>
  );
}
