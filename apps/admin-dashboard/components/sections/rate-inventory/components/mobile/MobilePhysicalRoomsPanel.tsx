"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DoorOpen, Settings2, Check, ArrowRightLeft, AlertTriangle, X } from "lucide-react";
import { RoomTypeInventoryRow, PhysicalRoomOccupant } from "../../RateInventoryTypes";
import { getChannelLogo } from "@/lib/channelHelper";
import s from "./MobilePhysicalRoomsPanel.module.css";

interface MobilePhysicalRoomsPanelProps {
    roomType: RoomTypeInventoryRow;
    selectedDate: string;
    onUpdatePhysicalRooms?: (roomTypeId: string, newRooms: string[]) => Promise<boolean>;
    onMoveBookingRoom?: (
        occupant: PhysicalRoomOccupant,
        newRoomNumber: string,
        newRoomTypeId?: string,
        newRoomTypeName?: string
    ) => Promise<boolean>;
}

export function MobilePhysicalRoomsPanel({
    roomType: rt,
    selectedDate,
    onUpdatePhysicalRooms,
    onMoveBookingRoom
}: MobilePhysicalRoomsPanelProps) {
    const router = useRouter();
    const [isEditingRooms, setIsEditingRooms] = useState<boolean>(false);
    const [roomsInput, setRoomsInput] = useState<string>(() => (rt.physicalRooms || []).join(", "));
    const [savingRooms, setSavingRooms] = useState<boolean>(false);

    const handleVacantClick = (dateStr: string, roomNumber: string) => {
        router.push(`/forecast/add?date=${dateStr}&roomTypeId=${encodeURIComponent(rt.roomTypeId)}&roomNumber=${encodeURIComponent(roomNumber)}&module=front-office&from=rate-inventory`);
    };

    const [activeSheet, setActiveSheet] = useState<{
        roomNumber: string;
        occupants: PhysicalRoomOccupant[];
    } | null>(null);
    const [selectedOccIdx, setSelectedOccIdx] = useState<number>(0);
    const [targetRoom, setTargetRoom] = useState<string>("");
    const [movingRoom, setMovingRoom] = useState<boolean>(false);

    useEffect(() => {
        setRoomsInput((rt.physicalRooms || []).join(", "));
    }, [rt.physicalRooms]);

    const handleSaveRooms = async () => {
        if (!onUpdatePhysicalRooms) return;
        const parsed = roomsInput
            .split(/[,;\n]+/)
            .map(x => x.trim())
            .filter(Boolean);
        setSavingRooms(true);
        const ok = await onUpdatePhysicalRooms(rt.roomTypeId, parsed);
        setSavingRooms(false);
        if (ok) {
            setIsEditingRooms(false);
        }
    };

    const handleOpenMoveSheet = (roomNumber: string, occupants: PhysicalRoomOccupant[]) => {
        if (!occupants || occupants.length === 0) return;
        setActiveSheet({ roomNumber, occupants });
        setSelectedOccIdx(0);
        const freeRoom = (rt.physicalRooms || []).find(rNum => {
            const pRow = (rt.physicalRoomRows || []).find(pr => pr.roomNumber.toUpperCase() === rNum.toUpperCase());
            return !pRow?.days?.[selectedDate]?.isOccupied;
        });
        setTargetRoom(freeRoom || occupants[0].roomNumber || rt.physicalRooms?.[0] || "");
    };

    const handleConfirmMove = async () => {
        if (!activeSheet || !onMoveBookingRoom) return;
        const occ = activeSheet.occupants[selectedOccIdx];
        if (!occ || !targetRoom.trim()) return;
        setMovingRoom(true);
        const ok = await onMoveBookingRoom(occ, targetRoom.trim(), rt.roomTypeId, rt.roomTypeName);
        setMovingRoom(false);
        if (ok) {
            setActiveSheet(null);
        }
    };

    const getMobileChannelTheme = (channel: string) => {
        const ch = (channel || "").toLowerCase();
        if (ch.includes("traveloka")) return s.themeTraveloka;
        if (ch.includes("tiket")) return s.themeTiket;
        if (ch.includes("booking.com") || ch.includes("booking")) return s.themeBooking;
        if (ch.includes("agoda")) return s.themeAgoda;
        if (ch.includes("airbnb")) return s.themeAirbnb;
        if (ch.includes("expedia")) return s.themeExpedia;
        if (ch.includes("trip.com") || ch.includes("ctrip") || ch.includes("trip")) return s.themeTrip;
        if (ch.includes("walk") || ch.includes("direct") || ch.includes("pos")) return s.themeWalkIn;
        if (ch.includes("engine") || ch.includes("web") || ch.includes("drc")) return s.themeBookingEngine;
        return s.themeDefault;
    };

    return (
        <div className={s.panelWrapper}>
            {/* Header Strip */}
            <div className={s.panelHeader}>
                <div className={s.panelTitleGroup}>
                    <DoorOpen size={14} />
                    <span className={s.panelTitle}>Room Inventory ({rt.totalPhysicalRooms} Rooms)</span>
                </div>
                {onUpdatePhysicalRooms && (
                    <button
                        type="button"
                        className={s.editRoomsBtn}
                        onClick={() => setIsEditingRooms(prev => !prev)}
                    >
                        <Settings2 size={13} />
                        <span>{isEditingRooms ? "Close" : "Room Setup"}</span>
                    </button>
                )}
            </div>

            {/* Inline Room Numbers Editor */}
            {isEditingRooms && (
                <div className={s.editorBox}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#71717a" }}>
                        Comma-separated room numbers (e.g. 101, 102, 103):
                    </span>
                    <input
                        type="text"
                        className={s.editorInput}
                        value={roomsInput}
                        onChange={e => setRoomsInput(e.target.value)}
                        placeholder="101, 102, 103"
                    />
                    <div className={s.editorActions}>
                        <button
                            type="button"
                            className={s.btnSecondary}
                            onClick={() => setIsEditingRooms(false)}
                            disabled={savingRooms}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={s.btnPrimary}
                            onClick={handleSaveRooms}
                            disabled={savingRooms}
                        >
                            <Check size={14} />
                            <span>{savingRooms ? "Saving..." : "Save"}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Physical Room Cards Grid for Selected Date */}
            <div className={s.roomsGrid}>
                {(rt.physicalRoomRows || []).map(pRow => {
                    const isUnassigned = Boolean(pRow.isUnassignedBucket);
                    const daySlot = pRow.days?.[selectedDate];
                    const occupants = daySlot?.occupants || [];
                    const isOccupied = occupants.length > 0;
                    const isConflict = occupants.length > 1 || (isUnassigned && isOccupied) || occupants.some(o => o.isOverbooked);

                    if (!isOccupied) {
                        return (
                            <button
                                key={pRow.roomNumber}
                                type="button"
                                onClick={() => handleVacantClick(selectedDate, pRow.roomNumber)}
                                className={`${s.roomSlotCard} ${s.slotEmpty}`}
                                title={`Kamar ${pRow.roomNumber} · Vacant (Klik untuk tambah reservasi)`}
                            >
                                <div className={s.slotTopRow}>
                                    <span className={s.roomNumText}>Room {pRow.roomNumber}</span>
                                    <span className={`${s.slotStatusTag} ${s.tagEmpty}`}>Vacant</span>
                                </div>
                                <span className={s.emptySubText}>+ Tambah Reservasi</span>
                            </button>
                        );
                    }

                    const primaryGuest = occupants[0];
                    const channelLogo = getChannelLogo(primaryGuest.channel);
                    const nights = Math.max(1, Math.round(
                        (new Date(primaryGuest.checkOutDate).getTime() - new Date(primaryGuest.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
                    ) || 1);

                    return (
                        <button
                            key={pRow.roomNumber}
                            type="button"
                            onClick={() => handleOpenMoveSheet(pRow.roomNumber, occupants)}
                            className={[
                                s.roomSlotCard,
                                isConflict ? s.slotConflict : `${s.slotOccupied} ${getMobileChannelTheme(primaryGuest.channel)}`
                            ].join(" ")}
                        >
                            <div className={s.slotTopRow}>
                                <span className={s.roomNumText}>
                                    {isUnassigned ? "UNASSIGNED" : `Room ${pRow.roomNumber}`}
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    {nights > 1 && !isConflict && (
                                        <span className={s.nightsBadge}>
                                            {nights} Nights
                                        </span>
                                    )}
                                    <div className={s.channelLogoBadge} title={primaryGuest.channel}>
                                        <Image
                                            src={channelLogo}
                                            alt={primaryGuest.channel}
                                            width={14}
                                            height={14}
                                            className={s.channelLogoImg}
                                        />
                                        {isConflict && (
                                            <span className={s.conflictTag}>
                                                {occupants.length > 1 ? "DOUBLE" : "OVERBOOK"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <span className={s.guestText}>
                                {occupants.length > 1
                                    ? occupants.map(o => o.guestName).join(" & ")
                                    : primaryGuest.guestName}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Bottom Sheet Modal to Move Guest Room on Mobile */}
            {activeSheet && (
                <div className={s.sheetBackdrop} onClick={() => setActiveSheet(null)}>
                    <div className={s.sheetContainer} onClick={e => e.stopPropagation()}>
                        <div className={s.sheetHandle} />
                        <div className={s.sheetHeader}>
                            <span className={s.sheetTitle}>
                                Reassign Room ({selectedDate})
                            </span>
                            <button
                                type="button"
                                className={s.btnSecondary}
                                style={{ minHeight: 32, padding: "0 8px" }}
                                onClick={() => setActiveSheet(null)}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {activeSheet.occupants.map((occ, idx) => (
                            <div
                                key={`${occ.bookingId}_${idx}`}
                                className={s.occupantPill}
                                onClick={() => setSelectedOccIdx(idx)}
                                style={{
                                    borderColor: idx === selectedOccIdx ? "#09090b" : undefined,
                                    cursor: activeSheet.occupants.length > 1 ? "pointer" : "default"
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                    <strong style={{ fontSize: 13, wordBreak: "break-word" }}>{occ.guestName}</strong>
                                    <div className={s.channelLogoBadge} title={occ.channel}>
                                        <Image
                                            src={getChannelLogo(occ.channel)}
                                            alt={occ.channel}
                                            width={15}
                                            height={15}
                                            className={s.channelLogoImg}
                                        />
                                    </div>
                                </div>
                                <span style={{ fontSize: 11, color: "#71717a" }}>
                                    Stay: {occ.checkInDate} to {occ.checkOutDate} · Room: {occ.roomNumber}
                                </span>
                            </div>
                        ))}

                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#71717a" }}>
                            Select Destination Room:
                        </div>

                        <div className={s.choiceGrid}>
                            {(rt.physicalRooms || []).map(rNum => {
                                const pRow = (rt.physicalRoomRows || []).find(
                                    pr => pr.roomNumber.toUpperCase() === rNum.toUpperCase()
                                );
                                const slot = pRow?.days?.[selectedDate];
                                const isBusy = Boolean(slot?.isOccupied);
                                const busyName = slot?.occupants?.[0]?.guestName;
                                const isSelected = targetRoom.trim().toUpperCase() === rNum.trim().toUpperCase();

                                return (
                                    <button
                                        key={rNum}
                                        type="button"
                                        onClick={() => setTargetRoom(rNum)}
                                        className={`${s.choiceBtn} ${isSelected ? s.choiceBtnActive : ""}`}
                                    >
                                        <span style={{ fontSize: 12.5, fontWeight: 800 }}>Room {rNum}</span>
                                        <span style={{ fontSize: 10, opacity: 0.85 }}>
                                            {isBusy ? `Occupied: ${busyName}` : "Vacant"}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className={s.editorActions} style={{ marginTop: 4 }}>
                            <button
                                type="button"
                                className={s.btnSecondary}
                                onClick={() => setActiveSheet(null)}
                                disabled={movingRoom}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={s.btnPrimary}
                                onClick={handleConfirmMove}
                                disabled={movingRoom || !targetRoom.trim()}
                            >
                                <ArrowRightLeft size={14} />
                                <span>
                                    {movingRoom ? "Reassigning..." : `Reassign to Room ${targetRoom}`}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

