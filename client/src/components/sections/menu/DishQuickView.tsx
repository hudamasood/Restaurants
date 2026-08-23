import { useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { DUR, EASE } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';
import { useEscape, useFocusTrap, useScrollLock } from '@/app/overlay';
import { Picture } from '@/components/media/Picture';
import { Token } from '@/components/primitives/Button';
import { price, dietaryTokens } from '@/lib/format';
import { STATION_LABELS, dishById } from '@/data/menu';
import type { Dish } from '@/types';

export function DishQuickView({ dish, onClose }: { dish: Dish | null; onClose: () => void }) {
  const canAnimate = useCanAnimate();
  const panelRef = useRef<HTMLDivElement>(null);
  const open = Boolean(dish);

  useScrollLock(open, 'quickView');
  useEscape(open, onClose);
  useFocusTrap(open, panelRef);

  const paired = dish?.pairedDrink ? dishById(dish.pairedDrink) : undefined;

  return (
    <AnimatePresence>
      {dish && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0"
            style={{ background: 'rgb(11 11 12 / 0.82)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={dish.name}
            className="relative max-h-[92svh] w-full overflow-y-auto sm:max-w-4xl"
            style={{ background: 'var(--color-ash)', border: '1px solid var(--color-smoke)' }}
            initial={canAnimate ? { opacity: 0, y: 24, scale: 0.98 } : { opacity: 0 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={canAnimate ? { opacity: 0, y: 12, scale: 0.99 } : { opacity: 0 }}
            transition={{
              duration: canAnimate ? 0.5 : DUR.micro,
              ease: EASE.house as unknown as number[],
            }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center"
              style={{ background: 'rgb(11 11 12 / 0.6)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M1 1l12 12M13 1L1 13" stroke="var(--color-bone)" strokeWidth="1" />
              </svg>
            </button>

            <div className="grid sm:grid-cols-2">
              <Picture
                src={dish.media.primary}
                alt={dish.name}
                ratio="4/5"
                sizes="(max-width: 640px) 100vw, 50vw"
                className="w-full"
              />

              <motion.div
                className="p-7 lg:p-10"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: canAnimate ? 0.09 : 0, delayChildren: 0.1 } },
                }}
              >
                {[
                  <p key="s" className="u-mono mb-4" style={{ color: 'var(--color-saffron)' }}>
                    {STATION_LABELS[dish.station]}
                  </p>,
                  <h2 key="n" className="u-display mb-4" style={{ fontSize: 'var(--t-dish-lg)' }}>
                    {dish.name}
                  </h2>,
                  <p key="d" className="mb-6" style={{ color: 'var(--color-bone-dim)', lineHeight: 1.7 }}>
                    {dish.longDescription ?? dish.description}
                  </p>,
                  <div key="p" className="mb-6 flex flex-wrap gap-1.5">
                    {dietaryTokens(dish.dietary).map((t) => (
                      <Token key={t}>{t}</Token>
                    ))}
                    {dish.isShared && <Token tone="share">To share</Token>}
                  </div>,
                  <dl key="pr" className="mb-6 flex flex-col gap-3">
                    {dish.provenance.map((p) => (
                      <div key={p.label} className="flex gap-4 border-t pt-3" style={{ borderColor: 'var(--color-smoke)' }}>
                        <dt className="u-mono shrink-0" style={{ color: 'var(--color-bone-faint)', minWidth: '9ch' }}>
                          {p.label}
                        </dt>
                        <dd className="u-mono" style={{ color: 'var(--color-bone)' }}>
                          {p.value}
                        </dd>
                      </div>
                    ))}
                  </dl>,
                  <div key="i" className="mb-7">
                    <p className="u-mono mb-2" style={{ color: 'var(--color-bone-faint)' }}>
                      Ingredients
                    </p>
                    <p style={{ color: 'var(--color-bone-dim)', fontSize: '0.875rem' }}>
                      {dish.ingredients.join(' · ')}
                    </p>
                  </div>,
                  <div
                    key="f"
                    className="flex flex-wrap items-center justify-between gap-4 border-t pt-6"
                    style={{ borderColor: 'var(--color-smoke)' }}
                  >
                    <span className="u-num" style={{ color: 'var(--color-bone)', fontSize: '1.125rem' }}>
                      {price(dish.price)}
                      {dish.priceNote && (
                        <span className="u-mono ml-3" style={{ color: 'var(--color-bone-faint)' }}>
                          {dish.priceNote}
                        </span>
                      )}
                    </span>
                    <Link to="/reserve" className="btn btn--outline">
                      <span>Reserve</span>
                    </Link>
                  </div>,
                  paired ? (
                    <div key="pd" className="mt-7 border-t pt-6" style={{ borderColor: 'var(--color-smoke)' }}>
                      <p className="u-mono mb-3" style={{ color: 'var(--color-bone-faint)' }}>
                        Paired zero-proof
                      </p>
                      <p className="u-display" style={{ fontSize: 'var(--t-dish)' }}>
                        {paired.name}
                      </p>
                    </div>
                  ) : null,
                ].map((child, i) =>
                  child ? (
                    <motion.div
                      key={i}
                      variants={{
                        hidden: { opacity: 0, y: canAnimate ? 12 : 0 },
                        show: {
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: canAnimate ? DUR.base : DUR.micro,
                            ease: EASE.house as unknown as number[],
                          },
                        },
                      }}
                    >
                      {child}
                    </motion.div>
                  ) : null,
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
