import { useMotionState } from '@/motion/guards';
import { useReveal } from '@/motion/useReveal';

export interface AnnotationPoint {
  label: string;
  value: string;
  /** Anchor as a % of the image box. */
  x: number;
  y: number;
  /** Which side the leader line runs to. */
  side?: 'left' | 'right';
}

const RUN = 88;

/**
 * The reference-site translation. Its callouts state temperature; ours state
 * provenance and time — `45-DAY DRY AGE`, `KASHMIR · 1,800m`.
 *
 * Sequence: terminal dot scales in → leader line draws → label follows.
 * Max 2 per image; the third is always the one that overlaps something.
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
  const { isMobile } = useMotionState();
  if (isMobile) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 ${className ?? ''}`} aria-hidden="true">
      {points.slice(0, 2).map((p, i) => (
        <AnnotationMark key={p.label} point={p} index={i} />
      ))}
    </div>
  );
}

function AnnotationMark({ point, index }: { point: AnnotationPoint; index: number }) {
  const { ref, state } = useReveal<HTMLDivElement>({ margin: '0px 0px -40% 0px' });
  const side = point.side ?? (point.x > 50 ? 'left' : 'right');
  const dir = side === 'right' ? 1 : -1;

  return (
    <div
      ref={ref}
      data-anno={state}
      className="absolute"
      style={{
        left: `${point.x}%`,
        top: `${point.y}%`,
        transform: 'translate(-50%, -50%)',
        // Stagger the second annotation behind the first.
        transitionDelay: `${index * 180}ms`,
      }}
    >
      {/* Halo ring */}
      <span
        className="anno-halo absolute block rounded-full"
        style={{
          width: 20,
          height: 20,
          border: '1px solid color-mix(in srgb, var(--color-saffron) 40%, transparent)',
          left: -10,
          top: -10,
        }}
      />

      {/* Terminal dot */}
      <span
        className="anno-dot absolute block rounded-full"
        style={{ width: 7, height: 7, background: 'var(--color-saffron)', left: -3.5, top: -3.5 }}
      />

      {/* Leader line */}
      <svg
        className="absolute overflow-visible"
        style={{
          left: 0,
          top: 0,
          width: RUN,
          height: 1,
          transform: dir === -1 ? 'scaleX(-1)' : undefined,
        }}
        viewBox={`0 0 ${RUN} 1`}
        preserveAspectRatio="none"
      >
        <line
          className="anno-line"
          x1="0"
          y1="0.5"
          x2={RUN}
          y2="0.5"
          stroke="var(--color-bone-ghost)"
          strokeWidth="1"
          pathLength={1}
        />
      </svg>

      {/* Label */}
      <div
        className="anno-label absolute whitespace-nowrap"
        style={{
          left: dir === 1 ? RUN + 12 : undefined,
          right: dir === -1 ? RUN + 12 : undefined,
          top: -9,
          textAlign: dir === 1 ? 'left' : 'right',
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
      </div>
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
