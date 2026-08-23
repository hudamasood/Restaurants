import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { DUR, EASE } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';
import { Wordmark } from '@/components/layout/Wordmark';

const COVER_MS = 450; // overlay wipes up
const HOLD_MS = 200; // holds on the wordmark
const UNCOVER_AT = COVER_MS + HOLD_MS;

/**
 * Oxblood overlay wipes up 450ms → holds 200ms on the wordmark → wipes away
 * 450ms. Total 900ms. Scroll resets to top under the cover.
 *
 * Two deliberate choices here, both learned the hard way:
 *
 * 1. The effect depends on `location.pathname` alone. It also sets `display`,
 *    and if `display` were a dependency the mid-transition swap would re-run
 *    the effect, whose cleanup would cancel the timer that uncovers the page —
 *    leaving the overlay stuck over the site permanently. The current path is
 *    therefore read through a ref rather than from the closure.
 *
 * 2. The page content is NOT wrapped in a keyed AnimatePresence. With
 *    `mode="wait"`, an exit animation that doesn't complete cleanly leaves the
 *    incoming child mounted at its `initial` state and never advanced, so the
 *    whole site renders at opacity 0. The overlay already covers the viewport
 *    for the entire swap, so the crossfade bought nothing and cost that. The
 *    outgoing fade is a plain CSS transition on a single persistent element,
 *    which cannot be orphaned — if anything stalls, the next state change
 *    still returns it to full opacity.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const canAnimate = useCanAnimate();
  const [, setDisplay] = useState(location.pathname);
  const [covering, setCovering] = useState(false);
  const displayRef = useRef(location.pathname);

  useEffect(() => {
    const from = displayRef.current;
    const to = location.pathname;
    if (from === to) return;

    const swap = () => {
      displayRef.current = to;
      setDisplay(to);
      window.scrollTo(0, 0);
    };

    // Dish chapter chaining is client-side with no page wipe — the hero
    // cross-dissolves and the counter ticks instead.
    const isDishChain = to.startsWith('/menu/') && from.startsWith('/menu/');

    if (!canAnimate || isDishChain) {
      swap();
      return;
    }

    setCovering(true);
    const swapAt = window.setTimeout(swap, COVER_MS);
    const uncoverAt = window.setTimeout(() => setCovering(false), UNCOVER_AT);

    return () => {
      window.clearTimeout(swapAt);
      window.clearTimeout(uncoverAt);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      <div
        style={{
          // Never animate outgoing position — it fights the incoming wipe.
          opacity: covering && canAnimate ? 0 : 1,
          transition: `opacity ${DUR.micro}s var(--ease-exit)`,
        }}
      >
        {children}
      </div>

      <AnimatePresence>
        {covering && (
          <motion.div
            aria-hidden="true"
            className="fixed inset-0 z-[120] flex items-center justify-center"
            style={{ background: 'var(--color-oxblood)' }}
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '-100%' }}
            transition={{ duration: COVER_MS / 1000, ease: EASE.exit }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.12 }}
            >
              <Wordmark size="lg" tone="bone" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
