"use client";

import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Reply, ThumbsUp, RefreshCw, CheckCircle2, ShieldCheck, Filter, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import styles from "./ChannelReviews.module.css";

interface ReviewScoreItem {
    category: string;
    score: number;
    name: string;
}

interface OTAFeedback {
    id: string;
    ota: string;
    guest_name: string;
    ota_reservation_id: string;
    room_name: string;
    stay_date: string;
    overall_score: number;
    received_at: string;
    content: string;
    is_replied: boolean;
    reply?: {
        content: string;
        replied_at: string;
    } | null;
    scores: ReviewScoreItem[];
    tags?: string[];
}

interface Props {
    hotelCode: string;
}

export function ChannelReviewsTab({ hotelCode }: Props) {
    const [reviews, setReviews] = useState<OTAFeedback[]>([]);
    const [summary, setSummary] = useState<any>({
        averageScore: 0,
        totalReviews: 0,
        cleanliness: 0,
        staff: 0,
        location: 0,
        comfort: 0,
        value: 0
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [filterOta, setFilterOta] = useState<string>("all");
    const [replyingId, setReplyingId] = useState<string | null>(null);
    const [replyDraft, setReplyDraft] = useState<string>("");
    const [submittingReply, setSubmittingReply] = useState<boolean>(false);

    const fetchReviews = async () => {
        if (!hotelCode) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/channex/reviews?hotelCode=${hotelCode}`);
            const data = await res.json();
            if (data.success) {
                if (data.reviews) setReviews(data.reviews);
                if (data.summary) setSummary(data.summary);
            }
        } catch (err: any) {
            console.error("Error fetching reviews:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [hotelCode]);

    const handleSendReply = async (reviewId: string) => {
        if (!replyDraft.trim()) return;
        setSubmittingReply(true);
        try {
            const res = await fetch("/api/channex/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    reviewId,
                    replyContent: replyDraft.trim()
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Official management response posted to OTA successfully.");
                setReviews(prev => prev.map(r => r.id === reviewId ? {
                    ...r,
                    is_replied: true,
                    reply: data.reply
                } : r));
                setReplyingId(null);
                setReplyDraft("");
            } else {
                toast.error(data.error || "Failed to submit review response");
            }
        } catch (err) {
            toast.error("Network communication error.");
        } finally {
            setSubmittingReply(false);
        }
    };

    const filteredReviews = reviews.filter(r => {
        if (filterOta !== "all" && r.ota.toLowerCase() !== filterOta.toLowerCase()) return false;
        return true;
    });

    return (
        <div className={styles.container}>
            {/* 1. Score Summary Metrics */}
            <div className={styles.scoreCardsGrid}>
                <div className={styles.scoreCard} style={{ borderLeft: "4px solid #2563eb" }}>
                    <span className={styles.scoreTitle}>Average OTA Score</span>
                    <div className={styles.scoreValueRow}>
                        <span className={styles.scoreValueLarge}>{summary.averageScore}</span>
                        <span className={styles.scoreScale}>/ 10</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                        Based on <b>{summary.totalReviews} reviews</b> verified
                    </div>
                </div>

                <div className={styles.scoreCard}>
                    <span className={styles.scoreTitle}>Cleanliness</span>
                    <div className={styles.scoreValueRow}>
                        <span className={styles.scoreValueLarge}>{summary.cleanliness}</span>
                        <span className={styles.scoreScale}>/ 10</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${(summary.cleanliness / 10) * 100}%` }} />
                    </div>
                </div>

                <div className={styles.scoreCard}>
                    <span className={styles.scoreTitle}>Staff &amp; Service</span>
                    <div className={styles.scoreValueRow}>
                        <span className={styles.scoreValueLarge}>{summary.staff}</span>
                        <span className={styles.scoreScale}>/ 10</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${(summary.staff / 10) * 100}%` }} />
                    </div>
                </div>

                <div className={styles.scoreCard}>
                    <span className={styles.scoreTitle}>Location</span>
                    <div className={styles.scoreValueRow}>
                        <span className={styles.scoreValueLarge}>{summary.location}</span>
                        <span className={styles.scoreScale}>/ 10</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${(summary.location / 10) * 100}%` }} />
                    </div>
                </div>

                <div className={styles.scoreCard}>
                    <span className={styles.scoreTitle}>Comfort &amp; Value</span>
                    <div className={styles.scoreValueRow}>
                        <span className={styles.scoreValueLarge}>{summary.comfort}</span>
                        <span className={styles.scoreScale}>/ 10</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${(summary.comfort / 10) * 100}%` }} />
                    </div>
                </div>
            </div>

            {/* 2. Filter Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.filterGroup}>
                    <Filter size={14} color="#64748b" />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Channel Filter:</span>
                    <select
                        value={filterOta}
                        onChange={e => setFilterOta(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Global OTAs</option>
                        <option value="BookingCom">Booking.com</option>
                        <option value="AirBNB">Airbnb</option>
                        <option value="Expedia">Expedia</option>
                    </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                        Showing <b>{filteredReviews.length}</b> reviews
                    </span>
                    <button
                        type="button"
                        onClick={fetchReviews}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                        title="Refresh Reviews"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* 3. Review Cards List */}
            <div className={styles.reviewList}>
                {filteredReviews.map(rev => (
                    <div key={rev.id} className={styles.reviewCard}>
                        <div className={styles.reviewHeader}>
                            <div className={styles.reviewerInfo}>
                                <div className={styles.scoreBadge}>
                                    {rev.overall_score.toFixed(1)}
                                </div>
                                <div className={styles.guestMeta}>
                                    <span className={styles.guestName}>{rev.guest_name}</span>
                                    <span className={styles.stayDetails}>
                                        Booking #{rev.ota_reservation_id} • {rev.room_name} • Stay: {rev.stay_date}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className={styles.channelBadge}>{rev.ota}</span>
                                <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                                    {new Date(rev.received_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                            </div>
                        </div>

                        {/* Review Content */}
                        <div className={styles.reviewBody}>
                            &ldquo;{rev.content}&rdquo;
                        </div>

                        {/* Sub scores breakdown */}
                        <div className={styles.subScoresRow}>
                            {rev.scores.map(s => (
                                <div key={s.category} className={styles.subScoreItem}>
                                    <span style={{ fontWeight: 600 }}>{s.name || s.category}:</span>
                                    <span style={{ color: "#2563eb", fontWeight: 700 }}>{s.score}</span>
                                </div>
                            ))}
                        </div>

                        {/* Official Response */}
                        {rev.is_replied && rev.reply ? (
                            <div className={styles.replyBox}>
                                <div className={styles.replyHeader}>
                                    <ShieldCheck size={14} />
                                    <span>Official Management Response:</span>
                                </div>
                                <div>{rev.reply.content}</div>
                            </div>
                        ) : replyingId === rev.id ? (
                            <div style={{ marginTop: "4px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Write Management Response:</span>
                                <div className={styles.replyForm}>
                                    <input
                                        type="text"
                                        value={replyDraft}
                                        onChange={e => setReplyDraft(e.target.value)}
                                        placeholder="Write an official hotel management response..."
                                        className={styles.replyInput}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleSendReply(rev.id)}
                                        disabled={submittingReply}
                                        className={styles.btnReply}
                                    >
                                        {submittingReply ? "Posting..." : "Post Reply"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReplyingId(null)}
                                        style={{ background: "none", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "0 10px", fontSize: "11px", cursor: "pointer" }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReplyingId(rev.id);
                                        setReplyDraft("");
                                    }}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: "#2563eb",
                                        background: "#eff6ff",
                                        border: "1px solid #bfdbfe",
                                        padding: "4px 10px",
                                        borderRadius: "4px",
                                        cursor: "pointer"
                                    }}
                                >
                                    <Reply size={12} />
                                    <span>Respond to Review</span>
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {filteredReviews.length === 0 && (
                    <div style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "48px 24px",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "14px",
                        margin: "12px 0"
                    }}>
                        <div style={{ width: 52, height: 52, borderRadius: 12, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Star size={26} />
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                            Belum Ada Ulasan Masuk atau Aplikasi Reviews Belum Terpasang
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", maxWidth: 480, lineHeight: 1.6 }}>
                            Modul ini mengumpulkan ulasan dan rating tamu dari Booking.com, Agoda, dan Expedia ke satu dashboard terpusat serta memungkinkan staf merespons ulasan langsung dari Tara.
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 480, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", textAlign: "left", fontSize: 11.5, color: "#475569" }}>
                            <div><b>Langkah 1:</b> Masuk ke Channex App Store di <span style={{ fontFamily: "monospace" }}>app.channex.io/applications</span></div>
                            <div><b>Langkah 2:</b> Aktifkan aplikasi <b>OTA Reviews</b> pada properti Anda</div>
                            <div><b>Langkah 3:</b> Ulasan tamu dari OTA akan otomatis disinkronkan ke My Tara</div>
                        </div>
                        <a
                            href="https://app.channex.io/applications"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                background: "#09090b",
                                color: "#ffffff",
                                padding: "8px 18px",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                textDecoration: "none",
                                marginTop: 6
                            }}
                        >
                            <span>Buka Channex App Store</span>
                            <ExternalLink size={14} />
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
