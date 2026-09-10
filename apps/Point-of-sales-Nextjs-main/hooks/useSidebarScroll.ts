import { useEffect, useRef } from 'react';

/**
 * useSidebarScroll
 * Provides flawless touch-drag and mouse-wheel scrolling for the POS sidebar
 * in both normal landscape orientation and CSS-rotated forced-landscape portrait orientation.
 */
export function useSidebarScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isTouching = false;
    let lastX = 0;
    let lastY = 0;
    let velocity = 0;
    let lastTime = 0;
    let animFrame: number | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (animFrame) {
        cancelAnimationFrame(animFrame);
        animFrame = null;
      }
      if (e.touches.length !== 1) return;
      isTouching = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      lastTime = Date.now();
      velocity = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouching || e.touches.length !== 1) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const now = Date.now();

      const deltaX = currentX - lastX;
      const deltaY = currentY - lastY;

      // Detect if in CSS forced-landscape rotated portrait
      const isPortrait =
        (typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches) ||
        (typeof window !== 'undefined' && window.innerHeight > window.innerWidth);

      let delta = 0;
      if (isPortrait) {
        // In 90deg clockwise rotation:
        // Physical vertical swipe (deltaY) or horizontal swipe (deltaX)
        if (Math.abs(deltaY) >= Math.abs(deltaX)) {
          delta = deltaY;
        } else {
          delta = -deltaX;
        }
      } else {
        delta = deltaY;
      }

      const dt = now - lastTime;
      if (dt > 0) {
        velocity = delta / dt;
      }

      lastX = currentX;
      lastY = currentY;
      lastTime = now;

      // Scroll content
      el.scrollTop -= delta;
    };

    const onTouchEnd = () => {
      if (!isTouching) return;
      isTouching = false;

      // Momentum / inertia scrolling
      if (Math.abs(velocity) > 0.15) {
        let currentVelocity = velocity * 12;
        const step = () => {
          if (Math.abs(currentVelocity) < 0.5) return;
          el.scrollTop -= currentVelocity;
          currentVelocity *= 0.92;
          animFrame = requestAnimationFrame(step);
        };
        animFrame = requestAnimationFrame(step);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      el.scrollTop += delta;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  return ref;
}
