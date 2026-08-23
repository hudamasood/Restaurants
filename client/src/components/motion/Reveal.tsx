import { motion, type Variants } from 'motion/react';
import type { ElementType, ReactNode } from 'react';
import { DUR, EASE, VIEWPORT } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';

interface RevealProps {
  children: ReactNode;
  /** Vertical offset the element rises from. */
  y?: number;
  delay?: number;
  duration?: number;
  as?: ElementType;
  className?: string;
  /** Fires when the element is this far into view. */
  margin?: string;
  once?: boolean;
  id?: string;
}

/**
 * The workhorse. opacity 0 → 1, y 24 → 0, 600ms, house easing.
 *
 * The CSS baseline is the *visible* state — the hidden state is applied by
 * Motion on mount, so if JS fails the content is still readable.
 */
export function Reveal({
  children,
  y = 24,
  delay = 0,
  duration = DUR.base,
  as = 'div',
  className,
  margin = VIEWPORT.margin,
  once = true,
  id,
}: RevealProps) {
  const canAnimate = useCanAnimate();
  const MotionTag = motion[as as 'div'] ?? motion.div;

  const variants: Variants = canAnimate
    ? {
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration, delay, ease: EASE.house },
        },
      }
    : {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { duration: DUR.micro, delay: 0, ease: EASE.house },
        },
      };

  return (
    <MotionTag
      id={id}
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin }}
    >
      {children}
    </MotionTag>
  );
}

/** Same trigger, but the parent orchestrates children via staggerChildren. */
export function RevealGroup({
  children,
  interval = 0.09,
  delay = 0,
  as = 'div',
  className,
  margin = VIEWPORT.margin,
  id,
}: {
  children: ReactNode;
  interval?: number;
  delay?: number;
  as?: ElementType;
  className?: string;
  margin?: string;
  id?: string;
}) {
  const canAnimate = useCanAnimate();
  const MotionTag = motion[as as 'div'] ?? motion.div;

  return (
    <MotionTag
      id={id}
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: canAnimate ? interval : 0,
            delayChildren: canAnimate ? delay : 0,
          },
        },
      }}
    >
      {children}
    </MotionTag>
  );
}

/** A child of RevealGroup. Inherits the parent's stagger. */
export function RevealItem({
  children,
  y = 24,
  as = 'div',
  className,
}: {
  children: ReactNode;
  y?: number;
  as?: ElementType;
  className?: string;
}) {
  const canAnimate = useCanAnimate();
  const MotionTag = motion[as as 'div'] ?? motion.div;

  const variants: Variants = canAnimate
    ? {
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: DUR.base, ease: EASE.house },
        },
      }
    : {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { duration: DUR.micro, ease: EASE.house },
        },
      };

  return (
    <MotionTag className={className} variants={variants}>
      {children}
    </MotionTag>
  );
}
