import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { DUR, EASE } from '@/motion/constants';
import { useMotionState } from '@/motion/guards';
import { useSharedObserver } from '@/motion/scroll';
import { Picture } from '@/components/media/Picture';
import { CurtainMask } from '@/components/motion/CurtainMask';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { STORY_MILESTONES } from '@/data/site';
import { BRAND } from '@/data/brand';

/**
 * Sticky image column. The image cross-dissolves at four text milestones,
 * driven by the text blocks' own IntersectionObserver entries — image and
 * text are bound to each other rather than to independent scroll offsets,
 * so they can never drift.
 */
export function StoryBlock() {
  const [active, setActive] = useState(0);
  const { isMobile } = useMotionState();

  if (isMobile) return <StoryMobile />;

  return (
    <section id="story" className="relative py-24 lg:py-32">
      <div className="u-shell">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          {/* Pinned image column */}
          <div className="lg:col-span-5">
            <div className="sticky" style={{ top: 'calc(var(--nav-h) + 3rem)' }}>
              <div className="relative" style={{ aspectRatio: '3/4' }}>
                {STORY_MILESTONES.map((m, i) => (
                  <motion.div
                    key={m.id}
                    className="absolute inset-0"
                    initial={false}
                    animate={{ opacity: active === i ? 1 : 0 }}
                    transition={{ duration: 0.7, ease: EASE.house }}
                  >
                    <Picture
                      src={m.image}
                      alt={m.heading}
                      className="h-full w-full"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 flex gap-1.5">
                {STORY_MILESTONES.map((m, i) => (
                  <span
                    key={m.id}
                    aria-hidden="true"
                    style={{
                      display: 'block',
                      flex: 1,
                      height: 1,
                      background:
                        active === i ? 'var(--color-bone)' : 'var(--color-bone-ghost)',
                      transition: `background-color ${DUR.base}s var(--ease-house)`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Scrolling text column */}
          <div className="lg:col-span-7">
            <Reveal>
              <p className="u-mono mb-8" style={{ color: 'var(--color-bone-faint)' }}>
                The story
              </p>
            </Reveal>

            {STORY_MILESTONES.map((m, i) => (
              <Milestone key={m.id} index={i} onActive={() => setActive(i)}>
                <p className="u-mono mb-5" style={{ color: 'var(--color-saffron)' }}>
                  {m.label}
                </p>
                <LineMask
                  text={m.heading}
                  as="h2"
                  className="u-display mb-6"
                  margin="0px 0px -25% 0px"
                />
                <Reveal delay={0.1}>
                  <p
                    style={{
                      color: 'var(--color-bone-dim)',
                      maxWidth: '52ch',
                      fontSize: 'var(--t-lede)',
                      lineHeight: 1.7,
                    }}
                  >
                    {m.body}
                  </p>
                </Reveal>

                {/* At the final milestone the certification body is named, in
                    mono with the annotation treatment — it reads as a
                    specification, not a badge. */}
                {i === STORY_MILESTONES.length - 1 && (
                  <Reveal delay={0.2}>
                    <div
                      className="mt-8 border-l pl-6"
                      style={{ borderColor: 'var(--color-saffron)' }}
                    >
                      <p className="u-mono mb-2" style={{ color: 'var(--color-bone-faint)' }}>
                        Certifying body
                      </p>
                      <p className="u-mono" style={{ color: 'var(--color-bone)' }}>
                        {BRAND.certification.body}
                      </p>
                      <p className="u-num mt-1" style={{ color: 'var(--color-bone-dim)', fontSize: '0.75rem' }}>
                        {BRAND.certification.reference}
                      </p>
                    </div>
                  </Reveal>
                )}
              </Milestone>
            ))}

            <Reveal>
              <Link to="/story" className="btn btn--outline mt-6">
                <span>The full story</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Milestone({
  children,
  onActive,
}: {
  children: React.ReactNode;
  index: number;
  onActive: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useSharedObserver(
    ref,
    (entry) => {
      if (entry.isIntersecting) onActive();
    },
    '-45% 0px -45% 0px',
  );

  return (
    <div ref={ref} className="pb-28 lg:pb-40">
      {children}
    </div>
  );
}

function StoryMobile() {
  return (
    <section id="story" className="py-20">
      <div className="u-shell">
        <Reveal>
          <p className="u-mono mb-8" style={{ color: 'var(--color-bone-faint)' }}>
            The story
          </p>
        </Reveal>

        {STORY_MILESTONES.map((m) => (
          <div key={m.id} className="mb-16">
            <CurtainMask className="mb-7">
              <Picture src={m.image} alt={m.heading} ratio="4/5" sizes="100vw" className="w-full" />
            </CurtainMask>
            <p className="u-mono mb-4" style={{ color: 'var(--color-saffron)' }}>
              {m.label}
            </p>
            <LineMask text={m.heading} as="h2" className="u-display mb-4" />
            <Reveal delay={0.08}>
              <p style={{ color: 'var(--color-bone-dim)', lineHeight: 1.7 }}>{m.body}</p>
            </Reveal>
          </div>
        ))}

        <Link to="/story" className="btn btn--outline">
          <span>The full story</span>
        </Link>
      </div>
    </section>
  );
}
