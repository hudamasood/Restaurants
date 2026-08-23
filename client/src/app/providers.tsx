import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LazyMotion, domAnimation } from 'motion/react';
import { MotionContext, detectLowEnd, type MotionPreference } from '@/motion/guards';
import { OverlayContext, type OverlayName } from '@/app/overlay';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

const STORAGE_KEY = 'mh:motion';

function MotionProvider({ children }: { children: ReactNode }) {
  const systemReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(max-width: 1023px)');
  const isTouch = useMediaQuery('(hover: none), (pointer: coarse)');

  const [preference, setPreferenceState] = useState<MotionPreference>(() => {
    if (typeof localStorage === 'undefined') return 'full';
    return (localStorage.getItem(STORAGE_KEY) as MotionPreference) ?? 'full';
  });

  const [lowEnd, setLowEnd] = useState(false);
  useEffect(() => setLowEnd(detectLowEnd()), []);

  const setPreference = useCallback((p: MotionPreference) => {
    setPreferenceState(p);
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch {
      /* storage unavailable — the setting is simply not persisted */
    }
  }, []);

  // One guard, resolved once: reduced motion OR saveData OR a low-end device.
  const canAnimate = !systemReduced && preference === 'full' && !lowEnd;

  useEffect(() => {
    document.documentElement.classList.toggle('motion-off', !canAnimate);
  }, [canAnimate]);

  const value = useMemo(
    () => ({
      canAnimate,
      preference,
      setPreference,
      systemReduced,
      isTouch,
      isMobile,
      isTablet,
    }),
    [canAnimate, preference, setPreference, systemReduced, isTouch, isMobile, isTablet],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

/**
 * One arbiter for scroll lock, so two overlays can never fight over
 * `overflow: hidden` and leave the page permanently locked.
 */
function OverlayProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<OverlayName[]>([]);

  const push = useCallback((name: OverlayName) => {
    setOpen((prev) => (prev.includes(name) ? prev : [...prev, name]));
  }, []);

  const pop = useCallback((name: OverlayName) => {
    setOpen((prev) => prev.filter((n) => n !== name));
  }, []);

  useEffect(() => {
    const locked = open.length > 0;
    const body = document.body;

    if (locked) {
      const y = window.scrollY;
      body.dataset.scrollLocked = 'true';
      body.style.position = 'fixed';
      body.style.top = `-${y}px`;
      body.style.width = '100%';
      return () => {
        const restore = parseInt(body.style.top || '0', 10);
        body.dataset.scrollLocked = 'false';
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';
        window.scrollTo(0, Math.abs(restore));
      };
    }
  }, [open.length]);

  const value = useMemo(
    () => ({ open, push, pop, isOpen: (n: OverlayName) => open.includes(n), any: open.length > 0 }),
    [open, push, pop],
  );

  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
        <OverlayProvider>
          {/* domAnimation is ~18kb rather than the ~34kb full feature set. */}
          <LazyMotion features={domAnimation} strict={false}>
            {children}
          </LazyMotion>
        </OverlayProvider>
      </MotionProvider>
    </QueryClientProvider>
  );
}
