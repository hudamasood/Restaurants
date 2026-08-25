import { useRef } from 'react';
import { motion, useTransform } from 'motion/react';
import { Picture } from '@/components/media/Picture';
import { CurtainMask } from '@/components/motion/CurtainMask';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { useExitProgress } from '@/motion/scroll';
import { img } from '@/data/brand';

/**
 * The Still Room hero, built on the architecture of the room rather than on
 * the drinks — those have three pinned chapters of their own further down the
 * page, and opening on them would spend the reveal twice.
 *
 * Where the Story hero is an asymmetric spread, this is an aligned triptych:
 * three tall frames on a shared baseline, curtaining down from the top edge
 * on a stagger, each climbing at a slightly different rate so the row breathes
 * instead of moving as one slab. Panelled oak, low light, a room read as a
 * colonnade. Same vocabulary as Story, opposite rhythm.
 */

const BASE = img('1550966871-3ed3cdb5ed0c'); // private dining, smoked oak

const BAYS = [
  { src: img('1414235077428-338989a2e8c0'), caption: 'The main room', rate: -18 },
  { src: img('1552566626-52f8b828add9'), caption: "The chef's table", rate: -11 },
  { src: img('1519167758481-83f550bb49b3'), caption: 'The terrace', rate: -21 },
];

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

        This one holds its ground through the band the type and the bay labels
        occupy — all of it below 48% of the hero — then falls away over ten
        percent so the room reads from the triptych upward.

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

      {/*
        The triptych sits in flow above the type rather than floating beside
        it. The headline is the constraint, not the lede: at wide viewports
        "No alcohol. No compromise." sets nearly edge to edge, and on a short
        laptop screen a percentage-positioned row has nowhere left to go — one
        viewport height or another will always drive the two together. Stacking
        them makes the collision structurally impossible instead of tuned away.

        Two bays from 768px, the third only from 1024px; three narrow frames on
        a tablet read as a filmstrip rather than as a room. Not rendered at all
        below 768px, where parallax is off.
      */}
      <div
        aria-hidden="true"
        className="u-shell pointer-events-none relative z-[5] mb-14 mt-8 hidden w-full md:flex md:items-end md:justify-end md:gap-5 lg:gap-7"
      >
        {BAYS.map((bay, i) => (
          <Bay key={bay.src} bay={bay} index={i} progress={progress} enabled={enabled} />
        ))}
      </div>

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

function Bay({
  bay,
  index,
  progress,
  enabled,
}: {
  bay: (typeof BAYS)[number];
  index: number;
  progress: ReturnType<typeof useExitProgress>['progress'];
  enabled: boolean;
}) {
  const y = useTransform(progress, [0, 1], ['0%', `${bay.rate}%`]);

  return (
    <motion.div
      className={index === 2 ? 'hidden lg:block' : undefined}
      style={{
        // Equal widths on a shared baseline, so the row reads as one group
        // rather than three loose pictures.
        width: 'clamp(108px, 11vw, 168px)',
        ...(enabled ? { y } : {}),
      }}
    >
      {/* Down from the top edge — the Story frames lift up from the bottom. */}
      <CurtainMask from="top" delay={0.5 + index * 0.12}>
        <Picture
          src={bay.src}
          alt=""
          ratio="2/3"
          sizes="(min-width: 1024px) 11vw, 15vw"
          objectPosition="center"
          // A hairline off the bone token, not a new colour. Over photography
          // a smoke rule disappears; this is what holds each card off the
          // background it is sitting on.
          style={{ border: '1px solid color-mix(in srgb, var(--color-bone) 14%, transparent)' }}
        />
      </CurtainMask>

      <Reveal delay={0.85 + index * 0.12}>
        <p
          className="u-mono-sm mt-4"
          style={{ color: 'var(--color-bone-faint)', whiteSpace: 'nowrap' }}
        >
          {bay.caption}
        </p>
      </Reveal>
    </motion.div>
  );
}
