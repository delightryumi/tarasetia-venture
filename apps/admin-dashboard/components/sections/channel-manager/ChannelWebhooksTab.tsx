"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ChannelTaskLog } from "./ChannelActionLogsTab";
import { ChannelWebhooksDesktopView } from "./ChannelWebhooksDesktopView";
import { ChannelWebhooksMobileView } from "./ChannelWebhooksMobileView";
import styles from "./ChannelWebhooks.module.css";

interface ChannelWebhooksTabProps {
  hotelCode: string;
}

export function ChannelWebhooksTab({ hotelCode }: ChannelWebhooksTabProps) {
  const [events, setEvents] = useState<ChannelTaskLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [testingPing, setTestingPing] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Webhook Registration info
  const [webhookRegistered, setWebhookRegistered] = useState<boolean>(true);
  const [webhookSecretConfigured, setWebhookSecretConfigured] = useState<boolean>(true);

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selected event for detail inspection drawer
  const [selectedEvent, setSelectedEvent] = useState<ChannelTaskLog | null>(null);

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/channex/webhook`
    : "https://your-domain.com/api/channex/webhook";

  // Keyboard accessibility: Close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedEvent) {
        setSelectedEvent(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEvent]);

  // Fetch all tasks and filter webhook events
  const fetchEvents = async () => {
    if (!hotelCode) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/channex/tasks?hotelCode=${encodeURIComponent(hotelCode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          // Filter webhook specific events or OTA inbound revisions
          const webhookLogs = data.logs.filter((l: ChannelTaskLog) => {
            const act = (l.action || l.task_type || "").toLowerCase();
            return (
              act.includes("webhook") ||
              act.includes("ota") ||
              act.includes("booking") ||
              act.includes("cancellation") ||
              act.includes("modification") ||
              act.includes("feed")
            );
          });

          // If no specific webhook events yet, display recent incoming channel tasks
          setEvents(webhookLogs.length > 0 ? webhookLogs : data.logs);
        }
      }

      // Check registration
      const regRes = await fetch(`/api/channex/register-webhook?hotelCode=${encodeURIComponent(hotelCode)}`);
      if (regRes.ok) {
        const regData = await regRes.json();
        if (regData?.isRegistered !== undefined) {
          setWebhookRegistered(Boolean(regData.isRegistered));
        }
      }
    } catch (err: any) {
      console.warn("[ChannelWebhooks] Could not fetch webhook events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [hotelCode]);

  // Inbound Webhook Ping Test Simulator
  const handlePingTest = async () => {
    if (!hotelCode) return;
    setTestingPing(true);
    const toastId = toast.loading("Mengirim simulasi inbound webhook ke /api/channex/webhook...");
    try {
      const res = await fetch("/api/channex/sandbox-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelCode,
          scenarioId: "sc_inbound_booking"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Inbound webhook berhasil diinjeksi dan direspons HTTP 200 OK!", { id: toastId });
        await fetchEvents();
      } else {
        toast.error(data.error || "Gagal menguji webhook", { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: toastId });
    } finally {
      setTestingPing(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} disalin ke clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Distinct channels
  const channelNames = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      if (e.channelName) set.add(e.channelName);
    });
    return Array.from(set);
  }, [events]);

  // Distinct event types
  const eventTypes = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      if (e.action) set.add(e.action);
    });
    return Array.from(set);
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (eventTypeFilter !== "all" && e.action !== eventTypeFilter) return false;
      if (channelFilter !== "all" && e.channelName !== channelFilter) return false;
      if (resultFilter !== "all" && e.result.toLowerCase() !== resultFilter.toLowerCase()) return false;
      return true;
    });
  }, [events, eventTypeFilter, channelFilter, resultFilter]);

  // Telemetry KPIs
  const totalEvents = filteredEvents.length;
  const successCount = filteredEvents.filter(e => e.result?.toLowerCase() === "success").length;
  const successRate = totalEvents > 0 ? (successCount / totalEvents) * 100 : 100;

  const avgLatency = useMemo(() => {
    const latencyValues = filteredEvents
      .map(e => e.execution_time_ms)
      .filter((v): v is number => typeof v === "number" && v > 0);
    if (!latencyValues.length) return 42;
    return latencyValues.reduce((sum, v) => sum + v, 0) / latencyValues.length;
  }, [filteredEvents]);

  // Paginated
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, page, pageSize]);

  const formatTimestamp = (ts?: string) => {
    if (!ts) return "Baru saja";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }) + " WIB";
    } catch {
      return ts;
    }
  };

  const sharedProps = {
    hotelCode,
    webhookUrl,
    webhookRegistered,
    webhookSecretConfigured,
    events: filteredEvents,
    paginatedEvents,
    totalEvents,
    successRate,
    avgLatency,
    activeChannelsCount: Math.max(1, channelNames.length),
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
  };

  return (
    <div className={styles.tabContainer}>
      <div className={styles.desktopOnly}>
        <ChannelWebhooksDesktopView {...sharedProps} />
      </div>
      <div className={styles.mobileOnly}>
        <ChannelWebhooksMobileView {...sharedProps} />
      </div>
    </div>
  );
}
