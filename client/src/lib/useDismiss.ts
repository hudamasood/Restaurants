import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Closes a popover when the pointer goes down anywhere outside it.
 *
 * `pointerdown` rather than `click` so the panel is gone before the underlying
 * control reacts, and capture phase so a child that stops propagation cannot
 * strand the panel open.
 */
export function useOutsideDismiss(
  active: boolean,
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!active) return;

    const onPointerDown = (event: PointerEvent) => {
      const node = ref.current;
      if (node && !node.contains(event.target as Node)) onDismiss();
    };

    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, [active, ref, onDismiss]);
}
