import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { DUR, EASE } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';
import { Wordmark } from '@/components/layout/Wordmark';

/**
 * Oxblood overlay wipes up 450ms → holds 200ms on the wordmark → wipes away
 * 450ms. Total 900ms. Scroll resets to top under the cover.
 *
 * The outgoing page fades to 0 over 200ms; its position is never animated,
 * because that fights the incoming wipe.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const canAnimate = useCanAnimate();
  const [covering, setCovering] = useState(false);
  const [renderedKey, setRenderedKey] = useState(location.pathname);

  useEffect(() => {
    // Dish chapter chaining is client-side with no page wipe — the hero
    // cross-dissolves and the counter ticks instead.
    const isDishChain =
      location.pathname.startsWith('/menu/') && renderedKey.startsWith('/menu/');

    if (location.pathname === renderedKey) return;

    if (!canAnimate || isDishChain) {
      setRenderedKey(location.pathname);
      window.scrollTo(0, 0);
      return;
    }

    setCovering(true);
    const coverAt = window.setTimeout(() => {
      setRenderedKey(location.pathname);
      window.scrollTo(0, 0);
    }, DUR.page * 1000 * 0.5);

    const clearAt = window.setTimeout(() => setCovering(false), DUR.page * 1000 * 0.72);

    return () => {
      window.clearTimeout(coverAt);
      window.clearTimeout(clearAt);
    };
  }, [location.pathname, renderedKey, canAnimate]);

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={renderedKey}
          initial={{ opacity: canAnimate ? 0 : 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: canAnimate ? DUR.micro : 0,
            ease: EASE.exit,
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {covering && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center"
            style={{ background: 'var(--color-oxblood)' }}
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '-100%' }}
            transition={{
              duration: 0.45,
              ease: EASE.exit,
            }}
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
