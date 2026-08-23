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
  /** How long the transition needs before we stop trusting it. */
  settleAfter?: number;
}) {
  const {
    margin = '0px 0px -15% 0px',
    once = true,
    onMount = false,
    settleAfter = 2600,
  } = options ?? {};
  const canAnimate = useCanAnimate();
  const ref = useRef<T>(null);
  const [state, setState] = useState<'idle' | 'hidden' | 'shown'>('idle');
  const [settled, setSettled] = useState(false);

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
      // A timer rather than requestAnimationFrame: rAF does not fire in a
      // throttled or backgrounded tab, which would leave the element pinned
      // at its hidden state forever. Timers still run.
      const id = window.setTimeout(() => setState('shown'), 16);
      return () => window.clearTimeout(id);
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

  /**
   * Flipping the state is not enough on its own: the transition that carries
   * the element into place can itself be frozen part-way — a throttled tab
   * leaves a half-clipped line of type on screen indefinitely. Once the
   * transition has had its full run, drop it entirely so the element resolves
   * to its final computed value immediately.
   */
  useEffect(() => {
    if (state !== 'shown') return;
    const t = window.setTimeout(() => setSettled(true), settleAfter);
    return () => window.clearTimeout(t);
  }, [state, settleAfter]);

  return {
    ref,
    state: state === 'idle' ? undefined : state,
    settled: settled ? '' : undefined,
  };
}
