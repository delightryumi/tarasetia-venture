'use client';

import React, { useEffect, useCallback } from 'react';

/**
 * OrientationController (Silent Landscape Enforcer)
 * Automatically requests screen orientation lock to landscape without any annoying popups or modals.
 * Works hand-in-hand with .pos-forced-landscape-root in globals.css.
 */
export const OrientationController: React.FC = () => {
  const attemptLockLandscape = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && 'screen' in window && 'orientation' in window.screen) {
        const orientation = window.screen.orientation as any;
        if (orientation && typeof orientation.lock === 'function') {
          await orientation.lock('landscape').catch(() => {
            // Silently catch unsupported browsers without showing errors
          });
        }
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  useEffect(() => {
    // Attempt lock on initial mount
    attemptLockLandscape();

    // Re-attempt on orientation change or screen resize
    const handleOrientationChange = () => {
      setTimeout(attemptLockLandscape, 150);
    };

    // On user's first touch or click, trigger silent lock
    const handleInteraction = () => {
      attemptLockLandscape();
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('pointerdown', handleInteraction, { passive: true });
    window.addEventListener('click', handleInteraction, { passive: true });

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [attemptLockLandscape]);

  // Completely silent - no UI popups rendered
  return null;
};

export default OrientationController;
