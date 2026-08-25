import { useRef } from 'react';
import { motion, useTransform } from 'motion/react';
import { Picture } from '@/components/media/Picture';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { useExitProgress } from '@/motion/scroll';
import { BRAND, img } from '@/data/brand';

/**
 * The Story hero: the clay wall full bleed, drifting slowly against the
 * scroll, with the type rising and dimming as the section leaves.
 */

/** Not a homepage hero chapter, and used nowhere else on this page. */
const BASE = img('1585032226651-759b368d7246'); // the clay wall at 480°C

export function StoryHero({ lede }: { lede: string }) {
  const ref = useRef<HTMLElement>(null);
  const { progress, enabled } = useExitProgress(ref);

  const baseY = useTransform(progress, [0, 1], ['0%', '-8%']);

  // The type does not fight the imagery on the way out; it withdraws first.
  const textY = useTransform(progress, [0, 1], ['0%', '-16%']);
  const textOpacity = useTransform(progress, [0, 0.68], [1, 0]);

  return (
    <header
      ref={ref}
      className="u-grain relative flex flex-col justify-end overflow-hidden"
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
