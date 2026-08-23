import { Link, Navigate, useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Picture } from '@/components/media/Picture';
import { CurtainMask } from '@/components/motion/CurtainMask';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { AnnotationLayer, AnnotationCaptions } from '@/components/motion/Annotation';
import { DishSignature, signatureLabel } from '@/components/sections/dish/DishSignature';
import { Token } from '@/components/primitives/Button';
import { DUR } from '@/motion/constants';
import { STATION_LABELS, adjacentSignatures, dishById, dishBySlug } from '@/data/menu';
import { price, dietaryTokens } from '@/lib/format';

export default function DishChapter() {
  const { slug } = useParams<{ slug: string }>();
  const dish = slug ? dishBySlug(slug) : undefined;

  if (!dish) return <Navigate to="/menu" replace />;
  if (!dish.isSignature) return <Navigate to={`/menu?dish=${dish.slug}`} replace />;

  const { prev, next, index, total } = adjacentSignatures(dish.slug);
  const paired = dish.pairedDrink ? dishById(dish.pairedDrink) : undefined;

  const annotations = dish.provenance.slice(0, 2).map((p, i) => ({
    label: p.label,
    value: p.value,
    x: i === 0 ? 30 : 66,
    y: i === 0 ? 32 : 64,
    side: (i === 0 ? 'right' : 'left') as 'right' | 'left',
  }));

  return (
    <PageShell
      title={dish.name}
      description={dish.description}
      key={dish.slug}
    >
      {/* Full-bleed hero. Chaining cross-dissolves this rather than wiping. */}
      <header className="relative" style={{ minHeight: '92svh', paddingTop: 'var(--nav-h)' }}>
        <div
          key={dish.id}
          className="enter-fade absolute inset-0"
          style={{ animationDuration: `${DUR.cine}s` }}
        >
          <Picture
            src={dish.media.landscape ?? dish.media.primary}
            alt=""
            priority
            className="h-full w-full"
            sizes="100vw"
            objectPosition="center 42%"
          />
        </div>
        <div className="u-scrim" />

        <div className="relative z-10 flex h-full min-h-[92svh] flex-col justify-end pb-16">
          <div className="u-shell">
            <div className="mb-6 flex items-center gap-4">
              <span className="u-num" style={{ color: 'var(--color-bone)', fontSize: 'var(--t-label)', letterSpacing: '0.18em' }}>
                {String(index).padStart(2, '0')}
              </span>
              <span aria-hidden="true" style={{ width: 26, height: 1, background: 'var(--color-bone-ghost)' }} />
              <span className="u-num" style={{ color: 'var(--color-bone-dim)', fontSize: 'var(--t-label)', letterSpacing: '0.18em' }}>
                {String(total).padStart(2, '0')}
              </span>
              <span className="u-mono ml-4" style={{ color: 'var(--color-saffron)' }}>
                {STATION_LABELS[dish.station]}
              </span>
            </div>

            <LineMask
              text={dish.name}
              as="h1"
              className="u-display mb-6"
              animateOnMount
              key={`${dish.id}-title`}
            />

            <Reveal delay={0.3}>
              <p style={{ color: 'var(--color-bone-dim)', maxWidth: '46ch', fontSize: 'var(--t-lede)' }}>
                {dish.description}
              </p>
            </Reveal>
          </div>
        </div>
      </header>

      {/* The signature motion piece */}
      <section className="relative py-20 lg:py-28">
        <div className="u-shell">
          <Reveal className="mb-10">
            <p className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>
              {signatureLabel(dish.motionSignature)}
            </p>
          </Reveal>

          <div className="relative">
            <DishSignature dish={dish} />
            <AnnotationLayer points={annotations} />
          </div>
          <AnnotationCaptions points={annotations} />
        </div>
      </section>

      {/* The making */}
      <section className="py-16 lg:py-24">
        <div className="u-shell">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="u-mono mb-6" style={{ color: 'var(--color-bone-faint)' }}>
                  The making
                </p>
              </Reveal>
              <Reveal delay={0.08}>
                <p style={{ color: 'var(--color-bone-dim)', lineHeight: 1.75, fontSize: 'var(--t-lede)' }}>
                  {dish.longDescription ?? dish.description}
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <RevealGroup interval={0.12} className="grid gap-5 sm:grid-cols-2">
                {(dish.media.process ?? []).map((src, i) => (
                  <RevealItem key={src} className={i === 0 ? 'sm:col-span-2' : ''}>
                    <CurtainMask margin="0px 0px -18% 0px">
                      <Picture
                        src={src}
                        alt=""
                        ratio={i === 0 ? '16/9' : '1/1'}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="w-full"
                      />
                    </CurtainMask>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
          </div>
        </div>
      </section>

      {/* Provenance + spec */}
      <section className="border-t py-16 lg:py-24" style={{ borderColor: 'var(--color-smoke)' }}>
        <div className="u-shell grid gap-12 lg:grid-cols-3">
          <Reveal>
            <p className="u-mono mb-6" style={{ color: 'var(--color-bone-faint)' }}>
              Provenance
            </p>
            <dl className="flex flex-col gap-4">
              {dish.provenance.map((p) => (
                <div key={p.label} className="border-t pt-3" style={{ borderColor: 'var(--color-smoke)' }}>
                  <dt className="u-mono mb-1" style={{ color: 'var(--color-bone-faint)' }}>
                    {p.label}
                  </dt>
                  <dd className="u-mono" style={{ color: 'var(--color-bone)' }}>
                    {p.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="u-mono mb-6" style={{ color: 'var(--color-bone-faint)' }}>
              Ingredients
            </p>
            <ul className="flex flex-col gap-2">
              {dish.ingredients.map((i) => (
                <li key={i} style={{ color: 'var(--color-bone-dim)' }}>
                  {i}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="u-mono mb-6" style={{ color: 'var(--color-bone-faint)' }}>
              At the table
            </p>
            <p className="u-num mb-5" style={{ color: 'var(--color-bone)', fontSize: '1.5rem' }}>
              {price(dish.price)}
            </p>
            {dish.priceNote && (
              <p className="u-mono mb-5" style={{ color: 'var(--color-bone-dim)' }}>
                {dish.priceNote}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {dietaryTokens(dish.dietary).map((t) => (
                <Token key={t}>{t}</Token>
              ))}
              {dish.isShared && <Token tone="share">To share</Token>}
            </div>
            {dish.dietary.allergens.length > 0 && (
              <p className="u-mono mt-5" style={{ color: 'var(--color-bone-faint)', lineHeight: 1.8 }}>
                Allergens · {dish.dietary.allergens.join(', ')}
              </p>
            )}
          </Reveal>
        </div>
      </section>

      {/* Paired zero-proof */}
      {paired && (
        <section className="border-t py-16 lg:py-24" style={{ borderColor: 'var(--color-smoke)' }}>
          <div className="u-shell grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <CurtainMask>
              <Picture
                src={paired.media.primary}
                alt={paired.name}
                ratio="4/5"
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="w-full"
              />
            </CurtainMask>
            <div>
              <Reveal>
                <p className="u-mono mb-5" style={{ color: 'var(--color-saffron)' }}>
                  Paired zero-proof
                </p>
              </Reveal>
              <LineMask text={paired.name} as="h2" className="u-display t-section mb-5" />
              <Reveal delay={0.1}>
                <p className="mb-7" style={{ color: 'var(--color-bone-dim)', maxWidth: '44ch', lineHeight: 1.7 }}>
                  {paired.description}
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <Link to="/still-room" className="btn btn--ghost">
                  <span>The still room</span>
                </Link>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* Prev / next chaining — client-side, no page wipe */}
      <nav
        className="border-t"
        style={{ borderColor: 'var(--color-smoke)' }}
        aria-label="Signature dishes"
      >
        <div className="grid sm:grid-cols-2">
          {prev && <ChainLink dish={prev} direction="prev" />}
          {next && <ChainLink dish={next} direction="next" />}
        </div>
      </nav>

      <section className="py-20 text-center">
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

function ChainLink({
  dish,
  direction,
}: {
  dish: ReturnType<typeof dishBySlug> & object;
  direction: 'prev' | 'next';
}) {
  return (
    <Link
      to={`/menu/${dish.slug}`}
      className="group relative flex min-h-[240px] items-end overflow-hidden p-8 lg:p-10"
      style={{
        borderRight: direction === 'prev' ? '1px solid var(--color-smoke)' : undefined,
      }}
    >
      <Picture
        src={dish.media.primary}
        alt=""
        className="absolute inset-0 h-full w-full opacity-30 transition-all duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 group-hover:opacity-45"
        sizes="50vw"
      />
      <div className="u-scrim" />
      <div className={`relative z-10 w-full ${direction === 'next' ? 'sm:text-right' : ''}`}>
        <p className="u-mono mb-3" style={{ color: 'var(--color-bone-faint)' }}>
          {direction === 'prev' ? 'Previous' : 'Next'}
        </p>
        <h3 className="u-display" style={{ fontSize: 'var(--t-dish-lg)' }}>
          {dish.name}
        </h3>
      </div>
    </Link>
  );
}
