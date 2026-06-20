"use client";

import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import styles from "./InstallAppButton.module.css";

export const InstallAppButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Tangkap event instalasi PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Aplikasi PWA ini sudah terinstal, atau browser Anda tidak mendukung.");
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className={styles.container}>
      <button
        onClick={handleInstallClick}
        type="button"
        className={styles.button}
      >
        <Download size={16} strokeWidth={2.5} className={styles.icon} />
        <span>Install Tara App</span>
      </button>
    </div>
  );
};
