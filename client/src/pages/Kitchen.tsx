import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Picture } from '@/components/media/Picture';
import { CurtainMask } from '@/components/motion/CurtainMask';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { DUR, EASE } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';
import { CHEFS } from '@/data/site';
import { STATION_LABELS } from '@/data/menu';

export default function Kitchen() {
  const [open, setOpen] = useState<string | null>(null);
  const canAnimate = useCanAnimate();

  return (
    <PageShell
      title="The Kitchen"
      description="Environmental portraits of the brigade, photographed at the station they run."
    >
      <header className="u-shell" style={{ paddingTop: 'calc(var(--nav-h) + 6rem)' }}>
        <Reveal y={0}>
          <p className="u-mono mb-7" style={{ color: 'var(--color-saffron)' }}>
            The kitchen
          </p>
        </Reveal>
        <LineMask text="The people at the pass" as="h1" className="u-display mb-7" animateOnMount />
        <Reveal delay={0.35}>
          <p
            className="mb-20"
            style={{ color: 'var(--color-bone-dim)', maxWidth: '50ch', fontSize: 'var(--t-lede)' }}
          >
            Photographed at the station they run, mid-service, because that is where they actually
            are.
          </p>
        </Reveal>
      </header>

      <section className="u-shell pb-28">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          {CHEFS.map((chef, i) => (
            <article key={chef.id} className={i % 2 === 1 ? 'lg:pt-28' : ''}>
              <CurtainMask margin={i === 0 ? '0px 0px -20% 0px' : '0px 0px -35% 0px'}>
                <Picture
                  src={chef.image}
                  alt={chef.name}
                  ratio="4/5"
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="w-full"
                />
              </CurtainMask>

              <div className="pt-8">
                <p className="u-mono mb-4" style={{ color: 'var(--color-saffron)' }}>
                  {STATION_LABELS[chef.station]}
                </p>
                <LineMask text={chef.name} as="h2" className="u-display mb-3" />
                <Reveal delay={0.08}>
                  <p className="u-mono mb-6" style={{ color: 'var(--color-bone-faint)' }}>
                    {chef.role}
                  </p>
                </Reveal>

                <button
                  type="button"
                  className="btn btn--ghost"
                  aria-expanded={open === chef.id}
                  aria-controls={`bio-${chef.id}`}
                  onClick={() => setOpen(open === chef.id ? null : chef.id)}
                >
                  <span>{open === chef.id ? 'Close' : 'Read the bio'}</span>
                </button>

                <AnimatePresence initial={false}>
                  {open === chef.id && (
                    <motion.div
                      id={`bio-${chef.id}`}
                      initial={canAnimate ? { height: 0, opacity: 0 } : { opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={canAnimate ? { height: 0, opacity: 0 } : { opacity: 0 }}
                      transition={{ duration: DUR.short, ease: EASE.house }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="pt-7">
                        <p style={{ color: 'var(--color-bone-dim)', lineHeight: 1.75, maxWidth: '48ch' }}>
                          {chef.bio}
                        </p>
                        {chef.quote && (
                          <blockquote
                            className="u-display mt-8 border-l pl-6"
                            style={{
                              fontSize: 'var(--t-dish)',
                              borderColor: 'var(--color-saffron)',
                              maxWidth: '40ch',
                            }}
                          >
                            “{chef.quote}”
                          </blockquote>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t py-20 text-center" style={{ borderColor: 'var(--color-smoke)' }}>
        <div className="u-shell">
          <Reveal>
            <Link to="/reserve" className="btn btn--filled">
              <span>Reserve a table</span>
            </Link>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
