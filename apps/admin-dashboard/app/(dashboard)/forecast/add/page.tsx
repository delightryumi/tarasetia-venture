"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import styles from "./TransactionFormStyles.module.css";
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
        handleCancel
    } = useTransactionForm();

    return (
        <div className={styles.forecastTerminalRoot}>
            <TerminalHeader 
                checkIn={form.checkIn}
                queueLength={queue.length}
                saving={saving}
                onCommit={commitTransactions}
                onBack={() => {
                    if (step === 'form') {
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
                                    updateForm={updateForm}
                                    updateRoom={updateRoom}
                                    updateNightRate={updateNightRate}
                                    onCancel={() => {
                                        setStep('select');
                                        updateForm({ incomeType: "" });
                                    }}
                                    onSubmit={addToQueue}
                                />
                            </div>

                            <ReviewSidebar 
                                revenueType={revenueType}
                                form={form}
                                roomTypes={roomTypes}
                                totalGross={totalGross}
                                queue={queue}
                                saving={saving}
                                onCommit={commitTransactions}
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
