import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DUR, EASE } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';
import { Wordmark } from '@/components/layout/Wordmark';

const HARD_CAP = 800;
const SKIP_UNDER = 500;

/**
 * Oxblood field. The wordmark line-masks up, a hairline rule draws
 * left-to-right tracking real asset load, then the field wipes upward.
 *
 * Hard-capped at 800ms. If assets resolve before 500ms the loader is skipped
 * entirely — a loader running on a warm cache is theatre at the expense of
 * LCP. Never shown on client-side route changes. Never a percentage counter.
 */
export function Loader({ onDone }: { onDone: () => void }) {
  const canAnimate = useCanAnimate();
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0.05);
  const started = useRef(performance.now());
  const finished = useRef(false);

  useEffect(() => {
    let raf = 0;

    const finish = (skip: boolean) => {
      if (finished.current) return;
      finished.current = true;
      cancelAnimationFrame(raf);
      setProgress(1);

      if (skip) {
        setVisible(false);
        onDone();
        return;
      }

      window.setTimeout(() => {
        setVisible(false);
        onDone();
      }, 220);
    };

    // Track real asset load rather than faking a timeline.
    const tick = () => {
      const elapsed = performance.now() - started.current;
      const imgs = Array.from(document.images);
      const done = imgs.filter((i) => i.complete).length;
      const ratio = imgs.length ? done / imgs.length : 1;
      const timeRatio = Math.min(elapsed / HARD_CAP, 1);

      setProgress(Math.max(0.05, Math.min(0.97, Math.max(ratio, timeRatio * 0.8))));

      if (document.readyState === 'complete' && elapsed < SKIP_UNDER) {
        finish(true);
        return;
      }
      if (document.readyState === 'complete' || elapsed >= HARD_CAP) {
        finish(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    const cap = window.setTimeout(() => finish(false), HARD_CAP);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(cap);
    };
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: 'var(--color-oxblood)' }}
          initial={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={
            canAnimate
              ? { clipPath: 'inset(0 0 100% 0)' }
              : { opacity: 0 }
          }
          transition={{
            duration: canAnimate ? 0.7 : DUR.micro,
            ease: EASE.house,
          }}
        >
          <div className="flex flex-col items-center gap-7 px-6">
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <motion.span
                style={{ display: 'block' }}
                initial={canAnimate ? { y: '110%' } : { opacity: 0 }}
                animate={canAnimate ? { y: '0%' } : { opacity: 1 }}
                transition={{
                  duration: canAnimate ? DUR.base : DUR.micro,
                  ease: EASE.house,
                }}
              >
                <Wordmark size="lg" tone="bone" />
              </motion.span>
            </span>

            <div
              style={{
                width: 'min(260px, 60vw)',
                height: 1,
                background: 'rgb(233 227 215 / 0.18)',
                overflow: 'hidden',
              }}
            >
              <motion.div
                style={{
                  height: '100%',
                  background: 'var(--color-bone)',
                  transformOrigin: 'left',
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: progress }}
                transition={{ duration: 0.35, ease: EASE.house }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
