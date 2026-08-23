import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { DishCard } from '@/components/sections/menu/DishCard';
import { DishQuickView } from '@/components/sections/menu/DishQuickView';
import { Reveal } from '@/components/motion/Reveal';
import { LineMask } from '@/components/motion/LineMask';
import { DUR, EASE } from '@/motion/constants';
import { useCanAnimate, useMotionState } from '@/motion/guards';
import { useEscape, useScrollLock } from '@/app/overlay';
import { useFlip } from '@/lib/flip';
import { COURSES, DISHES, STATIONS, dishBySlug } from '@/data/menu';
import type { Dish } from '@/types';

const DIETARY = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'glutenFree', label: 'Gluten-free' },
  { id: 'finned', label: 'Finned fish' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'signature', label: 'Signature' },
  { id: 'share', label: 'To share' },
] as const;

function matchesDietary(dish: Dish, id: string): boolean {
  switch (id) {
    case 'vegetarian':
      return dish.dietary.vegetarian;
    case 'vegan':
      return dish.dietary.vegan;
    case 'glutenFree':
      return dish.dietary.glutenFree;
    case 'finned':
      return dish.dietary.seafoodClass === 'finned';
    case 'shellfish':
      return dish.dietary.seafoodClass === 'shellfish';
    case 'signature':
      return dish.isSignature;
    case 'share':
      return Boolean(dish.isShared);
    default:
      return true;
  }
}

export default function Menu() {
  const [params, setParams] = useSearchParams();
  const { isMobile } = useMotionState();
  const canAnimate = useCanAnimate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState(params.get('q') ?? '');

  // Filters live in the URL, so the state is deep-linkable and shareable.
  const stations = params.getAll('station');
  const courses = params.getAll('course');
  const diets = params.getAll('diet');
  const quickSlug = params.get('dish');

  // On mobile, filters are staged and applied on sheet dismiss, so the FLIP
  // plays on a visible grid rather than under a covering sheet.
  const [staged, setStaged] = useState({ stations, courses, diets });
  useEffect(() => {
    if (!sheetOpen) setStaged({ stations, courses, diets });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetOpen, params.toString()]);

  const toggle = useCallback(
    (key: 'station' | 'course' | 'diet', value: string) => {
      const next = new URLSearchParams(params);
      const current = next.getAll(key);
      next.delete(key);
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      updated.forEach((v) => next.append(key, v));
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const clearAll = useCallback(() => {
    const next = new URLSearchParams(params);
    next.delete('station');
    next.delete('course');
    next.delete('diet');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DISHES.filter((d) => {
      if (!d.isAvailable) return false;
      // Multi-select within a group, AND across groups.
      if (stations.length && !stations.includes(d.station)) return false;
      if (courses.length && !courses.includes(d.course)) return false;
      if (diets.length && !diets.every((id) => matchesDietary(d, id))) return false;
      if (q) {
        const haystack = `${d.name} ${d.description} ${d.ingredients.join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [stations.join(), courses.join(), diets.join(), query]); // eslint-disable-line react-hooks/exhaustive-deps

  const gridRef = useFlip(
    results.map((d) => d.id),
    canAnimate,
  );

  const activeCount = stations.length + courses.length + diets.length;
  const quickDish = quickSlug ? (dishBySlug(quickSlug) ?? null) : null;

  const openQuickView = (dish: Dish) => {
    const next = new URLSearchParams(params);
    next.set('dish', dish.slug);
    setParams(next);
  };

  const closeQuickView = () => {
    const next = new URLSearchParams(params);
    next.delete('dish');
    setParams(next);
  };

  // "/" opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !/input|textarea|select/i.test((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // A readable sentence of the current filter state.
  const summary = useMemo(() => {
    const bits: string[] = [];
    if (stations.length)
      bits.push(stations.map((s) => STATIONS.find((x) => x.id === s)?.name ?? s).join(', '));
    if (courses.length)
      bits.push(courses.map((c) => COURSES.find((x) => x.id === c)?.name ?? c).join(', '));
    if (diets.length)
      bits.push(diets.map((d) => DIETARY.find((x) => x.id === d)?.label ?? d).join(', '));
    if (!bits.length) return 'Fifty-six dishes across three kitchens and the still room.';
    return `Showing ${bits.join(' · ')}.`;
  }, [stations.join(), courses.join(), diets.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PageShell
      title="The Menu"
      description="Fifty-six dishes across three kitchens — Tandoor & Dum, The Grill and The Sea — with a full dietary matrix and a separate shellfish legend."
    >
      {/* Compact header */}
      <header
        className="relative flex items-end"
        style={{ minHeight: '55vh', paddingTop: 'var(--nav-h)' }}
      >
        <div className="u-shell w-full pb-14">
          <LineMask text="The Menu" as="h1" className="u-display mb-6" animateOnMount />
          <Reveal delay={0.2}>
            <p style={{ color: 'var(--color-bone-dim)', maxWidth: '52ch', fontSize: 'var(--t-lede)' }}>
              {summary}
            </p>
          </Reveal>
        </div>
      </header>

      {/* Filter bar — sticky beneath the nav from scroll position 0 */}
      <div
        className="sticky z-40"
        style={{
          top: 'var(--nav-h)',
          background: 'rgb(11 11 12 / 0.94)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--color-smoke)',
          borderBottom: '1px solid var(--color-smoke)',
        }}
      >
        <div className="u-shell">
          {isMobile ? (
            <div className="flex items-center justify-between gap-4 py-4">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="u-mono"
                style={{ color: 'var(--color-bone)' }}
              >
                Filters {activeCount > 0 && `(${activeCount})`}
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="u-mono"
                style={{ color: 'var(--color-bone-dim)' }}
              >
                Search
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 py-4">
              <FilterGroup
                label="Station"
                options={STATIONS.map((s) => ({ id: s.id, label: s.name }))}
                active={stations}
                onToggle={(v) => toggle('station', v)}
              />
              <FilterGroup
                label="Course"
                options={COURSES.map((c) => ({ id: c.id, label: c.name }))}
                active={courses}
                onToggle={(v) => toggle('course', v)}
              />
              <FilterGroup
                label="Dietary"
                options={DIETARY.map((d) => ({ id: d.id, label: d.label }))}
                active={diets}
                onToggle={(v) => toggle('diet', v)}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="u-mono ml-auto"
                style={{ color: 'var(--color-bone-faint)' }}
              >
                Search <span style={{ opacity: 0.6 }}>/</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Result count + active chips */}
      <div className="u-shell pt-8">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <p className="u-num" style={{ color: 'var(--color-bone-faint)', fontSize: 'var(--t-label)', letterSpacing: '0.16em' }}>
            {String(results.length).padStart(2, '0')} {results.length === 1 ? 'dish' : 'dishes'}
          </p>

          <AnimatePresence mode="popLayout">
            {[
              ...stations.map((v) => ({ key: 'station' as const, v, label: STATIONS.find((s) => s.id === v)?.name ?? v })),
              ...courses.map((v) => ({ key: 'course' as const, v, label: COURSES.find((c) => c.id === v)?.name ?? v })),
              ...diets.map((v) => ({ key: 'diet' as const, v, label: DIETARY.find((d) => d.id === v)?.label ?? v })),
            ].map((chip) => (
              <motion.button
                key={`${chip.key}-${chip.v}`}
                type="button"
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: DUR.short, ease: EASE.house }}
                onClick={() => toggle(chip.key, chip.v)}
                className="u-mono flex items-center gap-2 px-3 py-1.5"
                style={{ border: '1px solid var(--color-bone-ghost)', color: 'var(--color-bone)' }}
              >
                {chip.label}
                <span aria-hidden="true" style={{ opacity: 0.6 }}>
                  ×
                </span>
                <span className="u-vh">Remove filter</span>
              </motion.button>
            ))}
          </AnimatePresence>

          {activeCount > 0 && (
            <button type="button" onClick={clearAll} className="u-mono" style={{ color: 'var(--color-bone-faint)' }}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="u-shell pb-24">
        {results.length === 0 ? (
          <EmptyState onClear={clearAll} query={query} onClearQuery={() => setQuery('')} />
        ) : (
          <div
            ref={gridRef}
            className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
          >
            {results.map((dish) => (
              <div key={dish.id} data-flip-key={dish.id}>
                <DishCard dish={dish} onQuickView={openQuickView} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cross-link band */}
      <section className="border-t py-20" style={{ borderColor: 'var(--color-smoke)' }}>
        <div className="u-shell grid gap-10 sm:grid-cols-2">
          <Reveal>
            <p className="u-mono mb-4" style={{ color: 'var(--color-bone-faint)' }}>
              Zero-proof
            </p>
            <h2 className="u-display mb-4" style={{ fontSize: 'var(--t-dish-lg)' }}>
              The Still Room
            </h2>
            <p className="mb-6" style={{ color: 'var(--color-bone-dim)', maxWidth: '40ch' }}>
              Twelve drinks, clarified, fermented, casked and smoked. A programme, not an absence.
            </p>
            <Link to="/still-room" className="btn btn--ghost">
              <span>The bar programme</span>
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="u-mono mb-4" style={{ color: 'var(--color-bone-faint)' }}>
              Dietary
            </p>
            <h2 className="u-display mb-4" style={{ fontSize: 'var(--t-dish-lg)' }}>
              Allergens &amp; certification
            </h2>
            <p className="mb-6" style={{ color: 'var(--color-bone-dim)', maxWidth: '40ch' }}>
              The full matrix for all fifty-six dishes, the named certifying body, and the
              finned-fish and shellfish legend.
            </p>
            <Link to="/allergens" className="btn btn--ghost">
              <span>The dietary matrix</span>
            </Link>
          </Reveal>
        </div>
      </section>

      <DishQuickView dish={quickDish} onClose={closeQuickView} />

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        staged={staged}
        setStaged={setStaged}
        onApply={(next) => {
          const p = new URLSearchParams(params);
          p.delete('station');
          p.delete('course');
          p.delete('diet');
          next.stations.forEach((v) => p.append('station', v));
          next.courses.forEach((v) => p.append('course', v));
          next.diets.forEach((v) => p.append('diet', v));
          setParams(p, { replace: true });
          setSheetOpen(false);
        }}
      />

      <SearchOverlay
        open={searchOpen}
        query={query}
        setQuery={setQuery}
        onClose={() => setSearchOpen(false)}
        results={results}
        onSelect={(d) => {
          setSearchOpen(false);
          if (d.isSignature) return;
          openQuickView(d);
        }}
      />
    </PageShell>
  );
}

function FilterGroup({
  label,
  options,
  active,
  onToggle,
}: {
  label: string;
  options: { id: string; label: string }[];
  active: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="u-mono shrink-0" style={{ color: 'var(--color-bone-ghost)' }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {options.map((o) => {
          const on = active.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onToggle(o.id)}
              aria-pressed={on}
              className="u-mono link-rule"
              style={{
                color: on ? 'var(--color-bone)' : 'var(--color-bone-dim)',
                transition: `color ${DUR.short}s var(--ease-house)`,
              }}
            >
              <span className="link-rule" data-active={on}>
                {o.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({
  onClear,
  query,
  onClearQuery,
}: {
  onClear: () => void;
  query: string;
  onClearQuery: () => void;
}) {
  return (
    <Reveal className="py-20 text-center">
      <h2 className="u-display mb-4" style={{ fontSize: 'var(--t-dish-lg)' }}>
        No dishes match these filters
      </h2>
      <p className="mx-auto mb-8" style={{ color: 'var(--color-bone-dim)', maxWidth: '40ch' }}>
        {query
          ? `Nothing matches “${query}”. Try a shorter search, or clear it.`
          : 'Try removing one of the active filters — the dietary group narrows quickly when combined.'}
      </p>
      <div className="flex justify-center gap-3">
        {query && (
          <button type="button" onClick={onClearQuery} className="btn btn--outline">
            <span>Clear search</span>
          </button>
        )}
        <button type="button" onClick={onClear} className="btn btn--filled">
          <span>Clear filters</span>
        </button>
      </div>
    </Reveal>
  );
}

type Staged = { stations: string[]; courses: string[]; diets: string[] };

function FilterSheet({
  open,
  onClose,
  staged,
  setStaged,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  staged: Staged;
  setStaged: (s: Staged) => void;
  onApply: (s: Staged) => void;
}) {
  useScrollLock(open, 'filters');
  useEscape(open, onClose);
  const canAnimate = useCanAnimate();

  const toggleIn = (key: keyof Staged, value: string) => {
    const list = staged[key];
    setStaged({
      ...staged,
      [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-end">
          <motion.button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0"
            style={{ background: 'rgb(11 11 12 / 0.8)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="relative max-h-[86svh] w-full overflow-y-auto"
            style={{ background: 'var(--color-ash)', borderTop: '1px solid var(--color-smoke)' }}
            initial={canAnimate ? { y: '100%' } : { opacity: 0 }}
            animate={canAnimate ? { y: 0 } : { opacity: 1 }}
            exit={canAnimate ? { y: '100%' } : { opacity: 0 }}
            transition={{ duration: DUR.short, ease: EASE.house }}
          >
            <div className="u-shell py-8">
              <h2 className="u-mono mb-8" style={{ color: 'var(--color-bone-faint)' }}>
                Filters
              </h2>

              {[
                { key: 'stations' as const, label: 'Station', options: STATIONS.map((s) => ({ id: s.id, label: s.name })) },
                { key: 'courses' as const, label: 'Course', options: COURSES.map((c) => ({ id: c.id, label: c.name })) },
                { key: 'diets' as const, label: 'Dietary', options: DIETARY.map((d) => ({ id: d.id, label: d.label })) },
              ].map((group) => (
                <div key={group.key} className="mb-8">
                  <p className="u-mono mb-4" style={{ color: 'var(--color-bone-ghost)' }}>
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.options.map((o) => {
                      const on = staged[group.key].includes(o.id);
                      return (
                        <button
                          key={o.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleIn(group.key, o.id)}
                          className="u-mono px-4 py-2.5"
                          style={{
                            border: `1px solid ${on ? 'var(--color-bone)' : 'var(--color-smoke)'}`,
                            color: on ? 'var(--color-bone)' : 'var(--color-bone-dim)',
                            background: on ? 'var(--color-ash-3)' : 'transparent',
                            transition: `all ${DUR.short}s var(--ease-house)`,
                          }}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStaged({ stations: [], courses: [], diets: [] })}
                  className="btn btn--outline flex-1"
                >
                  <span>Clear</span>
                </button>
                <button type="button" onClick={() => onApply(staged)} className="btn btn--filled flex-1">
                  <span>Apply</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SearchOverlay({
  open,
  query,
  setQuery,
  onClose,
  results,
  onSelect,
}: {
  open: boolean;
  query: string;
  setQuery: (q: string) => void;
  onClose: () => void;
  results: Dish[];
  onSelect: (d: Dish) => void;
}) {
  useScrollLock(open, 'search');
  useEscape(open, onClose);
  const canAnimate = useCanAnimate();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[115] overflow-y-auto"
          style={{ background: 'rgb(11 11 12 / 0.97)' }}
          initial={canAnimate ? { clipPath: 'inset(0 0 100% 0)' } : { opacity: 0 }}
          animate={canAnimate ? { clipPath: 'inset(0 0 0% 0)' } : { opacity: 1 }}
          exit={canAnimate ? { clipPath: 'inset(0 0 100% 0)' } : { opacity: 0 }}
          transition={{ duration: DUR.short, ease: EASE.house }}
        >
          <div className="u-shell py-10" style={{ paddingTop: 'calc(var(--nav-h) + 2rem)' }}>
            <div className="mb-10 flex items-center gap-6">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes, ingredients…"
                aria-label="Search the menu"
                className="field__control u-display flex-1"
                style={{ fontSize: 'var(--t-dish-lg)' }}
              />
              <button type="button" onClick={onClose} className="u-mono" style={{ color: 'var(--color-bone-dim)' }}>
                Close
              </button>
            </div>

            {query && (
              <p className="u-mono mb-8" style={{ color: 'var(--color-bone-faint)' }}>
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </p>
            )}

            <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {results.slice(0, 18).map((d, i) => (
                <motion.li
                  key={d.id}
                  initial={{ opacity: 0, y: canAnimate ? 12 : 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: DUR.base,
                    delay: canAnimate ? Math.min(i, 8) * 0.06 : 0,
                    ease: EASE.house,
                  }}
                >
                  <DishCard dish={d} onQuickView={onSelect} />
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
