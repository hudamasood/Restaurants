import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useTransform } from 'motion/react';
import { Link } from 'react-router-dom';
import { DUR, DEPTH } from '@/motion/constants';
import { useMotionState } from '@/motion/guards';
import { usePassProgress } from '@/motion/scroll';
import { Picture } from '@/components/media/Picture';
import { CurtainMask } from '@/components/motion/CurtainMask';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { AnnotationLayer, AnnotationCaptions } from '@/components/motion/Annotation';
import { SIGNATURE_DISHES } from '@/data/menu';
import { price } from '@/lib/format';
import type { Dish } from '@/types';

/**
 * The homepage carries four signature chapters, not all eight. Eight
 * full-viewport chapters would make the homepage roughly 2,400vh and bury
 * the reservation CTA. The remaining four live on /menu/:slug.
 */
const HOME_CHAPTERS = SIGNATURE_DISHES.slice(0, 4);

export function SignatureChapters() {
  const [active, setActive] = useState(1);

  return (
    <section id="signatures" className="relative">
      {/* Counter ticks as each chapter passes 50% viewport.
          Height is zero on purpose: a sticky element is still in normal flow,
          so without this the counter reserved a band of empty layout space
          between the station rail and the first chapter. Its content
          overflows the zero-height box and is positioned by padding. */}
      <div className="pointer-events-none sticky top-0 z-20 hidden h-0 lg:block">
        <div className="u-shell flex justify-end" style={{ paddingTop: 'calc(var(--nav-h) + 2rem)' }}>
          <div className="u-num flex items-center gap-3" style={{ fontSize: 'var(--t-label)', letterSpacing: '0.18em' }}>
            <motion.span
              key={active}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{ duration: DUR.short }}
              style={{ color: 'var(--color-bone)' }}
            >
              {String(active).padStart(2, '0')}
            </motion.span>
            <span style={{ width: 22, height: 1, background: 'var(--color-bone-ghost)' }} />
            <span style={{ color: 'var(--color-bone-dim)' }}>
              {String(HOME_CHAPTERS.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {HOME_CHAPTERS.map((dish, i) => (
        <Chapter
          key={dish.id}
          dish={dish}
          index={i}
          onActivate={() => setActive(i + 1)}
        />
      ))}
    </section>
  );
}

function Chapter({
  dish,
  index,
  onActivate,
}: {
  dish: Dish;
  index: number;
  onActivate: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { progress, enabled } = usePassProgress(ref);
  const { isMobile } = useMotionState();
  const flipped = index % 2 === 1;

  useMotionValueEvent(progress, 'change', (p) => {
    if (p > 0.35 && p < 0.75) onActivate();
  });

  // Two depth layers only — three or more reads as jitter, not depth.
  const imageY = useTransform(progress, [0, 1], ['0%', `${DEPTH.near}%`]);

  const annotations = dish.provenance.slice(0, 2).map((p, i) => ({
    label: p.label,
    value: p.value,
    x: i === 0 ? 32 : 62,
    y: i === 0 ? 30 : 66,
    side: (i === 0 ? 'right' : 'left') as 'right' | 'left',
  }));

  return (
    <div
      ref={ref}
      className="relative flex items-center py-20 lg:py-0"
      style={{ minHeight: isMobile ? 'auto' : '110vh' }}
    >
      <div className="u-shell w-full">
        <div
          className={`grid items-center gap-10 lg:grid-cols-12 lg:gap-16 ${
            flipped ? 'lg:[direction:rtl]' : ''
          }`}
        >
          {/* Image */}
          <div className={`relative lg:col-span-7 ${flipped ? 'lg:[direction:ltr]' : ''}`}>
            <CurtainMask className="relative" margin="0px 0px -20% 0px">
              <motion.div style={enabled ? { y: imageY } : undefined}>
                <Picture
                  // Homepage keeps its established frame; the menu card is
                  // chosen for dish accuracy and can differ.
                  src={dish.media.home ?? dish.media.primary}
                  alt={dish.name}
                  ratio={isMobile ? '4/5' : '3/4'}
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="w-full"
                />
              </motion.div>
            </CurtainMask>
            <AnnotationLayer points={annotations} />
          </div>

          {/* Copy */}
          <div className={`lg:col-span-5 ${flipped ? 'lg:[direction:ltr]' : ''}`}>
            <Reveal y={0}>
              <p className="u-mono mb-6" style={{ color: 'var(--color-saffron)' }}>
                Signature · {String(index + 1).padStart(2, '0')}
              </p>
            </Reveal>

            <LineMask
              text={dish.name}
              as="h2"
              className="u-display t-section mb-6"
              margin="0px 0px -20% 0px"
            />

            <Reveal delay={0.1}>
              <p
                className="mb-8"
                style={{ color: 'var(--color-bone-dim)', maxWidth: '44ch', fontSize: 'var(--t-lede)' }}
              >
                {dish.description}
              </p>
            </Reveal>

            <AnnotationCaptions points={annotations} className="mb-8" />

            <Reveal delay={0.15}>
              <div
                className="mb-9 flex items-center gap-6 border-t pt-6"
                style={{ borderColor: 'var(--color-smoke)' }}
              >
                <span className="u-num" style={{ color: 'var(--color-bone)', fontSize: '1rem' }}>
                  {price(dish.price)}
                </span>
                {dish.priceNote && (
                  <span className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>
                    {dish.priceNote}
                  </span>
                )}
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <Link to={`/menu/${dish.slug}`} className="btn btn--outline">
                <span>Read the dish</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
