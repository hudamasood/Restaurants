import { Children, cloneElement, isValidElement, type ElementType, type ReactNode } from 'react';
import { DUR, STAGGER, STAGGER_CAP, VIEWPORT } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';
import { useReveal } from '@/motion/useReveal';

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
 * The movement is a CSS transition driven by a data attribute rather than an
 * inline style written by JS. The CSS baseline — no attribute — is the
 * visible state, so content is readable both if JS never runs and if an
 * animation is interrupted part-way through.
 */
export function Reveal({
  children,
  y = 24,
  delay = 0,
  duration = DUR.base,
  as: Tag = 'div',
  className,
  margin = VIEWPORT.margin,
  once = true,
  id,
}: RevealProps) {
  const canAnimate = useCanAnimate();
  const { ref, state, settled } = useReveal<HTMLDivElement>({ margin, once });

  return (
    <Tag
      id={id}
      ref={ref}
      className={className}
      data-reveal={state}
      data-settled={settled}
      style={{
        '--reveal-y': `${y}px`,
        '--reveal-delay': `${canAnimate ? delay * 1000 : 0}ms`,
        transitionDuration: `${canAnimate ? duration : DUR.micro}s`,
      } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Orchestrates children on a stagger by handing each one a CSS delay. */
export function RevealGroup({
  children,
  interval = STAGGER.card,
  delay = 0,
  as: Tag = 'div',
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
  let index = 0;

  const staggered = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    // Stagger caps at 8; beyond that the ninth item would arrive after the
    // reader has already scrolled past it.
    const step = Math.min(index, STAGGER_CAP);
    index += 1;
    return cloneElement(child as React.ReactElement<{ _delay?: number; _margin?: string }>, {
      _delay: delay + step * interval,
      _margin: margin,
    });
  });

  return (
    <Tag className={className} id={id}>
      {staggered}
    </Tag>
  );
}

/** A child of RevealGroup. Receives its delay from the parent. */
export function RevealItem({
  children,
  y = 24,
  as = 'div',
  className,
  _delay = 0,
  _margin = VIEWPORT.margin,
}: {
  children: ReactNode;
  y?: number;
  as?: ElementType;
  className?: string;
  _delay?: number;
  _margin?: string;
}) {
  return (
    <Reveal y={y} delay={_delay} as={as} className={className} margin={_margin}>
      {children}
    </Reveal>
  );
}
