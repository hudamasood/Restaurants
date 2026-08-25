import { useRef } from 'react';
import { motion, useTransform } from 'motion/react';
import { Picture } from '@/components/media/Picture';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { useExitProgress } from '@/motion/scroll';
import { img } from '@/data/brand';

/**
 * The Still Room hero: the room full bleed, drifting slowly against the
 * scroll, with the type rising and dimming as the section leaves. It opens on
 * the architecture rather than on the drinks, which have three pinned chapters
 * of their own further down the page.
 */

const BASE = img('1550966871-3ed3cdb5ed0c'); // private dining, smoked oak

export function StillRoomHero({ lede }: { lede: string }) {
  const ref = useRef<HTMLElement>(null);
  const { progress, enabled } = useExitProgress(ref);

  const baseY = useTransform(progress, [0, 1], ['0%', '-6%']);
  const textY = useTransform(progress, [0, 1], ['0%', '-14%']);
  const textOpacity = useTransform(progress, [0, 0.7], [1, 0]);

  return (
    <header
      ref={ref}
      className="u-grain relative flex flex-col justify-end overflow-hidden"
      style={{ minHeight: '92svh', paddingTop: 'var(--nav-h)' }}
    >
      <motion.div className="absolute inset-0" style={enabled ? { y: baseY } : undefined}>
        <Picture
          src={BASE}
          alt=""
          priority
          className="h-[110%] w-full"
          sizes="100vw"
          objectPosition="center 38%"
        />
      </motion.div>

      {/*
        A local ramp rather than the shared `.u-scrim`.

        The shared one is tuned for a headline sitting low over food
        photography: it holds 0.64 alpha at the half-way line and only reaches
        0.12 at the very top, which over this room — a bright interior, mean
        luminance 0.45–0.52 across its upper half — flattens most of the frame
        to near-black without buying any contrast the text actually needs.

        This one holds its ground through the band the type occupies — all of
        it below 48% of the hero — then falls away over ten percent so the
        room reads above it.

        Measured against the composited photograph rather than guessed at:
        headline 12.1:1, eyebrow 6.5:1, lede 5.1:1, where the shared scrim gave
        7.5, 2.79 and 4.49 — the last two of which were failing. The photograph
        retains 0.70 of its luminance at 70% of the hero and 0.93 at 90%,
        against 0.66 and 0.81 before.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            `linear-gradient(to top,
              rgb(11 11 12 / 0.95) 0%,
              rgb(11 11 12 / 0.94) 48%,
              rgb(11 11 12 / 0.55) 58%,
              rgb(11 11 12 / 0.26) 72%,
              rgb(11 11 12 / 0.10) 85%,
              rgb(11 11 12 / 0.02) 100%)`,
            // The nav sits transparent over the hero; the top keeps its own ramp.
            `linear-gradient(to bottom,
              rgb(11 11 12 / 0.62) 0%,
              rgb(11 11 12 / 0.28) 11%,
              rgb(11 11 12 / 0) 24%)`,
          ].join(','),
        }}
      />

      <motion.div
        className="u-shell relative z-10 w-full pb-16"
        style={enabled ? { y: textY, opacity: textOpacity } : undefined}
      >
        <Reveal y={0}>
          <p className="u-mono mb-7" style={{ color: 'var(--color-saffron)' }}>
            The Still Room
          </p>
        </Reveal>

        <LineMask
          text="No alcohol. No compromise."
          as="h1"
          className="u-display mb-7"
          animateOnMount
        />

        <Reveal delay={0.4}>
          <p style={{ color: 'var(--color-bone-dim)', maxWidth: '48ch', fontSize: 'var(--t-lede)' }}>
            {lede}
          </p>
        </Reveal>
      </motion.div>
    </header>
  );
}
