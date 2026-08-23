import { useState } from 'react';
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'motion/react';
import { Link } from 'react-router-dom';
import { DUR, EASE } from '@/motion/constants';
import { StickyStage } from '@/components/motion/StickyStage';
import { Picture } from '@/components/media/Picture';
import { LineMaskControlled } from '@/components/motion/LineMask';
import { CurtainMask } from '@/components/motion/CurtainMask';
import { HERO_CHAPTERS } from '@/data/site';
import { BRAND } from '@/data/brand';

/**
 * 250vh pinned, three chapters at p 0–0.33, 0.33–0.66, 0.66–1.
 *
 * At each boundary the image cross-dissolves while the outgoing headline
 * masks DOWN and the incoming masks UP. Opposing directions are what make
 * the boundary read as a page turn rather than a slideshow.
 *
 * CTAs and nav do not participate — they are chrome, not content.
 */
export function Hero() {
  return (
    <StickyStage
      id="hero"
      height={250}
      heightTablet={180}
      mobile={<HeroMobile />}
      className="relative"
    >
      {(progress, enabled) => <HeroStage progress={progress} enabled={enabled} />}
    </StickyStage>
  );
}

function HeroStage({
  progress,
  enabled,
}: {
  progress: MotionValue<number>;
  enabled: boolean;
}) {
  const [chapter, setChapter] = useState(0);

  useMotionValueEvent(progress, 'change', (p) => {
    const next = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
    setChapter((prev) => (prev === next ? prev : next));
  });

  // Parallax inside the mask — the image moves, never the container.
  const imageY = useTransform(progress, [0, 1], ['0%', '-8%']);
  // Bottom-edge peek: the next section rises to 80px visible from p 0.85.
  const peekY = useTransform(progress, [0.85, 1], ['100%', 'calc(100% - 80px)']);

  return (
    <div className="u-grain relative h-full w-full overflow-hidden">
      {/* Stacked images, opacity derived from chapter distance */}
      {HERO_CHAPTERS.map((c, i) => (
        <motion.div
          key={c.id}
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: chapter === i ? 1 : 0 }}
          transition={{ duration: 0.7, ease: EASE.house }}
        >
          <motion.div className="h-full w-full" style={enabled ? { y: imageY } : undefined}>
            <Picture
              src={c.image}
              alt=""
              priority={i === 0}
              sizes="100vw"
              className="h-[112%] w-full"
              objectPosition="center 40%"
            />
          </motion.div>
        </motion.div>
      ))}

      <div className="u-scrim" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-end pb-[max(3.5rem,7vh)]">
        <div className="u-shell">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
            <div className="min-w-0 lg:flex-1">
              {HERO_CHAPTERS.map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    display: chapter === i ? 'block' : 'none',
                  }}
                >
                  <LineMaskControlled
                    text={c.headline}
                    state="in"
                    className="u-display t-hero"
                    key={`${c.id}-${chapter === i}`}
                  />
                </div>
              ))}
            </div>

            <div className="flex shrink-0 flex-col items-start gap-7 lg:items-end">
              <p
                className="u-mono enter-rise max-w-[28ch] lg:text-right"
                style={{
                  color: 'var(--color-bone-dim)',
                  lineHeight: 1.9,
                  animationDelay: '300ms',
                }}
              >
                {BRAND.claim}
              </p>

              <div
                className="enter-rise flex flex-wrap items-center gap-3"
                style={{ animationDelay: '500ms' }}
              >
                <Link to="/reserve" className="btn btn--filled">
                  <span>Reserve a table</span>
                </Link>
                <Link to="/menu" className="btn btn--outline">
                  <span>The menu</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Chapter counter, bottom-left */}
          <div
            className="enter-fade mt-12 flex items-center gap-4"
            style={{ animationDelay: '600ms' }}
          >
            <span
              className="u-num"
              style={{
                fontSize: 'var(--t-label)',
                letterSpacing: '0.18em',
                color: 'var(--color-bone)',
              }}
            >
              {String(chapter + 1).padStart(2, '0')}
            </span>
            <div className="flex gap-1.5">
              {HERO_CHAPTERS.map((c, i) => (
                <span
                  key={c.id}
                  aria-hidden="true"
                  style={{
                    display: 'block',
                    width: chapter === i ? 34 : 16,
                    height: 1,
                    background:
                      chapter === i ? 'var(--color-bone)' : 'var(--color-bone-ghost)',
                    transition: `all ${DUR.base}s var(--ease-house)`,
                  }}
                />
              ))}
            </div>
            <span
              className="u-num"
              style={{
                fontSize: 'var(--t-label)',
                letterSpacing: '0.18em',
                color: 'var(--color-bone-dim)',
              }}
            >
              {String(HERO_CHAPTERS.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom-edge peek — costs nothing, signals depth */}
      {enabled && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[30vh]"
          style={{ y: peekY }}
        >
          <Picture src={HERO_CHAPTERS[0].image} alt="" className="h-full w-full" />
          <div className="u-scrim-full" />
        </motion.div>
      )}
    </div>
  );
}

/** Mobile: no pin. Three stacked full-height panels, each with a curtain entrance. */
function HeroMobile() {
  return (
    <div>
      {HERO_CHAPTERS.map((c, i) => (
        <div key={c.id} className="relative" style={{ height: '100svh' }}>
          <CurtainMask className="absolute inset-0" margin="0px 0px -20% 0px">
            <Picture
              src={c.image}
              alt=""
              priority={i === 0}
              className="h-full w-full"
              sizes="100vw"
            />
          </CurtainMask>
          <div className="u-scrim" />

          <div className="relative z-10 flex h-full flex-col justify-end pb-16">
            <div className="u-shell">
              <LineMaskControlled text={c.headline} state="in" className="u-display t-display mb-5" />
              <p style={{ color: 'var(--color-bone-dim)', maxWidth: '34rem' }}>{c.body}</p>

              {i === 0 && (
                <div className="mt-8 flex flex-col gap-3">
                  <Link to="/reserve" className="btn btn--filled">
                    <span>Reserve a table</span>
                  </Link>
                  <Link to="/menu" className="btn btn--outline">
                    <span>The menu</span>
                  </Link>
                </div>
              )}

              <p className="u-num mt-8" style={{ color: 'var(--color-bone-faint)' }}>
                {String(i + 1).padStart(2, '0')} / {String(HERO_CHAPTERS.length).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
