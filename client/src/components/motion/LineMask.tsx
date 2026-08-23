import { useEffect, useRef, useState, type CSSProperties, type ElementType } from 'react';
import { DUR, STAGGER, VIEWPORT } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';
import { useReveal } from '@/motion/useReveal';

/**
 * Splits text into rendered lines by measurement — never per character.
 * Per-letter scrambles are the strongest generic-agency tell and cost far
 * more in layout thrash.
 */
function useMeasuredLines(text: string, enabled: boolean) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [lines, setLines] = useState<string[]>([text]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !enabled) {
      setLines([text]);
      return;
    }

    const measure = () => {
      const width = host.clientWidth;
      if (!width) return;

      const probe = document.createElement('div');
      const cs = getComputedStyle(host);
      probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:${width}px;font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};line-height:${cs.lineHeight};letter-spacing:${cs.letterSpacing};text-transform:${cs.textTransform};`;

      const words = text.split(/\s+/).filter(Boolean);
      probe.innerHTML = words.map((w) => `<span>${w}</span>`).join(' ');
      host.appendChild(probe);

      const spans = Array.from(probe.querySelectorAll('span'));
      const grouped: string[] = [];
      let top: number | null = null;
      let buffer: string[] = [];

      spans.forEach((span, i) => {
        const t = (span as HTMLElement).offsetTop;
        if (top === null) top = t;
        if (t !== top) {
          grouped.push(buffer.join(' '));
          buffer = [];
          top = t;
        }
        buffer.push(words[i]);
      });
      if (buffer.length) grouped.push(buffer.join(' '));

      host.removeChild(probe);
      setLines(grouped.length ? grouped : [text]);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, [text, enabled]);

  return { hostRef, lines };
}

interface LineMaskProps {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  interval?: number;
  duration?: number;
  margin?: string;
  /** Reveal on mount rather than on entering the viewport. */
  animateOnMount?: boolean;
  once?: boolean;
}

/**
 * Per-line text reveal, driven by CSS transitions on a data attribute.
 *
 * The baseline — no attribute — is the visible state. That is what keeps the
 * text readable if JS never runs, and equally if a reveal is interrupted
 * before it lands, which an inline-style animation cannot guarantee.
 *
 * Accessibility: the split spans are aria-hidden and the original string is
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
  const { hostRef, lines } = useMeasuredLines(text, canAnimate);
  const { ref, state, settled } = useReveal<HTMLDivElement>({
    margin,
    once,
    onMount: animateOnMount,
  });
  const Tag = as as ElementType;

  // Reduced motion: the whole block, no split, no movement.
  if (!canAnimate) {
    return (
      <div className={className}>
        <Tag>{text}</Tag>
      </div>
    );
  }

  return (
    <div
      ref={(node: HTMLDivElement | null) => {
        hostRef.current = node;
        ref.current = node;
      }}
      className={className}
      data-settled={settled}
    >
      <span className="u-vh">{text}</span>
      <Tag aria-hidden="true" data-lines={state} style={{ display: 'block' }}>
        {lines.map((line, i) => (
          <span key={`${line}-${i}`}>
            <span
              style={
                {
                  transitionDuration: `${duration}s`,
                  transitionDelay: `${(delay + i * interval) * 1000}ms`,
                } as CSSProperties
              }
            >
              {line}
            </span>
          </span>
        ))}
      </Tag>
    </div>
  );
}

/**
 * A line-masked block whose state is driven by a parent rather than by the
 * viewport — used in the hero, where chapter boundaries drive the reveal.
 *
 * Incoming masks UP and outgoing masks DOWN. Opposing directions are what
 * make a boundary read as a page turn rather than a slideshow.
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
  const { hostRef, lines } = useMeasuredLines(text, canAnimate);
  const [entered, setEntered] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!canAnimate) return;
    // See useReveal: rAF does not fire in a backgrounded tab.
    const id = window.setTimeout(() => setEntered(true), 16);
    return () => window.clearTimeout(id);
  }, [canAnimate]);

  // Same guard as useReveal: a transition frozen part-way would leave a
  // half-clipped line of display type on screen indefinitely.
  useEffect(() => {
    if (!canAnimate || state !== 'in') return;
    const t = window.setTimeout(() => setSettled(true), 2600);
    return () => window.clearTimeout(t);
  }, [canAnimate, state]);

  if (!canAnimate) {
    return <div className={className}>{text}</div>;
  }

  const shown = state === 'in' && entered;

  return (
    <div ref={hostRef} className={className} data-settled={settled ? '' : undefined}>
      <span className="u-vh">{text}</span>
      <span aria-hidden="true" data-lines={shown ? 'shown' : 'hidden'} style={{ display: 'block' }}>
        {lines.map((line, i) => (
          <span key={`${line}-${i}`}>
            <span
              style={
                {
                  transitionDuration: `${DUR.base}s`,
                  transitionDelay: `${state === 'in' ? i * interval * 1000 : 0}ms`,
                } as CSSProperties
              }
            >
              {line}
            </span>
          </span>
        ))}
      </span>
    </div>
  );
}
