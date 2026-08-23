import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { DUR, EASE, VIEWPORT } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';

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

const CLIP = {
  bottom: { hidden: 'inset(0 0 100% 0)', show: 'inset(0 0 0% 0)' },
  top: { hidden: 'inset(100% 0 0 0)', show: 'inset(0% 0 0 0)' },
  left: { hidden: 'inset(0 100% 0 0)', show: 'inset(0 0% 0 0)' },
  right: { hidden: 'inset(0 0 0 100%)', show: 'inset(0 0 0 0%)' },
};

/**
 * clip-path image reveal. The <Picture> inside simultaneously runs a
 * scale settle — parallax *within* the mask, which is what makes this read
 * as cinematic rather than as a wipe.
 *
 * clip-path is compositor-friendly but not free; the spec caps concurrent
 * instances at 3 per viewport.
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
  const clip = CLIP[from];

  if (!canAnimate) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once, margin }}
        transition={{ duration: DUR.micro, ease: EASE.house }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      style={{ overflow: 'hidden', willChange: 'clip-path' }}
      initial={{ clipPath: clip.hidden }}
      whileInView={{ clipPath: clip.show }}
      viewport={{ once, margin }}
      transition={{ duration, delay, ease: EASE.house }}
    >
      <motion.div
        style={{ height: '100%', willChange: 'transform' }}
        initial={{ scale: innerScale }}
        whileInView={{ scale: 1 }}
        viewport={{ once, margin }}
        transition={{ duration, delay, ease: EASE.house }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
