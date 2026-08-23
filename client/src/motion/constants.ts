/**
 * The single source of truth for every duration, easing and stagger in
 * the build. No inline `transition={{ duration: 0.6 }}` anywhere — if a
 * value isn't here, either it belongs here or the animation is wrong.
 */

export const EASE = {
  /** Long slow settle — the default for everything entering. */
  house: [0.22, 1, 0.36, 1],
  /** Exits only. */
  exit: [0.65, 0, 0.35, 1],
  /** Scroll-linked scrubbing only, where scroll drives the value directly. */
  linear: [0, 0, 1, 1],
} as const;

export const DUR = {
  micro: 0.2, // hover, focus, tap
  short: 0.4, // token, chip, small state
  base: 0.6, // reveals, card entrance — the floor for anything meaningful
  long: 0.9, // section reveals, drawers
  cine: 1.1, // hero masks, cross-dissolves
  page: 0.9, // route transition, total
} as const;

export const STAGGER = {
  tight: 0.06, // nav links, chips
  line: 0.09, // text lines — the house stagger
  card: 0.09,
  loose: 0.15, // large blocks
} as const;

/** Parallax rates, % translateY. Max two depth layers per section. */
export const DEPTH = {
  near: -3,
  mid: -8,
  far: -15,
} as const;

/**
 * Stagger caps at 8 items. Beyond that the total is capped so the ninth
 * card doesn't arrive after the user has scrolled past it.
 */
export const STAGGER_CAP = 8;

export function staggerFor(index: number, interval: number = STAGGER.card) {
  return Math.min(index, STAGGER_CAP) * interval;
}

/** Reduced-motion replacement: a flat opacity fade, nothing else. */
export const REDUCED = {
  duration: DUR.micro,
  ease: EASE.house,
} as const;

/** Viewport defaults — fire at 15% in, not at the very edge. */
export const VIEWPORT = {
  once: true,
  margin: '0px 0px -15% 0px',
} as const;

export const VIEWPORT_EARLY = {
  once: true,
  margin: '0px 0px -5% 0px',
} as const;

export const VIEWPORT_LATE = {
  once: true,
  margin: '0px 0px -30% 0px',
} as const;
