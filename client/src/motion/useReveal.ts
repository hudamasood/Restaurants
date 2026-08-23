import { useEffect, useRef, useState } from 'react';
import { useCanAnimate } from './guards';

/**
 * Drives the CSS reveal states in globals.css.
 *
 * The element renders with no data attribute on the very first paint, which
 * is the visible baseline. On mount — and only when we can actually animate —
 * it flips to `hidden`, then to `shown` once an IntersectionObserver sees it.
 *
 * Because the movement itself is a CSS transition, an interrupted or
 * never-started animation still resolves to the final computed value on the
 * next repaint, rather than stranding the element under a stale inline
 * transform. That is what keeps content readable when animation cannot run.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  /** Fires when the element is this far into the viewport. */
  margin?: string;
  once?: boolean;
  /** Skip the observer and reveal as soon as it is mounted. */
  onMount?: boolean;
}) {
  const { margin = '0px 0px -15% 0px', once = true, onMount = false } = options ?? {};
  const canAnimate = useCanAnimate();
  const ref = useRef<T>(null);
  const [state, setState] = useState<'idle' | 'hidden' | 'shown'>('idle');

  // Hide first, in a layout effect so the visible baseline is never painted
  // as a flash before the reveal begins.
  useEffect(() => {
    if (!canAnimate) {
      setState('shown');
      return;
    }
    setState('hidden');
  }, [canAnimate]);

  useEffect(() => {
    if (state !== 'hidden') return;

    if (onMount || !canAnimate) {
      const id = requestAnimationFrame(() => setState('shown'));
      return () => cancelAnimationFrame(id);
    }

    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setState('shown');
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState('shown');
            if (once) io.disconnect();
          } else if (!once) {
            setState('hidden');
          }
        }
      },
      { rootMargin: margin, threshold: 0 },
    );

    io.observe(el);

    // Belt and braces: if the observer never fires — an element that is
    // already past, a detached subtree, a throttled tab — reveal anyway
    // rather than leaving the content invisible.
    const failsafe = window.setTimeout(() => setState('shown'), 2500);

    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [state, margin, once, onMount, canAnimate]);

  return { ref, state: state === 'idle' ? undefined : state };
}
