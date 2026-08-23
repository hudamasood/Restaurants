import { useLayoutEffect, useRef } from 'react';
import { DUR, EASE } from '@/motion/constants';

const CUBIC = `cubic-bezier(${EASE.house.join(',')})`;

/**
 * FLIP re-layout for the menu filter grid — roughly forty lines, which is
 * why this is not a dependency.
 *
 * 1. Measure every mounted card.
 * 2. Surviving cards translate from their old position to the new one,
 *    400ms, transform only.
 * 3. New cards rise and fade in at a 40ms stagger, beginning at move-50%.
 *
 * The whole point is that a card present before and after a filter change is
 * visibly the same card, so this is never a hard re-render.
 */
export function useFlip(keys: string[], enabled: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, DOMRect>());
  const previousKeys = useRef<string[]>(keys);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const nodes = Array.from(container.querySelectorAll<HTMLElement>('[data-flip-key]'));

    if (!enabled) {
      positions.current.clear();
      nodes.forEach((n) => positions.current.set(n.dataset.flipKey!, n.getBoundingClientRect()));
      previousKeys.current = keys;
      return;
    }

    const prevKeys = new Set(previousKeys.current);
    const entering: HTMLElement[] = [];

    nodes.forEach((node) => {
      const key = node.dataset.flipKey!;
      const next = node.getBoundingClientRect();
      const prev = positions.current.get(key);

      if (!prev || !prevKeys.has(key)) {
        entering.push(node);
        return;
      }

      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

      // Invert, then play.
      node.style.transition = 'none';
      node.style.transform = `translate(${dx}px, ${dy}px)`;

      requestAnimationFrame(() => {
        node.style.transition = `transform ${DUR.short}s ${CUBIC}`;
        node.style.transform = '';
      });
    });

    entering.forEach((node, i) => {
      const delay = DUR.short / 2 + i * 0.04;
      node.style.transition = 'none';
      node.style.opacity = '0';
      node.style.transform = 'translateY(20px)';

      requestAnimationFrame(() => {
        node.style.transition = `opacity 0.3s ${CUBIC} ${delay}s, transform 0.3s ${CUBIC} ${delay}s`;
        node.style.opacity = '';
        node.style.transform = '';
      });
    });

    positions.current.clear();
    nodes.forEach((n) => positions.current.set(n.dataset.flipKey!, n.getBoundingClientRect()));
    previousKeys.current = keys;
  }, [keys.join('|'), enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return containerRef;
}
