import type { ReactNode, CSSProperties } from 'react';
import { DUR, VIEWPORT } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';
import { useReveal } from '@/motion/useReveal';

interface CurtainMaskProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  margin?: string;
  /** Which edge the curtain lifts from. */
  from?: 'bottom' | 'top' | 'left' | 'right';
  /** The inner scale settle that makes it read as cinematic, not a wipe. */
  innerScale?: number;
  once?: boolean;
}

const CLIP_FROM = {
  bottom: 'inset(0 0 100% 0)',
  top: 'inset(100% 0 0 0)',
  left: 'inset(0 100% 0 0)',
  right: 'inset(0 0 0 100%)',
};

/**
 * clip-path image reveal. The picture inside simultaneously runs a scale
 * settle — parallax *within* the mask, which is what makes this read as
 * cinematic rather than as a wipe.
 *
 * Both halves are CSS transitions on a data attribute, so an interrupted
 * reveal still resolves to the uncovered state instead of leaving the image
 * clipped away.
 */
export function CurtainMask({
  children,
  className,
  delay = 0,
  duration = DUR.cine,
  margin = VIEWPORT.margin,
  from = 'bottom',
  innerScale = 1.08,
  once = true,
}: CurtainMaskProps) {
  const canAnimate = useCanAnimate();
  const { ref, state } = useReveal<HTMLDivElement>({ margin, once });

  return (
    <div
      ref={ref}
      className={className}
      data-curtain={state}
      style={{
        '--curtain-from': CLIP_FROM[from],
        '--curtain-scale': innerScale,
        '--reveal-delay': `${canAnimate ? delay * 1000 : 0}ms`,
        transitionDuration: `${canAnimate ? duration : DUR.micro}s`,
      } as CSSProperties}
    >
      <div
        data-curtain-inner=""
        style={{
          transitionDuration: `${canAnimate ? duration : DUR.micro}s`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
