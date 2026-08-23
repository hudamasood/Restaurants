import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { ElementType } from 'react';
import { DUR, EASE, STAGGER, VIEWPORT } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';

interface LineMaskProps {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  interval?: number;
  duration?: number;
  margin?: string;
  /** Drive the animation from a parent variant instead of the viewport. */
  animateOnMount?: boolean;
  once?: boolean;
}

/**
 * Per-line text reveal. Lines are measured by a ResizeObserver-driven pass —
 * never split per character. Per-letter scrambles are the strongest generic
 * agency tell and cost far more in layout thrash.
 *
 * Accessibility: the split spans are aria-hidden, and the original string is
 * preserved in a visually-hidden node, so screen readers get unfragmented text.
 */
export function LineMask({
  text,
  as = 'div',
  className,
  delay = 0,
  interval = STAGGER.line,
  duration = DUR.base,
  margin = VIEWPORT.margin,
  animateOnMount = false,
  once = true,
}: LineMaskProps) {
  const canAnimate = useCanAnimate();
  const hostRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<string[] | null>(null);
  const Tag = as as ElementType;

  // Measure: render words, group by offsetTop, collapse back into lines.
  useLayoutEffect(() => {
    if (!canAnimate) return;
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      const probe = document.createElement('div');
      const cs = getComputedStyle(host);
      probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:${host.clientWidth}px;font:${cs.font};font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};line-height:${cs.lineHeight};letter-spacing:${cs.letterSpacing};text-transform:${cs.textTransform};`;

      const words = text.split(/\s+/).filter(Boolean);
      probe.innerHTML = words.map((w) => `<span>${w}</span>`).join(' ');
      host.appendChild(probe);

      const spans = Array.from(probe.querySelectorAll('span'));
      const grouped: string[] = [];
      let currentTop: number | null = null;
      let buffer: string[] = [];

      spans.forEach((span, i) => {
        const top = (span as HTMLElement).offsetTop;
        if (currentTop === null) currentTop = top;
        if (top !== currentTop) {
          grouped.push(buffer.join(' '));
          buffer = [];
          currentTop = top;
        }
        buffer.push(words[i]);
      });
      if (buffer.length) grouped.push(buffer.join(' '));

      host.removeChild(probe);
      setLines(grouped.length ? grouped : [text]);
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(host);
    return () => ro.disconnect();
  }, [text, canAnimate]);

  // Reduced motion: the whole block fades, no split at all.
  if (!canAnimate) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once, margin }}
        transition={{ duration: DUR.micro, ease: EASE.house }}
      >
        <Tag>{text}</Tag>
      </motion.div>
    );
  }

  const parentProps = animateOnMount
    ? { initial: 'hidden' as const, animate: 'show' as const }
    : {
        initial: 'hidden' as const,
        whileInView: 'show' as const,
        viewport: { once, margin },
      };

  return (
    <div ref={hostRef} className={className}>
      <span className="u-vh">{text}</span>
      <motion.span
        aria-hidden="true"
        style={{ display: 'block' }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: interval, delayChildren: delay } },
        }}
        {...parentProps}
      >
        {(lines ?? [text]).map((line, i) => (
          <span
            key={`${line}-${i}`}
            style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.06em' }}
          >
            <motion.span
              style={{ display: 'block', willChange: 'transform' }}
              variants={{
                hidden: { y: '110%' },
                show: {
                  y: '0%',
                  transition: { duration, ease: EASE.house },
                },
              }}
            >
              <Tag style={{ display: 'block' }}>{line}</Tag>
            </motion.span>
          </span>
        ))}
      </motion.span>
    </div>
  );
}

/**
 * A line-masked block that takes its animation state from a parent variant
 * tree — used inside the hero, where chapter boundaries drive the reveal.
 */
export function LineMaskControlled({
  text,
  className,
  state,
  interval = STAGGER.line,
}: {
  text: string;
  className?: string;
  state: 'in' | 'out';
  interval?: number;
}) {
  const canAnimate = useCanAnimate();
  const [lines, setLines] = useState<string[]>([text]);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !canAnimate) return;

    const measure = () => {
      const probe = document.createElement('div');
      const cs = getComputedStyle(host);
      probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:${host.clientWidth}px;font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};line-height:${cs.lineHeight};letter-spacing:${cs.letterSpacing};`;
      const words = text.split(/\s+/).filter(Boolean);
      probe.innerHTML = words.map((w) => `<span>${w}</span>`).join(' ');
      host.appendChild(probe);

      const spans = Array.from(probe.querySelectorAll('span'));
      const grouped: string[] = [];
      let top: number | null = null;
      let buf: string[] = [];
      spans.forEach((s, i) => {
        const t = (s as HTMLElement).offsetTop;
        if (top === null) top = t;
        if (t !== top) {
          grouped.push(buf.join(' '));
          buf = [];
          top = t;
        }
        buf.push(words[i]);
      });
      if (buf.length) grouped.push(buf.join(' '));
      host.removeChild(probe);
      setLines(grouped.length ? grouped : [text]);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, [text, canAnimate]);

  if (!canAnimate) {
    return <div className={className}>{text}</div>;
  }

  return (
    <div ref={hostRef} className={className}>
      <span className="u-vh">{text}</span>
      <span aria-hidden="true" style={{ display: 'block' }}>
        {lines.map((line, i) => (
          <span key={`${line}-${i}`} style={{ display: 'block', overflow: 'hidden' }}>
            <motion.span
              style={{ display: 'block', willChange: 'transform' }}
              initial={{ y: '110%' }}
              animate={{
                // Incoming masks UP, outgoing masks DOWN — opposing directions
                // are what make a boundary read as a page turn, not a fade.
                y: state === 'in' ? '0%' : '110%',
              }}
              transition={{
                duration: DUR.base,
                delay: state === 'in' ? i * interval : 0,
                ease: (state === 'in' ? EASE.house : EASE.exit),
              }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </span>
    </div>
  );
}
