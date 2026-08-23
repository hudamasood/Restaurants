import { PageShell } from '@/components/layout/PageShell';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { ExperienceRail } from '@/components/sections/home/ExperienceRail';
import { Picture } from '@/components/media/Picture';
import { CurtainMask } from '@/components/motion/CurtainMask';
import { Link } from 'react-router-dom';
import { EXPERIENCES } from '@/data/site';

export default function ExperiencePage() {
  return (
    <PageShell
      title="Rooms & Occasions"
      description="Five rooms — the main room, the chef's table, private dining, the terrace, and full buyouts for events."
    >
      <header className="u-shell" style={{ paddingTop: 'calc(var(--nav-h) + 6rem)' }}>
        <Reveal y={0}>
          <p className="u-mono mb-7" style={{ color: 'var(--color-saffron)' }}>
            Rooms &amp; occasions
          </p>
        </Reveal>
        <LineMask text="Five rooms, one fire" as="h1" className="u-display mb-7" animateOnMount />
        <Reveal delay={0.35}>
          <p
            className="mb-16"
            style={{ color: 'var(--color-bone-dim)', maxWidth: '50ch', fontSize: 'var(--t-lede)' }}
          >
            From a table under the vault to a full buyout. The kitchen scales; the room does not
            change.
          </p>
        </Reveal>
      </header>

      <ExperienceRail />

      {/* A full listing beneath the rail, so nothing is only reachable by scroll */}
      <section className="border-t py-20 lg:py-28" style={{ borderColor: 'var(--color-smoke)' }}>
        <div className="u-shell">
          <Reveal>
            <p className="u-mono mb-14" style={{ color: 'var(--color-bone-faint)' }}>
              Every room
            </p>
          </Reveal>

          <div className="flex flex-col gap-20">
            {EXPERIENCES.map((e, i) => (
              <article
                key={e.id}
                className={`grid items-center gap-10 lg:grid-cols-12 lg:gap-16 ${
                  i % 2 === 1 ? 'lg:[direction:rtl]' : ''
                }`}
              >
                <div className={`lg:col-span-7 ${i % 2 === 1 ? 'lg:[direction:ltr]' : ''}`}>
                  <CurtainMask margin="0px 0px -18% 0px">
                    <Picture
                      src={e.image}
                      alt={e.name}
                      ratio="16/10"
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="w-full"
                    />
                  </CurtainMask>
                </div>

                <div className={`lg:col-span-5 ${i % 2 === 1 ? 'lg:[direction:ltr]' : ''}`}>
                  <Reveal>
                    <p className="u-mono mb-4" style={{ color: 'var(--color-bone-faint)' }}>
                      {e.capacity}
                    </p>
                  </Reveal>
                  <LineMask text={e.name} as="h2" className="u-display mb-5" />
                  <Reveal delay={0.1}>
                    <p
                      className="mb-7"
                      style={{ color: 'var(--color-bone-dim)', maxWidth: '44ch', lineHeight: 1.7 }}
                    >
                      {e.description}
                    </p>
                  </Reveal>
                  <Reveal delay={0.15}>
                    <Link
                      to={`/contact?subject=${encodeURIComponent(e.name)}`}
                      className="btn btn--outline"
                    >
                      <span>Enquire</span>
                    </Link>
                  </Reveal>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
