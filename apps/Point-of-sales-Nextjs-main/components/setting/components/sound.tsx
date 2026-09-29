'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { Volume2, Upload, Trash2, Play, Music, Loader2 } from 'lucide-react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

const PRESETS = [
  { id: 'bell', name: 'Lonceng Bell (Default)', path: '/sounds/notification.mp3' },
  { id: 'digital', name: 'Beep Digital', path: '/sounds/digital.mp3' },
  { id: 'chime', name: 'Water Drop Chime', path: '/sounds/chime.mp3' },
];

export default function SoundSettingCard() {
  const [selectedSound, setSelectedSound] = useState<string>('/sounds/notification.mp3');
  const [customSoundName, setCustomSoundName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hotelCode, setHotelCode] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let currentHotelCode = "";
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          if (user?.hotelCode) {
            currentHotelCode = user.hotelCode;
          }
        } catch (e) {}
      }
      if (!currentHotelCode) {
        currentHotelCode = localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode') || '';
      }
      setHotelCode(currentHotelCode);
    }

    if (!currentHotelCode || currentHotelCode === "0") return;

    const hotelRef = doc(db, `hotels/${currentHotelCode}`);
    const unsubscribe = onSnapshot(hotelRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.posSoundUrl) {
          setSelectedSound(data.posSoundUrl);
        } else {
          setSelectedSound('/sounds/notification.mp3'); // default
        }
        if (data.posSoundName) {
          setCustomSoundName(data.posSoundName);
        } else {
          setCustomSoundName(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handlePlaySound = (soundPathOrBase64: string) => {
    try {
      const audio = new Audio(soundPathOrBase64);
      audio.volume = 1.0;
      audio.play().catch(err => {
        console.error('Play blocked:', err);
        toast.error('Autoplay diblokir browser. Klik layar terlebih dahulu.');
      });
    } catch (e) {
      toast.error('Gagal memutar audio.');
    }
  };

  const handleSelectPreset = async (path: string) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_sound_url', path);
        window.dispatchEvent(new Event('soundChanged'));
      }
      setSelectedSound(path);
      setCustomSoundName(null);
      const effectiveCode = hotelCode || (typeof window !== 'undefined' ? (localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode') || '') : '');
      if (effectiveCode && effectiveCode !== '0') {
        const hotelRef = doc(db, `hotels/${effectiveCode}`);
        await updateDoc(hotelRef, {
          posSoundUrl: path,
          posSoundName: null
        });
      }
      toast.success('Nada preset aktif dan berhasil disimpan ke cloud!');
      handlePlaySound(path);
    } catch (e) {
      console.error('Save preset error:', e);
      toast.error('Gagal menyimpan pengaturan nada.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error('File terlalu besar! Maksimal 1MB.');
      return;
    }

    const effectiveCode = hotelCode || (typeof window !== 'undefined' ? (localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode') || '') : '');

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'mp3';
      const storageRef = ref(storage, `attachments/settings_${effectiveCode}/pos_sound_${Date.now()}.${ext}`);
      
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_sound_url', downloadUrl);
        window.dispatchEvent(new Event('soundChanged'));
      }
      setSelectedSound(downloadUrl);
      setCustomSoundName(file.name);

      if (effectiveCode && effectiveCode !== '0') {
        const hotelRef = doc(db, `hotels/${effectiveCode}`);
        await updateDoc(hotelRef, {
          posSoundUrl: downloadUrl,
          posSoundName: file.name
        });
      }

      toast.success('Nada kustom aktif dan tersinkronisasi ke semua terminal!');
      handlePlaySound(downloadUrl);
    } catch (error) {
      console.error('Error uploading sound:', error);
      toast.error('Gagal mengunggah file nada.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetToDefault = async () => {
    const defaultPath = '/sounds/notification.mp3';
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_sound_url', defaultPath);
        window.dispatchEvent(new Event('soundChanged'));
      }
      setSelectedSound(defaultPath);
      setCustomSoundName(null);
      const effectiveCode = hotelCode || (typeof window !== 'undefined' ? (localStorage.getItem('active_hotel_code') || localStorage.getItem('hotelCode') || '') : '');
      if (effectiveCode && effectiveCode !== '0') {
        const hotelRef = doc(db, `hotels/${effectiveCode}`);
        await updateDoc(hotelRef, {
          posSoundUrl: defaultPath,
          posSoundName: null
        });
      }
      toast.info('Kembali menggunakan nada default.');
      handlePlaySound(defaultPath);
    } catch (e) {
      console.error('Reset error:', e);
      toast.error('Gagal mereset nada.');
    }
  };

  return (
    <Card x-chunk="dashboard-04-chunk-5" className="my-5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-stone-900 dark:text-white" />
          Nada Notifikasi Kasir
        </CardTitle>
        <CardDescription>
          Kustomisasi nada alarm yang berbunyi saat ada pesanan baru. Berlaku terpusat secara real-time untuk <strong>semua Kasir, Layar Kitchen, dan Admin Dashboard</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset Tones Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider block">Pilih Nada Preset</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESETS.map((preset) => {
              const isActive = selectedSound === preset.path;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.path)}
                  className={`p-3 border rounded-xl cursor-pointer select-none flex items-center justify-between transition-all relative ${
                    isActive 
                      ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20 shadow-sm' 
                      : 'bg-white hover:bg-neutral-50 dark:bg-zinc-900 border-neutral-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Music className={`h-4 w-4 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300'}`} />
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${isActive ? 'text-emerald-950 dark:text-emerald-100' : 'text-neutral-800 dark:text-neutral-200'}`}>
                        {preset.name}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Aktif (ON)
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySound(preset.path);
                    }}
                    className={`p-1.5 rounded-lg border-none cursor-pointer flex items-center justify-center transition-colors ${
                      isActive 
                        ? 'bg-emerald-200/60 hover:bg-emerald-300/60 text-emerald-900' 
                        : 'hover:bg-neutral-200 text-stone-700 bg-transparent'
                    }`}
                    title="Test Putar Nada"
                  >
                    <Play size={12} fill="currentColor" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom MP3 Upload */}
        <div className="pt-2">
          <label className="text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider block mb-2">Unggah Nada Kustom (.mp3/.wav)</label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input
              type="file"
              accept="audio/mp3,audio/wav,audio/mpeg"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 transition-colors"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? 'Mengunggah...' : 'Unggah File Audio'}
            </Button>
            {customSoundName && (
              <div className="flex items-center gap-3 bg-neutral-100 p-2.5 rounded-xl border">
                <span className="text-xs font-bold text-neutral-700 truncate max-w-[200px]">{customSoundName}</span>
                <button
                  onClick={() => handlePlaySound(selectedSound)}
                  className="p-1.5 rounded-full hover:bg-neutral-200 text-stone-700 bg-transparent border-none cursor-pointer flex items-center"
                  title="Putar Kustom"
                >
                  <Play size={12} fill="currentColor" />
                </button>
                <button
                  onClick={handleResetToDefault}
                  className="p-1.5 rounded-full hover:bg-red-100 text-red-600 bg-transparent border-none cursor-pointer flex items-center"
                  title="Hapus Kustom"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Pengaturan suara kustom disimpan di Cloud (Firebase Storage) dan akan tersinkronisasi ke seluruh terminal Kasir & Dapur secara real-time.
        </p>
      </CardFooter>
    </Card>
  );
}
