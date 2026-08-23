import { createContext, useContext, useEffect } from 'react';

export type OverlayName =
  | 'nav'
  | 'quickView'
  | 'lightbox'
  | 'cart'
  | 'filters'
  | 'search'
  | 'chef';

interface OverlayState {
  open: OverlayName[];
  push: (n: OverlayName) => void;
  pop: (n: OverlayName) => void;
  isOpen: (n: OverlayName) => boolean;
  any: boolean;
}

export const OverlayContext = createContext<OverlayState>({
  open: [],
  push: () => {},
  pop: () => {},
  isOpen: () => false,
  any: false,
});

export function useOverlay() {
  return useContext(OverlayContext);
}

/** Registers an overlay for the lifetime it is open, and locks scroll once. */
export function useScrollLock(active: boolean, name: OverlayName) {
  const { push, pop } = useOverlay();

  useEffect(() => {
    if (!active) return;
    push(name);
    return () => pop(name);
  }, [active, name, push, pop]);
}

/** Escape closes. Every overlay in the build uses this rather than its own handler. */
export function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onClose]);
}

/** Focus trap — focus never escapes an open modal, and returns when it closes. */
export function useFocusTrap(
  active: boolean,
  ref: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const previous = document.activeElement as HTMLElement | null;

    const selector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => el.offsetParent !== null,
      );

    const first = focusables()[0];
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    node.addEventListener('keydown', onKey);
    return () => {
      node.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [active, ref]);
}
