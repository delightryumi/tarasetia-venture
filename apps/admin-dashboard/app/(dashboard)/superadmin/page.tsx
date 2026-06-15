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
import {
  Building2,
  Plus,
  ShieldAlert,
  Loader2,
  Globe,
  CheckCircle,
  Edit,
  Calendar,
  Layers,
  Sparkles,
  Grid,
  Trash2,
  AlertTriangle,
  Mail,
  X,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import styles from "./superadmin.module.css";

interface HotelMasterDoc {
  hotelCode: string;
  name: string;
  active: boolean;
  domain: string;
  subdomain: string;
  createdAt: string;
  suspendedAt: string | null;
  address: string;
  phone: string;
  email: string;
  billing: {
    plan: "basic" | "premium" | "enterprise";
    cycle: "monthly" | "yearly";
    nextDueDate: string;
    status: "paid" | "overdue" | "grace-period";
    showBillingAlert?: boolean;
    showExpirationAlert?: boolean;
    activeModules?: string[];
    alertMessage?: string;
  };
}

export default function SuperadminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [hotels, setHotels] = useState<HotelMasterDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Main Tab control
  const [activeMainTab, setActiveMainTab] = useState<"registry" | "billing">("registry");

  // Form states for adding/editing a hotel
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentHotelCode, setCurrentHotelCode] = useState("");
  const [name, setName] = useState("");
  const [hotelCode, setHotelCode] = useState("");
  const [domain, setDomain] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<"basic" | "premium" | "enterprise">("basic");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [billingStatus, setBillingStatus] = useState<"paid" | "overdue" | "grace-period">("paid");
  const [nextDueDate, setNextDueDate] = useState("");
  const [showBillingAlert, setShowBillingAlert] = useState(false);
  const [showExpirationAlert, setShowExpirationAlert] = useState(false);
  const [activeModules, setActiveModules] = useState<string[]>([]);

  // States for deleting a hotel
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState<HotelMasterDoc | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // States for billing stats & custom alerts
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [outstandingAmount, setOutstandingAmount] = useState(0);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedHotelForAlert, setSelectedHotelForAlert] = useState<HotelMasterDoc | null>(null);
  const [customAlertMsg, setCustomAlertMsg] = useState("");
  const [isSavingAlert, setIsSavingAlert] = useState(false);

  // States for billing records (Invoice history)
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [selectedHotelForBilling, setSelectedHotelForBilling] = useState<HotelMasterDoc | null>(null);
  const [billingRecords, setBillingRecords] = useState<any[]>([]);
  const [loadingBillingRecords, setLoadingBillingRecords] = useState(false);

  // States for recording new payment
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPlan, setPaymentPlan] = useState<"basic" | "premium" | "enterprise">("basic");
  const [paymentCycle, setPaymentCycle] = useState<"monthly" | "yearly">("monthly");
  const [paymentPeriodStart, setPaymentPeriodStart] = useState("");
  const [paymentPeriodEnd, setPaymentPeriodEnd] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">("paid");
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // State for active invoice being printed
  const [activeInvoiceToPrint, setActiveInvoiceToPrint] = useState<any | null>(null);

  // States for global billing records
  const [globalBillingRecords, setGlobalBillingRecords] = useState<any[]>([]);
  const [loadingGlobalBilling, setLoadingGlobalBilling] = useState(false);

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/superadmin");
      } else if (user.role !== "superadmin") {
        router.push("/select-module");
      }
    }
  }, [user, authLoading, router]);

  // Real-time Firestore subscription to master hotels list
  useEffect(() => {
    if (!user || user.role !== "superadmin") return;

    const q = query(collection(db, "hotels"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const hotelList: HotelMasterDoc[] = [];
        snapshot.forEach((doc) => {
          hotelList.push(doc.data() as HotelMasterDoc);
        });
        setHotels(hotelList);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore read error:", err);
        setError("Gagal memuat daftar hotel.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Dynamically calculate billing stats when on billing tab
  useEffect(() => {
    if (activeMainTab === "billing" && hotels.length > 0) {
      const fetchAllBillingStats = async () => {
        setLoadingGlobalBilling(true);
        let revenueSum = 0;
        let outstandingSum = 0;
        const allRecords: any[] = [];
        
        for (const hotel of hotels) {
          try {
            const recordsCol = collection(db, "hotels", hotel.hotelCode, "billing_records");
            const snap = await getDocs(recordsCol);
            snap.forEach(d => {
              const data = d.data();
              allRecords.push({
                id: d.id,
                hotelCode: hotel.hotelCode,
                hotelName: hotel.name,
                hotelEmail: hotel.email,
                hotelPhone: hotel.phone,
                hotelAddress: hotel.address,
                ...data
              });
              if (data.status === "paid") {
                revenueSum += Number(data.amount || 0);
              } else if (data.status === "unpaid") {
                outstandingSum += Number(data.amount || 0);
              }
            });
          } catch (err) {
            console.error("Error fetching stats for hotel:", hotel.hotelCode, err);
          }
        }
        
        // Sort by createdAt descending
        allRecords.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        
        setGlobalBillingRecords(allRecords);
        setTotalRevenue(revenueSum);
        setOutstandingAmount(outstandingSum);
        setLoadingGlobalBilling(false);
      };
      
      fetchAllBillingStats();
    }
  }, [activeMainTab, hotels]);

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

  if (user?.role !== "superadmin") {
    return null; // Let the redirect trigger
  }

  // Handle active status toggle
  const handleToggleActive = async (hotel: HotelMasterDoc) => {
    try {
      setError("");
      setSuccessMsg("");
      const docRef = doc(db, "hotels", hotel.hotelCode);
      const newActive = !hotel.active;
      await updateDoc(docRef, {
        active: newActive,
        suspendedAt: newActive ? null : new Date().toISOString(),
      });
      setSuccessMsg(`Status hotel "${hotel.name}" berhasil diperbarui.`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError("Gagal merubah status hotel.");
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    const randomId = Math.floor(10000 + Math.random() * 90000).toString();
    setHotelCode(randomId);
    setName("");
    setDomain("");
    setSubdomain("");
    setAddress("");
    setPhone("");
    setEmail("");
    setPlan("custom");
    setActiveModules(["pos", "cpanel-only"]); // Default modules for basic/new hotel
    setCycle("monthly");
    setBillingStatus("paid");
    setNextDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setShowBillingAlert(false);
    setShowExpirationAlert(false);
    setIsModalOpen(true);
  };

  const openEditModal = (hotel: HotelMasterDoc) => {
    setIsEditing(true);
    setCurrentHotelCode(hotel.hotelCode);
    setHotelCode(hotel.hotelCode);
    setName(hotel.name);
    setDomain(hotel.domain || "");
    setSubdomain(hotel.subdomain || "");
    setAddress(hotel.address || "");
    setPhone(hotel.phone || "");
    setEmail(hotel.email || "");
    setPlan(hotel.billing?.plan || "custom");
    
    // Load activeModules
    let modules = hotel.billing?.activeModules || [];
    // Migrate old cpanel key to cpanel-full or cpanel-only
    if (modules.includes('cpanel')) {
      modules = modules.filter(m => m !== 'cpanel');
      if (hotel.billing?.plan === 'basic') {
        if (!modules.includes('cpanel-only')) modules.push('cpanel-only');
      } else {
        if (!modules.includes('cpanel-full')) modules.push('cpanel-full');
      }
    }
    if (modules.length === 0) {
      if ((hotel.billing?.plan || "basic") === "basic") {
        modules = ["pos", "cpanel-only"];
      } else {
        modules = ["pos", "front-office", "housekeeping", "food-beverage", "purchasing", "accounting", "cpanel-full"];
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


  // Handle submit form (Save/Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const code = hotelCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!code) {
      setError("Kode hotel tidak boleh kosong dan harus alphanumeric.");
      return;
    }

    try {
      // 1. Buat akun Auth & Dokumen User di Firestore jika email diisi
      let defaultPasswordInfo = "";
      if (email.trim()) {
        const registerRes = await fetch("/api/hotels/register-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: email.trim(), 
            hotelCode: isEditing ? currentHotelCode : code,
            hotelName: name.trim()
          }),
        });

        const registerData = await registerRes.json();
        if (!registerRes.ok) {
          setError(registerData.error || "Gagal mengautentikasi email admin.");
          return;
        }

        if (registerData.success) {
          const emailStatus = registerData.emailSent ? " & Email detail login telah dikirim!" : " (SMTP belum diset, email dilewati)";
          if (registerData.defaultPassword) {
            defaultPasswordInfo = ` User Admin dibuat (Password: ${registerData.defaultPassword})${emailStatus}`;
          } else {
            defaultPasswordInfo = ` User Admin ditautkan (Email sudah terdaftar)${emailStatus}`;
          }

          // 2. Buat dokumen user di sub-koleksi users_master milik hotel
          const userDocId = email.trim().toLowerCase().replace(/[@.]/g, "_");
          const userDocRef = doc(db, "hotels", isEditing ? currentHotelCode : code, "users_master", userDocId);
          await setDoc(userDocRef, {
            email: email.trim().toLowerCase(),
            name: `${name.trim()} Admin`,
            role: "admin",
            createdAt: new Date().toISOString(),
            permissions: {
              // Modules
              module_pos: true,
              module_front_office: true,
              module_housekeeping: true,
              module_food_beverage: true,
              module_purchasing: true,
              module_accounting: true,
              module_cpanel: true,
              
              // Submenus
              overview: true,
              forecast: true,
              invoice: true,
              pnl: true,
              logo: true,
              hero: true,
              "room-type": true,
              about: true,
              gallery: true,
              footer: true,
              attractions: true,
              promo: true,
              packages: true,
              seo: true,
              users: true,
              purchasing: true,
              "store-requisition": true,
              "purchase-requisition": true,
              "daily-market-list": true,
              "stock-opname": true,
              items: true,
              suppliers: true,
              "purchase-order": true,
              "food-beverage-product": true,

              // POS submenus
              pos_home: true,
              pos_lexupos: true,
              pos_cashier: true,
              pos_product: true,
              pos_records: true,
              pos_settings: true,
              pos_technologies: true,
            },
          }, { merge: true });
        }
      }

      // 3. Simpan data Master Hotel
      const docRef = doc(db, "hotels", isEditing ? currentHotelCode : code);
      const dataPayload = {
        hotelCode: isEditing ? currentHotelCode : code,
        name: name.trim(),
        domain: domain.trim(),
        subdomain: subdomain.trim() || `${code}.nexuracrs.com`,
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        billing: {
          plan,
          cycle,
          status: billingStatus,
          nextDueDate: nextDueDate ? new Date(nextDueDate).toISOString() : new Date().toISOString(),
          showBillingAlert,
          showExpirationAlert,
          activeModules,
        },

        ...(isEditing
          ? {}
          : {
              active: true,
              createdAt: new Date().toISOString(),
              suspendedAt: null,
            }),
      };

      await setDoc(docRef, dataPayload, { merge: true });
      
      setSuccessMsg(
        isEditing
          ? `Konfigurasi hotel "${name}" berhasil diubah.${defaultPasswordInfo}`
          : `Hotel baru "${name}" berhasil ditambahkan.${defaultPasswordInfo}`
      );
      
      setIsModalOpen(false);
      // Tampilkan notifikasi lebih lama jika mengandung password default agar user sempat mencatat
      setTimeout(() => setSuccessMsg(""), defaultPasswordInfo.includes("Password") ? 15000 : 4000);
    } catch (err: any) {
      console.error(err);
      setError("Gagal menyimpan data hotel.");
    }
  };

  const openDeleteConfirm = (hotel: HotelMasterDoc) => {
    setHotelToDelete(hotel);
    setDeleteConfirmInput("");
    setIsDeleteModalOpen(true);
  };

  const handleDeleteHotel = async () => {
    if (!hotelToDelete) return;
    if (deleteConfirmInput !== hotelToDelete.hotelCode) {
      setError("Kode hotel yang dimasukkan tidak cocok.");
      return;
    }

    setIsDeleting(true);
    setError("");
    setSuccessMsg("");

    try {
      const code = hotelToDelete.hotelCode;
      const subCollections = [
        "users_master",
        "roomTypes",
        "packages",
        "pos_orders",
        "daily_revenue",
        "revenue_transactions",
        "pos_products",
        "purchasing_counters",
        "items",
        "suppliers",
        "sections",
        "settings",
        "gallery",
        "attractions"
      ];

      // Hapus setiap sub-koleksi secara sekuensial/paralel
      for (const subCol of subCollections) {
        const colRef = collection(db, "hotels", code, subCol);
        const snapshot = await getDocs(colRef);
        
        // Hapus dokumen secara batch jika ada dokumen
        if (!snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.forEach((d) => {
            batch.delete(d.ref);
          });
          await batch.commit();
        }
      }

      // Hapus dokumen utama hotel
      const mainDocRef = doc(db, "hotels", code);
      await deleteDoc(mainDocRef);

      setSuccessMsg(`Hotel "${hotelToDelete.name}" beserta seluruh database operasionalnya berhasil dihapus secara permanen.`);
      setIsDeleteModalOpen(false);
      setHotelToDelete(null);
      setDeleteConfirmInput("");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      console.error("Error deleting hotel database:", err);
      setError("Gagal menghapus database hotel. Silakan coba lagi.");
    } finally {
      setIsDeleting(false);
    }
  };



  // Load billing records of a specific hotel
  const loadBillingRecords = async (code: string) => {
    setLoadingBillingRecords(true);
    try {
      const recordsCol = collection(db, "hotels", code, "billing_records");
      const q = query(recordsCol, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      setBillingRecords(list);
    } catch (e) {
      console.error("Error loading billing records:", e);
      setError("Gagal memuat riwayat pembayaran.");
    } finally {
      setLoadingBillingRecords(false);
    }
  };

  // Add new payment/invoice record
  const handleAddPaymentRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotelForBilling) return;

    setIsSavingPayment(true);
    try {
      const code = selectedHotelForBilling.hotelCode;
      const invoiceNum = `INV-${code}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
      const recordsCol = collection(db, "hotels", code, "billing_records");
      const recordDoc = doc(recordsCol, invoiceNum);

      const payload = {
        invoiceId: invoiceNum,
        amount: Number(paymentAmount),
        plan: paymentPlan,
        cycle: paymentCycle,
        status: paymentStatus,
        billingPeriodStart: paymentPeriodStart ? new Date(paymentPeriodStart).toISOString() : new Date().toISOString(),
        billingPeriodEnd: paymentPeriodEnd ? new Date(paymentPeriodEnd).toISOString() : new Date().toISOString(),
        paidAt: paymentStatus === "paid" ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
      };

      await setDoc(recordDoc, payload);

      // If paid, update the nextDueDate in the hotel's master billing document to match billingPeriodEnd!
      if (paymentStatus === "paid") {
        const hotelRef = doc(db, "hotels", code);
        await updateDoc(hotelRef, {
          "billing.nextDueDate": new Date(paymentPeriodEnd).toISOString(),
          "billing.status": "paid",
          "billing.showBillingAlert": false, // Clear billing alert since they paid
        });
      }

      setSuccessMsg("Rekapan pembayaran baru berhasil dicatat.");
      setIsAddPaymentOpen(false);
      setPaymentAmount("");
      
      // Reload billing records
      await loadBillingRecords(code);

      // Prepend to global records list
      setGlobalBillingRecords(prev => [
        {
          id: invoiceNum,
          invoiceId: invoiceNum,
          hotelCode: code,
          hotelName: selectedHotelForBilling.name,
          hotelEmail: selectedHotelForBilling.email,
          hotelPhone: selectedHotelForBilling.phone,
          hotelAddress: selectedHotelForBilling.address,
          ...payload
        },
        ...prev
      ]);

      // Adjust dynamic totals
      if (paymentStatus === "paid") {
        setTotalRevenue(prev => prev + Number(paymentAmount));
      } else {
        setOutstandingAmount(prev => prev + Number(paymentAmount));
      }
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      console.error(err);
      setError("Gagal menyimpan rekapan pembayaran.");
    } finally {
      setIsSavingPayment(false);
    }
  };

  // Toggle invoice status (paid vs unpaid)
  const handleTogglePaymentStatus = async (record: any) => {
    const code = record.hotelCode || selectedHotelForBilling?.hotelCode;
    if (!code) return;
    try {
      const docRef = doc(db, "hotels", code, "billing_records", record.id);
      const newStatus = record.status === "paid" ? "unpaid" : "paid";
      await updateDoc(docRef, {
        status: newStatus,
        paidAt: newStatus === "paid" ? new Date().toISOString() : null,
      });

      // If paid, update due date in hotel master
      if (newStatus === "paid") {
        const hotelRef = doc(db, "hotels", code);
        await updateDoc(hotelRef, {
          "billing.nextDueDate": record.billingPeriodEnd,
          "billing.status": "paid",
          "billing.showBillingAlert": false,
        });
      }

      setSuccessMsg("Status pembayaran invoice berhasil diperbarui.");
      
      if (selectedHotelForBilling) {
        await loadBillingRecords(code);
      }
      
      // Snappy UI state update for global list
      setGlobalBillingRecords(prev => prev.map(rec => {
        if (rec.id === record.id && rec.hotelCode === code) {
          return {
            ...rec,
            status: newStatus,
            paidAt: newStatus === "paid" ? new Date().toISOString() : null
          };
        }
        return rec;
      }));

      // Adjust dynamic totals
      if (newStatus === "paid") {
        setTotalRevenue(prev => prev + Number(record.amount || 0));
        setOutstandingAmount(prev => Math.max(0, prev - Number(record.amount || 0)));
      } else {
        setTotalRevenue(prev => Math.max(0, prev - Number(record.amount || 0)));
        setOutstandingAmount(prev => prev + Number(record.amount || 0));
      }

      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Gagal memperbarui status invoice.");
    }
  };

  // Send custom warning alert/banner message
  const handleSaveCustomAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotelForAlert) return;
    setIsSavingAlert(true);
    try {
      const code = selectedHotelForAlert.hotelCode;
      const docRef = doc(db, "hotels", code);
      await updateDoc(docRef, {
        "billing.alertMessage": customAlertMsg.trim() || null,
        "billing.showBillingAlert": customAlertMsg.trim() !== "",
      });
      setSuccessMsg(`Pesan alert kustom berhasil dikirim ke hotel "${selectedHotelForAlert.name}".`);
      setIsAlertModalOpen(false);
      setCustomAlertMsg("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setError("Gagal memperbarui pesan alert.");
    } finally {
      setIsSavingAlert(false);
    }
  };

  // Toggle expiration warning banner H-3
  const handleToggleExpirationAlert = async (hotel: HotelMasterDoc) => {
    try {
      const docRef = doc(db, "hotels", hotel.hotelCode);
      const currentVal = !!hotel.billing?.showExpirationAlert;
      await updateDoc(docRef, {
        "billing.showExpirationAlert": !currentVal,
      });
      setSuccessMsg(`Status warning banner hotel "${hotel.name}" diperbarui.`);
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (e) {
      console.error(e);
      setError("Gagal mengubah status warning banner.");
    }
  };

  // Toggle suspended overlay banner
  const handleToggleBillingAlert = async (hotel: HotelMasterDoc) => {
    try {
      const docRef = doc(db, "hotels", hotel.hotelCode);
      const currentVal = !!hotel.billing?.showBillingAlert;
      await updateDoc(docRef, {
        "billing.showBillingAlert": !currentVal,
      });
      setSuccessMsg(`Status pop-up penangguhan hotel "${hotel.name}" diperbarui.`);
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (e) {
      console.error(e);
      setError("Gagal mengubah status pop-up penangguhan.");
    }
  };

  // Print/Download invoice sheet
  const handlePrintInvoice = (record: any, hotel: HotelMasterDoc) => {
    setActiveInvoiceToPrint({
      ...record,
      hotelName: hotel.name,
      hotelEmail: hotel.email,
      hotelPhone: hotel.phone,
      hotelAddress: hotel.address,
    });
    // Trigger print
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Derive registry / billing stats from hotels list
  const totalHotels = hotels.length;
  const activeHotels = hotels.filter(h => h.active).length;
  const overdueHotels = hotels.filter(h => h.billing?.status === "overdue").length;

  return (
    <div className={styles.page}>
      
      {/* ===== Header ===== */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <Building2 size={32} />
            Superadmin CRS Portal
          </h1>
          <p className={styles.subtitle}>
            Registry terpusat, pengawasan billing, dan aktivasi sistem hotel.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/select-module")} className={styles.btnSecondary}>
            <Grid size={16} />
            Pilih Modul
          </button>
          <button onClick={openAddModal} className={styles.btnPrimary}>
            <Plus size={16} />
            Registrasi Hotel Baru
          </button>
        </div>
      </header>

      {/* ===== Status Messages ===== */}
      {error && (
        <div className={`${styles.alertBox} ${styles.alertBoxError}`}>
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className={`${styles.alertBox} ${styles.alertBoxSuccess}`}>
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ===== Tab Selection ===== */}
      <div className={styles.tabsContainer}>
        <button
          onClick={() => setActiveMainTab("registry")}
          className={`${styles.tabBtn} ${activeMainTab === "registry" ? styles.tabBtnActive : ""}`}
        >
          Registry Tenant
        </button>
        <button
          onClick={() => setActiveMainTab("billing")}
          className={`${styles.tabBtn} ${activeMainTab === "billing" ? styles.tabBtnActive : ""}`}
        >
          Central Billing
        </button>
      </div>

      {/* ===== KPI Cards (Dynamic depending on Tab) ===== */}
      {activeMainTab === "registry" ? (
        <section className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div>
              <div className={styles.kpiLabel}>Total Tenant</div>
              <div className={styles.kpiValue}>{totalHotels}</div>
            </div>
            <div className={styles.kpiIcon}>
              <Building2 size={20} />
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div>
              <div className={styles.kpiLabel}>Hotel Aktif</div>
              <div className={styles.kpiValue} style={{ color: "#15803d" }}>{activeHotels}</div>
            </div>
            <div className={styles.kpiIcon}>
              <CheckCircle size={20} style={{ color: "#15803d" }} />
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div>
              <div className={styles.kpiLabel}>Billing Overdue</div>
              <div className={styles.kpiValue} style={{ color: "#b91c1c" }}>{overdueHotels}</div>
            </div>
            <div className={styles.kpiIcon}>
              <ShieldAlert size={20} style={{ color: "#b91c1c" }} />
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div>
              <div className={styles.kpiLabel}>Total Pendapatan</div>
              <div className={styles.kpiValue} style={{ color: "#15803d" }}>
                Rp {totalRevenue.toLocaleString("id-ID")}
              </div>
            </div>
            <div className={styles.kpiIcon}>
              <CheckCircle size={20} style={{ color: "#15803d" }} />
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div>
              <div className={styles.kpiLabel}>Piutang Belum Lunas</div>
              <div className={styles.kpiValue} style={{ color: "#d9a441" }}>
                Rp {outstandingAmount.toLocaleString("id-ID")}
              </div>
            </div>
            <div className={styles.kpiIcon}>
              <Layers size={20} style={{ color: "#d9a441" }} />
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div>
              <div className={styles.kpiLabel}>Billing Overdue</div>
              <div className={styles.kpiValue} style={{ color: "#b91c1c" }}>{overdueHotels}</div>
            </div>
            <div className={styles.kpiIcon}>
              <ShieldAlert size={20} style={{ color: "#b91c1c" }} />
            </div>
          </div>
        </section>
      )}

      {/* ===== Registry Tab Content ===== */}
      {activeMainTab === "registry" && (
        <section className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>
              <Sparkles size={16} style={{ color: "#d9a441" }} />
              Registry Tenant CRS
            </h2>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHead}>
                  <th>Nama Hotel & Kode</th>
                  <th>Domain & Subdomain</th>
                  <th>Layanan & Billing</th>
                  <th>Status Langganan</th>
                  <th style={{ textAlign: "center" }}>Status Sistem</th>
                  <th style={{ textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {hotels.map((hotel) => (
                  <tr key={hotel.hotelCode}>
                    <td className={styles.tdPrimary}>
                      <div>{hotel.name}</div>
                      <div className={styles.tdMono} style={{ color: "var(--s-muted)", marginTop: "2px" }}>
                        Code: {hotel.hotelCode}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Globe size={14} style={{ color: "var(--s-muted)" }} />
                        <span>{hotel.domain || "-"}</span>
                      </div>
                      <div className={styles.tdMono} style={{ color: "var(--s-muted)", fontSize: "11px", marginTop: "2px" }}>
                        Sub: {hotel.subdomain || `${hotel.hotelCode}.nexuracrs.com`}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Layers size={14} style={{ color: "var(--s-muted)" }} />
                        <span className="capitalize font-medium text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                          Plan: {hotel.billing?.plan || "basic"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--s-muted)", marginTop: "4px" }}>
                        <Calendar size={14} />
                        <span>Due: {hotel.billing?.nextDueDate ? new Date(hotel.billing.nextDueDate).toLocaleDateString() : "-"}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          hotel.billing?.status === "paid"
                            ? styles.badgePaid
                            : hotel.billing?.status === "grace-period"
                            ? styles.badgeGrace
                            : styles.badgeOverdue
                        }`}
                      >
                        {hotel.billing?.status === "paid" && "Paid"}
                        {hotel.billing?.status === "grace-period" && "Grace Period"}
                        {hotel.billing?.status === "overdue" && "Overdue"}
                        {!hotel.billing?.status && "N/A"}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleToggleActive(hotel)}
                          className={`${styles.toggleBtn} ${
                            hotel.active ? styles.toggleActive : styles.toggleInactive
                          }`}
                        >
                          <span
                            className={`${styles.toggleKnob} ${
                              hotel.active ? styles.knobActive : styles.knobInactive
                            }`}
                          />
                        </button>
                        <span
                          className="font-bold"
                          style={{ fontSize: "10px", color: hotel.active ? "#15803d" : "#b91c1c" }}
                        >
                          {hotel.active ? "ACTIVE" : "SUSPENDED"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(hotel)}
                          className={styles.actionBtn}
                          title="Edit Konfigurasi"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(hotel)}
                          className={styles.actionBtn}
                          style={{ color: "#dc2626", borderColor: "rgba(220, 38, 38, 0.15)" }}
                          title="Hapus Hotel Secara Permanen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {hotels.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--s-muted)" }}>
                      Belum ada hotel terdaftar. Klik "Registrasi Hotel Baru" untuk memulai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ===== Central Billing Tab Content ===== */}
      {activeMainTab === "billing" && (
        <>
          <section className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h2 className={styles.tableTitle}>
              <Sparkles size={16} style={{ color: "#d9a441" }} />
              Daftar Billing & Jatuh Tempo Tenant
            </h2>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHead}>
                  <th>Properti Hotel</th>
                  <th>Subscription & Due Date</th>
                  <th>Status Billing</th>
                  <th style={{ textAlign: "center" }}>Warning Expiry (H-3)</th>
                  <th style={{ textAlign: "center" }}>Pop-up Suspend</th>
                  <th style={{ textAlign: "center" }}>Pesan Alert Kustom</th>
                  <th style={{ textAlign: "center" }}>Aksi Billing</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {hotels.map((hotel) => {
                  const daysLeft = hotel.billing?.nextDueDate
                    ? Math.ceil((new Date(hotel.billing.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;
                  
                  return (
                    <tr key={hotel.hotelCode}>
                      <td className={styles.tdPrimary}>
                        <div>{hotel.name}</div>
                        <div className={styles.tdMono} style={{ color: "var(--s-muted)", marginTop: "2px" }}>
                          Code: {hotel.hotelCode}
                        </div>
                      </td>
                      <td>
                        <span className="capitalize font-medium text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                          Plan: {hotel.billing?.plan || "basic"} ({hotel.billing?.cycle || "monthly"})
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: daysLeft !== null && daysLeft < 0 ? "#dc2626" : daysLeft !== null && daysLeft <= 3 ? "#d97706" : "var(--s-muted)", marginTop: "4px" }}>
                          <Calendar size={14} />
                          <span>Due: {hotel.billing?.nextDueDate ? new Date(hotel.billing.nextDueDate).toLocaleDateString("id-ID") : "-"}</span>
                          {daysLeft !== null && (
                            <span style={{ fontSize: "10px" }}>
                              ({daysLeft < 0 ? `Lewat ${Math.abs(daysLeft)} hari` : `${daysLeft} hari lagi`})
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            hotel.billing?.status === "paid"
                              ? styles.badgePaid
                              : hotel.billing?.status === "grace-period"
                              ? styles.badgeGrace
                              : styles.badgeOverdue
                          }`}
                        >
                          {hotel.billing?.status === "paid" && "Paid"}
                          {hotel.billing?.status === "grace-period" && "Grace Period"}
                          {hotel.billing?.status === "overdue" && "Overdue"}
                          {!hotel.billing?.status && "N/A"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => handleToggleExpirationAlert(hotel)}
                          className={`${styles.toggleBtn} ${
                            hotel.billing?.showExpirationAlert ? styles.toggleActive : styles.toggleInactive
                          }`}
                          style={{ margin: "0 auto" }}
                        >
                          <span
                            className={`${styles.toggleKnob} ${
                              hotel.billing?.showExpirationAlert ? styles.knobActive : styles.knobInactive
                            }`}
                          />
                        </button>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => handleToggleBillingAlert(hotel)}
                          className={`${styles.toggleBtn} ${
                            hotel.billing?.showBillingAlert ? styles.toggleActive : styles.toggleInactive
                          }`}
                          style={{ margin: "0 auto" }}
                        >
                          <span
                            className={`${styles.toggleKnob} ${
                              hotel.billing?.showBillingAlert ? styles.knobActive : styles.knobInactive
                            }`}
                          />
                        </button>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => {
                            setSelectedHotelForAlert(hotel);
                            setCustomAlertMsg(hotel.billing?.alertMessage || "");
                            setIsAlertModalOpen(true);
                          }}
                          className={styles.btnSecondary}
                          style={{ padding: "0 16px", height: "30px", fontSize: "12px", borderRadius: "var(--s-radius-sm)", whiteSpace: "nowrap" }}
                        >
                          {hotel.billing?.alertMessage ? "Edit Alert" : "Kirim Alert"}
                        </button>
                        {hotel.billing?.alertMessage && (
                          <div style={{ fontSize: "10px", color: "var(--s-muted)", marginTop: "4px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={hotel.billing.alertMessage}>
                            {hotel.billing.alertMessage}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedHotelForBilling(hotel);
                              loadBillingRecords(hotel.hotelCode);
                              setTimeout(() => {
                                document.getElementById("billing-history-section")?.scrollIntoView({ behavior: "smooth" });
                              }, 100);
                            }}
                            className={styles.btnPrimary}
                            style={{ padding: "0 16px", height: "30px", fontSize: "12px", borderRadius: "var(--s-radius-sm)", whiteSpace: "nowrap" }}
                          >
                            Kelola Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {hotels.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--s-muted)" }}>
                      Belum ada hotel terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===== Daftar Riwayat Pembayaran (Per Akun) ===== */}
        <section id="billing-history-section" className={styles.tableCard} style={{ marginTop: "32px" }}>
          <div className={styles.tableHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Receipt size={16} style={{ color: "#d9a441" }} />
              <h2 className={styles.tableTitle}>
                {selectedHotelForBilling 
                  ? `Riwayat Pembayaran & Invoice: ${selectedHotelForBilling.name}`
                  : "Riwayat Pembayaran & Invoice Tenant"}
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <span style={{ fontSize: "12px", color: "var(--s-muted)", fontWeight: "500" }}>Pilih Tenant:</span>
              <select
                value={selectedHotelForBilling?.hotelCode || ""}
                onChange={(e) => {
                  const hotel = hotels.find(h => h.hotelCode === e.target.value);
                  if (hotel) {
                    setSelectedHotelForBilling(hotel);
                    loadBillingRecords(hotel.hotelCode);
                  } else {
                    setSelectedHotelForBilling(null);
                    setBillingRecords([]);
                  }
                }}
                style={{ 
                  height: "32px", 
                  padding: "0 12px", 
                  fontSize: "12px", 
                  borderRadius: "6px", 
                  width: "200px", 
                  border: "1px solid var(--s-hairline)",
                  backgroundColor: "var(--s-canvas)",
                  color: "var(--s-ink)"
                }}
              >
                <option value="">-- Pilih Properti --</option>
                {hotels.map(h => (
                  <option key={h.hotelCode} value={h.hotelCode}>{h.name}</option>
                ))}
              </select>

              {selectedHotelForBilling && (
                <button
                  onClick={() => {
                    setPaymentAmount("");
                    setPaymentPlan(selectedHotelForBilling.billing?.plan || "basic");
                    setPaymentCycle(selectedHotelForBilling.billing?.cycle || "monthly");
                    setPaymentPeriodStart(new Date().toISOString().split("T")[0]);
                    setPaymentPeriodEnd(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
                    setPaymentStatus("paid");
                    setIsAddPaymentOpen(true);
                  }}
                  className={styles.btnPrimary}
                  style={{ height: "30px", fontSize: "12px", padding: "0 14px", borderRadius: "var(--s-radius-sm)" }}
                >
                  <Plus size={14} /> Catat Pembayaran
                </button>
              )}
            </div>
          </div>

          <div className={styles.tableWrapper}>
            {!selectedHotelForBilling ? (
              <div style={{ padding: "48px", textAlign: "center", color: "var(--s-muted)", fontSize: "13px" }}>
                Pilih properti hotel dari dropdown di atas atau klik tombol <strong>"Kelola Invoice"</strong> pada daftar billing untuk memuat riwayat pembayaran.
              </div>
            ) : loadingBillingRecords ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHead}>
                    <th>No. Invoice</th>
                    <th>Plan & Siklus</th>
                    <th>Periode Aktif</th>
                    <th>Nominal Tagihan</th>
                    <th style={{ textAlign: "center" }}>Status Pembayaran</th>
                    <th style={{ textAlign: "center" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {billingRecords.map((record) => (
                    <tr key={record.id}>
                      <td className={styles.tdMono} style={{ fontSize: "11px", fontWeight: "600" }}>
                        {record.invoiceId}
                      </td>
                      <td>
                        <span className="capitalize font-medium text-xs">
                          {record.plan} ({record.cycle})
                        </span>
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--s-muted)" }}>
                        {new Date(record.billingPeriodStart).toLocaleDateString("id-ID")} - {new Date(record.billingPeriodEnd).toLocaleDateString("id-ID")}
                      </td>
                      <td style={{ fontWeight: "600" }}>
                        Rp {Number(record.amount || 0).toLocaleString("id-ID")}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => handleTogglePaymentStatus(record)}
                          className={`${styles.badge} ${record.status === "paid" ? styles.badgePaid : styles.badgeOverdue}`}
                          style={{ border: "none", cursor: "pointer", margin: "0 auto" }}
                          title="Klik untuk mengubah status pembayaran"
                        >
                          {record.status === "paid" ? "Lunas" : "Belum Lunas"}
                        </button>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handlePrintInvoice(record, selectedHotelForBilling)}
                            className={styles.smallIconBtn}
                            title="Unduh / Cetak Invoice"
                          >
                            Cetak
                          </button>
                          <button
                            onClick={() => {
                              toast.success("Invoice terkirim!", {
                                description: `Invoice ${record.invoiceId} berhasil dikirim ke ${selectedHotelForBilling.email}`
                              });
                            }}
                            className={styles.smallIconBtn}
                            title="Kirim Invoice ke Email"
                          >
                            Kirim
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {billingRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--s-muted)" }}>
                        Belum ada riwayat pembayaran yang tercatat untuk hotel ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </>)}

      {/* ===== Add/Edit Hotel Modal ===== */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <header className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {isEditing ? `Edit Konfigurasi: ${name}` : "Registrasi Hotel Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className={styles.modalCloseBtn}>
                &times;
              </button>
            </header>

            <form onSubmit={handleSubmit} className={styles.modalBody}>
              <div className={styles.formGrid}>
                {/* Hotel Code */}
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Kode Hotel (ID Unik)</label>
                  <input
                    type="text"
                    required
                    disabled={true}
                    placeholder="Auto-generated 5-digit ID"
                    value={hotelCode}
                    className={styles.formInput}
                  />
                </div>

                {/* Hotel Name */}
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Nama Hotel</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Bumi Anyom Resort"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                {/* Custom Domain */}
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Domain Utama Custom</label>
                  <input
                    type="text"
                    placeholder="misal: resort.bumianyom.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                {/* Subdomain */}
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Subdomain CRS Cadangan</label>
                  <input
                    type="text"
                    placeholder="Auto: {kode-hotel}.nexuracrs.com"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                {/* Email */}
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Email Kontak</label>
                  <input
                    type="email"
                    placeholder="email@hotel.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                {/* Phone */}
                <div className={styles.formField}>
                  <label className={styles.formLabel}>No. Telepon</label>
                  <input
                    type="text"
                    placeholder="+62..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
              </div>

              {/* Address */}
              <div className={styles.formGridFull}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Alamat Lengkap</label>
                  <textarea
                    placeholder="Alamat lengkap hotel..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={styles.formTextarea}
                  />
                </div>
              </div>

              <div className={styles.modalDivider} />

              <div className={styles.formGrid}>
                {/* Cycle */}
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Siklus Tagihan</label>
                  <select
                    value={cycle}
                    onChange={(e) => setCycle(e.target.value as any)}
                    className={styles.formSelect}
                  >
                    <option value="monthly">Bulanan (Monthly)</option>
                    <option value="yearly">Tahunan (Yearly)</option>
                  </select>
                </div>

                {/* Billing Status */}
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Status Tagihan</label>
                  <select
                    value={billingStatus}
                    onChange={(e) => setBillingStatus(e.target.value as any)}
                    className={styles.formSelect}
                  >
                    <option value="paid">Paid (Lunas)</option>
                    <option value="grace-period">Grace Period (Masa Tenggang)</option>
                    <option value="overdue">Overdue (Nunggak)</option>
                  </select>
                </div>

                {/* Due Date */}
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Tanggal Jatuh Tempo Berikutnya</label>
                  <input
                    type="date"
                    required
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
              </div>

              {/* Active Modules Configuration */}
              <div className={styles.formGridFull} style={{ marginTop: "16px", marginBottom: "16px" }}>
                <div className={styles.formField}>
                  <label className={styles.formLabel} style={{ marginBottom: "12px", fontWeight: "bold" }}>Modul Aktif Tenant</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/10">
                    {[
                      { id: "pos", label: "Point of Sales (POS)" },
                      { id: "front-office", label: "Front Office" },
                      { id: "housekeeping", label: "Housekeeping" },
                      { id: "food-beverage", label: "Food & Beverage" },
                      { id: "purchasing", label: "Purchasing" },
                      { id: "accounting", label: "Accounting" },
                      { id: "cpanel-only", label: "CPanel Only (User & Logo)" },
                      { id: "cpanel-full", label: "CPanel Full (Landing Page)" }
                    ].map((mod) => (
                      <label key={mod.id} className="flex items-center gap-2.5 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={activeModules.includes(mod.id)}
                          onChange={(e) => {
                            let updated = [...activeModules];
                            if (e.target.checked) {
                              updated.push(mod.id);
                              if (mod.id === "cpanel-only") {
                                updated = updated.filter((id) => id !== "cpanel-full");
                              } else if (mod.id === "cpanel-full") {
                                updated = updated.filter((id) => id !== "cpanel-only");
                              }
                            } else {
                              updated = updated.filter((id) => id !== mod.id);
                            }
                            setActiveModules(updated);
                          }}
                          style={{ width: "16px", height: "16px", cursor: "pointer" }}
                        />
                        <span className="text-neutral-700 dark:text-neutral-300 font-medium">{mod.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>



              <div className={styles.formGrid} style={{ marginTop: "12px" }}>
                {/* Show Billing Alert Toggle */}
                <div className={styles.formField} style={{ flexDirection: "row", alignItems: "center", gap: "10px", padding: "8px 0" }}>
                  <input
                    type="checkbox"
                    id="showBillingAlert"
                    checked={showBillingAlert}
                    onChange={(e) => setShowBillingAlert(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="showBillingAlert" className={styles.formLabel} style={{ cursor: "pointer", textTransform: "none", fontSize: "12px", fontWeight: "normal" }}>
                    Aktifkan Pop-up Tagihan (Lunas Diperlukan)
                  </label>
                </div>

                {/* Show Expiration Alert Toggle */}
                <div className={styles.formField} style={{ flexDirection: "row", alignItems: "center", gap: "10px", padding: "8px 0" }}>
                  <input
                    type="checkbox"
                    id="showExpirationAlert"
                    checked={showExpirationAlert}
                    onChange={(e) => setShowExpirationAlert(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <label htmlFor="showExpirationAlert" className={styles.formLabel} style={{ cursor: "pointer", textTransform: "none", fontSize: "12px", fontWeight: "normal" }}>
                    Aktifkan Peringatan Masa Aktif (H-3)
                  </label>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.btnSecondary}
                >
                  Batal
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Delete Confirmation Modal ===== */}
      {isDeleteModalOpen && hotelToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: "480px" }}>
            <header className={styles.modalHeader} style={{ backgroundColor: "#fef2f2" }}>
              <h3 className={styles.modalTitle} style={{ color: "#991b1b", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={20} />
                Tindakan Sangat Destruktif!
              </h3>
              <button onClick={() => { setIsDeleteModalOpen(false); setHotelToDelete(null); }} className={styles.modalCloseBtn}>
                &times;
              </button>
            </header>

            <div className={styles.modalBody} style={{ padding: "24px" }}>
              <p className="text-sm font-semibold text-neutral-800 dark:text-white mb-2">
                Apakah Anda benar-benar yakin ingin menghapus hotel secara permanen?
              </p>
              
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-xl p-4 mb-4 text-xs text-rose-800 dark:text-rose-450 space-y-1">
                <p className="font-bold">Hotel yang akan dihapus:</p>
                <p className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
                  [{hotelToDelete.hotelCode}] {hotelToDelete.name}
                </p>
                <p className="mt-2 text-rose-700 dark:text-rose-400">
                  Tindakan ini akan **menghapus secara permanen** seluruh database transaksi operasional, POS orders, data user admin, stok barang, tipe kamar, serta konfigurasi landing page dari database Firestore. Tindakan ini **TIDAK DAPAT DIBATALKAN**.
                </p>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel} style={{ textTransform: "none", fontSize: "11px", fontWeight: "bold", color: "#991b1b" }}>
                  Ketik kode hotel <span className="font-mono font-bold">"{hotelToDelete.hotelCode}"</span> untuk mengonfirmasi:
                </label>
                <input
                  type="text"
                  placeholder="Masukkan kode hotel di sini"
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  disabled={isDeleting}
                  className={styles.formInput}
                  style={{ borderColor: deleteConfirmInput === hotelToDelete.hotelCode ? "#22c55e" : "var(--s-hairline)" }}
                />
              </div>
            </div>

            <div className={styles.modalFooter} style={{ padding: "16px 24px" }}>
              <button
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setHotelToDelete(null); }}
                disabled={isDeleting}
                className={styles.btnSecondary}
                style={{ height: "38px" }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteHotel}
                disabled={isDeleting || deleteConfirmInput !== hotelToDelete.hotelCode}
                className={styles.btnPrimary}
                style={{
                  height: "38px",
                  backgroundColor: deleteConfirmInput === hotelToDelete.hotelCode ? "#dc2626" : "rgba(220, 38, 38, 0.4)",
                  color: "#ffffff",
                  cursor: deleteConfirmInput === hotelToDelete.hotelCode ? "pointer" : "not-allowed"
                }}
              >
                {isDeleting ? "Menghapus Database..." : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Custom Alert Modal ===== */}
      {isAlertModalOpen && selectedHotelForAlert && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: "480px" }}>
            <header className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Kirim Alert Kustom: {selectedHotelForAlert.name}</h3>
              <button onClick={() => { setIsAlertModalOpen(false); setSelectedHotelForAlert(null); }} className={styles.modalCloseBtn}>
                &times;
              </button>
            </header>
            <form onSubmit={handleSaveCustomAlert} className={styles.modalBody}>
              <div className={styles.formGridFull}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Pesan Peringatan Kustom (Tampil di Dashboard Hotel)</label>
                  <textarea
                    required
                    placeholder="Contoh: Tagihan langganan Anda jatuh tempo dalam 2 hari. Segera lakukan pembayaran untuk mencegah penangguhan layanan."
                    value={customAlertMsg}
                    onChange={(e) => setCustomAlertMsg(e.target.value)}
                    className={styles.formTextarea}
                    style={{ minHeight: "120px" }}
                  />
                  <p style={{ fontSize: "11px", color: "var(--s-muted)", marginTop: "4px" }}>
                    Catatan: Mengisi pesan ini secara otomatis mengaktifkan Pop-up Alert tagihan di dashboard hotel. Kosongkan untuk menonaktifkan banner/pop-up kustom.
                  </p>
                </div>
              </div>
              <div className={styles.modalFooter} style={{ padding: "16px 0 0 0", borderTop: "1px solid var(--s-hairline)", background: "transparent" }}>
                <button
                  type="button"
                  onClick={() => { setIsAlertModalOpen(false); setSelectedHotelForAlert(null); }}
                  className={styles.btnSecondary}
                >
                  Batal
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isSavingAlert}>
                  {isSavingAlert ? "Mengirim..." : "Kirim Alert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isAddPaymentOpen && selectedHotelForBilling && (
        <div className={styles.modalOverlay} style={{ zIndex: 600 }}>
          <div className={styles.modal} style={{ maxWidth: "540px" }}>
            <header className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Catat Pembayaran Baru: {selectedHotelForBilling.name}</h3>
              <button onClick={() => setIsAddPaymentOpen(false)} className={styles.modalCloseBtn}>
                &times;
              </button>
            </header>
            <form onSubmit={handleAddPaymentRecord} className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Nominal Pembayaran (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="misal: 1500000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Status Pembayaran</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className={styles.formSelect}
                  >
                    <option value="paid">Lunas (Paid)</option>
                    <option value="unpaid">Belum Lunas (Unpaid)</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Plan Layanan</label>
                  <select
                    value={paymentPlan}
                    onChange={(e) => setPaymentPlan(e.target.value as any)}
                    className={styles.formSelect}
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Siklus Tagihan</label>
                  <select
                    value={paymentCycle}
                    onChange={(e) => setPaymentCycle(e.target.value as any)}
                    className={styles.formSelect}
                  >
                    <option value="monthly">Bulanan (Monthly)</option>
                    <option value="yearly">Tahunan (Yearly)</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Mulai Masa Aktif</label>
                  <input
                    type="date"
                    required
                    value={paymentPeriodStart}
                    onChange={(e) => setPaymentPeriodStart(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Jatuh Tempo (Akhir Masa Aktif)</label>
                  <input
                    type="date"
                    required
                    value={paymentPeriodEnd}
                    onChange={(e) => setPaymentPeriodEnd(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
              </div>
              <div className={styles.modalFooter} style={{ padding: "16px 0 0 0", borderTop: "1px solid var(--s-hairline)", background: "transparent" }}>
                <button
                  type="button"
                  onClick={() => setIsAddPaymentOpen(false)}
                  className={styles.btnSecondary}
                >
                  Batal
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isSavingPayment}>
                  {isSavingPayment ? "Menyimpan..." : "Simpan Pembayaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Print Invoice Layout (Visible only during print) ===== */}
      {activeInvoiceToPrint && (
        <div className={styles.printInvoiceContainer}>
          <div className={styles.printHeader}>
            <div>
              <span className={styles.printLogo}>Nexura Global Hospitality</span>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#666" }}>Central Reservation System Billing</p>
            </div>
            <div className={styles.printMeta}>
              <h3 className={styles.printInvoiceTitle}>INVOICE</h3>
              <p style={{ margin: "4px 0" }}>Nomor: {activeInvoiceToPrint.invoiceId}</p>
              <p style={{ margin: "4px 0" }}>Tanggal: {new Date(activeInvoiceToPrint.createdAt).toLocaleDateString("id-ID")}</p>
            </div>
          </div>

          <div className={styles.printBillingDetails}>
            <div className={styles.printDetailBlock}>
              <h4>Diterbitkan Oleh:</h4>
              <strong>Nexura Finance Department</strong>
              <p>Email: billing@nexuraglobal.com</p>
              <p>Gedung Nexura Central, Jakarta</p>
            </div>
            <div className={styles.printDetailBlock}>
              <h4>Ditagihkan Kepada:</h4>
              <strong>{activeInvoiceToPrint.hotelName}</strong>
              <p>Email: {activeInvoiceToPrint.hotelEmail || "-"}</p>
              <p>Telp: {activeInvoiceToPrint.hotelPhone || "-"}</p>
              <p>{activeInvoiceToPrint.hotelAddress || "-"}</p>
            </div>
          </div>

          <table className={styles.printTable}>
            <thead>
              <tr>
                <th>Deskripsi Layanan</th>
                <th>Siklus</th>
                <th>Masa Aktif</th>
                <th style={{ textAlign: "right" }}>Total Biaya</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Layanan Multi-Hotel CRS Cloud Workspace - Plan: {activeInvoiceToPrint.plan}</td>
                <td style={{ textTransform: "capitalize" }}>{activeInvoiceToPrint.cycle}</td>
                <td>
                  {new Date(activeInvoiceToPrint.billingPeriodStart).toLocaleDateString("id-ID")} s/d {new Date(activeInvoiceToPrint.billingPeriodEnd).toLocaleDateString("id-ID")}
                </td>
                <td style={{ textAlign: "right", fontWeight: "bold" }}>
                  Rp {Number(activeInvoiceToPrint.amount).toLocaleString("id-ID")}
                </td>
              </tr>
            </tbody>
          </table>

          <div className={styles.printTotalRow}>
            Total Pembayaran: Rp {Number(activeInvoiceToPrint.amount).toLocaleString("id-ID")}
          </div>

          <div className={styles.printFooter}>
            <p>Terima kasih atas kerja sama Anda bersama Nexura Global Hospitality.</p>
            <p>Invoice ini sah diterbitkan secara elektronik oleh Nexura CRS Central Billing.</p>
          </div>
        </div>
      )}
    </div>
  );
}
