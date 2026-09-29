'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { collection, doc, onSnapshot, query, orderBy, limit, QuerySnapshot, DocumentData, DocumentChange } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface GlobalOrderNotifierProps {
  hotelCode: string;
  onBadgeChange: (count: number) => void;
}

export function GlobalOrderNotifier({ hotelCode, onBadgeChange }: GlobalOrderNotifierProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const isInitialRef = useRef(true);
  const badgeCountRef = useRef(0);

  const posSoundUrlRef = useRef<string>('/sounds/notification.mp3');

  useEffect(() => {
    if (!hotelCode || hotelCode === '0') return;
    const hotelRef = doc(db, 'hotels', hotelCode);
    const unsub = onSnapshot(hotelRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.posSoundUrl && data.posSoundUrl !== posSoundUrlRef.current) {
          posSoundUrlRef.current = data.posSoundUrl;
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
        }
      }
    });
    return () => unsub();
  }, [hotelCode]);

  const getSoundPath = useCallback((): string => {
    return posSoundUrlRef.current || '/sounds/notification.mp3';
  }, []);

  // Preload & unlock audio on first user interaction
  const getAudio = useCallback(() => {
    if (!audioRef.current && typeof window !== 'undefined') {
      audioRef.current = new Audio(getSoundPath());
      audioRef.current.volume = 1.0;
      audioRef.current.loop = true;
    }
    return audioRef.current;
  }, [getSoundPath]);

  // Re-init audio when user changes sound in POS settings
  useEffect(() => {
    const handleSoundChanged = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null; // will be re-created on next alert
      }
    };
    window.addEventListener('soundChanged', handleSoundChanged);
    return () => window.removeEventListener('soundChanged', handleSoundChanged);
  }, []);

  useEffect(() => {
    const unlock = () => {
      const audio = getAudio();
      if (audio) {
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [getAudio]);

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  useEffect(() => {
    // Let FoodBeverageRealtimeTab manage audio on the realtime KDS page
    if (pathname.includes('/food-beverage/realtime')) return;
    if (!hotelCode || hotelCode === '0') return;

    const colHeldRef = collection(db, 'hotels', hotelCode, 'pos_held_orders');
    let isInitialHeld = true;

    const unsubHeld = onSnapshot(colHeldRef, (snap: QuerySnapshot<DocumentData>) => {
      if (isInitialHeld) {
        isInitialHeld = false;
        return;
      }

      snap.docChanges().forEach((change: DocumentChange<DocumentData>) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.status === 'CANCELLED' || data.status === 'VOID') return;

          let isFresh = true;
          if (data.createdAt) {
            const t = typeof data.createdAt.toDate === 'function'
              ? data.createdAt.toDate().getTime()
              : new Date(data.createdAt).getTime();
            if (!isNaN(t) && Date.now() - t > 60_000) isFresh = false;
          }

          if (isFresh) {
            badgeCountRef.current += 1;
            onBadgeChange(badgeCountRef.current);

            const audio = getAudio();
            if (audio) {
              audio.currentTime = 0;
              audio.play().catch(() => {});
            }

            const label = data.source === 'Self-Order Tamu' ? '🛎️ Self-Order Tamu' : '🔔 Pesanan Held Baru';
            const detail = `${data.customerName || 'Tamu'} · Meja ${data.tableNumber || '-'}`;

            toast.info(`${label}: ${detail}`, {
              duration: 8000,
              position: 'top-right',
              action: {
                label: 'Matikan',
                onClick: () => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                  }
                  badgeCountRef.current = Math.max(0, badgeCountRef.current - 1);
                  onBadgeChange(badgeCountRef.current);
                },
              },
            });
          }
        }
      });
    }, (err: any) => {
      console.error('[GlobalOrderNotifier] Firestore held error:', err);
    });

    const colPaidRef = query(collection(db, 'hotels', hotelCode, 'pos_orders'), orderBy('timestamp', 'desc'), limit(10));
    let isInitialPaid = true;

    const unsubPaid = onSnapshot(colPaidRef, (snap: QuerySnapshot<DocumentData>) => {
      if (isInitialPaid) {
        isInitialPaid = false;
        return;
      }

      snap.docChanges().forEach((change: DocumentChange<DocumentData>) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.status === 'CANCELLED' || data.status === 'VOID') return;

          let isFresh = true;
          let orderTime = 0;
          if (data.timestamp) {
            orderTime = typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate().getTime() : new Date(data.timestamp).getTime();
          } else if (data.createdAt) {
            orderTime = typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().getTime() : new Date(data.createdAt).getTime();
          }
          if (orderTime && Date.now() - orderTime > 60_000) isFresh = false;

          if (isFresh) {
            badgeCountRef.current += 1;
            onBadgeChange(badgeCountRef.current);

            const audio = getAudio();
            if (audio) {
              audio.currentTime = 0;
              audio.play().catch(() => {});
            }

            const detail = `${data.customerName || 'Tamu'} · Meja ${data.tableNumber || '-'}`;
            toast.info(`💰 Transaksi Kasir Selesai: ${detail}`, {
              duration: 8000,
              position: 'top-right',
              action: {
                label: 'Matikan',
                onClick: () => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                  }
                  badgeCountRef.current = Math.max(0, badgeCountRef.current - 1);
                  onBadgeChange(badgeCountRef.current);
                },
              },
            });
          }
        }
      });
    }, (err: any) => {
      console.error('[GlobalOrderNotifier] Firestore paid error:', err);
    });

    return () => {
      unsubHeld();
      unsubPaid();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [hotelCode, getAudio, onBadgeChange, pathname]);

  // No UI — purely a side-effect component
  return null;
}
