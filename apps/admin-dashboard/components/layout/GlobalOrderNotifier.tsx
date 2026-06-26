'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
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

  useEffect(() => {
    if (!hotelCode || hotelCode === '0') return;

    const colRef = collection(db, 'hotels', hotelCode, 'pos_held_orders');

    const unsub = onSnapshot(colRef, (snap) => {
      const currentIds = new Set<string>(snap.docs.map(d => d.id));

      // Skip first snapshot (initial load)
      if (isInitialRef.current) {
        prevIdsRef.current = currentIds;
        isInitialRef.current = false;
        return;
      }

      // Find genuinely new docs
      const newDocs = snap.docs.filter(d => !prevIdsRef.current.has(d.id));
      prevIdsRef.current = currentIds;

      newDocs.forEach(d => {
        const data = d.data();

        // Freshness check: only alert if created within the last 30s
        if (data.createdAt) {
          const t = typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate().getTime()
            : new Date(data.createdAt).getTime();
          if (Date.now() - t > 30_000) return;
        }

        // Increment badge
        badgeCountRef.current += 1;
        onBadgeChange(badgeCountRef.current);

        // Play sound
        const audio = getAudio();
        if (audio) {
          audio.currentTime = 0;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              toast.warning('Klik layar untuk mengizinkan suara notifikasi!', {
                duration: 8000,
                position: 'top-center',
              });
            });
          }
        }

        // Toast with dismiss = stop sound
        const label = data.source === 'Self-Order Tamu'
          ? `🛎️ Self-Order Tamu`
          : `🔔 Pesanan Held Baru`;
        const detail = `${data.customerName || 'Tamu'} · Meja ${data.tableNumber || '-'}`;

        toast.success(`${label}: ${detail}`, {
          duration: Infinity,
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
          onDismiss: () => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            badgeCountRef.current = Math.max(0, badgeCountRef.current - 1);
            onBadgeChange(badgeCountRef.current);
          },
        });
      });
    }, (err) => {
      console.error('[GlobalOrderNotifier] Firestore error:', err);
    });

    return () => {
      unsub();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [hotelCode, getAudio, onBadgeChange]);

  // No UI — purely a side-effect component
  return null;
}
