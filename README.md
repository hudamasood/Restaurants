# Marrow &amp; Hearth

A premium multi-cuisine restaurant site — three kitchens (Tandoor &amp; Dum, The Grill, The Sea) and a
zero-proof bar programme — built to a two-part production specification covering architecture and
motion design.

Motion is the point of this build. Every animation is specified as trigger, initial → final,
duration, easing and implementation, and every one has a defined reduced-motion equivalent.

## Stack

| Layer | Choice |
|---|---|
| Build | Vite 8 · TypeScript |
| UI | React 19 · React Router 7 |
| Styling | Tailwind 4 (CSS-first `@theme` token layer) |
| Motion | `motion` 13 (Framer Motion) with `LazyMotion` + `domAnimation` |
| Server state | TanStack Query 5 |
| Validation | zod 4 |

No GSAP. Pinning is native `position: sticky`; scrubbing is `useScroll` + `useTransform`;
the menu filter re-layout is a ~40-line custom FLIP.

## Run it

```bash
cd client
npm install
npm run dev
```

Production build:

```bash
cd client
npm run build
```

## Design tokens

The specification names its colours but never numbers them, with one exception — the scrolled-nav
rule fixes the ground at `#0B0B0C`. Everything else is derived outward from that in
`src/styles/tokens.css`, honouring the two rules the spec does state: *ash and bone*, and
**saffron exactly once per viewport**.

| Token | Value | Role |
|---|---|---|
| `--color-ink` | `#0B0B0C` | Page ground |
| `--color-ash` | `#141416` | Raised surfaces |
| `--color-smoke` | `#2C2C31` | Every hairline rule |
| `--color-bone` | `#E9E3D7` | Primary text (14.9:1 on ink) |
| `--color-bone-dim` | `#948E83` | Body copy (6.2:1) |
| `--color-oxblood` | `#4A1119` | Loader field, page-transition wipe |
| `--color-saffron` | `#D99A2B` | One use per viewport |

Type: **Bodoni Moda** (display) · **Archivo** (body) · **IBM Plex Mono** (counters, prices,
provenance, dietary tokens).

## Motion system

Every duration and easing comes from `src/motion/constants.ts` — there are no inline transition
values anywhere in the build.

```
micro  200ms   hover, focus, tap
short  400ms   token, chip, small state
base   600ms   reveals, card entrance — the floor for anything meaningful
long   900ms   section reveals, drawers
cine  1100ms   hero masks, cross-dissolves
```

Easing is a long slow settle, `cubic-bezier(0.22, 1, 0.36, 1)`. No springs, no overshoot.

### Signature interactions

- **Hero** — 250vh pinned, three chapters. At each boundary the image cross-dissolves while the
  outgoing headline masks *down* and the incoming masks *up*; opposing directions are what make it
  read as a page turn rather than a slideshow.
- **Station rail** — two input modes sharing one continuous `MotionValue`. Scroll derives the
  value; dragging the indicator suspends that derivation and follows pointer Y; on release it
  settles to the nearest station and re-syncs page scroll so the modes never diverge. Station
  imagery blends by distance, so a mid-drag position shows a genuine blend of two stations.
- **Eight motion signatures** — turntable, macro, pan, lidLift, build, colourBleed, risePour and
  smokeClear, one per signature dish. A visitor who sees all eight never sees the same trick twice.
- **Menu FLIP** — surviving cards translate from old position to new, so a card present before and
  after a filter change is visibly the same card.
- **Annotations** — the reference site's callouts state temperature; ours state provenance and
  time. Terminal dot scales in, leader line draws, label follows. Max two per image. On mobile they
  become a mono `LABEL · VALUE` caption row rather than an overlay.

### Reduced motion

One guard, resolved once in `src/motion/guards.ts` — it returns false for `prefers-reduced-motion`,
a `saveData` connection, or a low-end device. Components ask it at the top and render the static
variant; reduced-motion handling is not sprinkled through every animation definition.

There is also a visible motion toggle in the footer, independent of the OS setting.

## Responsive

Mobile is redesigned, not scaled down. Pinning is removed below 768px, the station rail becomes a
bottom tab bar with a scroll-snap carousel, parallax and drift layers are off, the filter bar
becomes a bottom sheet that applies on dismiss, and every hover state has a defined touch
equivalent.

## Structure

```
client/src/
├── app/          router · providers · overlay arbitration
├── styles/       tokens.css · globals.css
├── motion/       constants · variants · scroll · guards
├── components/
│   ├── primitives/  Button · Token
│   ├── media/       Picture
│   ├── motion/      Reveal · LineMask · CurtainMask · Parallax · Annotation ·
│   │                StickyStage · CursorTrail · PageTransition · Loader
│   ├── layout/      Nav · Footer · PageShell · Wordmark
│   └── sections/    home · menu · dish
├── pages/        14 routes
├── data/         brand · menu (56 dishes) · site
├── lib/          flip · format · jsonld
└── types/
```

## Notes

- Photography is sourced from Unsplash at reference quality. The `<Picture>` contract (srcset
  across five widths, LQIP, reserved intrinsic dimensions, priority flag) is already in place, so a
  real `sharp` pipeline drops in without touching a component.
- Ordering is specified but ships behind `VITE_FEATURE_ORDERING`, dark at launch.
