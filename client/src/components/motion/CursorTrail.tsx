import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DUR, EASE } from '@/motion/constants';
import { useMotionState } from '@/motion/guards';
import { useLerp } from '@/motion/scroll';

/**
 * Three thumbnails following the cursor with a damped lerp (0.12), staggered
 * 60ms apart so they trail rather than stack.
 *
 * The native cursor is never replaced — this site's job is bookings, and
 * click confidence matters more than the effect.
 *
 * Desktop pointer only: @media (hover: hover) and (pointer: fine).
 */
export function CursorTrail({ images, active }: { images: string[]; active: boolean }) {
  const { canAnimate, isTouch, isTablet } = useMotionState();
  const [target, setTarget] = useState({ x: 0, y: 0 });
  const enabled = canAnimate && !isTouch && !isTablet;

  useEffect(() => {
    if (!enabled || !active) return;
    const onMove = (e: PointerEvent) => setTarget({ x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [enabled, active]);

  if (!enabled) return null;

  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
          {images.slice(0, 3).map((src, i) => (
            <TrailItem key={src} src={src} target={target} index={i} />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

function TrailItem({
  src,
  target,
  index,
}: {
  src: string;
  target: { x: number; y: number };
  index: number;
}) {
  // Each successive thumbnail follows more loosely, so they read as a trail.
  const pos = useLerp(target, 0.12 - index * 0.028);
  const size = 108 - index * 14;

  return (
    <motion.img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      initial={{ opacity: 0, scale: 0.86 }}
      animate={{ opacity: 1 - index * 0.22, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{
        duration: DUR.micro,
        delay: index * 0.06,
        ease: EASE.house,
      }}
      style={{
        position: 'absolute',
        left: pos.x - size / 2 + index * 16,
        top: pos.y - size / 2 + index * 12,
        width: size,
        height: size * 1.25,
        objectFit: 'cover',
        border: '1px solid rgb(233 227 215 / 0.12)',
        willChange: 'transform',
      }}
    />
  );
}
