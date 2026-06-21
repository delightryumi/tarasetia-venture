import React, { useState } from "react";
import { X, Search, Building2, Save, AlertCircle } from "lucide-react";
import { HotelMasterDoc } from "./types";
import styles from "./superadmin.module.css";
import { toast } from "sonner";

interface MergeAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotels: HotelMasterDoc[];
  initialEmail?: string;
}

export const MergeAccessModal: React.FC<MergeAccessModalProps> = ({
  isOpen,
  onClose,
  hotels,
  initialEmail = "",
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Update email if initialEmail changes and fetch existing allowedOutlets
  React.useEffect(() => {
    setEmail(initialEmail);
    setSelectedOutlets([]);
    
    if (isOpen && initialEmail) {
      setIsLoading(true);
      fetch(`/api/hotels/merge-access?email=${encodeURIComponent(initialEmail)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.allowedOutlets && Array.isArray(data.allowedOutlets)) {
            setSelectedOutlets(data.allowedOutlets);
          }
        })
        .catch((err) => console.error("Failed to fetch allowed outlets:", err))
        .finally(() => setIsLoading(false));
    }
  }, [initialEmail, isOpen]);

  if (!isOpen) return null;

  const filteredHotels = hotels.filter((h) =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.hotelCode.includes(searchQuery)
  );

  const handleToggleOutlet = (code: string) => {
    setSelectedOutlets((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSave = async () => {
    if (!email.trim()) {
      toast.error("Email Owner wajib diisi!");
      return;
    }

    if (selectedOutlets.length === 0) {
      toast.error("Minimal harus ada 1 cabang yang diizinkan untuk akun ini. Jika ingin memisahkan akun, biarkan 1 cabang asli tetap tercentang.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/hotels/merge-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, selectedOutlets }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui akses");

      const successMsg = selectedOutlets.length === 1 
        ? "Akses berhasil dipisahkan! Akun kembali ke 1 cabang utama." 
        : (data.message || "Akses berhasil diperbarui!");
        
      toast.success(successMsg);
      setEmail("");
      setSelectedOutlets([]);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: "600px", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Gabungkan Akses Bisnis</h3>
            <p className="text-sm text-neutral-500 mt-1 font-medium" style={{ margin: 0, fontWeight: "normal", fontSize: "14px", color: "#6b7280" }}>
              Berikan akses multi-cabang ke satu email Owner.
            </p>
          </div>
          <button onClick={onClose} className={styles.modalCloseBtn}>
            &times;
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody} style={{ padding: "24px 32px" }}>
          
          <div className={styles.formField} style={{ marginBottom: "24px" }}>
            <label className={styles.formLabel}>
              Email Akun Owner <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Contoh: owner@bisnis.com"
              className={styles.formInput}
              disabled={isLoading}
            />
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px", display: "flex", alignItems: "flex-start", gap: "6px" }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
              Pastikan email ini sudah pernah diregistrasikan di salah satu cabang sebelumnya.
            </p>
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>Pilih Cabang / Bisnis yang Diizinkan</label>
            <div style={{ position: "relative", marginTop: "8px", marginBottom: "12px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama bisnis atau kode..."
                className={styles.formInput}
                style={{ paddingLeft: "36px" }}
                disabled={isLoading}
              />
            </div>

            <div style={{ border: "1px solid var(--s-border)", borderRadius: "8px", overflow: "hidden", backgroundColor: "var(--s-surface-soft)" }}>
              <div style={{ maxHeight: "250px", overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {filteredHotels.length === 0 ? (
                  <p style={{ fontSize: "14px", textAlign: "center", color: "#6b7280", padding: "16px 0" }}>Tidak ada bisnis ditemukan.</p>
                ) : (
                  filteredHotels.map((hotel) => (
                    <label
                      key={hotel.hotelCode}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                        backgroundColor: selectedOutlets.includes(hotel.hotelCode) ? "#8d7a521a" : "transparent"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedOutlets.includes(hotel.hotelCode)}
                        onChange={() => handleToggleOutlet(hotel.hotelCode)}
                        disabled={isLoading}
                        style={{ width: "16px", height: "16px", accentColor: "#8d7a52", cursor: "pointer" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--s-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Building2 size={14} color="#6b7280" />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--s-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {hotel.name}
                          </span>
                          <span style={{ fontSize: "11px", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            Kode: {hotel.hotelCode} • {hotel.domain}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
            
            <div style={{ marginTop: "8px", fontSize: "12px", fontWeight: 600, color: "#8d7a52" }}>
              {selectedOutlets.length} bisnis dipilih
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnSecondary} disabled={isLoading}>
            Batal
          </button>
          <button onClick={handleSave} className={styles.btnPrimary} disabled={isLoading}>
            {isLoading ? "Menyimpan..." : (
              <>
                <Save size={16} /> Simpan Akses
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
