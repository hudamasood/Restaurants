import { createContext, useContext } from 'react';

export type MotionPreference = 'full' | 'reduced';

export interface MotionState {
  /** Resolved: false when reduced-motion, saveData, or a low-end device. */
  canAnimate: boolean;
  /** The user's explicit override, independent of the OS setting. */
  preference: MotionPreference;
  setPreference: (p: MotionPreference) => void;
  /** True when the OS itself asks for reduced motion. */
  systemReduced: boolean;
  /** Coarse pointer — hover effects and drag affordances are suppressed. */
  isTouch: boolean;
  /** < 768px. Pinning, parallax and drift layers are off. */
  isMobile: boolean;
  /** < 1024px. Cursor trail off, pin heights reduced. */
  isTablet: boolean;
}

export const MotionContext = createContext<MotionState>({
  canAnimate: true,
  preference: 'full',
  setPreference: () => {},
  systemReduced: false,
  isTouch: false,
  isMobile: false,
  isTablet: false,
});

/**
 * One guard, checked once. Components ask this at the top and render the
 * static variant — reduced-motion handling is not sprinkled through every
 * animation definition.
 */
export function useCanAnimate() {
  return useContext(MotionContext).canAnimate;
}

export function useMotionState() {
  return useContext(MotionContext);
}

export function useIsTouch() {
  return useContext(MotionContext).isTouch;
}

/** Detects a device we should not ask to run pinned scroll sequences. */
export function detectLowEnd(): boolean {
  if (typeof navigator === 'undefined') return false;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };

  if (nav.connection?.saveData) return true;
  if (nav.connection?.effectiveType && /^(slow-)?2g$/.test(nav.connection.effectiveType)) {
    return true;
  }
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4) {
    return true;
  }
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return true;

  return false;
}

/** Frame budget for canvas sequences, adapted to the device. */
export function frameBudget(total: number, isMobile: boolean, lowEnd: boolean): number {
  if (lowEnd) return 1;
  if (isMobile) return Math.min(total, 12);
  return total;
}
