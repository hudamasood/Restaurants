import { useEffect, useMemo, useRef, useState } from 'react';
import { useScroll, useTransform, useMotionValue, type MotionValue } from 'motion/react';
import { useMotionState } from './guards';

/**
 * Section scroll progress, 0 → 1 across a pinned stage.
 * Responsive logic lives here, not in the component: below 768px the hook
 * reports `enabled: false` and a frozen progress, and the component renders
 * its mobile path.
 */
export function useSectionProgress(ref: React.RefObject<HTMLElement | null>) {
  const { canAnimate, isMobile } = useMotionState();
  const enabled = canAnimate && !isMobile;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const frozen = useMotionValue(0);
  return { progress: enabled ? scrollYProgress : frozen, enabled };
}

/** Progress across an element entering and leaving the viewport — for parallax. */
export function usePassProgress(ref: React.RefObject<HTMLElement | null>) {
  const { canAnimate, isMobile } = useMotionState();
  const enabled = canAnimate && !isMobile;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const frozen = useMotionValue(0.5);
  return { progress: enabled ? scrollYProgress : frozen, enabled };
}

/**
 * Progress across a hero leaving the viewport: 0 while it sits at rest, 1
 * when its bottom edge reaches the top of the screen.
 *
 * `usePassProgress` is wrong for a hero. Its window opens before the element
 * has entered, so an element already on screen at load starts part-way
 * through and its parallax is pre-offset on first paint. This one starts at
 * zero, which is what lets a hero settle before it begins to move.
 */
export function useExitProgress(ref: React.RefObject<HTMLElement | null>) {
  const { canAnimate, isMobile } = useMotionState();
  const enabled = canAnimate && !isMobile;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const frozen = useMotionValue(0);
  return { progress: enabled ? scrollYProgress : frozen, enabled };
}

/** Depth-rate parallax on y. Returns a ready-to-spread motion style value. */
export function useParallax(progress: MotionValue<number>, rate: number, enabled = true) {
  const frozen = useMotionValue('0%');
  const moved = useTransform(progress, [0, 1], ['0%', `${rate}%`]);
  return enabled ? moved : frozen;
}

/**
 * Window scroll position with a hysteresis band, so a nav crossing its
 * threshold doesn't flicker.
 */
export function useScrolledPast(threshold: number, hysteresis = 40) {
  const [past, setPast] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const unsub = scrollY.on('change', (v) => {
      setPast((prev) => {
        if (!prev && v > threshold + hysteresis) return true;
        if (prev && v < threshold - hysteresis) return false;
        return prev;
      });
    });
    return unsub;
  }, [scrollY, threshold, hysteresis]);

  return past;
}

/** Nav hide-on-scroll-down. 8px threshold avoids trackpad jitter. */
export function useScrollDirection(activeAfter = 0) {
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  const last = useRef(0);

  useEffect(() => {
    const unsub = scrollY.on('change', (v) => {
      const delta = v - last.current;
      if (Math.abs(delta) < 8) return;
      if (v < activeAfter) {
        setHidden(false);
      } else {
        setHidden(delta > 0);
      }
      last.current = v;
    });
    return unsub;
  }, [scrollY, activeAfter]);

  return hidden;
}

/**
 * A single shared IntersectionObserver registry, rather than one observer
 * instantiated per component.
 */
type IOCallback = (entry: IntersectionObserverEntry) => void;
const registries = new Map<string, { io: IntersectionObserver; map: Map<Element, IOCallback> }>();

function getRegistry(rootMargin: string, threshold: number) {
  const key = `${rootMargin}|${threshold}`;
  let reg = registries.get(key);
  if (!reg) {
    const map = new Map<Element, IOCallback>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) map.get(entry.target)?.(entry);
      },
      { rootMargin, threshold },
    );
    reg = { io, map };
    registries.set(key, reg);
  }
  return reg;
}

export function useSharedObserver(
  ref: React.RefObject<Element | null>,
  onChange: IOCallback,
  rootMargin = '0px',
  threshold = 0,
) {
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const { io, map } = getRegistry(rootMargin, threshold);
    map.set(el, (e) => cb.current(e));
    io.observe(el);
    return () => {
      io.unobserve(el);
      map.delete(el);
    };
  }, [ref, rootMargin, threshold]);
}

/** Which of a set of sections currently occupies the middle 10% band. */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );

    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as Element[];
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return active;
}

/**
 * Sprite-sheet frame loader shared by all canvas signatures. Handles frame
 * count adaptation by device and the saveData fallback.
 */
export function useSequenceFrames(urls: string[], budget: number) {
  const [frames, setFrames] = useState<HTMLImageElement[]>([]);
  const [ready, setReady] = useState(false);

  const selected = useMemo(() => {
    if (budget >= urls.length) return urls;
    if (budget <= 1) return urls.slice(-1);
    const step = (urls.length - 1) / (budget - 1);
    return Array.from({ length: budget }, (_, i) => urls[Math.round(i * step)]);
  }, [urls, budget]);

  useEffect(() => {
    let cancelled = false;
    const imgs: HTMLImageElement[] = [];
    let loaded = 0;

    selected.forEach((src, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.src = src;
      img.onload = img.onerror = () => {
        loaded += 1;
        if (loaded === selected.length && !cancelled) {
          setFrames(imgs);
          setReady(true);
        }
      };
      imgs[i] = img;
    });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  return { frames, ready, count: selected.length };
}

/** Damped follow — `lerp(current, target, factor)` per frame. */
export function useLerp(target: { x: number; y: number }, factor = 0.12) {
  const [pos, setPos] = useState(target);
  const raf = useRef(0);
  const current = useRef(target);
  const goal = useRef(target);
  goal.current = target;

  useEffect(() => {
    const tick = () => {
      const c = current.current;
      const g = goal.current;
      const next = {
        x: c.x + (g.x - c.x) * factor,
        y: c.y + (g.y - c.y) * factor,
      };
      current.current = next;
      setPos(next);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [factor]);

  return pos;
}
