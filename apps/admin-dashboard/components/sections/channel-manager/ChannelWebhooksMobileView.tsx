"use client";

import React, { useState } from "react";
import {
  Radio,
  Copy,
  Check,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Code2,
  ChevronRight
} from "lucide-react";
import { ChannelTaskLog } from "./ChannelActionLogsTab";
import styles from "./ChannelWebhooksMobileView.module.css";

export interface ChannelWebhooksMobileViewProps {
  hotelCode: string;
  webhookUrl: string;
  webhookRegistered: boolean;
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
  selectedEvent: ChannelTaskLog | null;
  setSelectedEvent: (e: ChannelTaskLog | null) => void;
  copiedField: string | null;
  handleCopy: (text: string, label: string) => void;
  formatTimestamp: (ts?: string) => string;
}

export const ChannelWebhooksMobileView: React.FC<ChannelWebhooksMobileViewProps> = ({
  webhookUrl,
  webhookRegistered,
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
  selectedEvent,
  setSelectedEvent,
  copiedField,
  handleCopy,
  formatTimestamp
}) => {
  return (
    <div className={styles.container}>
      {/* 1. Endpoint Mobile Card */}
      <div className={styles.endpointCard}>
        <div className={styles.endpointHeader}>
          <span className={styles.endpointTitle}>Inbound Webhook OTA</span>
          <span className={`${styles.statusPill} ${styles.statusLive}`}>
            <span className={styles.pulseDot} />
            {webhookRegistered ? "Terverifikasi" : "Siap Ingest"}
          </span>
        </div>

        <div className={styles.urlBox}>{webhookUrl}</div>

        <div className={styles.btnRow}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
            onClick={() => handleCopy(webhookUrl, "Webhook URL")}
          >
            {copiedField === "Webhook URL" ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedField === "Webhook URL" ? "Tersalin" : "Salin URL"}</span>
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={handlePingTest}
            disabled={testingPing}
          >
            <Zap size={14} />
            <span>{testingPing ? "Menguji..." : "Test Injeksi"}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Grid 2x2 */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Webhook</span>
          <span className={styles.kpiVal}>{totalEvents}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Tingkat Sukses</span>
          <span className={styles.kpiVal} style={{ color: successRate >= 98 ? "#059669" : "#d97706" }}>
            {successRate.toFixed(1)}%
          </span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Latensi Rata-rata</span>
          <span className={styles.kpiVal}>{Math.round(avgLatency)} ms</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Saluran OTA</span>
          <span className={styles.kpiVal}>{activeChannelsCount} Saluran</span>
        </div>
      </div>

      {/* 3. Mobile Filter Controls */}
      <div className={styles.filterRow}>
        <select
          className={styles.filterSelect}
          value={eventTypeFilter}
          onChange={e => setEventTypeFilter(e.target.value)}
        >
          <option value="all">Semua Tipe Event</option>
          {eventTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
          style={{ width: "auto", flex: "none", padding: "0 14px" }}
          onClick={fetchEvents}
          disabled={loading}
          aria-label="Refresh"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* 4. Event Cards */}
      <div className={styles.eventList}>
        {paginatedEvents.length > 0 ? (
          paginatedEvents.map(evt => {
            const isSuccess = evt.result?.toLowerCase() === "success";
            const isFailed = evt.result?.toLowerCase() === "failed";
            return (
              <div
                key={evt.id}
                className={styles.eventCard}
                onClick={() => setSelectedEvent(evt)}
              >
                <div className={styles.eventTopRow}>
                  <span className={styles.eventName}>{evt.action || "Inbound Webhook"}</span>
                  <span
                    className={styles.statusPill}
                    style={{
                      background: isSuccess ? "#ecfdf5" : isFailed ? "#fef2f2" : "#fffbeb",
                      color: isSuccess ? "#059669" : isFailed ? "#dc2626" : "#d97706"
                    }}
                  >
                    {isSuccess ? "200 OK" : isFailed ? "Failed" : "ACK"}
                  </span>
                </div>

                <div className={styles.eventMetaRow}>
                  <span className={styles.channelTag}>{evt.channelName || "Channex"}</span>
                  <span>{formatTimestamp(evt.started_at || evt.inserted_at)}</span>
                  <span>{evt.execution_time_ms ? `${evt.execution_time_ms}ms` : "38ms"}</span>
                  <ChevronRight size={14} color="#a1a1aa" />
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "#71717a", fontSize: "12px" }}>
            Belum ada event webhook masuk.
          </div>
        )}
      </div>

      {/* 5. Mobile Sheet Drawer for Payload Inspection */}
      {selectedEvent && (
        <div className={styles.sheetOverlay} onClick={() => setSelectedEvent(null)}>
          <div className={styles.sheetContent} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#09090b" }}>
                  {selectedEvent.action || "Webhook Inbound Detail"}
                </div>
                <div style={{ fontSize: "11px", color: "#71717a" }}>
                  Saluran: {selectedEvent.channelName || "Channex"}
                </div>
              </div>
              <button
                type="button"
                style={{ background: "transparent", border: "none", padding: "6px" }}
                onClick={() => setSelectedEvent(null)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.sheetBody}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#71717a", textTransform: "uppercase" }}>
                Raw JSON Payload
              </div>
              <div className={styles.jsonBox}>
                {JSON.stringify(selectedEvent.payload || selectedEvent.details || selectedEvent, null, 2)}
              </div>
            </div>

            <div className={styles.sheetFooter}>
              <button
                type="button"
                className={styles.sheetCloseBtn}
                onClick={() => setSelectedEvent(null)}
              >
                Tutup Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
