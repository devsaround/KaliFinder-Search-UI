import { useEffect } from 'react';

interface UseFloatingOptions {
  baseOffsetPx?: number; // how far from bottom in a "perfect" browser
  minGapPx?: number; // extra gap above any overlay
}

/**
 * Hook to keep floating bottom elements above browser UI on iOS
 * Handles iOS 26.x Chrome bottom toolbar overlay issue using VisualViewport API
 *
 * @param el - The HTMLElement to adjust
 * @param options - Configuration options
 */
export function useSafeFloatingBottom(el: HTMLElement | null, options: UseFloatingOptions = {}) {
  useEffect(() => {
    if (!el) return;

    const baseOffset = options.baseOffsetPx ?? 24; // default "bottom-6"
    const minGap = options.minGapPx ?? 12;

    const update = () => {
      const vv = window.visualViewport;
      // Fall back: if no VisualViewport, just use base offset
      if (!vv) {
        el.style.setProperty(
          '--kf-floating-bottom',
          `calc(env(safe-area-inset-bottom, 0px) + ${baseOffset}px)`
        );
        return;
      }

      const rect = el.getBoundingClientRect();
      const viewportBottom = vv.height;

      // How much of the element is below the visible area?
      const overlap = rect.bottom - viewportBottom;

      const extra = overlap > 0 ? overlap + minGap : minGap;

      // Final bottom offset = safe area + base + "whatever we need to clear the bar"
      const total = baseOffset + extra;

      el.style.setProperty(
        '--kf-floating-bottom',
        `calc(env(safe-area-inset-bottom, 0px) + ${total}px)`
      );
    };

    update();

    const vv = window.visualViewport;
    if (!vv) return;

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('scroll', update, { passive: true });

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('scroll', update);
    };
  }, [el, options.baseOffsetPx, options.minGapPx]);
}
