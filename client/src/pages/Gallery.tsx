import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Picture } from '@/components/media/Picture';
import { CurtainMask } from '@/components/motion/CurtainMask';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { DUR, EASE } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';
import { useEscape, useFocusTrap, useScrollLock } from '@/app/overlay';
import { GALLERY } from '@/data/site';
import type { GalleryItem } from '@/types';

const CATEGORIES = [
  { id: 'all', label: 'Everything' },
  { id: 'room', label: 'The Room' },
  { id: 'kitchen', label: 'The Kitchen' },
  { id: 'food', label: 'The Food' },
  { id: 'bar', label: 'The Bar' },
] as const;

export default function Gallery() {
  const [params, setParams] = useSearchParams();
  const [category, setCategory] = useState<string>('all');
  const canAnimate = useCanAnimate();

  const items = useMemo(
    () => (category === 'all' ? GALLERY : GALLERY.filter((g) => g.category === category)),
    [category],
  );

  const openId = params.get('image');
  const openIndex = openId ? items.findIndex((i) => i.id === openId) : -1;

  const open = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('image', id);
    setParams(next);
  };

  const close = useCallback(() => {
    const next = new URLSearchParams(params);
    next.delete('image');
    setParams(next);
  }, [params, setParams]);

  return (
    <PageShell
      title="Gallery"
      description="The room, the kitchen, the food and the bar."
    >
      <header className="u-shell" style={{ paddingTop: 'calc(var(--nav-h) + 6rem)' }}>
        <Reveal y={0}>
          <p className="u-mono mb-7" style={{ color: 'var(--color-saffron)' }}>
            Gallery
          </p>
        </Reveal>
        <LineMask text="The room, and the work" as="h1" className="u-display mb-10" animateOnMount />

        <Reveal delay={0.3}>
          <div className="mb-14 flex flex-wrap gap-x-7 gap-y-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={category === c.id}
                className="u-mono"
              >
                <span
                  className="link-rule"
                  data-active={category === c.id}
                  style={{
                    color: category === c.id ? 'var(--color-bone)' : 'var(--color-bone-dim)',
                    transition: `color ${DUR.short}s var(--ease-house)`,
                  }}
                >
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </Reveal>
      </header>

      {/* Masonry via CSS columns, so the grid re-flows naturally on filter */}
      <section className="u-shell pb-28">
        <motion.div layout className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <motion.figure
                key={item.id}
                layout
                initial={{ opacity: 0, y: canAnimate ? 20 : 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{
                  duration: canAnimate ? DUR.base : DUR.micro,
                  delay: canAnimate ? Math.min(i, 8) * 0.045 : 0,
                  ease: EASE.house,
                }}
                className="mb-4 break-inside-avoid"
              >
                <button
                  type="button"
                  onClick={() => open(item.id)}
                  className="group block w-full text-left"
                  aria-label={`Open ${item.caption}`}
                >
                  <CurtainMask margin="0px 0px -12% 0px">
                    <Picture
                      src={item.image}
                      alt={item.caption}
                      ratio={item.tall ? '3/4' : '4/3'}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="w-full transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                    />
                  </CurtainMask>
                  <figcaption
                    className="u-mono pt-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                    style={{ color: 'var(--color-bone-dim)' }}
                  >
                    {item.caption}
                  </figcaption>
                </button>
              </motion.figure>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      <Lightbox
        items={items}
        index={openIndex}
        onClose={close}
        onNavigate={(i) => open(items[i].id)}
      />
    </PageShell>
  );
}

function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const open = index >= 0;
  const canAnimate = useCanAnimate();
  const panelRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const touchStart = useRef(0);

  useScrollLock(open, 'lightbox');
  useEscape(open, onClose);
  useFocusTrap(open, panelRef);

  const go = useCallback(
    (delta: 1 | -1) => {
      setDirection(delta);
      const next = (index + delta + items.length) % items.length;
      onNavigate(next);
    },
    [index, items.length, onNavigate],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go]);

  // Preload the adjacent images.
  useEffect(() => {
    if (!open) return;
    [1, -1].forEach((d) => {
      const item = items[(index + d + items.length) % items.length];
      if (item) {
        const i = new Image();
        i.src = `${item.image}?w=1600&q=78&auto=format&fit=crop`;
      }
    });
  }, [open, index, items]);

  if (!open) return null;
  const item = items[index];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex flex-col">
        <motion.div
          className="absolute inset-0"
          style={{ background: 'rgb(11 11 12 / 0.96)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />

        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={item.caption}
          className="relative z-10 flex h-full flex-col"
          onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const delta = e.changedTouches[0].clientX - touchStart.current;
            if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
          }}
        >
          <div className="u-shell flex items-center justify-between py-6">
            <span className="u-num" style={{ color: 'var(--color-bone-dim)' }}>
              {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </span>
            <button type="button" onClick={onClose} className="u-mono" style={{ color: 'var(--color-bone)' }}>
              Close
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={item.id}
                className="max-h-full"
                initial={canAnimate ? { opacity: 0, x: 40 * direction, scale: 0.94 } : { opacity: 0 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={canAnimate ? { opacity: 0, x: -40 * direction } : { opacity: 0 }}
                transition={{ duration: canAnimate ? 0.5 : DUR.micro, ease: EASE.house }}
              >
                <img
                  src={`${item.image}?w=1600&q=80&auto=format&fit=crop`}
                  alt={item.caption}
                  className="max-h-[72svh] w-auto object-contain"
                />
                <p className="u-mono pt-5 text-center" style={{ color: 'var(--color-bone-dim)' }}>
                  {item.caption}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="u-shell flex justify-center gap-3 pb-8">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="flex h-12 w-12 items-center justify-center"
              style={{ border: '1px solid var(--color-smoke)' }}
            >
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
                <path d="M14 5H2M6 1L2 5l4 4" stroke="var(--color-bone-dim)" strokeWidth="1" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="flex h-12 w-12 items-center justify-center"
              style={{ border: '1px solid var(--color-smoke)' }}
            >
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
                <path d="M0 5h12M8 1l4 4-4 4" stroke="var(--color-bone-dim)" strokeWidth="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}
