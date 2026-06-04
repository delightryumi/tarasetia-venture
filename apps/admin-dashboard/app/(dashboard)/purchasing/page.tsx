'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Package, Users, FileText, ShoppingCart, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useItems } from '@/hooks/purchasing/useItems';
import { useSuppliers } from '@/hooks/purchasing/useSuppliers';
import { useStoreRequisition } from '@/hooks/purchasing/useStoreRequisition';
import { usePurchaseRequisition } from '@/hooks/purchasing/usePurchaseRequisition';
import { useDailyMarketList } from '@/hooks/purchasing/useDailyMarketList';
import { formatRupiah } from '@/lib/purchasing/utils';
import { PStatusChip } from '@/components/purchasing/ui/PStatusChip';
import { PButton } from '@/components/purchasing/ui/PButton';
import styles from './page.module.css';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as any } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function PurchasingOverviewPage() {
  const { items, loading: itemsLoading } = useItems();
  const { suppliers } = useSuppliers();
  const { srs } = useStoreRequisition();
  const { prs } = usePurchaseRequisition();
  const { dmls } = useDailyMarketList();

  const lowStockItems = useMemo(
    () => items.filter(i => i.current_stock <= i.min_stock && i.is_active),
    [items]
  );

  const pendingCount = useMemo(
    () => srs.filter(s => s.status === 'submitted').length + prs.filter(p => p.status === 'submitted').length,
    [srs, prs]
  );

  const recentPRs = useMemo(
    () => [...prs].sort((a, b) => ((b.created_at?.seconds ?? 0) - (a.created_at?.seconds ?? 0))).slice(0, 5),
    [prs]
  );

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Purchasing</h1>
          <p className={styles.subtitle}>Ikhtisar aktivitas pengadaan, tingkat stok, dan persetujuan tertunda.</p>
        </div>
        <Link href="/purchasing/store-requisition">
          <PButton>Store Requisition Baru</PButton>
        </Link>
      </div>

      {/* ── Low Stock Alert Banner (Coral Signature Card) ── */}
      {lowStockItems.length > 0 && (
        <motion.div variants={fadeUp} className={styles.alertCard}>
          <div className={styles.alertCardTitle}>
            {lowStockItems.length} barang di bawah stok minimum
          </div>
          <div className={styles.alertCardBody}>
            Barang-barang ini perlu ditambah. Buat Store Requisition atau Purchase Requisition untuk memesan kembali.
          </div>
          <Link href="/purchasing/items?filter=low-stock">
            <PButton variant="secondary" size="sm">Lihat Master Barang</PButton>
          </Link>
        </motion.div>
      )}

      {/* ── KPI Cards ── */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className={styles.kpiGrid}>
        <motion.div variants={fadeUp} className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total Barang</div>
          <div className={styles.kpiValue}>{items.length}</div>
          <div className={styles.kpiMeta}>
            {lowStockItems.length > 0 ? (
              <span className={styles.kpiAlert}>{lowStockItems.length} stok rendah</span>
            ) : (
              'Semua terstok'
            )}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Supplier</div>
          <div className={styles.kpiValue}>{suppliers.length}</div>
          <div className={styles.kpiMeta}>{suppliers.filter(s => s.is_active).length} aktif</div>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Persetujuan Tertunda</div>
          <div className={styles.kpiValue}>{pendingCount}</div>
          <div className={styles.kpiMeta}>
            {srs.filter(s => s.status === 'submitted').length} SR ·{' '}
            {prs.filter(p => p.status === 'submitted').length} PR
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.kpiCardDark}>
          <div className={styles.kpiLabel}>DML Aktif</div>
          <div className={styles.kpiValue}>{dmls.filter(d => d.status !== 'received').length}</div>
          <div className={styles.kpiMeta}>Daily market list terbuka</div>
        </motion.div>
      </motion.div>

      {/* ── Body Grid ── */}
      <div className={styles.bodyGrid}>
        {/* Recent Purchase Requisitions */}
        <motion.div variants={fadeUp} className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Purchase Requisition Terbaru</span>
            <Link href="/purchasing/purchase-requisition" className={styles.sectionLink}>Lihat semua</Link>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>Nomor PR</th>
                  <th>Supplier</th>
                  <th style={{ textAlign: 'right' }}>Est. Biaya</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {recentPRs.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className={styles.empty}>
                        <p className={styles.emptyText}>Belum ada purchase requisition.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentPRs.map(pr => {
                    const suppliers = Array.from(new Set((pr.items ?? []).map((i: any) => i.supplier_name))).filter(Boolean);
                    return (
                      <tr key={pr.id}>
                        <td className={styles.tdPrimary}>{pr.pr_number}</td>
                        <td className={styles.tdMuted}>{suppliers.join(', ') || '—'}</td>
                        <td className={`${styles.tdRight}`}>{formatRupiah(pr.total_estimated)}</td>
                        <td><PStatusChip status={pr.status} /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Low Stock Items */}
        <motion.div variants={fadeUp} className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Barang Stok Rendah</span>
            <Link href="/purchasing/items?filter=low-stock" className={styles.sectionLink}>Kelola</Link>
          </div>
          <div className={styles.stockList}>
            {lowStockItems.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyText}>Semua barang terstok dengan cukup.</p>
              </div>
            ) : (
              lowStockItems.slice(0, 8).map(item => (
                <div key={item.id} className={styles.stockRow}>
                  <div>
                    <div className={styles.stockName}>{item.name}</div>
                    <div className={styles.stockMeta}>{item.category} · Min: {item.min_stock} {item.unit}</div>
                  </div>
                  <div className={styles.stockQty}>{item.current_stock} {item.unit}</div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
