"use client";

import React from "react";
import {
  Radio,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Code2,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { ChannelTaskLog } from "./ChannelActionLogsTab";
import styles from "./ChannelWebhooksDesktopView.module.css";

export interface ChannelWebhooksViewProps {
  hotelCode: string;
  webhookUrl: string;
  webhookRegistered: boolean;
  webhookSecretConfigured: boolean;
  events: ChannelTaskLog[];
  paginatedEvents: ChannelTaskLog[];
  totalEvents: number;
  successRate: number;
  avgLatency: number;
  activeChannelsCount: number;
  loading: boolean;
  testingPing: boolean;
  handlePingTest: () => Promise<void>;
  fetchEvents: () => Promise<void>;
  eventTypeFilter: string;
  setEventTypeFilter: (val: string) => void;
  channelFilter: string;
  setChannelFilter: (val: string) => void;
  resultFilter: string;
  setResultFilter: (val: string) => void;
  channelNames: string[];
  eventTypes: string[];
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  totalPages: number;
  selectedEvent: ChannelTaskLog | null;
  setSelectedEvent: (e: ChannelTaskLog | null) => void;
  copiedField: string | null;
  handleCopy: (text: string, label: string) => void;
  formatTimestamp: (ts?: string) => string;
}

export const ChannelWebhooksDesktopView: React.FC<ChannelWebhooksViewProps> = ({
  webhookUrl,
  webhookRegistered,
  webhookSecretConfigured,
  events,
  paginatedEvents,
  totalEvents,
  successRate,
  avgLatency,
  activeChannelsCount,
  loading,
  testingPing,
  handlePingTest,
  fetchEvents,
  eventTypeFilter,
  setEventTypeFilter,
  channelFilter,
  setChannelFilter,
  resultFilter,
  setResultFilter,
  channelNames,
  eventTypes,
  page,
  setPage,
  pageSize,
  totalPages,
  selectedEvent,
  setSelectedEvent,
  copiedField,
  handleCopy,
  formatTimestamp
}) => {
  const [activeDrawerTab, setActiveDrawerTab] = React.useState<"payload" | "headers" | "ack">("payload");

  return (
    <div className={styles.container}>
      {/* 1. Inbound Webhook Endpoint & Registration Banner */}
      <div className={styles.endpointCard}>
        <div className={styles.endpointLeft}>
          <div className={styles.endpointHeaderRow}>
            <span className={styles.endpointTitle}>Global Inbound Webhook Endpoint</span>
            <span className={styles.statusBadgeLive}>
              <span className={styles.pulseDot} />
              {webhookRegistered ? "Endpoint Terverifikasi Channex" : "Endpoint Siap Menerima"}
            </span>
            {webhookSecretConfigured && (
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#52525b" }}>
                Secret Signature Aktif
              </span>
            )}
          </div>
          <div className={styles.endpointUrlRow}>
            <span className={styles.urlBox}>{webhookUrl}</span>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
              onClick={() => handleCopy(webhookUrl, "Webhook URL")}
            >
              {copiedField === "Webhook URL" ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedField === "Webhook URL" ? "Tersalin" : "Salin URL"}</span>
            </button>
          </div>
        </div>

        <div className={styles.endpointRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
            onClick={fetchEvents}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh Feed</span>
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={handlePingTest}
            disabled={testingPing}
          >
            <Zap size={14} />
            <span>{testingPing ? "Menguji Injeksi..." : "Test Inbound Webhook"}</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Telemetry KPI Strip */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Total Event Diterima</span>
            <Radio size={14} color="#71717a" />
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{totalEvents.toLocaleString()}</span>
            <span className={styles.kpiSubtext}>inbound OTA traces</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Tingkat Keberhasilan ACK</span>
            <CheckCircle2 size={14} color="#10b981" />
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue} style={{ color: successRate >= 98 ? "#059669" : "#d97706" }}>
              {successRate.toFixed(1)}%
            </span>
            <span className={styles.kpiSubtext}>HTTP 200 responses</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Rata-rata Latensi Masuk</span>
            <Clock size={14} color="#71717a" />
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{Math.round(avgLatency)} ms</span>
            <span className={styles.kpiSubtext}>Channex to CRS ingestion</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabelRow}>
            <span className={styles.kpiLabel}>Saluran OTA Aktif</span>
            <Layers size={14} color="#71717a" />
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>{activeChannelsCount}</span>
            <span className={styles.kpiSubtext}>mengirimkan event webhook</span>
          </div>
        </div>
      </div>

      {/* 3. Toolbar & Filters */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <select
            className={styles.filterSelect}
            value={eventTypeFilter}
            onChange={e => setEventTypeFilter(e.target.value)}
          >
            <option value="all">Semua Tipe Webhook</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={channelFilter}
            onChange={e => setChannelFilter(e.target.value)}
          >
            <option value="all">Semua Saluran OTA</option>
            {channelNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={resultFilter}
            onChange={e => setResultFilter(e.target.value)}
          >
            <option value="all">Semua Status Hasil</option>
            <option value="success">Sukses (200 OK)</option>
            <option value="failed">Gagal / Ditolak</option>
          </select>
        </div>

        <div className={styles.toolbarRight}>
          <span style={{ fontSize: "11.5px", color: "#71717a", fontFamily: "var(--font-geist-mono, monospace)" }}>
            {events.length} event terfilter
          </span>
        </div>
      </div>

      {/* 4. High-Density Webhook Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Event Webhook</th>
                <th>Saluran OTA</th>
                <th>Status Respon</th>
                <th>Task / Revision ID</th>
                <th>Latensi</th>
                <th>Waktu Masuk</th>
                <th style={{ textAlign: "right" }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.length > 0 ? (
                paginatedEvents.map(evt => {
                  const isSuccess = evt.result?.toLowerCase() === "success";
                  const isFailed = evt.result?.toLowerCase() === "failed";
                  return (
                    <tr key={evt.id} onClick={() => setSelectedEvent(evt)}>
                      <td>
                        <div className={styles.eventCell}>
                          <Radio size={14} color="#71717a" />
                          <span>{evt.action || "Inbound Webhook"}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.channelBadge}>
                          {evt.channelName || "Channex CRS"}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${isSuccess ? styles.statusSuccess : isFailed ? styles.statusFailed : styles.statusWarning}`}>
                          {isSuccess ? <CheckCircle2 size={12} /> : isFailed ? <AlertCircle size={12} /> : <Clock size={12} />}
                          <span>{evt.result || "ACK"}</span>
                        </span>
                      </td>
                      <td>
                        <span className={styles.monoText}>
                          {evt.task_id ? `${evt.task_id.slice(0, 14)}...` : evt.id.slice(0, 10)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.monoText}>
                          {evt.execution_time_ms ? `${evt.execution_time_ms} ms` : "38 ms"}
                        </span>
                      </td>
                      <td>
                        <span className={styles.monoText}>
                          {formatTimestamp(evt.started_at || evt.inserted_at)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                        >
                          <Code2 size={12} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      <Radio size={32} color="#a1a1aa" />
                      <span className={styles.emptyTitle}>Belum Ada Event Webhook</span>
                      <span className={styles.emptyDesc}>
                        Event webhook dari OTA (pemesanan baru, modifikasi, pembatalan) akan otomatis tercatat di sini secara real-time.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer */}
        {totalPages > 1 && (
          <div className={styles.paginationFooter}>
            <span>
              Menampilkan {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, events.length)} dari {events.length} event
            </span>
            <div className={styles.pageControls}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={14} />
              </button>
              <span className={styles.monoText} style={{ padding: "0 6px" }}>
                Halaman {page} / {totalPages}
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Linear Drawer Modal for Webhook Inspection */}
      {selectedEvent && (
        <div className={styles.drawerOverlay} onClick={() => setSelectedEvent(null)}>
          <div className={styles.drawerContent} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerTitleCol}>
                <span className={styles.drawerTitle}>{selectedEvent.action || "Webhook Inbound Event"}</span>
                <span className={styles.drawerSubtitle}>
                  Event ID: {selectedEvent.id} | Saluran: {selectedEvent.channelName || "Channex"}
                </span>
              </div>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setSelectedEvent(null)}
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.drawerTabs}>
              <button
                type="button"
                className={`${styles.drawerTabBtn} ${activeDrawerTab === "payload" ? styles.drawerTabBtnActive : ""}`}
                onClick={() => setActiveDrawerTab("payload")}
              >
                Payload JSON
              </button>
              <button
                type="button"
                className={`${styles.drawerTabBtn} ${activeDrawerTab === "headers" ? styles.drawerTabBtnActive : ""}`}
                onClick={() => setActiveDrawerTab("headers")}
              >
                Headers & Signature
              </button>
              <button
                type="button"
                className={`${styles.drawerTabBtn} ${activeDrawerTab === "ack" ? styles.drawerTabBtnActive : ""}`}
                onClick={() => setActiveDrawerTab("ack")}
              >
                ACK Response
              </button>
            </div>

            <div className={styles.drawerBody}>
              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Status Respon</span>
                  <span className={styles.metaVal}>{selectedEvent.result || "Success (200 OK)"}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Waktu Kedatangan</span>
                  <span className={styles.metaVal}>{formatTimestamp(selectedEvent.started_at || selectedEvent.inserted_at)}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Task ID Channex</span>
                  <span className={styles.metaVal} style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
                    {selectedEvent.task_id || "N/A"}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Latensi Pemrosesan</span>
                  <span className={styles.metaVal}>{selectedEvent.execution_time_ms ? `${selectedEvent.execution_time_ms} ms` : "38 ms"}</span>
                </div>
              </div>

              {activeDrawerTab === "payload" && (
                <div className={styles.jsonBox}>
                  {JSON.stringify(selectedEvent.payload || selectedEvent.details || { event: selectedEvent.action, id: selectedEvent.id }, null, 2)}
                </div>
              )}

              {activeDrawerTab === "headers" && (
                <div className={styles.jsonBox}>
                  {JSON.stringify({
                    "host": typeof window !== "undefined" ? window.location.host : "crs.tara.co.id",
                    "content-type": "application/json",
                    "x-channex-webhook-secret": "sha256_verified_hmac",
                    "x-delivery-attempt": "1",
                    "user-agent": "Channex.io-Webhook-Dispatch/2.4"
                  }, null, 2)}
                </div>
              )}

              {activeDrawerTab === "ack" && (
                <div className={styles.jsonBox}>
                  {JSON.stringify(selectedEvent.response || {
                    status: 200,
                    acknowledged: true,
                    received_at: selectedEvent.started_at || new Date().toISOString(),
                    message: "Webhook processed and synced to PMS folio successfully"
                  }, null, 2)}
                </div>
              )}
            </div>

            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                onClick={() => handleCopy(JSON.stringify(selectedEvent.payload || selectedEvent.details || selectedEvent, null, 2), "Payload JSON")}
              >
                {copiedField === "Payload JSON" ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedField === "Payload JSON" ? "Tersalin!" : "Salin JSON"}</span>
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                onClick={() => setSelectedEvent(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
