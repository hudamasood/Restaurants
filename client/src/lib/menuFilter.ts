import type { CourseId, Dish, StationId } from '@/types';

/**
 * The menu taxonomy and the single matching predicate for the whole build.
 *
 * Everything that decides whether a dish is shown lives here. The page renders
 * the result; it never re-implements a comparison. That is deliberate — the
 * previous bug existed because matching logic sat inline in the page with a
 * `default: return true` fallthrough, so an unrecognised filter value silently
 * matched every dish instead of none.
 *
 * Two rules hold throughout:
 *   1. A filter value is either resolved to a canonical id or dropped. It is
 *      never passed through unvalidated.
 *   2. Every active filter is an AND. Within the course group the values are
 *      an OR of one another, because a dish has exactly one course and an AND
 *      there could only ever return nothing.
 */

/* ── Categories — the primary navigation ──────────────────────────── */

export type CategoryId = 'all' | StationId;

export interface MenuSubGroup {
  id: CourseId;
  label: string;
}

export interface MenuCategory {
  id: CategoryId;
  label: string;
  /** A dish belongs here when its station matches. `null` accepts everything. */
  station: StationId | null;
  /** Present when the category is browsed by sub-group rather than as one list. */
  subGroups?: MenuSubGroup[];
}

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: 'all', label: 'All', station: null },
  { id: 'tandoor', label: 'Tandoor & Dum', station: 'tandoor' },
  { id: 'grill', label: 'The Grill', station: 'grill' },
  { id: 'sea', label: 'The Sea', station: 'sea' },
  { id: 'garden', label: 'The Garden', station: 'garden' },
  {
    id: 'still',
    label: 'The Still Room',
    station: 'still',
    subGroups: [
      { id: 'zeroProof', label: 'Zero-Proof' },
      { id: 'coffeeTea', label: 'Coffee & Tea' },
    ],
  },
];

export const DEFAULT_CATEGORY: CategoryId = 'all';

export function categoryById(id: CategoryId): MenuCategory {
  return MENU_CATEGORIES.find((c) => c.id === id) ?? MENU_CATEGORIES[0];
}

/* ── Refine filters — course and dietary ──────────────────────────── */

/**
 * Zero-Proof and Coffee & Tea are absent on purpose: they are how The Still
 * Room is subdivided, so they belong to the category nav rather than to a
 * refine control that is meant to apply across every category.
 */
export const REFINE_COURSES = [
  { id: 'begin', label: 'To Begin' },
  { id: 'principal', label: 'Principal' },
  { id: 'alongside', label: 'Alongside' },
  { id: 'dessert', label: 'Dessert' },
] as const satisfies readonly { id: CourseId; label: string }[];

export const DIETARY_FILTERS = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'glutenFree', label: 'Gluten-free' },
  { id: 'finned', label: 'Finned fish' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'signature', label: 'Signature' },
  { id: 'share', label: 'To share' },
] as const;

export type DietaryId = (typeof DIETARY_FILTERS)[number]['id'];

/**
 * Total over `DietaryId` — every id has an explicit predicate and there is no
 * catch-all. Adding an id to `DIETARY_FILTERS` without adding a predicate is a
 * type error rather than a filter that quietly matches everything.
 */
const DIETARY_PREDICATES: Record<DietaryId, (dish: Dish) => boolean> = {
  vegetarian: (d) => d.dietary.vegetarian === true,
  vegan: (d) => d.dietary.vegan === true,
  glutenFree: (d) => d.dietary.glutenFree === true,
  finned: (d) => d.dietary.seafoodClass === 'finned',
  shellfish: (d) => d.dietary.seafoodClass === 'shellfish',
  signature: (d) => d.isSignature === true,
  share: (d) => d.isShared === true,
};

/* ── Value resolution ─────────────────────────────────────────────── */

/**
 * Canonical ids are camelCase (`glutenFree`) while the labels people see and
 * share are not (`Gluten-free`). Folding both to the same key means a
 * hand-edited or historic URL resolves to the real id instead of falling
 * through to a match-everything branch.
 */
function fold(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function lookupFor<T extends string>(
  entries: readonly { id: T; label: string }[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const entry of entries) {
    map.set(fold(entry.id), entry.id);
    map.set(fold(entry.label), entry.id);
  }
  return map;
}

const CATEGORY_LOOKUP = lookupFor(MENU_CATEGORIES);
const COURSE_LOOKUP = lookupFor(REFINE_COURSES);
const DIETARY_LOOKUP = lookupFor(DIETARY_FILTERS);
const SUB_GROUP_LOOKUP = lookupFor(
  MENU_CATEGORIES.flatMap((c) => c.subGroups ?? []),
);

/** Unknown values resolve to `null` and are dropped by the caller. */
export function resolveCategory(raw: string | null): CategoryId | null {
  return raw ? (CATEGORY_LOOKUP.get(fold(raw)) ?? null) : null;
}

export function resolveSubGroup(raw: string | null): CourseId | null {
  return raw ? (SUB_GROUP_LOOKUP.get(fold(raw)) ?? null) : null;
}

export function resolveCourse(raw: string): CourseId | null {
  return COURSE_LOOKUP.get(fold(raw)) ?? null;
}

export function resolveDietary(raw: string): DietaryId | null {
  return DIETARY_LOOKUP.get(fold(raw)) ?? null;
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

/* ── The query ────────────────────────────────────────────────────── */

export interface MenuQuery {
  category: CategoryId;
  /** Only meaningful when the active category declares sub-groups. */
  subGroup: CourseId | null;
  courses: CourseId[];
  diets: DietaryId[];
  search: string;
}

export const EMPTY_QUERY: MenuQuery = {
  category: DEFAULT_CATEGORY,
  subGroup: null,
  courses: [],
  diets: [],
  search: '',
};

/** Courses that actually occur in a category — the refine panel offers no dead options. */
export function coursesInCategory(dishes: Dish[], category: CategoryId): Set<CourseId> {
  const cat = categoryById(category);
  const out = new Set<CourseId>();
  for (const dish of dishes) {
    if (!dish.isAvailable) continue;
    if (cat.station !== null && dish.station !== cat.station) continue;
    out.add(dish.course);
  }
  return out;
}

/**
 * Drops any part of a query that cannot apply to its own category, so state
 * left over from a previous category never survives a switch. A sub-group is
 * only kept when the category declares it; a course refine is only kept when
 * the category actually contains that course.
 */
export function reconcileQuery(dishes: Dish[], query: MenuQuery): MenuQuery {
  const cat = categoryById(query.category);

  const subGroup =
    query.subGroup && cat.subGroups?.some((s) => s.id === query.subGroup)
      ? query.subGroup
      : null;

  const available = coursesInCategory(dishes, query.category);
  const courses = query.courses.filter((c) => available.has(c));

  const same =
    subGroup === query.subGroup && courses.length === query.courses.length;

  return same ? query : { ...query, subGroup, courses };
}

/* ── URL <-> query ────────────────────────────────────────────────── */

/**
 * Filters live in the URL so the state stays deep-linkable. Anything that does
 * not resolve is discarded here, which is the one place unvalidated input can
 * enter.
 */
export function parseMenuQuery(params: URLSearchParams): MenuQuery {
  // `station` is the pre-restructure name for the same thing, and the station
  // rail on the homepage still links with it. Both resolve to a category.
  const rawCategory = params.get('category') ?? params.get('station');

  return {
    category: resolveCategory(rawCategory) ?? DEFAULT_CATEGORY,
    subGroup: resolveSubGroup(params.get('sub')),
    courses: unique(
      params
        .getAll('course')
        .map(resolveCourse)
        .filter((c): c is CourseId => c !== null),
    ),
    diets: unique(
      params
        .getAll('diet')
        .map(resolveDietary)
        .filter((d): d is DietaryId => d !== null),
    ),
    search: params.get('q') ?? '',
  };
}

/** Writes a query back onto a params object, clearing every key it owns first. */
export function writeMenuQuery(params: URLSearchParams, query: MenuQuery): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete('category');
  next.delete('station');
  next.delete('sub');
  next.delete('course');
  next.delete('diet');

  if (query.category !== DEFAULT_CATEGORY) next.set('category', query.category);
  if (query.subGroup) next.set('sub', query.subGroup);
  query.courses.forEach((c) => next.append('course', c));
  query.diets.forEach((d) => next.append('diet', d));

  return next;
}

/* ── Matching ─────────────────────────────────────────────────────── */

/**
 * The one predicate. Every clause is an AND, and every clause rejects on a
 * value it does not recognise rather than waving the dish through.
 */
export function matchesQuery(dish: Dish, query: MenuQuery): boolean {
  if (!dish.isAvailable) return false;

  const cat = categoryById(query.category);
  if (cat.station !== null && dish.station !== cat.station) return false;

  if (query.subGroup !== null && dish.course !== query.subGroup) return false;

  // OR within the group: a dish has exactly one course.
  if (query.courses.length > 0 && !query.courses.includes(dish.course)) return false;

  // AND within the group: every selected dietary trait must hold.
  for (const id of query.diets) {
    const predicate = DIETARY_PREDICATES[id];
    if (!predicate || !predicate(dish)) return false;
  }

  const needle = query.search.trim().toLowerCase();
  if (needle) {
    const haystack =
      `${dish.name} ${dish.description} ${dish.ingredients.join(' ')}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }

  return true;
}

export function filterDishes(dishes: Dish[], query: MenuQuery): Dish[] {
  return dishes.filter((dish) => matchesQuery(dish, query));
}

export function activeRefineCount(query: MenuQuery): number {
  return query.courses.length + query.diets.length;
}

export function courseLabel(id: CourseId): string {
  return (
    REFINE_COURSES.find((c) => c.id === id)?.label ??
    MENU_CATEGORIES.flatMap((c) => c.subGroups ?? []).find((s) => s.id === id)?.label ??
    id
  );
}

export function dietaryLabel(id: DietaryId): string {
  return DIETARY_FILTERS.find((d) => d.id === id)?.label ?? id;
}
