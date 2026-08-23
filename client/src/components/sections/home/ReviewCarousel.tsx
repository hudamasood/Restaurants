import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DUR, EASE } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';
import { REVIEWS } from '@/data/site';

const INTERVAL = 7000;

/**
 * Three quotes, one at a time. Outgoing text masks down and fades, incoming
 * masks up — with no overlap, because overlapping two blocks of large serif
 * is unreadable. Dots only; no second progress element.
 */
export function ReviewCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const canAnimate = useCanAnimate();
  const timer = useRef<number>(0);

  const go = useCallback((next: number) => {
    setIndex(((next % REVIEWS.length) + REVIEWS.length) % REVIEWS.length);
  }, []);

  useEffect(() => {
    // Auto-advance stops under reduced motion, on hover or focus, and when
    // the tab is hidden.
    if (!canAnimate || paused) return;

    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    timer.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % REVIEWS.length);
    }, INTERVAL);

    return () => {
      window.clearInterval(timer.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [canAnimate, paused, index]);

  const review = REVIEWS[index];

  return (
    <section
      className="relative py-24 lg:py-36"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Press quotes"
    >
      <div className="u-shell">
        <div
          className="relative flex flex-col justify-center"
          style={{ minHeight: 'clamp(280px, 34vh, 400px)' }}
        >
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={review.id}
              initial={
                canAnimate ? { opacity: 0, y: '32%' } : { opacity: 0 }
              }
              animate={{ opacity: 1, y: '0%' }}
              exit={canAnimate ? { opacity: 0, y: '-24%' } : { opacity: 0 }}
              transition={{
                duration: canAnimate ? 0.5 : DUR.micro,
                ease: EASE.house as unknown as number[],
              }}
              className="u-measure"
            >
              <p
                className="u-display mb-8"
                style={{ fontSize: 'var(--t-section)', lineHeight: 1.2, maxWidth: '22ch' }}
              >
                {review.quote}
              </p>
              <footer className="flex flex-wrap items-center gap-4">
                <span className="u-mono" style={{ color: 'var(--color-bone)' }}>
                  {review.source}
                </span>
                <span aria-hidden="true" style={{ width: 22, height: 1, background: 'var(--color-bone-ghost)' }} />
                <span className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>
                  {review.attribution}
                </span>
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        <div className="mt-12 flex items-center gap-8">
          <div className="flex gap-3">
            {REVIEWS.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Quote ${i + 1} of ${REVIEWS.length}`}
                aria-current={index === i}
                className="py-2"
              >
                <span
                  style={{
                    display: 'block',
                    width: index === i ? 30 : 14,
                    height: 1,
                    background: index === i ? 'var(--color-bone)' : 'var(--color-bone-ghost)',
                    transition: `all ${DUR.base}s var(--ease-house)`,
                  }}
                />
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-2">
            <Arrow direction="prev" onClick={() => go(index - 1)} />
            <Arrow direction="next" onClick={() => go(index + 1)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Arrow({ direction, onClick }: { direction: 'prev' | 'next'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Previous quote' : 'Next quote'}
      className="flex h-11 w-11 items-center justify-center"
      style={{
        border: '1px solid var(--color-smoke)',
        transition: `border-color ${DUR.short}s var(--ease-house)`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-bone-ghost)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-smoke)')}
    >
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
        <path
          d={direction === 'next' ? 'M0 5h12M8 1l4 4-4 4' : 'M14 5H2M6 1L2 5l4 4'}
          stroke="var(--color-bone-dim)"
          strokeWidth="1"
        />
      </svg>
    </button>
  );
}
