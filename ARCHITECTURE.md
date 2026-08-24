# Architecture

Marrow &amp; Hearth — a premium multi-cuisine restaurant site. Three kitchens
(Tandoor &amp; Dum, The Grill, The Sea) plus a zero-proof bar programme.

This document describes how the code is actually organised and, more
usefully, *why* several non-obvious decisions were made. Where a rule exists
because something broke, the incident is recorded — those are the parts most
likely to be undone by accident.

---

## 1. Stack

| Layer | Choice | Note |
|---|---|---|
| Build | Vite 8 · TypeScript 6 | `client/` is the project root |
| UI | React 19 | Native document metadata; no helmet library |
| Routing | React Router 7 | 14 routes, lazy except the homepage |
| Styling | Tailwind 4 | CSS-first `@theme` token layer |
| Motion | `motion` 13 (Framer Motion) | `LazyMotion` + `domAnimation` (~18kb, not ~34kb) |
| Server state | TanStack Query 5 | `staleTime: 5min` |
| Validation | zod 4 | Reservation and contact forms |
| Hosting | Vercel | Root Directory **must** be `client` |

**No GSAP.** Pinning is native `position: sticky`; scroll scrubbing is
`useScroll` + `useTransform`; the menu filter re-layout is a ~70-line custom
FLIP in `lib/flip.ts`. Nothing in the build needs ScrollTrigger.

**Express 4, not 5** — deliberate, if/when the API lands. Express 5 changed
error handling and path matching in ways that break common middleware, and
this API surface gains nothing from it.

---

## 2. Directory map

```
client/src/
├── main.tsx              Entry: Router → Providers → App
├── app/
│   ├── App.tsx           Route table, lazy boundaries, Loader mount
│   ├── providers.tsx     QueryClient · MotionProvider · OverlayProvider
│   └── overlay.ts        Overlay registry, scroll lock, focus trap, Escape
├── styles/
│   ├── tokens.css        @theme design tokens + fluid type scale
│   └── globals.css       Baseline, utilities, CSS reveal system, components
├── motion/
│   ├── constants.ts      EASE · DUR · STAGGER · DEPTH — single source of truth
│   ├── guards.ts         useCanAnimate, device/connection detection
│   ├── useReveal.ts      The CSS reveal driver (see §5)
│   ├── scroll.ts         Scroll progress, parallax, shared IO registry, lerp
│   └── variants.ts       Motion variants for the few JS-animated pieces
├── components/
│   ├── primitives/       Button, Token
│   ├── media/            Picture
│   ├── motion/           Reveal, LineMask, CurtainMask, Parallax, Annotation,
│   │                     StickyStage, CursorTrail, PageTransition, Loader,
│   │                     ChapterCounter
│   ├── layout/           Nav, Footer, PageShell, Wordmark
│   └── sections/
│       ├── home/         Hero, StationRail, SignatureChapters, StoryBlock,
│       │                 KitchenBlock, ExperienceRail, GalleryStrip,
│       │                 ReviewCarousel, ReserveBand
│       ├── menu/         DishCard, DishQuickView
│       └── dish/         DishSignature (all 8 signatures)
├── pages/                14 route components
├── data/                 brand.ts · menu.ts (56 dishes) · site.ts
├── lib/                  flip.ts · format.ts · jsonld.tsx
└── types/                Shared domain types
```

---

## 3. Data layer

There is **no backend**. All content is typed seed data in `src/data/`,
imported directly. TanStack Query is wired up but currently reads from these
modules, so swapping in a real API means changing the query functions and
nothing else.

- **`brand.ts`** — name, address, hours, certification body, feature flags,
  and `img()`, the single helper that builds an image URL. Every occurrence of
  the restaurant name routes through `BRAND`, so renaming is one line.
- **`menu.ts`** — `STATIONS`, `COURSES`, and all 56 `DISHES`. Eight are
  `isSignature` and carry a `motionSignature`.
- **`site.ts`** — hero chapters, chefs, rooms, reviews, gallery, hours,
  seating areas, story milestones, drink families.

**Reservations** persist to `sessionStorage`, not a database. The five-step
flow is fully clickable end to end and issues a real reference code, but a
booking does not survive a browser restart.

**Images** are Unsplash URLs at reference quality. `Picture` already
implements the full contract — `srcset` across five widths, an LQIP
placeholder, reserved intrinsic dimensions, a priority flag — so a real
`sharp` pipeline drops in without touching a component.

> **Known content issue:** the image assigned to Tandoor &amp; Dum
> (`1585032226651-759b368d7246`) is a photo of noodles, not tandoor food. It
> appears in 6 places across `menu.ts` and `site.ts`. Retained at the owner's
> explicit request; replace when real photography arrives.

---

## 4. Motion system

Every duration and easing comes from `motion/constants.ts`. There are no
inline transition values anywhere in the build.

```
micro  200ms   hover, focus, tap
short  400ms   token, chip, small state
base   600ms   reveals, card entrance — the floor for anything meaningful
long   900ms   section reveals, drawers
cine  1100ms   hero masks, cross-dissolves
```

Easing is a long slow settle: `cubic-bezier(0.22, 1, 0.36, 1)`. No springs,
no overshoot anywhere.

### Signature interactions

- **Hero** — 250vh native-sticky pin, three chapters. At each boundary the
  image cross-dissolves while the outgoing headline masks *down* and the
  incoming masks *up*. Opposing directions are what make it read as a page
  turn rather than a slideshow.
- **Station rail** — two input modes over one continuous `MotionValue`.
  Scroll derives the value; dragging the indicator suspends that derivation
  and follows pointer Y; on release it settles to the nearest station **and
  re-syncs page scroll**. Without that re-sync the two modes diverge and the
  imagery jumps backwards after a drag — the classic failure of this pattern.
  Station images blend by distance, so mid-drag genuinely shows two at once.
- **Eight dish signatures** (`DishSignature.tsx`) — turntable, macro, pan,
  lidLift, build, colourBleed, risePour, smokeClear. One per signature dish,
  so a visitor who sees all eight never sees the same trick twice. The four
  the spec assigns to canvas are currently scroll-driven transforms over
  process stills; `useSequenceFrames` in `scroll.ts` drops in behind the same
  component boundary once real frame sequences exist.
- **Menu FLIP** (`lib/flip.ts`) — surviving cards translate from old position
  to new, so a card present before and after a filter change is visibly the
  same card. Never a hard re-render.
- **Annotations** — the reference site's callouts state temperature; ours
  state provenance and time. Dot scales in, leader line draws via
  `stroke-dashoffset`, label follows. Max two per image. On mobile they become
  a mono `LABEL · VALUE` caption row — a designed alternative, not a hidden
  feature.

### Reduced motion

One guard, resolved once in `motion/guards.ts`. `useCanAnimate()` returns
false for `prefers-reduced-motion`, a `saveData` connection, or a low-end
device. Components ask once at the top and render the static variant —
reduced-motion handling is not sprinkled through every animation definition.

A visible toggle in the footer overrides the OS setting in both directions.

---

## 5. The CSS reveal system — read before changing

This is the least obvious part of the codebase and the easiest to
accidentally revert.

**Rule: the CSS baseline is the VISIBLE state.** No component writes
`opacity: 0` as a resting style. Reveals work by JS *adding* a `hidden` data
attribute on mount — only when it can actually animate — then flipping it to
`shown`.

```css
[data-reveal]           { transition: opacity, transform; }
[data-reveal='hidden']  { opacity: 0; transform: translateY(24px); }
[data-reveal='shown']   { opacity: 1; transform: none; }
```

`Reveal`, `CurtainMask`, `LineMask` and `Annotation` all use this via
`useReveal()`. They previously used JS-applied inline styles, which caused a
real bug: **all 8 images and most body text on a dish page sat at opacity 0**,
because an interrupted animation left a stale inline style behind and the
content never appeared.

Three layers of protection, all of which exist because each was needed:

1. **CSS transitions, not inline styles.** A CSS transition resolves to its
   final computed value on the next repaint; a frozen JS animation strands the
   element permanently.
2. **Timers, not `requestAnimationFrame`,** to flip mount-time reveals. rAF
   does not fire in a throttled or backgrounded tab, which left elements
   pinned at `hidden` forever.
3. **A `settled` flag.** Flipping the state is not enough — the transition
   *itself* can freeze part-way, leaving a half-clipped line of display type on
   screen. After the transition has had its full run, `useReveal` marks the
   element settled and settled elements drop the transition entirely, resolving
   to the final value at once.

Every observer also carries a failsafe that reveals anyway if it never fires.

**Mount-time entrances** (hero claim line, CTAs, counter; dish hero dissolve;
confirmation reference) use CSS keyframe animations with **no `forwards`
fill**, so the resting style is the visible one. These fire during initial
page load — exactly when a tab is most likely to be backgrounded. The hero
once shipped without its reservation CTA in that state.

The same reasoning applies to `Picture`: an image already decoded at first
paint renders with `transition: none`. An image is the one element whose
visibility must never depend on a transition completing.

---

## 6. Pinned sections (`StickyStage`)

Pinning is a 100svh `position: sticky` child inside a tall parent. Native,
GPU-composited, zero JS, survives resize with no `refresh()` call.

```
.stage-track  → tall parent, height in vh, defines scroll range
.stage-pin    → sticky 100svh child, holds the content
```

Consumers: `Hero` (250vh), `StationRail` (200vh), `ExperienceRail` (220vh),
and the three still-room drink families (160vh each).

**Critical:** under reduced motion these collapse to normal flow, and
`.motion-off .stage-pin` **must keep `min-height: 100svh`**. Every consumer
paints its content as absolutely positioned layers with nothing in normal
flow, so `height: auto` alone resolves to **zero** — every pinned section on
the site rendered as an invisible sliver, stacked on top of the next section
at the same offset. Any visitor with the OS-level reduce-motion setting hit
this by default.

Below 768px there is no pinning at all; each stage renders a distinct
`mobile` prop instead.

---

## 7. Routing and page transitions

Route-level code splitting: everything is `React.lazy` except `Home`.

`PageTransition` runs an oxblood overlay — wipes up 450ms, holds 200ms on the
wordmark, wipes away 450ms. Scroll resets to top under the cover.

Two hard-won constraints, both commented in the file:

1. **The effect depends on `location.pathname` alone.** It also sets
   `display`, and if `display` were a dependency, the mid-transition swap
   would re-run the effect and its own cleanup would cancel the timer that
   uncovers the page — leaving the overlay stuck over the site permanently.
   The current path is read through a ref instead.
2. **Page content is NOT wrapped in a keyed `AnimatePresence`.** With
   `mode="wait"`, an exit animation that does not complete cleanly leaves the
   incoming child mounted at `initial` and never advanced — the whole site at
   opacity 0. The overlay already covers the viewport for the entire swap, so
   the crossfade bought nothing. The outgoing fade is a plain CSS transition
   on one persistent element, which cannot be orphaned.

Dish-chapter navigation (`/menu/:slug` → `/menu/:slug`) deliberately skips the
wipe: the hero cross-dissolves and the counter ticks instead.

---

## 8. Overlays

`OverlayProvider` is a single arbiter. Overlays register by name, and scroll
lock is applied once for the whole stack, so two overlays can never fight over
`overflow: hidden` and leave the page permanently locked.

`overlay.ts` also exports `useEscape` and `useFocusTrap`. Every overlay uses
them rather than hand-rolling: focus moves in, is trapped, and returns to the
originating element on close.

Quick-view and lightbox reflect state in the URL (`?dish=`, `?image=`) so the
browser Back button closes the overlay instead of leaving the page — the most
common overlay UX failure.

---

## 9. Design tokens

The specification named its colours but never numbered them, with one
exception: the scrolled-nav rule fixes the ground at `#0B0B0C`. Everything
else is derived outward, honouring the two rules the spec does state — *ash
and bone*, and **saffron exactly once per viewport**.

| Token | Value | Role |
|---|---|---|
| `--color-ink` | `#0B0B0C` | Page ground |
| `--color-ash` | `#141416` | Raised surfaces |
| `--color-smoke` | `#2C2C31` | Every hairline rule |
| `--color-bone` | `#E9E3D7` | Primary text — 14.9:1 on ink |
| `--color-bone-dim` | `#948E83` | Body copy — 6.2:1 |
| `--color-oxblood` | `#4A1119` | Loader field, page-transition wipe |
| `--color-saffron` | `#D99A2B` | One use per viewport |

Type: **Bodoni Moda** (display) · **Archivo** (body) · **IBM Plex Mono**
(counters, prices, provenance, dietary tokens).

`u-display` sets family, weight and tracking **and a default size**. It did not
originally, which meant all 35 `LineMask` headings silently fell back to 16px.
Size steps: `.t-hero`, `.t-display`, `.t-section`, `.t-dish-lg`, `.t-dish`.

> **Trap:** never cap a display-type container with a `ch`-based max-width.
> `ch` resolves against *that element's own inherited* font size, not the
> display size inside it. A `max-w-[13ch]` wrapper inheriting 16px computed to
> ~104px wide and clipped every word of an 86px headline. Use flex allocation
> or px.

Three scrims — `u-scrim` (ramped both ends), `u-scrim-full`, `u-scrim-left`.
Every text-over-image pairing carries one and clears 4.5:1. `u-scrim` also
ramps from the top, because the nav sits transparent over the hero.

---

## 10. Responsive

Mobile is redesigned, not scaled down.

| | Desktop | Mobile (<768px) |
|---|---|---|
| Pinning | Full | Removed entirely |
| Station rail | Drag + scroll + cursor trail | Bottom tab bar + snap carousel |
| Parallax / drift | Yes | Removed |
| Annotations | Overlay with leader lines | Mono caption row |
| Menu filters | Inline bar | Bottom sheet, applies on dismiss |
| Hover states | Yes | Defined touch equivalents |

Filters apply on sheet dismiss on mobile so the FLIP plays on a *visible*
grid, not underneath a covering sheet.

---

## 11. Performance

Initial route is ~157kb gzip, inside the 180kb budget.

- Route-level splitting; the admin bundle would be fully separate.
- `LazyMotion` with `domAnimation` only.
- `transform` and `opacity` only, with three sanctioned exceptions:
  `clip-path` (capped at 3 concurrent), `stroke-dashoffset` on annotation
  leader lines, and `filter: blur` on FLIP exits.
- **Never** animate `width`, `height`, `top`, `left`, `margin`, `box-shadow`.
- All `IntersectionObserver`s go through one shared registry in `scroll.ts`
  rather than being instantiated per component.
- No scroll event listeners anywhere; `useScroll` MotionValues update outside
  React's render cycle.
- No moment, no lodash, no icon library — icons are inline SVG.

---

## 12. Deployment

Vercel, with **Root Directory set to `client`**. Leave it at the repo root and
the build fails with `vite: command not found`, because `package.json` lives
in `client/` and the install step is skipped.

`client/vercel.json` provides the SPA rewrite — without it every route except
`/` 404s on direct load or refresh — plus a one-year immutable cache on
hashed build assets.

No environment variables are required. Ordering is built but dark behind
`VITE_FEATURE_ORDERING`.

---

## 13. Not built

The spec's phases 7 and 8: the Express/Mongo backend and the admin SPA.
Content is seed data; reservations are `sessionStorage`. The `<Picture>`
contract and the query layer are both shaped so these can land without
reworking components.
