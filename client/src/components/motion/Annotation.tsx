import { motion } from 'motion/react';
import { DUR, EASE } from '@/motion/constants';
import { useCanAnimate, useMotionState } from '@/motion/guards';

export interface AnnotationPoint {
  label: string;
  value: string;
  /** Anchor as a % of the image box. */
  x: number;
  y: number;
  /** Which side the leader line runs to. */
  side?: 'left' | 'right';
}

/**
 * The reference-site translation. Its callouts state temperature; ours state
 * provenance and time — `45-DAY DRY AGE`, `KASHMIR · 1,800m`.
 *
 * Sequence: terminal dot scales in → leader line draws via stroke-dashoffset
 * → label reveals 200ms after the line lands. Max 2 per image.
 *
 * On mobile these do not render as overlays at all — they collapse into a
 * mono caption row beneath the image. That is a designed alternative, not a
 * hidden feature.
 */
export function AnnotationLayer({
  points,
  className,
}: {
  points: AnnotationPoint[];
  className?: string;
}) {
  const canAnimate = useCanAnimate();
  const { isMobile } = useMotionState();

  if (isMobile) return null;

  const capped = points.slice(0, 2);

  return (
    <div className={`pointer-events-none absolute inset-0 ${className ?? ''}`} aria-hidden="true">
      {capped.map((p, i) => (
        <AnnotationMark key={p.label} point={p} index={i} canAnimate={canAnimate} />
      ))}
    </div>
  );
}

function AnnotationMark({
  point,
  index,
  canAnimate,
}: {
  point: AnnotationPoint;
  index: number;
  canAnimate: boolean;
}) {
  const side = point.side ?? (point.x > 50 ? 'left' : 'right');
  const dir = side === 'right' ? 1 : -1;
  const runLength = 88;

  const base = canAnimate ? index * 0.18 : 0;
  const lineDelay = canAnimate ? base + 0.3 : 0;
  const labelDelay = canAnimate ? lineDelay + 0.5 + 0.2 : 0;

  const viewport = { once: true, margin: '0px 0px -40% 0px' };

  return (
    <div
      className="absolute"
      style={{
        left: `${point.x}%`,
        top: `${point.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Terminal dot */}
      <motion.span
        className="absolute block rounded-full"
        style={{
          width: 7,
          height: 7,
          background: 'var(--color-saffron)',
          left: -3.5,
          top: -3.5,
        }}
        initial={canAnimate ? { scale: 0 } : { opacity: 0 }}
        whileInView={canAnimate ? { scale: 1 } : { opacity: 1 }}
        viewport={viewport}
        transition={{
          duration: canAnimate ? 0.3 : DUR.micro,
          delay: base,
          ease: EASE.house,
        }}
      />

      {/* Halo ring */}
      {canAnimate && (
        <motion.span
          className="absolute block rounded-full"
          style={{
            width: 20,
            height: 20,
            border: '1px solid color-mix(in srgb, var(--color-saffron) 40%, transparent)',
            left: -10,
            top: -10,
          }}
          initial={{ scale: 0.2, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={viewport}
          transition={{ duration: DUR.base, delay: base + 0.1, ease: EASE.house }}
        />
      )}

      {/* Leader line */}
      <svg
        className="absolute overflow-visible"
        style={{ left: 0, top: 0, width: runLength, height: 1, transform: dir === -1 ? 'scaleX(-1)' : undefined }}
        viewBox={`0 0 ${runLength} 1`}
        preserveAspectRatio="none"
      >
        <motion.line
          x1="0"
          y1="0.5"
          x2={runLength}
          y2="0.5"
          stroke="var(--color-bone-ghost)"
          strokeWidth="1"
          initial={canAnimate ? { pathLength: 0 } : { opacity: 0 }}
          whileInView={canAnimate ? { pathLength: 1 } : { opacity: 1 }}
          viewport={viewport}
          transition={{
            duration: canAnimate ? 0.5 : DUR.micro,
            delay: lineDelay,
            ease: EASE.house,
          }}
        />
      </svg>

      {/* Label */}
      <motion.div
        className="absolute whitespace-nowrap"
        style={{
          left: dir === 1 ? runLength + 12 : undefined,
          right: dir === -1 ? runLength + 12 : undefined,
          top: -9,
          textAlign: dir === 1 ? 'left' : 'right',
        }}
        initial={canAnimate ? { opacity: 0, y: 6 } : { opacity: 0 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{
          duration: canAnimate ? DUR.base : DUR.micro,
          delay: labelDelay,
          ease: EASE.house,
        }}
      >
        <span
          className="u-mono block"
          style={{ color: 'var(--color-bone)', fontSize: '0.6875rem', letterSpacing: '0.14em' }}
        >
          {point.label}
        </span>
        <span
          className="u-mono block"
          style={{ color: 'var(--color-bone-dim)', fontSize: '0.6875rem', letterSpacing: '0.14em' }}
        >
          {point.value}
        </span>
      </motion.div>
    </div>
  );
}

/** The mobile alternative: a mono LABEL · VALUE caption row beneath the image. */
export function AnnotationCaptions({
  points,
  className,
}: {
  points: AnnotationPoint[];
  className?: string;
}) {
  const { isMobile } = useMotionState();
  if (!isMobile) return null;

  return (
    <ul className={`flex flex-wrap gap-x-6 gap-y-2 pt-4 ${className ?? ''}`}>
      {points.map((p) => (
        <li key={p.label} className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>
          {p.label} <span style={{ color: 'var(--color-bone)' }}>{p.value}</span>
        </li>
      ))}
    </ul>
  );
}
