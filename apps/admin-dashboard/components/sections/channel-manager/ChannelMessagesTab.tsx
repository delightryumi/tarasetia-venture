"use client";

import React, { useState, useEffect } from "react";
import { Send, MessageSquare, CheckCheck, Clock, Search, RefreshCw, FileText, Building2 } from "lucide-react";
import { toast } from "sonner";
import styles from "./ChannelMessages.module.css";

interface MessageThread {
    id: string;
    provider: string;
    title: string;
    booking_id?: string;
    room_type?: string;
    checkin?: string;
    checkout?: string;
    is_closed: boolean;
    unread_count?: number;
    last_message?: {
        message: string;
        sender: string;
        inserted_at: string;
    };
}

interface ChatMessage {
    id: string;
    message: string;
    sender: "guest" | "property";
    inserted_at: string;
}

interface Props {
    hotelCode: string;
}

export function ChannelMessagesTab({ hotelCode }: Props) {
    const [threads, setThreads] = useState<MessageThread[]>([]);
    const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loadingThreads, setLoadingThreads] = useState<boolean>(false);
    const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
    const [replyText, setReplyText] = useState<string>("");
    const [sending, setSending] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const fetchThreads = async () => {
        if (!hotelCode) return;
        setLoadingThreads(true);
        try {
            const res = await fetch(`/api/channex/messages?hotelCode=${hotelCode}`);
            const data = await res.json();
            if (data.success && data.threads) {
                setThreads(data.threads);
                if (data.threads.length > 0 && !selectedThread) {
                    setSelectedThread(data.threads[0]);
                }
            }
        } catch (err: any) {
            console.error("Error fetching threads:", err);
        } finally {
            setLoadingThreads(false);
        }
    };

    const fetchMessages = async (threadId: string) => {
        setLoadingMessages(true);
        try {
            const res = await fetch(`/api/channex/messages?hotelCode=${hotelCode}&threadId=${threadId}`);
            const data = await res.json();
            if (data.success && data.messages) {
                setMessages(data.messages);
            }
        } catch (err: any) {
            console.error("Error fetching messages:", err);
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        fetchThreads();
    }, [hotelCode]);

    useEffect(() => {
        if (selectedThread) {
            fetchMessages(selectedThread.id);
        }
    }, [selectedThread]);

    const handleSendMessage = async (textToSend?: string) => {
        const text = textToSend || replyText;
        if (!text.trim() || !selectedThread) return;

        setSending(true);
        try {
            const res = await fetch("/api/channex/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    threadId: selectedThread.id,
                    message: text.trim()
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Official response sent to OTA guest successfully.");
                setMessages(prev => [...prev, data.sentMessage]);
                setReplyText("");
            } else {
                toast.error(data.error || "Failed to send message");
            }
        } catch (err: any) {
            toast.error("Network communication error while sending message.");
        } finally {
            setSending(false);
        }
    };

    const filteredThreads = threads.filter(th =>
        th.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (th.booking_id && th.booking_id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className={styles.container}>
            {/* Sidebar Threads */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.sidebarTitle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <MessageSquare size={16} color="#1e3a2f" />
                            <span>OTA Guest Inbox</span>
                        </div>
                        <button
                            type="button"
                            onClick={fetchThreads}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                            title="Refresh Messages"
                        >
                            <RefreshCw size={13} className={loadingThreads ? "animate-spin" : ""} />
                        </button>
                    </div>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search guest name / Booking ID..."
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                <div className={styles.threadList}>
                    {filteredThreads.map(th => {
                        const isAirbnb = th.provider.toLowerCase().includes("airbnb");
                        const isExpedia = th.provider.toLowerCase().includes("expedia");
                        const isSelected = selectedThread?.id === th.id;

                        return (
                            <div
                                key={th.id}
                                onClick={() => setSelectedThread(th)}
                                className={`${styles.threadItem} ${isSelected ? styles.threadItemActive : ""}`}
                            >
                                <div className={styles.threadHeader}>
                                    <span className={styles.guestName}>{th.title}</span>
                                    <span className={`${styles.channelBadge} ${isAirbnb ? styles.channelAirbnb : isExpedia ? styles.channelExpedia : ""}`}>
                                        {th.provider}
                                    </span>
                                </div>
                                <div className={styles.bookingMeta}>
                                    <span>Ref: <b>{th.booking_id}</b></span>
                                    <span>•</span>
                                    <span>{th.room_type}</span>
                                </div>
                                <div className={styles.lastMessage}>
                                    {th.last_message?.message || "No prior messages"}
                                </div>
                            </div>
                        );
                    })}

                    {filteredThreads.length === 0 && (
                        <div style={{ padding: "30px 16px", textAlign: "center", fontSize: "12px", color: "#94a3b8" }}>
                            No matching conversations found.
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Conversation Area */}
            {selectedThread ? (
                <div className={styles.chatWindow}>
                    <div className={styles.chatHeader}>
                        <div className={styles.chatTitleGroup}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className={styles.chatGuestTitle}>{selectedThread.title}</span>
                                <span className={styles.channelBadge}>{selectedThread.provider}</span>
                            </div>
                            <div className={styles.chatSubTitle}>
                                Booking Ref: <b>{selectedThread.booking_id}</b> • Room: <b>{selectedThread.room_type}</b> • Stay: {selectedThread.checkin} to {selectedThread.checkout}
                            </div>
                        </div>
                        <div style={{ fontSize: "11px", color: "#059669", display: "flex", alignItems: "center", gap: "4px" }}>
                            <CheckCheck size={14} />
                            <span>Direct 2-Way Messaging Connected</span>
                        </div>
                    </div>

                    <div className={styles.messageArea}>
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`${styles.bubble} ${msg.sender === "property" ? styles.bubbleProperty : styles.bubbleGuest}`}
                            >
                                <div>{msg.message}</div>
                                <div className={styles.bubbleMeta}>
                                    {new Date(msg.inserted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Replies Bar */}
                    <div className={styles.quickRepliesBar}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                            <FileText size={12} color="#1e3a2f" /> Quick Templates:
                        </span>
                        <button
                            type="button"
                            onClick={() => handleSendMessage("Hello! We have noted your early check-in request and will prioritize your room preparation subject to availability upon arrival.")}
                            className={styles.btnQuick}
                        >
                            Early Check-In Confirmation
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSendMessage("Hello! Airport transfer service is available upon advance booking. Please share your flight details and arrival time.")}
                            className={styles.btnQuick}
                        >
                            Airport Transfer Details
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSendMessage("Buffet breakfast is served daily at the main restaurant from 06:00 to 10:00.")}
                            className={styles.btnQuick}
                        >
                            Breakfast Hours &amp; Location
                        </button>
                    </div>

                    {/* Message Input Bar */}
                    <div className={styles.inputArea}>
                        <input
                            type="text"
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Type official hotel response to OTA guest (Enter to send)..."
                            className={styles.messageInput}
                        />
                        <button
                            type="button"
                            onClick={() => handleSendMessage()}
                            disabled={sending || !replyText.trim()}
                            className={styles.btnSend}
                        >
                            <Send size={14} />
                            <span>{sending ? "Sending..." : "Send Reply"}</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <MessageSquare size={36} color="#cbd5e1" />
                    <span>Select a conversation from the left to view guest messages.</span>
                </div>
            )}
        </div>
    );
}
