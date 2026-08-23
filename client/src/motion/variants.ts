import type { Variants, Transition } from 'motion/react';
import { DUR, EASE, STAGGER } from './constants';

const house = (duration: number, delay = 0): Transition => ({
  duration,
  ease: EASE.house,
  delay,
});

const exit = (duration: number, delay = 0): Transition => ({
  duration,
  ease: EASE.exit,
  delay,
});

export const T = { house, exit };

/* ── Reveal — the workhorse ────────────────────────────────────────── */
export const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: house(DUR.base) },
};

export const revealStill: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: house(DUR.micro) },
};

export const revealFrom = (y: number, duration = DUR.base): Variants => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: house(duration) },
});

/* ── Line mask — per-line text reveal, never per-letter ────────────── */
export const lineMaskParent = (interval = STAGGER.line, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: interval, delayChildren: delay } },
});

export const lineMaskChild: Variants = {
  hidden: { y: '110%' },
  show: { y: '0%', transition: house(DUR.base) },
};

/** Masks DOWN — used by the outgoing headline at a chapter boundary. */
export const lineMaskChildOut: Variants = {
  hidden: { y: '0%' },
  show: { y: '110%', transition: exit(DUR.base) },
};

/* ── Curtain mask — clip-path image reveal ─────────────────────────── */
export const curtain: Variants = {
  hidden: { clipPath: 'inset(0 0 100% 0)' },
  show: { clipPath: 'inset(0 0 0% 0)', transition: house(DUR.cine) },
};

export const curtainUp: Variants = {
  hidden: { clipPath: 'inset(100% 0 0 0)' },
  show: { clipPath: 'inset(0% 0 0 0)', transition: house(DUR.cine) },
};

/** The image inside a curtain runs a slow settle — parallax within the mask. */
export const curtainInner: Variants = {
  hidden: { scale: 1.08 },
  show: { scale: 1, transition: house(DUR.cine) },
};

/* ── Stagger containers ────────────────────────────────────────────── */
export const staggerParent = (interval = STAGGER.card, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: interval, delayChildren: delay } },
});

/* ── Overlays ──────────────────────────────────────────────────────── */
export const backdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: house(0.3) },
  out: { opacity: 0, transition: exit(0.25) },
};

export const modalPanel: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: house(0.5) },
  out: { opacity: 0, y: 12, scale: 0.99, transition: exit(0.25) },
};

export const drawerRight: Variants = {
  hidden: { x: '100%' },
  show: { x: 0, transition: house(DUR.short) },
  out: { x: '100%', transition: exit(0.3) },
};

export const sheetBottom: Variants = {
  hidden: { y: '100%' },
  show: { y: 0, transition: house(DUR.short) },
  out: { y: '100%', transition: exit(0.3) },
};

/** Mobile nav drawer — wipes up, links stagger, close does not stagger out. */
export const navDrawer: Variants = {
  hidden: { clipPath: 'inset(100% 0 0 0)' },
  show: {
    clipPath: 'inset(0% 0 0 0)',
    transition: { ...house(DUR.short), staggerChildren: 0.06, delayChildren: 0.15 },
  },
  out: { clipPath: 'inset(100% 0 0 0)', transition: exit(0.3) },
};

/* ── Page transition ───────────────────────────────────────────────── */
export const pageOverlay: Variants = {
  hidden: { y: '100%' },
  show: { y: '0%', transition: exit(0.45) },
  out: { y: '-100%', transition: house(0.45) },
};

export const pageContent: Variants = {
  hidden: { opacity: 1 },
  /** Never animate outgoing position — it fights the incoming wipe. */
  out: { opacity: 0, transition: { duration: DUR.micro, ease: EASE.exit } },
};

/* ── Step transitions (reservation flow) ───────────────────────────── */
export const stepForward: Variants = {
  hidden: { opacity: 0, x: 32 },
  show: { opacity: 1, x: 0, transition: house(DUR.short) },
  out: { opacity: 0, x: -32, transition: exit(0.25) },
};

export const stepBackward: Variants = {
  hidden: { opacity: 0, x: -32 },
  show: { opacity: 1, x: 0, transition: house(DUR.short) },
  out: { opacity: 0, x: 32, transition: exit(0.25) },
};

/* ── Lightbox navigation — directional ─────────────────────────────── */
export const lightboxSlide = (dir: 1 | -1): Variants => ({
  hidden: { opacity: 0, x: 40 * dir },
  show: { opacity: 1, x: 0, transition: house(DUR.short) },
  out: { opacity: 0, x: -40 * dir, transition: exit(0.25) },
});

/* ── Reviews — outgoing masks down, incoming masks up, no overlap ──── */
export const quoteIn: Variants = {
  hidden: { opacity: 0, y: '40%' },
  show: { opacity: 1, y: '0%', transition: house(0.5) },
  out: { opacity: 0, y: '-30%', transition: exit(0.3) },
};

/* ── Rule draw ─────────────────────────────────────────────────────── */
export const ruleDraw: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: house(DUR.long) },
};
