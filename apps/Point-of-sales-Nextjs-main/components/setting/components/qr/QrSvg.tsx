'use client';
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrSvgProps {
  value: string;
  size?: number;
  className?: string;
  title?: string;
}

export function QrSvg({ value, size = 160, className = '', title }: QrSvgProps) {
  const [svgString, setSvgString] = useState<string>('');

  useEffect(() => {
    if (!value) return;
    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'Q',
      width: size,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(svg => setSvgString(svg))
      .catch(err => console.error('Error generating QR SVG:', err));
  }, [value, size]);

  if (!svgString) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`flex items-center justify-center bg-neutral-100 dark:bg-stone-800 rounded-lg animate-pulse ${className}`}
      />
    );
  }

  return (
    <div
      title={title}
      className={`inline-block select-none [&>svg]:w-full [&>svg]:h-full [&>svg]:block ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}

/**
 * Downloads QR as high resolution PNG
 */
export async function downloadQrPng(url: string, filename: string, size = 1000) {
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      margin: 2,
      width: size,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${filename || 'qr-code'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Failed to download PNG QR:', err);
  }
}

/**
 * Downloads QR as scalable vector SVG
 */
export async function downloadQrSvg(url: string, filename: string) {
  try {
    const svgStr = await QRCode.toString(url, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${filename || 'qr-code'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Failed to download SVG QR:', err);
  }
}
