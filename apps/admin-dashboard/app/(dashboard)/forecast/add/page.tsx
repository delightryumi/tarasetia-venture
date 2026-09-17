"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import styles from "./TransactionFormStyles.module.css";
import pmsStyles from "./AddReservation.module.css";
import { useTransactionForm } from "./useTransactionForm";
import {
    TerminalHeader,
    RevenueTypeSelector,
    TransactionEntryForm,
    ReviewSidebar,
    QueueTable
} from "./TransactionPanels";

function AddTransactionContent() {
    const router = useRouter();
    const {
        form,
        roomTypes,
        ratePlans,
        selectedRatePlanId,
        onSelectRatePlan,
        saving,
        step,
        setStep,
        revenueType,
        setRevenueType,
        updateForm,
        updateRoom,
        updateNightRate,
        totalGross,
        queue,
        addToQueue,
        removeFromQueue,
        commitTransactions,
        handleCancel,
        getAvailableRoomNumbers,
        addRoom,
        removeRoom,
        isEditMode,
        isLoadingEdit
    } = useTransactionForm();

    React.useEffect(() => {
        const handleWheel = () => {
            const active = document.activeElement as HTMLElement | null;
            if (active && (active.tagName === "INPUT" || active.tagName === "SELECT")) {
                active.blur();
            }
        };
        window.addEventListener("wheel", handleWheel, { passive: true });
        return () => window.removeEventListener("wheel", handleWheel);
    }, []);

    if (isLoadingEdit) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--pms-text-muted, #78716c)' }}>Memuat data reservasi untuk diedit...</span>
            </div>
        );
    }

    const isRoomForm = step === 'form' && revenueType === 'room';

    if (isRoomForm) {
        return (
            <div className={pmsStyles.rootContainer}>
                <div className={pmsStyles.layoutGrid}>
                    <div className={pmsStyles.leftColumn}>
                        <TransactionEntryForm 
                            revenueType={revenueType}
                            form={form}
                            roomTypes={roomTypes}
                            ratePlans={ratePlans}
                            selectedRatePlanId={selectedRatePlanId}
                            onSelectRatePlan={onSelectRatePlan}
                            updateForm={updateForm}
                            updateRoom={updateRoom}
                            addRoom={addRoom}
                            removeRoom={removeRoom}
                            updateNightRate={updateNightRate}
                            onCancel={() => {
                                if (isEditMode) {
                                    handleCancel();
                                } else {
                                    setStep('select');
                                    updateForm("incomeType", "");
                                }
                            }}
                            onSubmit={addToQueue}
                            onCommit={commitTransactions}
                            saving={saving}
                            getAvailableRoomNumbers={getAvailableRoomNumbers}
                            totalGross={totalGross}
                            handleCancel={handleCancel}
                            isEditMode={isEditMode}
                        />
                    </div>

                    <ReviewSidebar 
                        revenueType={revenueType}
                        form={form}
                        roomTypes={roomTypes}
                        totalGross={totalGross}
                        queue={queue}
                        saving={saving}
                        updateForm={updateForm}
                        onCommit={commitTransactions}
                        onSubmit={addToQueue}
                        onCancel={handleCancel}
                        isEditMode={isEditMode}
                    />
                </div>

                {queue.length > 0 && (
                    <div style={{ maxWidth: '1440px', width: '100%', margin: '24px auto 0 auto', boxSizing: 'border-box' }}>
                        <QueueTable 
                            queue={queue}
                            removeFromQueue={removeFromQueue}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={styles.forecastTerminalRoot}>
            <TerminalHeader 
                checkIn={form.checkIn}
                queueLength={queue.length}
                saving={saving}
                onCommit={commitTransactions}
                onBack={() => {
                    if (isEditMode) {
                        handleCancel();
                    } else if (step === 'form') {
                        setStep('select');
                    } else {
                        handleCancel();
                    }
                }}
            />

            <main className={styles.mainContainer}>
                <AnimatePresence mode="wait">
                    {step === 'select' ? (
                        <RevenueTypeSelector 
                            onSelect={(type) => {
                                setRevenueType(type);
                                setStep('form');
                            }}
                        />
                    ) : (
                        <div className={styles.twoColumnLayout}>
                            <div className={styles.leftFormCol}>
                                <TransactionEntryForm 
                                    revenueType={revenueType}
                                    form={form}
                                    roomTypes={roomTypes}
                                    ratePlans={ratePlans}
                                    selectedRatePlanId={selectedRatePlanId}
                                    onSelectRatePlan={onSelectRatePlan}
                                    updateForm={updateForm}
                                    updateRoom={updateRoom}
                                    addRoom={addRoom}
                                    removeRoom={removeRoom}
                                    updateNightRate={updateNightRate}
                                    onCancel={() => {
                                        if (isEditMode) {
                                            handleCancel();
                                        } else {
                                            setStep('select');
                                            updateForm("incomeType", "");
                                        }
                                    }}
                                    onSubmit={addToQueue}
                                    onCommit={commitTransactions}
                                    saving={saving}
                                    getAvailableRoomNumbers={getAvailableRoomNumbers}
                                    totalGross={totalGross}
                                    handleCancel={handleCancel}
                                    isEditMode={isEditMode}
                                />
                            </div>

                            <ReviewSidebar 
                                revenueType={revenueType}
                                form={form}
                                roomTypes={roomTypes}
                                totalGross={totalGross}
                                queue={queue}
                                saving={saving}
                                updateForm={updateForm}
                                onCommit={commitTransactions}
                                onSubmit={addToQueue}
                                onCancel={handleCancel}
                                isEditMode={isEditMode}
                            />
                        </div>
                    )}
                </AnimatePresence>

                <QueueTable 
                    queue={queue}
                    removeFromQueue={removeFromQueue}
                />
            </main>
        </div>
    );
}

export default function AddTransactionPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}><div style={{ width: '48px', height: '48px', border: '2px solid rgba(0,0,0,0.05)', borderTopColor: '#788069', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>}>
            <AddTransactionContent />
        </Suspense>
    );
}
