import { motion, useTransform, type MotionValue } from 'motion/react';
import { Link } from 'react-router-dom';
import { StickyStage } from '@/components/motion/StickyStage';
import { Picture } from '@/components/media/Picture';
import { Reveal } from '@/components/motion/Reveal';
import { EXPERIENCES } from '@/data/site';

/**
 * Pinned container; vertical wheel input translates to lateral movement.
 * Bounded — never page-wide scroll hijacking. A thin progress rule at the
 * bottom is the only indicator in this section.
 */
export function ExperienceRail() {
  return (
    <StickyStage
      id="rooms"
      height={220}
      heightTablet={180}
      mobile={<ExperienceMobile />}
      className="relative"
    >
      {(progress) => <Lateral progress={progress} />}
    </StickyStage>
  );
}

function Lateral({ progress }: { progress: MotionValue<number> }) {
  const x = useTransform(progress, [0, 1], ['0%', '-80%']);

  return (
    <div className="relative flex h-full flex-col justify-center overflow-hidden">
      <div className="u-shell absolute inset-x-0 top-0 z-20" style={{ paddingTop: 'calc(var(--nav-h) + 2rem)' }}>
        <p className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>
          Rooms &amp; occasions
        </p>
      </div>

      <motion.div className="flex gap-6 pl-[clamp(1.25rem,4vw,5rem)]" style={{ x, willChange: 'transform' }}>
        {EXPERIENCES.map((e, i) => (
          <Panel key={e.id} experience={e} index={i} progress={progress} />
        ))}
      </motion.div>

      {/* The only progress indicator in this section */}
      <div className="u-shell absolute inset-x-0 bottom-10 z-20">
        <div style={{ height: 1, background: 'var(--color-smoke)' }}>
          <motion.div
            style={{
              height: '100%',
              background: 'var(--color-bone)',
              transformOrigin: 'left',
              scaleX: progress,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Panel({
  experience,
  index,
  progress,
}: {
  experience: (typeof EXPERIENCES)[number];
  index: number;
  progress: MotionValue<number>;
}) {
  // Text reveals when this panel's centre crosses 60% viewport width —
  // tracked per panel with useTransform rather than five observers.
  const start = Math.max(0, index / EXPERIENCES.length - 0.12);
  const opacity = useTransform(progress, [start, start + 0.08], [0, 1]);
  const y = useTransform(progress, [start, start + 0.08], [18, 0]);

  return (
    <article
      className="relative shrink-0 overflow-hidden"
      style={{ width: 'min(78vw, 620px)', height: 'min(72vh, 620px)' }}
    >
      <Picture
        src={experience.image}
        alt={experience.name}
        className="h-full w-full"
        sizes="(max-width: 1024px) 78vw, 620px"
      />
      <div className="u-scrim" />

      <motion.div
        className="absolute inset-x-0 bottom-0 p-8 lg:p-10"
        style={{ opacity, y }}
      >
        <p className="u-mono mb-3" style={{ color: 'var(--color-bone-dim)' }}>
          {experience.capacity}
        </p>
        <h3 className="u-display mb-4" style={{ fontSize: 'var(--t-dish-lg)' }}>
          {experience.name}
        </h3>
        <p
          className="mb-6"
          style={{ color: 'var(--color-bone-dim)', maxWidth: '42ch', fontSize: '0.9375rem' }}
        >
          {experience.description}
        </p>
        <Link
          to={`/contact?subject=${encodeURIComponent(experience.name)}`}
          className="btn btn--ghost"
        >
          <span>Enquire</span>
        </Link>
      </motion.div>
    </article>
  );
}

/** Mobile: native scroll-snap carousel, no pinning. */
function ExperienceMobile() {
  return (
    <div className="py-20">
      <div className="u-shell mb-8">
        <p className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>
          Rooms &amp; occasions
        </p>
      </div>

      <div
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pl-[clamp(1.25rem,4vw,5rem)] pr-6 pb-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {EXPERIENCES.map((e) => (
          <article
            key={e.id}
            className="relative shrink-0 snap-center overflow-hidden"
            style={{ width: '82vw', height: '62vh' }}
          >
            <Picture src={e.image} alt={e.name} className="h-full w-full" sizes="82vw" />
            <div className="u-scrim" />
            <Reveal className="absolute inset-x-0 bottom-0 p-6">
              <p className="u-mono mb-2" style={{ color: 'var(--color-bone-dim)' }}>
                {e.capacity}
              </p>
              <h3 className="u-display mb-3" style={{ fontSize: 'var(--t-dish)' }}>
                {e.name}
              </h3>
              <Link
                to={`/contact?subject=${encodeURIComponent(e.name)}`}
                className="btn btn--ghost"
              >
                <span>Enquire</span>
              </Link>
            </Reveal>
          </article>
        ))}
      </div>
    </div>
  );
}
