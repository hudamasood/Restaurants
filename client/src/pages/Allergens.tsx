import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { DUR } from '@/motion/constants';
import { BRAND } from '@/data/brand';
import { useMenu } from '@/hooks/useMenu';

const COLUMNS = [
  { id: 'vegetarian', label: 'Veg' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'glutenFree', label: 'GF' },
  { id: 'containsDairy', label: 'Dairy' },
  { id: 'containsNuts', label: 'Nuts' },
] as const;

/** The trust page. No editorialising — the legend states what it states. */
export default function Allergens() {
  const { dishes: DISHES, courses: COURSES } = useMenu();
  const [course, setCourse] = useState<string>('all');

  const rows = useMemo(
    () => (course === 'all' ? DISHES : DISHES.filter((d) => d.course === course)),
    [course],
  );

  return (
    <PageShell
      title="Allergens & Dietary"
      description={`The full dietary matrix for all ${DISHES.length} dishes, the finned-fish and shellfish legend, and halal certification by the ${BRAND.certification.body}.`}
    >
      <div className="u-shell" style={{ paddingTop: 'calc(var(--nav-h) + 6rem)' }}>
        <Reveal y={0}>
          <p className="u-mono mb-7" style={{ color: 'var(--color-saffron)' }}>
            Allergens &amp; dietary
          </p>
        </Reveal>
        <LineMask text="Everything, stated plainly" as="h1" className="u-display mb-8" animateOnMount />
        <Reveal delay={0.3}>
          <p className="mb-16" style={{ color: 'var(--color-bone-dim)', maxWidth: '58ch', fontSize: 'var(--t-lede)' }}>
            The full matrix for all {DISHES.length} dishes. If anything here is unclear, ask your
            server or call us before you come — we would rather answer twice than once too late.
          </p>
        </Reveal>
      </div>

      {/* Certification */}
      <section className="u-shell mb-16">
        <Reveal>
          <div className="grid gap-8 border p-8 sm:grid-cols-3 lg:p-10" style={{ borderColor: 'var(--color-smoke)' }}>
            <div>
              <p className="u-mono mb-3" style={{ color: 'var(--color-bone-faint)' }}>
                Certifying body
              </p>
              <p className="u-mono" style={{ color: 'var(--color-bone)' }}>
                {BRAND.certification.body}
              </p>
              <p className="u-num mt-1" style={{ color: 'var(--color-bone-dim)', fontSize: '0.75rem' }}>
                {BRAND.certification.reference}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="u-mono mb-3" style={{ color: 'var(--color-bone-faint)' }}>
                Scope
              </p>
              <p style={{ color: 'var(--color-bone-dim)', lineHeight: 1.75 }}>
                {BRAND.certification.note}
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* The seafood legend, without editorialising */}
      <section className="u-shell mb-16">
        <Reveal>
          <p className="u-mono mb-6" style={{ color: 'var(--color-bone-faint)' }}>
            Seafood legend
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                term: 'Finned fish',
                body: 'Fish with fins and scales — turbot, sea bass, kingfish, trout. Marked on the card and filterable on the menu.',
              },
              {
                term: 'Shellfish',
                body: 'Crustaceans and molluscs — oyster, scallop, langoustine, crab, prawn, octopus. Marked separately from finned fish.',
              },
              {
                term: 'Why separate',
                body: 'Some guests avoid shellfish while eating finned fish. A single “seafood” marker cannot answer that question, so we carry two.',
              },
            ].map((item) => (
              <div key={item.term} className="border-t pt-5" style={{ borderColor: 'var(--color-smoke)' }}>
                <p className="u-mono mb-3" style={{ color: 'var(--color-bone)' }}>
                  {item.term}
                </p>
                <p style={{ color: 'var(--color-bone-dim)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Matrix */}
      <section className="u-shell pb-28">
        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-2">
          <button
            type="button"
            onClick={() => setCourse('all')}
            className="u-mono"
            aria-pressed={course === 'all'}
          >
            <span
              className="link-rule"
              data-active={course === 'all'}
              style={{ color: course === 'all' ? 'var(--color-bone)' : 'var(--color-bone-dim)' }}
            >
              All
            </span>
          </button>
          {COURSES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCourse(c.id)}
              className="u-mono"
              aria-pressed={course === c.id}
            >
              <span
                className="link-rule"
                data-active={course === c.id}
                style={{
                  color: course === c.id ? 'var(--color-bone)' : 'var(--color-bone-dim)',
                  transition: `color ${DUR.short}s var(--ease-house)`,
                }}
              >
                {c.name}
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 760 }}>
            <caption className="u-vh">
              Dietary matrix for every dish, with allergens listed per dish
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="u-mono"
                  style={{
                    textAlign: 'left',
                    padding: '0 1rem 0.75rem 0',
                    color: 'var(--color-bone-faint)',
                    borderBottom: '1px solid var(--color-smoke)',
                    fontWeight: 400,
                  }}
                >
                  Dish
                </th>
                {COLUMNS.map((c) => (
                  <th
                    key={c.id}
                    scope="col"
                    className="u-mono"
                    style={{
                      textAlign: 'center',
                      padding: '0 0.5rem 0.75rem',
                      color: 'var(--color-bone-faint)',
                      borderBottom: '1px solid var(--color-smoke)',
                      fontWeight: 400,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.label}
                  </th>
                ))}
                <th
                  scope="col"
                  className="u-mono"
                  style={{
                    textAlign: 'left',
                    padding: '0 0 0.75rem 1.5rem',
                    color: 'var(--color-bone-faint)',
                    borderBottom: '1px solid var(--color-smoke)',
                    fontWeight: 400,
                  }}
                >
                  Seafood
                </th>
                <th
                  scope="col"
                  className="u-mono"
                  style={{
                    textAlign: 'left',
                    padding: '0 0 0.75rem 1.5rem',
                    color: 'var(--color-bone-faint)',
                    borderBottom: '1px solid var(--color-smoke)',
                    fontWeight: 400,
                  }}
                >
                  Allergens
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <th
                    scope="row"
                    style={{
                      textAlign: 'left',
                      padding: '0.85rem 1rem 0.85rem 0',
                      borderBottom: '1px solid var(--color-ash-2)',
                      color: 'var(--color-bone)',
                      fontWeight: 400,
                    }}
                  >
                    {d.name}
                  </th>
                  {COLUMNS.map((c) => {
                    const on = d.dietary[c.id];
                    return (
                      <td
                        key={c.id}
                        style={{
                          textAlign: 'center',
                          padding: '0.85rem 0.5rem',
                          borderBottom: '1px solid var(--color-ash-2)',
                          color: on ? 'var(--color-saffron)' : 'var(--color-bone-ghost)',
                        }}
                      >
                        <span aria-hidden="true">{on ? '●' : '·'}</span>
                        <span className="u-vh">{on ? `${c.label}: yes` : `${c.label}: no`}</span>
                      </td>
                    );
                  })}
                  <td
                    className="u-mono"
                    style={{
                      padding: '0.85rem 0 0.85rem 1.5rem',
                      borderBottom: '1px solid var(--color-ash-2)',
                      color:
                        d.dietary.seafoodClass === 'none'
                          ? 'var(--color-bone-ghost)'
                          : 'var(--color-bone-dim)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {d.dietary.seafoodClass === 'none'
                      ? '—'
                      : d.dietary.seafoodClass === 'finned'
                        ? 'Finned fish'
                        : 'Shellfish'}
                  </td>
                  <td
                    className="u-mono"
                    style={{
                      padding: '0.85rem 0 0.85rem 1.5rem',
                      borderBottom: '1px solid var(--color-ash-2)',
                      color: 'var(--color-bone-dim)',
                      lineHeight: 1.7,
                    }}
                  >
                    {d.dietary.allergens.length ? d.dietary.allergens.join(', ') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Reveal className="mt-14">
          <div className="border-l pl-6" style={{ borderColor: 'var(--color-saffron)' }}>
            <p className="u-mono mb-3" style={{ color: 'var(--color-saffron)' }}>
              Speak to us
            </p>
            <p className="mb-5" style={{ color: 'var(--color-bone-dim)', maxWidth: '52ch', lineHeight: 1.75 }}>
              This kitchen handles nuts, dairy, gluten, sesame, fish and shellfish. We take
              allergies seriously and we will tell you honestly when we cannot guarantee something.
              Note anything relevant on your reservation, or call ahead.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={`tel:${BRAND.phone.replace(/\s/g, '')}`} className="btn btn--outline">
                <span>{BRAND.phone}</span>
              </a>
              <Link to="/reserve" className="btn btn--ghost">
                <span>Note it on a reservation</span>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </PageShell>
  );
}
