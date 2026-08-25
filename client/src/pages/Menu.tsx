import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { DishCard } from '@/components/sections/menu/DishCard';
import { DishQuickView } from '@/components/sections/menu/DishQuickView';
import { CategoryNav } from '@/components/sections/menu/CategoryNav';
import { RefineControl } from '@/components/sections/menu/RefineControl';
import { Reveal } from '@/components/motion/Reveal';
import { LineMask } from '@/components/motion/LineMask';
import { DUR, EASE } from '@/motion/constants';
import { useCanAnimate } from '@/motion/guards';
import { useEscape, useScrollLock } from '@/app/overlay';
import { useFlip } from '@/lib/flip';
import {
  DEFAULT_CATEGORY,
  EMPTY_QUERY,
  activeRefineCount,
  categoryById,
  courseLabel,
  coursesInCategory,
  dietaryLabel,
  filterDishes,
  parseMenuQuery,
  reconcileQuery,
  writeMenuQuery,
} from '@/lib/menuFilter';
import type { CategoryId, DietaryId, MenuQuery } from '@/lib/menuFilter';
import { dishBySlug } from '@/data/menu';
import { useMenu } from '@/hooks/useMenu';
import type { CourseId, Dish } from '@/types';

export default function Menu() {
  const { dishes: DISHES } = useMenu();
  const [params, setParams] = useSearchParams();
  const canAnimate = useCanAnimate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState(params.get('q') ?? '');

  const barRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const quickSlug = params.get('dish');

  /**
   * Filters live in the URL so the state stays shareable. Parsing validates
   * every value, and reconciling drops anything that cannot apply to the
   * active category — so a category switch can never leave a stale sub-group
   * or an impossible course behind.
   */
  const query = useMemo(() => {
    const parsed = parseMenuQuery(params);
    return reconcileQuery(DISHES, parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  const effective = useMemo<MenuQuery>(
    () => ({ ...query, search }),
    [query, search],
  );

  const results = useMemo(() => filterDishes(DISHES, effective), [effective]);

  const availableCourses = useMemo(
    () => coursesInCategory(DISHES, query.category),
    [query.category],
  );

  const commit = useCallback(
    (next: MenuQuery) => {
      const reconciled = reconcileQuery(DISHES, next);
      setParams(writeMenuQuery(params, reconciled), { replace: true });
    },
    [params, setParams],
  );

  /** Puts the top of the grid just under the two sticky bars. */
  const scrollToResults = useCallback(() => {
    const target = resultsRef.current;
    if (!target) return;
    const navH = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h'),
    );
    const offset = (barRef.current?.offsetHeight ?? 0) + (navH || 88) + 16;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: canAnimate ? 'smooth' : 'auto',
    });
  }, [canAnimate]);

  const selectCategory = useCallback(
    (category: CategoryId, subGroup: CourseId | null) => {
      commit({ ...query, category, subGroup });
      // The grid is one list, so the category "section" is brought to the top
      // of the viewport rather than jumped to as a separate anchor.
      requestAnimationFrame(scrollToResults);
    },
    [commit, query, scrollToResults],
  );

  const toggleCourse = useCallback(
    (id: CourseId) => {
      const courses = query.courses.includes(id)
        ? query.courses.filter((c) => c !== id)
        : [...query.courses, id];
      commit({ ...query, courses });
    },
    [commit, query],
  );

  const toggleDiet = useCallback(
    (id: DietaryId) => {
      const diets = query.diets.includes(id)
        ? query.diets.filter((d) => d !== id)
        : [...query.diets, id];
      commit({ ...query, diets });
    },
    [commit, query],
  );

  const clearRefine = useCallback(() => {
    commit({ ...query, courses: [], diets: [] });
  }, [commit, query]);

  const clearAll = useCallback(() => {
    commit({ ...EMPTY_QUERY, search: query.search });
    setSearch('');
  }, [commit, query.search]);

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

  const gridRef = useFlip(
    results.map((d) => d.id),
    canAnimate,
  );

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
    const cat = categoryById(query.category);
    if (query.category !== DEFAULT_CATEGORY) {
      const sub = query.subGroup
        ? cat.subGroups?.find((s) => s.id === query.subGroup)
        : undefined;
      bits.push(sub ? `${cat.label} · ${sub.label}` : cat.label);
    }
    if (query.courses.length) bits.push(query.courses.map(courseLabel).join(', '));
    if (query.diets.length) bits.push(query.diets.map(dietaryLabel).join(', '));
    if (!bits.length) return 'Fifty-six dishes across three kitchens and the still room.';
    return `Showing ${bits.join(' · ')}.`;
  }, [query]);

  const refineCount = activeRefineCount(query);
  const anythingActive = refineCount > 0 || query.category !== DEFAULT_CATEGORY;

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

      {/*
        Browse bar — category navigation with the refine control alongside it.
        Solid ground, not translucent: it sits over dish photography for the
        whole scroll and must never let an image read through it.
      */}
      <div
        ref={barRef}
        className="sticky z-40"
        style={{
          top: 'var(--nav-h)',
          background: 'var(--color-ink)',
          borderTop: '1px solid var(--color-smoke)',
          borderBottom: '1px solid var(--color-smoke)',
        }}
      >
        {/*
          Below 768px the two controls stack, so the category nav keeps the
          full width to scroll in and the refine control is never squeezed.
          768px is also where `isMobile` flips the refine panel to a sheet, so
          the layout and the behaviour change at the same breakpoint.
        */}
        <div className="u-shell flex flex-col md:flex-row md:items-center md:gap-6">
          <div className="min-w-0 md:flex-1">
            <CategoryNav
              category={query.category}
              subGroup={query.subGroup}
              onSelect={selectCategory}
            />
          </div>

          <div
            className="flex shrink-0 items-center justify-between gap-4 border-t pb-3 pt-3 md:border-t-0 md:pb-0 md:pt-0"
            style={{ borderColor: 'var(--color-smoke)' }}
          >
            <RefineControl
              query={query}
              availableCourses={availableCourses}
              onToggleCourse={toggleCourse}
              onToggleDiet={toggleDiet}
              onClear={clearRefine}
            />
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="u-mono"
              style={{ color: 'var(--color-bone-faint)' }}
            >
              Search <span className="hidden md:inline" style={{ opacity: 0.6 }}>/</span>
            </button>
          </div>
        </div>
      </div>

      {/* Result count + active refinements */}
      <div ref={resultsRef} className="u-shell pt-8">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <p
            className="u-num"
            style={{
              color: 'var(--color-bone-faint)',
              fontSize: 'var(--t-label)',
              letterSpacing: '0.16em',
            }}
          >
            {String(results.length).padStart(2, '0')}{' '}
            {results.length === 1 ? 'dish' : 'dishes'}
          </p>

          <AnimatePresence mode="popLayout">
            {[
              ...query.courses.map((v) => ({
                key: `course-${v}`,
                label: courseLabel(v),
                remove: () => toggleCourse(v),
              })),
              ...query.diets.map((v) => ({
                key: `diet-${v}`,
                label: dietaryLabel(v),
                remove: () => toggleDiet(v),
              })),
            ].map((chip) => (
              <motion.button
                key={chip.key}
                type="button"
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: DUR.short, ease: EASE.house }}
                onClick={chip.remove}
                className="u-mono flex items-center gap-2"
                style={{
                  // Inline, for the same reason as the refine controls: the
                  // unlayered `button` reset in globals.css outranks utilities.
                  padding: '0.375rem 0.75rem',
                  border: '1px solid var(--color-bone-ghost)',
                  color: 'var(--color-bone)',
                }}
              >
                {chip.label}
                <span aria-hidden="true" style={{ opacity: 0.6 }}>
                  ×
                </span>
                <span className="u-vh">Remove filter</span>
              </motion.button>
            ))}
          </AnimatePresence>

          {anythingActive && (
            <button
              type="button"
              onClick={clearAll}
              className="u-mono"
              style={{ color: 'var(--color-bone-faint)' }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="u-shell pb-24">
        {results.length === 0 ? (
          <EmptyState onClear={clearAll} query={search} onClearQuery={() => setSearch('')} />
        ) : (
          <div ref={gridRef} className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
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

      <SearchOverlay
        open={searchOpen}
        query={search}
        setQuery={setSearch}
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
