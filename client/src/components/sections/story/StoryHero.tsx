import { useRef } from 'react';
import { motion, useTransform } from 'motion/react';
import { Picture } from '@/components/media/Picture';
import { CurtainMask } from '@/components/motion/CurtainMask';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { AnnotationLayer } from '@/components/motion/Annotation';
import { useExitProgress } from '@/motion/scroll';
import { BRAND, img } from '@/data/brand';

/**
 * The Story hero, as an editorial spread rather than a headline over a
 * photograph.
 *
 * Three depths: the clay wall runs full bleed and drifts slowest, two
 * portrait frames sit in the empty ground to the right of the lede and climb
 * against it, and the type rises and dims as the whole thing leaves. The
 * frames curtain up from the bottom edge on a stagger, so the composition
 * assembles rather than appearing.
 *
 * It is deliberately asymmetric — two frames at unequal heights, not a grid.
 * The Still Room answers with an aligned triptych; the two pages share the
 * vocabulary and read nothing alike.
 */

/**
 * None of these appear elsewhere on this page, and none is a homepage hero
 * chapter — the two pages should not open on the same photograph.
 */
const BASE = img('1585032226651-759b368d7246'); // the clay wall at 480°C
const FRAME_CRAFT = img('1601050690597-df0568f70950'); // the seal, unbroken
const FRAME_LARDER = img('1589302168068-964664d93dc0'); // ratanjot, not tomato

export function StoryHero({ lede }: { lede: string }) {
  const ref = useRef<HTMLElement>(null);
  const { progress, enabled } = useExitProgress(ref);

  // Three rates, largest gap at the front — the frames read as nearer than
  // the wall behind them.
  const baseY = useTransform(progress, [0, 1], ['0%', '-8%']);
  const craftY = useTransform(progress, [0, 1], ['0%', '-22%']);
  const larderY = useTransform(progress, [0, 1], ['0%', '-13%']);

  // The type does not fight the imagery on the way out; it withdraws first.
  const textY = useTransform(progress, [0, 1], ['0%', '-16%']);
  const textOpacity = useTransform(progress, [0, 0.68], [1, 0]);

  return (
    <header
      ref={ref}
      className="u-grain relative flex items-end overflow-hidden"
      style={{ minHeight: '88svh', paddingTop: 'var(--nav-h)' }}
    >
      <motion.div
        className="absolute inset-0"
        style={enabled ? { y: baseY } : undefined}
      >
        <Picture
          src={BASE}
          alt=""
          priority
          className="h-[112%] w-full"
          sizes="100vw"
          objectPosition="center 42%"
        />
      </motion.div>

      <div className="u-scrim" />

      {/*
        The frames live in the ground to the right of the lede, which is
        capped at 50ch, so they never cross the type. Below 768px they are not
        rendered at all: parallax is off there, and two floating frames over a
        375px hero would crowd the headline rather than deepen it.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5] hidden md:block"
      >
        <motion.div
          className="absolute bottom-[42%] xl:bottom-[30%]"
          style={{
            right: 'clamp(1.25rem, 4vw, 5rem)',
            width: 'clamp(150px, 16vw, 236px)',
            ...(enabled ? { y: craftY } : {}),
          }}
        >
          <CurtainMask from="bottom" delay={0.55} className="relative">
            <Picture
              src={FRAME_CRAFT}
              alt=""
              ratio="3/4"
              sizes="(min-width: 1024px) 16vw, 22vw"
              objectPosition="center 45%"
            />
            {/* Provenance and time, never temperature-for-its-own-sake. */}
            <AnnotationLayer
              points={[{ label: 'Dum', value: 'Sealed six hours', x: 58, y: 32, side: 'left' }]}
            />
          </CurtainMask>
        </motion.div>

        <motion.div
          className="absolute hidden lg:block"
          style={{
            right: 'calc(clamp(1.25rem, 4vw, 5rem) + clamp(150px, 16vw, 236px) + 1.5rem)',
            bottom: '46%',
            width: 'clamp(122px, 12vw, 178px)',
            ...(enabled ? { y: larderY } : {}),
          }}
        >
          <CurtainMask from="bottom" delay={0.85} className="relative">
            <Picture
              src={FRAME_LARDER}
              alt=""
              ratio="4/5"
              sizes="12vw"
              objectPosition="center"
            />
          </CurtainMask>
        </motion.div>
      </div>

      <motion.div
        className="u-shell relative z-10 w-full pb-16"
        style={enabled ? { y: textY, opacity: textOpacity } : undefined}
      >
        <Reveal y={0}>
          <p className="u-mono mb-7" style={{ color: 'var(--color-saffron)' }}>
            The story
          </p>
        </Reveal>

        <LineMask text="Built around one fire" as="h1" className="u-display mb-7" animateOnMount />

        <Reveal delay={0.4}>
          <p style={{ color: 'var(--color-bone-dim)', maxWidth: '50ch', fontSize: 'var(--t-lede)' }}>
            {lede}
          </p>
        </Reveal>

        <Reveal delay={0.55}>
          <p className="u-mono mt-9" style={{ color: 'var(--color-bone-faint)' }}>
            {BRAND.address.line2}, {BRAND.address.city} · {BRAND.certification.reference}
          </p>
        </Reveal>
      </motion.div>
    </header>
  );
}
