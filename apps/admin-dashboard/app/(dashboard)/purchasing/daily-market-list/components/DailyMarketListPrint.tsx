'use client';

import React from 'react';
import { formatRupiah } from '@/lib/purchasing/utils';
import s from '../../PurchasingPrint.module.css';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';

interface DailyMarketListPrintProps {
  selectedDml: any;
}

export default function DailyMarketListPrint({ selectedDml }: DailyMarketListPrintProps) {
  if (!selectedDml) return null;

  const { branding, property, pos } = useSettings();
  const { activeHotelName } = useAuth();
  const hotelInfo = property || pos;
  const logoSrc = branding?.lightLogo || branding?.logoUrl || branding?.darkLogo;
  const partnerName = hotelInfo?.name || activeHotelName || 'HOTEL & RESORT';

  const formatDate = (val: any) => {
    if (!val) return '—';
    if (val?.toDate) {
      return val.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return `${s.printStatusPill} ${s.printStatusApproved}`;
      case 'submitted': return `${s.printStatusPill} ${s.printStatusSubmitted}`;
      default: return `${s.printStatusPill} ${s.printStatusDraft}`;
    }
  };

  return (
    <div className={s.printArea}>
      {/* ── Document Header ── */}
      <div className={s.printHeader}>
        <div className={s.printHeaderLeft}>
          {logoSrc ? (
            <img src={logoSrc} alt="Logo" className={s.printLogo} />
          ) : (
            <div className={s.printCompany}>{partnerName}</div>
          )}
          {hotelInfo?.address && <div className={s.printCompanyAddr}>{hotelInfo.address}</div>}
          {(hotelInfo?.phone || hotelInfo?.email) && (
            <div className={s.printCompanyAddr}>
              {hotelInfo.phone && <span>Telp: {hotelInfo.phone}</span>}
              {hotelInfo.phone && hotelInfo.email && <span> · </span>}
              {hotelInfo.email && <span>Email: {hotelInfo.email}</span>}
            </div>
          )}
        </div>

        <div className={s.printHeaderRight}>
          <div className={s.printDocBadge}>Official Procurement</div>
          <h1 className={s.printDocTitle}>Daily Market List</h1>
          <div className={s.printDocSubTitle}>Daftar Belanja Pasar & Segar Harian</div>
          <div className={s.printDocNumBox}>
            <span className={s.printDocNumLabel}>NO DML:</span>
            <span className={s.printDocNumValue}>{selectedDml.dml_number}</span>
          </div>
        </div>
      </div>

      {/* ── Metadata Grid ── */}
      <div className={s.printMetaGrid}>
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Tanggal Order</div>
          <div className={s.printMetaValue}>{formatDate(selectedDml.order_date || selectedDml.date)}</div>
        </div>
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Tanggal Pengiriman</div>
          <div className={s.printMetaValue}>{formatDate(selectedDml.delivery_date)}</div>
        </div>
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Departemen</div>
          <div className={s.printMetaValue}>{selectedDml.department || 'Food & Beverage'}</div>
        </div>
        {(!selectedDml.department || selectedDml.department === 'Food & Beverage') && (
          <>
            <div className={s.printMetaItem}>
              <div className={s.printMetaLabel}>Kategori (F&B)</div>
              <div className={s.printMetaValue}>{selectedDml.fb_category || 'Food'}</div>
            </div>
            <div className={s.printMetaItem}>
              <div className={s.printMetaLabel}>Tipe Layanan / Outlet</div>
              <div className={s.printMetaValue}>{selectedDml.event_category || 'A la Carte'}</div>
            </div>
          </>
        )}
        <div className={s.printMetaItem}>
          <div className={s.printMetaLabel}>Status Dokumen</div>
          <div>
            <span className={getStatusClass(selectedDml.status)}>
              {selectedDml.status || 'Draft'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Items Table ── */}
      <table className={s.printTable}>
        <thead>
          <tr>
            <th style={{ width: 36, textAlign: 'center' }}>NO</th>
            <th>NAMA BARANG & SPESIFIKASI</th>
            <th style={{ width: 64, textAlign: 'center' }}>SATUAN</th>
            <th style={{ width: 70, textAlign: 'right' }}>JUMLAH</th>
            <th style={{ width: 110, textAlign: 'right' }}>HARGA SATUAN</th>
            <th style={{ width: 120, textAlign: 'right' }}>TOTAL ESTIMASI</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            const itemsList = (selectedDml.items || []) as any[];
            const grouped: Record<string, any[]> = {};
            itemsList.forEach(item => { 
              const cat = item.category || 'Dry Goods & Groceries'; 
              if (!grouped[cat]) grouped[cat] = []; 
              grouped[cat].push(item); 
            });
            let counter = 0;
            const categories = Object.keys(grouped).sort();
            return categories.map(cat => (
              <React.Fragment key={`group-${cat}`}>
                <tr className={s.printCategoryRow} key={`pcat-${cat}`}>
                  <td colSpan={6}>{cat}</td>
                </tr>
                {grouped[cat].map(item => { 
                  counter++; 
                  const itemIndex = counter;
                  return (
                    <tr key={`p-${itemIndex}`}>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>{itemIndex}</td>
                      <td>
                        <div className={s.printItemName}>{item.name}</div>
                        {(item.supplier_name || item.notes) && (
                          <div className={s.printItemSub}>
                            {item.supplier_name && <span>Vendor: {item.supplier_name}</span>}
                            {item.supplier_name && item.notes && <span> · </span>}
                            {item.notes && <span>Catatan: {item.notes}</span>}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 500 }}>{item.unit}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{item.qty_ordered}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(item.unit_price || 0)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {formatRupiah(item.total || (item.qty_ordered * (item.unit_price || 0)))}
                      </td>
                    </tr>
                  ); 
                })}
              </React.Fragment>
            ));
          })()}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={{ textAlign: 'right', letterSpacing: '0.04em' }}>TOTAL ESTIMASI KEBUTUHAN:</td>
            <td style={{ textAlign: 'right', fontSize: '12.5px', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              {formatRupiah(selectedDml.total_cost || 0)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ── Notes ── */}
      {selectedDml.notes && (
        <div className={s.printNotes}>
          <div className={s.printNotesLabel}>Catatan Khusus Kitchen (Chef's Notes)</div>
          <div className={s.printNotesBody}>{selectedDml.notes}</div>
        </div>
      )}

      {/* ── Signatures ── */}
      <div className={s.printSignatureRow}>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Prepared By</div>
          <div className={s.printSignSpace}></div>
          <div className={s.printSignName}>{selectedDml.submitted_by_name || selectedDml.submitted_by || 'Kitchen Staff'}</div>
          <div className={s.printSignRole}>Chef de Partie / Section Cook</div>
          <div className={s.printSignDate}>Tgl: ___________________</div>
        </div>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Acknowledged By</div>
          <div className={s.printSignSpace}></div>
          <div className={s.printSignName}>Executive Chef</div>
          <div className={s.printSignRole}>Head of Culinary Dept</div>
          <div className={s.printSignDate}>Tgl: ___________________</div>
        </div>
        <div className={s.printSignBlock}>
          <div className={s.printSignTitle}>Verified & Approved By</div>
          <div className={s.printSignSpace}></div>
          <div className={s.printSignName}>F&B Director / Purchasing</div>
          <div className={s.printSignRole}>Cost Control & Procurement</div>
          <div className={s.printSignDate}>Tgl: ___________________</div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className={s.printFooter}>
        <div>Powered by <a href="https://mytara.id" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>Tara</a> · {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div>Dokumen Operasional Pengadaan F&B Resmi</div>
      </div>
    </div>
  );
}
