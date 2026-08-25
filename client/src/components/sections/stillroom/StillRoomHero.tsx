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

      <div className="u-scrim" />

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
        className="u-shell pointer-events-none relative z-[5] mb-10 hidden w-full md:flex md:items-end md:justify-end md:gap-3 lg:gap-4"
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
        width: 'clamp(96px, 10vw, 152px)',
        ...(enabled ? { y } : {}),
      }}
    >
      {/* Down from the top edge — the Story frames lift up from the bottom. */}
      <CurtainMask from="top" delay={0.5 + index * 0.12}>
        <Picture
          src={bay.src}
          alt=""
          ratio="2/3"
          sizes="(min-width: 1024px) 10vw, 14vw"
          objectPosition="center"
        />
      </CurtainMask>

      <Reveal delay={0.85 + index * 0.12}>
        <p
          className="u-mono-sm mt-3"
          style={{ color: 'var(--color-bone-faint)', whiteSpace: 'nowrap' }}
        >
          {bay.caption}
        </p>
      </Reveal>
    </motion.div>
  );
}
