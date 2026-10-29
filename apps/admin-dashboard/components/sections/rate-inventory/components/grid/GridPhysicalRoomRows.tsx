"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { DoorOpen, AlertTriangle, Check, X, ArrowRightLeft } from "lucide-react";
import { RoomTypeInventoryRow, PhysicalRoomOccupant } from "../../RateInventoryTypes";
import { getChannelLogo } from "@/lib/channelHelper";
import styles from "./GridPhysicalRoomRows.module.css";

interface GridPhysicalRoomRowsProps {
    roomType: RoomTypeInventoryRow;
    dateList: string[];
    todayStr: string;
    isEditingRooms: boolean;
    onCloseEditRooms: () => void;
    onUpdatePhysicalRooms?: (roomTypeId: string, newRooms: string[]) => Promise<boolean>;
    onMoveBookingRoom?: (
        occupant: PhysicalRoomOccupant,
        newRoomNumber: string,
        newRoomTypeId?: string,
        newRoomTypeName?: string
    ) => Promise<boolean>;
}

export const GridPhysicalRoomRows = React.memo(function GridPhysicalRoomRows({
    roomType: rt,
    dateList,
    todayStr,
    isEditingRooms,
    onCloseEditRooms,
    onUpdatePhysicalRooms,
    onMoveBookingRoom
}: GridPhysicalRoomRowsProps) {
    const [roomsInputText, setRoomsInputText] = useState<string>(() => (rt.physicalRooms || []).join(", "));
    const [savingRooms, setSavingRooms] = useState<boolean>(false);

    // Selected cell modal state for viewing & moving guest room
    const [activeMoveModal, setActiveMoveModal] = useState<{
        dateStr: string;
        roomNumber: string;
        occupants: PhysicalRoomOccupant[];
    } | null>(null);
    const [selectedOccupantIdx, setSelectedOccupantIdx] = useState<number>(0);
    const [targetRoomNum, setTargetRoomNum] = useState<string>("");
    const [movingRoom, setMovingRoom] = useState<boolean>(false);

    useEffect(() => {
        setRoomsInputText((rt.physicalRooms || []).join(", "));
    }, [rt.physicalRooms]);

    useEffect(() => {
        if (!activeMoveModal) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setActiveMoveModal(null);
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [activeMoveModal]);

    const handleSaveRoomList = async () => {
        if (!onUpdatePhysicalRooms) return;
        const parsed = roomsInputText
            .split(/[,;\n]+/)
            .map(s => s.trim())
            .filter(Boolean);
        setSavingRooms(true);
        const ok = await onUpdatePhysicalRooms(rt.roomTypeId, parsed);
        setSavingRooms(false);
        if (ok) {
            onCloseEditRooms();
        }
    };

    const handleOpenMoveModal = (dateStr: string, roomNumber: string, occupants: PhysicalRoomOccupant[]) => {
        if (!occupants || occupants.length === 0) return;
        setActiveMoveModal({ dateStr, roomNumber, occupants });
        setSelectedOccupantIdx(0);
        const firstOcc = occupants[0];
        const firstFree = (rt.physicalRooms || []).find(rNum => {
            const row = rt.physicalRoomRows.find(pr => pr.roomNumber.toUpperCase() === rNum.toUpperCase());
            return !row?.days[dateStr]?.isOccupied;
        });
        setTargetRoomNum(firstFree || firstOcc.roomNumber || rt.physicalRooms?.[0] || "");
    };

    const handleConfirmMoveRoom = async () => {
        if (!activeMoveModal || !onMoveBookingRoom) return;
        const targetOcc = activeMoveModal.occupants[selectedOccupantIdx];
        if (!targetOcc || !targetRoomNum.trim()) return;
        setMovingRoom(true);
        const ok = await onMoveBookingRoom(targetOcc, targetRoomNum.trim(), rt.roomTypeId, rt.roomTypeName);
        setMovingRoom(false);
        if (ok) {
            setActiveMoveModal(null);
        }
    };

    const getChannelThemeClass = (channel: string) => {
        const ch = (channel || "").toLowerCase();
        if (ch.includes("traveloka")) return styles.themeTraveloka;
        if (ch.includes("tiket")) return styles.themeTiket;
        if (ch.includes("booking.com") || ch.includes("booking")) return styles.themeBooking;
        if (ch.includes("agoda")) return styles.themeAgoda;
        if (ch.includes("airbnb")) return styles.themeAirbnb;
        if (ch.includes("expedia")) return styles.themeExpedia;
        if (ch.includes("trip.com") || ch.includes("ctrip") || ch.includes("trip")) return styles.themeTrip;
        if (ch.includes("walk") || ch.includes("direct") || ch.includes("pos")) return styles.themeWalkIn;
        if (ch.includes("engine") || ch.includes("web") || ch.includes("drc")) return styles.themeBookingEngine;
        return styles.themeDefault;
    };

    return (
        <React.Fragment>
            {/* 1. Optional Inline Editor for Physical Room Numbers */}
            {isEditingRooms && (
                <tr className={styles.editorRow}>
                    <td colSpan={dateList.length + 2}>
                        <div className={styles.editorContainer}>
                            <div className={styles.editorLeft}>
                                <span className={styles.editorLabel}>
                                    Room Inventory Setup ({rt.roomTypeName}):
                                </span>
                                <input
                                    type="text"
                                    className={styles.editorInput}
                                    value={roomsInputText}
                                    onChange={e => setRoomsInputText(e.target.value)}
                                    placeholder="Comma separated, e.g. 101, 102, 103"
                                />
                                <span className={styles.editorHint}>
                                    Total capacity: {rt.totalPhysicalRooms} rooms
                                </span>
                            </div>
                            <div className={styles.editorActions}>
                                <button
                                    type="button"
                                    className={styles.btnCancelRooms}
                                    onClick={onCloseEditRooms}
                                    disabled={savingRooms}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className={styles.btnSaveRooms}
                                    onClick={handleSaveRoomList}
                                    disabled={savingRooms}
                                >
                                    <Check size={13} />
                                    <span>{savingRooms ? "Saving..." : "Save Rooms"}</span>
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            )}

            {/* 2. Per-Physical-Room Sub-Rows */}
            {(rt.physicalRoomRows || []).map(pRow => {
                const isUnassigned = Boolean(pRow.isUnassignedBucket);

                return (
                    <tr
                        key={`${rt.roomTypeId}_phys_${pRow.roomNumber}`}
                        className={[
                            styles.subRow,
                            isUnassigned ? styles.subRowConflict : ""
                        ].filter(Boolean).join(" ")}
                    >
                        <td
                            className={[
                                styles.roomLabelCell,
                                isUnassigned ? styles.roomLabelCellUnassigned : ""
                            ].filter(Boolean).join(" ")}
                        >
                            <div className={styles.roomLabelLeft}>
                                <span
                                    className={[
                                        styles.roomNumBadge,
                                        isUnassigned ? styles.roomNumBadgeDanger : ""
                                    ].filter(Boolean).join(" ")}
                                >
                                    {isUnassigned ? (
                                        <AlertTriangle size={11} />
                                    ) : (
                                        <DoorOpen size={11} />
                                    )}
                                    <span>{isUnassigned ? "UNASSIGNED" : `Room ${pRow.roomNumber}`}</span>
                                </span>
                                {isUnassigned && (
                                    <span className={styles.roomSubLabel}>
                                        Pending Allocation
                                    </span>
                                )}
                            </div>
                        </td>

                        {(() => {
                            const cells: React.ReactNode[] = [];
                            let i = 0;

                            while (i < dateList.length) {
                                const dateStr = dateList[i];
                                const daySlot = pRow.days[dateStr];
                                const occupants = daySlot?.occupants || [];
                                const isOccupied = occupants.length > 0;
                                const isConflict = occupants.length > 1 || (isUnassigned && isOccupied) || occupants.some(o => o.isOverbooked);
                                const isToday = dateStr === todayStr;
                                const isWeekend = rt.days[dateStr]?.isWeekend ?? false;

                                const cellClasses = [
                                    styles.dayCell,
                                    isWeekend ? styles.dayCellWeekend : "",
                                    isToday ? styles.dayCellToday : "",
                                    isConflict ? styles.dayCellConflict : ""
                                ].filter(Boolean).join(" ");

                                if (!isOccupied) {
                                    cells.push(
                                        <td key={dateStr} className={cellClasses} title={`Room ${pRow.roomNumber} · Vacant on ${dateStr}`}>
                                            <span className={styles.emptySlotPill}>Vacant</span>
                                        </td>
                                    );
                                    i++;
                                    continue;
                                }

                                const primaryGuest = occupants[0];
                                const allSpanOccupants = [...occupants];

                                // Merge consecutive columns only if same booking or exact matching guest name (including title)
                                let span = 1;
                                if (!isConflict) {
                                    while (i + span < dateList.length) {
                                        const nextDate = dateList[i + span];
                                        const nextSlot = pRow.days[nextDate];
                                        const nextOccupants = nextSlot?.occupants || [];
                                        if (nextOccupants.length !== 1) break;
                                        const nextGuest = nextOccupants[0];

                                        const isSameBooking = Boolean(
                                            nextGuest.bookingId && primaryGuest.bookingId &&
                                            nextGuest.bookingId === primaryGuest.bookingId
                                        );
                                        const isSameGuestExtend = Boolean(
                                            nextGuest.guestName && primaryGuest.guestName &&
                                            nextGuest.guestName.trim().toLowerCase() === primaryGuest.guestName.trim().toLowerCase()
                                        );

                                        if (isSameBooking || isSameGuestExtend) {
                                            span++;
                                            if (!allSpanOccupants.some(o => o.bookingId === nextGuest.bookingId)) {
                                                allSpanOccupants.push(nextGuest);
                                            }
                                        } else {
                                            break;
                                        }
                                    }
                                }

                                const channelLogo = getChannelLogo(primaryGuest.channel);
                                const tooltipText = allSpanOccupants
                                    .map(o => `${o.guestName} (${o.channel}) [${o.checkInDate} s/d ${o.checkOutDate}]`)
                                    .join(" | ");

                                cells.push(
                                    <td
                                        key={`${dateStr}_${primaryGuest.bookingId || primaryGuest.guestName}`}
                                        colSpan={span}
                                        className={cellClasses}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleOpenMoveModal(dateStr, pRow.roomNumber, allSpanOccupants)}
                                            className={[
                                                isConflict ? styles.conflictPillBtn : styles.occupiedPillBtn,
                                                !isConflict ? getChannelThemeClass(primaryGuest.channel) : "",
                                                span > 1 ? styles.occupiedPillBtnSpanned : ""
                                            ].filter(Boolean).join(" ")}
                                            title={`${tooltipText} | Room ${pRow.roomNumber} · Occupied (${span > 1 ? `${span} Nights Extend` : "1 Night"}) · Click to reassign`}
                                        >
                                            <div className={styles.pillTopRow}>
                                                <div className={styles.channelLogoBadge} title={primaryGuest.channel}>
                                                    <Image
                                                        src={channelLogo}
                                                        alt={primaryGuest.channel}
                                                        width={14}
                                                        height={14}
                                                        className={styles.channelLogoImg}
                                                    />
                                                </div>
                                                {span > 1 && (
                                                    <span className={styles.nightsBadge} title={`Stay / Extend (${span} Malam berturut-turut)`}>
                                                        {span} Nights
                                                    </span>
                                                )}
                                                {isConflict && (
                                                    <span className={styles.conflictBadge}>
                                                        {occupants.length > 1 ? "DOUBLE" : "OVERBOOK"}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={styles.guestFullName}>
                                                {occupants.length > 1
                                                    ? occupants.map(o => o.guestName).join(" & ")
                                                    : primaryGuest.guestName}
                                            </span>
                                        </button>
                                    </td>
                                );

                                i += span;
                            }

                            return cells;
                        })()}

                        <td />
                    </tr>
                );
            })}

            {/* 3. Modal Dialog to Move / Assign Guest Physical Room */}
            {activeMoveModal && typeof document !== "undefined" && createPortal(
                <div
                    className={styles.modalBackdrop}
                    onClick={() => setActiveMoveModal(null)}
                >
                    <div
                        className={styles.modalBox}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <div>
                                <div className={styles.modalTag}>
                                    ROOM REASSIGNMENT · {rt.roomTypeName}
                                </div>
                                <div className={styles.modalTitle}>
                                    Reassign Room ({activeMoveModal.dateStr})
                                </div>
                            </div>
                            <button
                                type="button"
                                className={styles.modalCloseBtn}
                                onClick={() => setActiveMoveModal(null)}
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {activeMoveModal.occupants.length > 1 && (
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", padding: "8px 10px", borderRadius: 8 }}>
                                    Room conflict detected: {activeMoveModal.occupants.length} reservations on this slot. Select a guest below to reassign to an available room:
                                </div>
                            )}

                            {/* Occupant Selector */}
                            {activeMoveModal.occupants.map((occ, idx) => {
                                const isSel = idx === selectedOccupantIdx;
                                return (
                                    <div
                                        key={`${occ.bookingId}_${idx}`}
                                        className={styles.occupantCard}
                                        style={{
                                            cursor: activeMoveModal.occupants.length > 1 ? "pointer" : "default",
                                            borderColor: isSel ? "#09090b" : undefined
                                        }}
                                        onClick={() => setSelectedOccupantIdx(idx)}
                                    >
                                        <div className={styles.occupantTop}>
                                            <span className={styles.occupantName}>{occ.guestName}</span>
                                            <div className={styles.channelLogoBadge} title={occ.channel}>
                                                <Image
                                                    src={getChannelLogo(occ.channel)}
                                                    alt={occ.channel}
                                                    width={15}
                                                    height={15}
                                                    className={styles.channelLogoImg}
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.occupantMeta}>
                                            <span>Check-in: {occ.checkInDate}</span>
                                            <span>Check-out: {occ.checkOutDate}</span>
                                            <span>Current Room: <strong>Room {occ.roomNumber}</strong></span>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Target Physical Room Grid */}
                            <div>
                                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#71717a", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    Select Destination Room:
                                </div>
                                <div className={styles.roomSelectGrid}>
                                    {(rt.physicalRooms || []).map(rNum => {
                                        const pRow = rt.physicalRoomRows.find(
                                            pr => pr.roomNumber.toUpperCase() === rNum.toUpperCase()
                                        );
                                        const slotOnDate = pRow?.days[activeMoveModal.dateStr];
                                        const isBusy = Boolean(slotOnDate?.isOccupied);
                                        const busyGuest = slotOnDate?.occupants?.[0]?.guestName;
                                        const isActive = targetRoomNum.trim().toUpperCase() === rNum.trim().toUpperCase();

                                        return (
                                            <button
                                                key={rNum}
                                                type="button"
                                                onClick={() => setTargetRoomNum(rNum)}
                                                className={[
                                                    styles.roomChoiceBtn,
                                                    isBusy ? styles.roomChoiceBusy : styles.roomChoiceFree,
                                                    isActive ? styles.roomChoiceActive : ""
                                                ].filter(Boolean).join(" ")}
                                            >
                                                <span className={styles.roomChoiceNum}>Room {rNum}</span>
                                                <span className={styles.roomChoiceStatus}>
                                                    {isBusy ? `Occupied: ${busyGuest}` : "Vacant"}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                className={styles.btnCancelRooms}
                                onClick={() => setActiveMoveModal(null)}
                                disabled={movingRoom}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={styles.btnSaveRooms}
                                onClick={handleConfirmMoveRoom}
                                disabled={movingRoom || !targetRoomNum.trim()}
                            >
                                <ArrowRightLeft size={13} />
                                <span>
                                    {movingRoom
                                        ? "Reassigning..."
                                        : `Reassign to Room ${targetRoomNum}`}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </React.Fragment>
    );
});
