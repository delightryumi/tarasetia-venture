"use client";

import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import styles from "./InstallAppButton.module.css";

import { toast } from "sonner";

export const InstallAppButton = ({ 
  appName = "Tara App", 
  variant = "secondary" 
}: { 
  appName?: string; 
  variant?: "secondary" | "on-dark" 
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if it was captured globally before this component mounted
    if (typeof window !== "undefined" && (window as any).deferredPWAInstallPrompt) {
      setDeferredPrompt((window as any).deferredPWAInstallPrompt);
    }

    // Tangkap event instalasi PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log(`[PWA] beforeinstallprompt fired for: ${appName}`);
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPWAInstallPrompt = e;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [appName]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Cek jika app sudah terinstal via standalone display mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      
      if (isStandalone) {
        toast.success(`Aplikasi ${appName} sudah terpasang dan sedang berjalan secara mandiri.`);
      } else {
        toast.info(
          `Untuk memasang ${appName}:\n` +
          `1. Di Chrome/Edge: Klik ikon instalasi (layar komputer + tanda panah) di sebelah kanan address bar browser Anda.\n` +
          `2. Di Safari (iOS): Klik tombol Share (Bagikan) lalu pilih 'Add to Home Screen' (Tambah ke Layar Utama).`,
          { duration: 8000 }
        );
      }
    }
  };

  const buttonClass = `${styles.button} ${variant === "on-dark" ? styles.onDark : styles.secondary}`;

  return (
    <div className={styles.container}>
      <button
        onClick={handleInstallClick}
        type="button"
        className={buttonClass}
      >
        <Download size={16} strokeWidth={2.5} className={styles.icon} />
        <span>Install {appName}</span>
      </button>
    </div>
  );
};
