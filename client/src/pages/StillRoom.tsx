import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Picture } from '@/components/media/Picture';
import { CurtainMask } from '@/components/motion/CurtainMask';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { StickyStage } from '@/components/motion/StickyStage';
import { DishCard } from '@/components/sections/menu/DishCard';
import { motion, useTransform, type MotionValue } from 'motion/react';
import { EASE } from '@/motion/constants';
import { useMenu } from '@/hooks/useMenu';
import { DRINK_FAMILIES } from '@/data/site';


export default function StillRoom() {
  const { dishes } = useMenu();
  const DRINKS = dishes.filter((d) => d.course === 'zeroProof');
  const HOT = dishes.filter((d) => d.course === 'coffeeTea');

  return (
    <PageShell
      title="The Still Room"
      description="Twelve zero-proof drinks built on clarification, wild fermentation, cask ageing and smoke. A programme, not an absence."
    >
      {/* Statement hero */}
      <header
        className="relative flex items-end"
        style={{ minHeight: '88svh', paddingTop: 'var(--nav-h)' }}
      >
        <Picture
          src={DRINK_FAMILIES[1].image}
          alt=""
          priority
          className="absolute inset-0 h-full w-full"
          sizes="100vw"
        />
        <div className="u-scrim" />

        <div className="u-shell relative z-10 w-full pb-16">
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
            <p style={{ color: 'var(--color-bone-dim)', maxWidth: '50ch', fontSize: 'var(--t-lede)' }}>
              Twelve drinks that take between four hours and three weeks to make. The technique is
              the point — and the reason the price sits where it does.
            </p>
          </Reveal>
        </div>
      </header>

      {/* The three families, as pinned chapters */}
      {DRINK_FAMILIES.map((family, i) => (
        <StickyStage
          key={family.id}
          height={160}
          heightTablet={130}
          mobile={<FamilyMobile family={family} index={i} />}
        >
          {(progress, enabled) => (
            <FamilyStage family={family} index={i} progress={progress} enabled={enabled} />
          )}
        </StickyStage>
      ))}

      {/* The twelve */}
      <section className="py-24 lg:py-32">
        <div className="u-shell">
          <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal>
                <p className="u-mono mb-5" style={{ color: 'var(--color-bone-faint)' }}>
                  The list
                </p>
              </Reveal>
              <LineMask text="Twelve zero-proof" as="h2" className="u-display t-section" />
            </div>
            <Reveal delay={0.1}>
              <p className="u-num" style={{ color: 'var(--color-bone-faint)' }}>
                {String(DRINKS.length).padStart(2, '0')}
              </p>
            </Reveal>
          </div>

          <RevealGroup interval={0.06} className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {DRINKS.map((d) => (
              <RevealItem key={d.id}>
                <DishCard dish={d} variant="drink" />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Pairing flight */}
      <section className="border-t py-20 lg:py-28" style={{ borderColor: 'var(--color-smoke)' }}>
        <div className="u-shell grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <Reveal>
              <p className="u-mono mb-5" style={{ color: 'var(--color-saffron)' }}>
                The flight
              </p>
            </Reveal>
            <LineMask text="Five drinks, five courses" as="h2" className="u-display t-section mb-6" />
            <Reveal delay={0.1}>
              <p className="mb-8" style={{ color: 'var(--color-bone-dim)', maxWidth: '44ch', lineHeight: 1.7 }}>
                A pairing built against the tasting menu and adjusted each week. Poured in five
                measures rather than five full glasses, so it sits alongside the food rather than
                filling you up before the principal course arrives.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="u-num mb-8" style={{ color: 'var(--color-bone)', fontSize: '1.5rem' }}>
                £68 <span className="u-mono ml-3" style={{ color: 'var(--color-bone-faint)' }}>per guest</span>
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <Link to="/reserve" className="btn btn--filled">
                <span>Reserve a table</span>
              </Link>
            </Reveal>
          </div>

          <CurtainMask>
            <Picture
              src={DRINK_FAMILIES[2].image}
              alt=""
              ratio="4/5"
              sizes="(max-width: 1024px) 100vw, 46vw"
              className="w-full"
            />
          </CurtainMask>
        </div>
      </section>

      {/* Chai & coffee service */}
      <section className="border-t py-20 lg:py-28" style={{ borderColor: 'var(--color-smoke)' }}>
        <div className="u-shell">
          <Reveal>
            <p className="u-mono mb-5" style={{ color: 'var(--color-bone-faint)' }}>
              Chai &amp; coffee
            </p>
          </Reveal>
          <LineMask text="The end of the meal" as="h2" className="u-display t-section mb-12" />

          <RevealGroup interval={0.06} className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {HOT.map((d) => (
              <RevealItem key={d.id}>
                <DishCard dish={d} variant="drink" />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </PageShell>
  );
}

function FamilyStage({
  family,
  index,
  progress,
  enabled,
}: {
  family: (typeof DRINK_FAMILIES)[number];
  index: number;
  progress: MotionValue<number>;
  enabled: boolean;
}) {
  const y = useTransform(progress, [0, 1], ['0%', '-10%']);
  const textOpacity = useTransform(progress, [0, 0.15, 0.85, 1], [0.4, 1, 1, 0.4]);

  /**
   * Each family is its own pinned stage stacked directly beneath the last,
   * so without this the image is at full brightness from the very first
   * frame — a hard cut against the section it follows, and against the
   * next family when this one releases. Cross-dissolving the image itself
   * in and out at the edges of its own scroll range turns every boundary
   * (header → family, family → family, family → the list below) into the
   * same kind of dissolve the hero uses between its chapters, rather than
   * a seam. The page background is --color-ink, so at opacity 0 the frame
   * reads as pure black, matching the dark ground on both sides of it.
   */
  const dissolve = useTransform(progress, [0, 0.08, 0.92, 1], [0, 1, 1, 0]);
  // Reduced motion supplies a MotionValue frozen at 0, which would otherwise
  // pin the image invisible and the text at 40% forever.
  const imageOpacity = enabled ? dissolve : 1;
  const opacity = enabled ? textOpacity : 1;

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: 'var(--color-ink)' }}>
      <motion.div className="absolute inset-0" style={{ opacity: imageOpacity }}>
        <motion.div className="h-[112%] w-full" style={enabled ? { y } : undefined}>
          <Picture src={family.image} alt="" className="h-full w-full" sizes="100vw" />
        </motion.div>
        <div className="u-scrim-left" />
      </motion.div>

      <motion.div
        className="absolute inset-0 flex items-center"
        style={{ opacity }}
        transition={{ ease: EASE.house }}
      >
        <div className="u-shell">
          <p className="u-num mb-6" style={{ color: 'var(--color-bone-faint)', letterSpacing: '0.18em' }}>
            {String(index + 1).padStart(2, '0')} / {String(DRINK_FAMILIES.length).padStart(2, '0')}
          </p>
          <p className="u-mono mb-5" style={{ color: 'var(--color-saffron)' }}>
            {family.technique}
          </p>
          <h2 className="u-display t-section mb-6" style={{ fontSize: 'var(--t-display)', maxWidth: '12ch' }}>
            {family.name}
          </h2>
          <p style={{ color: 'var(--color-bone-dim)', maxWidth: '46ch', fontSize: 'var(--t-lede)', lineHeight: 1.7 }}>
            {family.description}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function FamilyMobile({
  family,
  index,
}: {
  family: (typeof DRINK_FAMILIES)[number];
  index: number;
}) {
  return (
    <div className="py-14">
      <div className="u-shell">
        <CurtainMask className="mb-7">
          <Picture src={family.image} alt="" ratio="4/5" sizes="100vw" className="w-full" />
        </CurtainMask>
        <p className="u-num mb-4" style={{ color: 'var(--color-bone-faint)' }}>
          {String(index + 1).padStart(2, '0')} / {String(DRINK_FAMILIES.length).padStart(2, '0')}
        </p>
        <p className="u-mono mb-3" style={{ color: 'var(--color-saffron)' }}>
          {family.technique}
        </p>
        <LineMask text={family.name} as="h2" className="u-display t-section mb-4" />
        <Reveal delay={0.08}>
          <p style={{ color: 'var(--color-bone-dim)', lineHeight: 1.7 }}>{family.description}</p>
        </Reveal>
      </div>
    </div>
  );
}
