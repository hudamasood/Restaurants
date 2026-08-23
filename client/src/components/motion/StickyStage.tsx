import { useRef, type ReactNode } from 'react';
import { type MotionValue } from 'motion/react';
import { useSectionProgress } from '@/motion/scroll';
import { useMotionState } from '@/motion/guards';

interface StickyStageProps {
  /** Track height in vh. The pinned child is always 100svh. */
  height: number;
  /** Tablet track height — pinning is retained at reduced heights. */
  heightTablet?: number;
  children: (progress: MotionValue<number>, enabled: boolean) => ReactNode;
  /** Rendered instead of the pinned stage below 768px. */
  mobile?: ReactNode;
  className?: string;
  id?: string;
}

/**
 * Pinning without a library: `position: sticky` on a 100svh child inside a
 * tall parent. Native, GPU-composited, zero JS, and it survives resize
 * without a refresh call.
 *
 * Under reduced motion the track height collapses to auto and the sticky
 * child becomes relative, so pinned sections degrade to ordinary stacked
 * content.
 */
export function StickyStage({
  height,
  heightTablet,
  children,
  mobile,
  className,
  id,
}: StickyStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { progress, enabled } = useSectionProgress(ref);
  const { isMobile, isTablet, canAnimate } = useMotionState();

  // Below 768px there is no pinning anywhere.
  if (isMobile && mobile) {
    return (
      <section id={id} className={className}>
        {mobile}
      </section>
    );
  }

  const trackHeight = !canAnimate
    ? undefined
    : isTablet && heightTablet
      ? `${heightTablet}vh`
      : `${height}vh`;

  return (
    <section
      id={id}
      ref={ref}
      className={`stage-track relative ${className ?? ''}`}
      style={{ height: trackHeight }}
    >
      <div className="stage-pin">{children(progress, enabled)}</div>
    </section>
  );
}
