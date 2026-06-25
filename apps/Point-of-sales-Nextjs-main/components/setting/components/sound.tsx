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
import { Volume2, Upload, Trash2, Play, Music } from 'lucide-react';

const PRESETS = [
  { id: 'bell', name: 'Lonceng Bell (Default)', path: '/sounds/notification.mp3' },
  { id: 'digital', name: 'Beep Digital', path: '/sounds/digital.mp3' },
  { id: 'chime', name: 'Water Drop Chime', path: '/sounds/chime.mp3' },
];

export default function SoundSettingCard() {
  const [selectedSound, setSelectedSound] = useState<string>('/sounds/notification.mp3');
  const [customSoundName, setCustomSoundName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedSound = localStorage.getItem('pos_sound_choice');
    const savedName = localStorage.getItem('pos_sound_custom_name');
    if (savedSound) {
      setSelectedSound(savedSound);
    }
    if (savedName) {
      setCustomSoundName(savedName);
    }
  }, []);

  const handlePlaySound = (soundPathOrBase64: string) => {
    try {
      const audio = new Audio(soundPathOrBase64);
      audio.volume = 0.8;
      audio.play().catch(err => {
        console.error('Play blocked:', err);
        toast.error('Autoplay diblokir browser. Klik layar terlebih dahulu.');
      });
    } catch (e) {
      toast.error('Gagal memutar audio.');
    }
  };

  const handleSelectPreset = (path: string) => {
    setSelectedSound(path);
    localStorage.setItem('pos_sound_choice', path);
    localStorage.removeItem('pos_sound_custom_name');
    setCustomSoundName(null);
    toast.success('Nada preset berhasil diterapkan!');
    handlePlaySound(path);
    // Dispatch event so layout.tsx reloads audio immediately
    window.dispatchEvent(new Event('soundChanged'));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      toast.error('File terlalu besar! Maksimal 800KB untuk efisiensi penyimpanan.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setSelectedSound(base64String);
      setCustomSoundName(file.name);
      localStorage.setItem('pos_sound_choice', base64String);
      localStorage.setItem('pos_sound_custom_name', file.name);
      toast.success('Nada kustom berhasil diunggah!');
      handlePlaySound(base64String);
      window.dispatchEvent(new Event('soundChanged'));
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefault = () => {
    const defaultPath = '/sounds/notification.mp3';
    setSelectedSound(defaultPath);
    setCustomSoundName(null);
    localStorage.setItem('pos_sound_choice', defaultPath);
    localStorage.removeItem('pos_sound_custom_name');
    toast.info('Kembali menggunakan nada default.');
    handlePlaySound(defaultPath);
    window.dispatchEvent(new Event('soundChanged'));
  };

  return (
    <Card x-chunk="dashboard-04-chunk-5" className="my-5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-stone-900 dark:text-white" />
          Nada Notifikasi Kasir
        </CardTitle>
        <CardDescription>
          Kustomisasi nada alarm yang berbunyi saat ada pesanan baru. Berlaku di <strong>kasir POS</strong> maupun <strong>Admin Dashboard</strong> pada perangkat yang sama.
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
                  className={`p-3 border rounded-xl cursor-pointer select-none flex items-center justify-between transition-all ${
                    isActive ? 'border-stone-900 bg-stone-50' : 'bg-white hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-stone-700" />
                    <span className="text-xs font-semibold">{preset.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySound(preset.path);
                    }}
                    className="p-1 rounded-lg hover:bg-neutral-200 text-stone-700 bg-transparent border-none cursor-pointer flex items-center justify-center"
                    title="Test Putar"
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
              className="flex items-center gap-2 bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Unggah File Audio
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
          Pengaturan suara kustom disimpan secara lokal pada per-komputer kasir ini.
        </p>
      </CardFooter>
    </Card>
  );
}
