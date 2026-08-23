import { useRef, type ReactNode } from 'react';
import { motion, useTransform } from 'motion/react';
import { DEPTH } from '@/motion/constants';
import { usePassProgress } from '@/motion/scroll';

interface ParallaxProps {
  children: ReactNode;
  /** Depth rate as % translateY. Negative moves against the scroll. */
  rate?: number;
  className?: string;
}

/**
 * Depth-rate wrapper. Maximum two depth layers per section — three or more
 * reads as jitter rather than depth. Disabled below 768px, because parallax
 * on a touch device fights momentum scrolling.
 */
export function Parallax({ children, rate = DEPTH.mid, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { progress, enabled } = usePassProgress(ref);
  const y = useTransform(progress, [0, 1], ['0%', `${rate}%`]);

  if (!enabled) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y, willChange: 'transform' }}>{children}</motion.div>
    </div>
  );
}

/**
 * Ingredient cut-outs drifting at three depths across a section. Purely
 * decorative, so aria-hidden. Disabled below 768px and under reduced motion.
 */
export function DriftLayer({
  items,
  className,
}: {
  items: { src: string; x: string; y: string; size: number; rate: number; rotate: number }[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { progress, enabled } = usePassProgress(ref);

  if (!enabled) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}
    >
      {items.map((item, i) => (
        <DriftItem key={i} item={item} progress={progress} />
      ))}
    </div>
  );
}

function DriftItem({
  item,
  progress,
}: {
  item: { src: string; x: string; y: string; size: number; rate: number; rotate: number };
  progress: ReturnType<typeof usePassProgress>['progress'];
}) {
  const y = useTransform(progress, [0, 1], ['0%', `${item.rate}%`]);
  const rotate = useTransform(progress, [0, 1], [-item.rotate, item.rotate]);

  return (
    <motion.img
      src={item.src}
      alt=""
      loading="lazy"
      decoding="async"
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        width: item.size,
        height: 'auto',
        y,
        rotate,
        opacity: 0.5,
        filter: 'saturate(0.7) brightness(0.8)',
        willChange: 'transform',
      }}
    />
  );
}
