import { BRAND } from './brand';
import { DISHES } from './menu';

/**
 * Title and description for every static route, in one place.
 *
 * These used to live as literals inside each page's PageShell call, which was
 * fine while React was the only thing that rendered them. The prerender step
 * needs the same strings at build time, in Node, without rendering React — and
 * two copies of a description is two copies that drift. So the pages read from
 * here and so does scripts/build-prerender.mjs.
 */
export const BRAND_NAME = BRAND.name;

export interface PageMeta {
  title: string;
  description: string;
  /**
   * Set when the title is already complete and must not have the brand name
   * appended. Only the homepage needs it: "Marrow & Hearth — Three Kitchens,
   * One Fire" is the title, not a page name waiting for a suffix.
   */
  exactTitle?: boolean;
}

export const PAGE_META = {
  '/': {
    title: `${BRAND.name} — Three Kitchens, One Fire`,
    exactTitle: true,
    description: BRAND.description,
  },
  '/menu': {
    title: 'The Menu',
    description:
      'Fifty-six dishes across three kitchens — Tandoor & Dum, The Grill and The Sea — with a full dietary matrix and a separate shellfish legend.',
  },
  '/still-room': {
    title: 'The Still Room',
    description:
      'Twelve zero-proof drinks built on clarification, wild fermentation, cask ageing and smoke. A programme, not an absence.',
  },
  '/story': {
    title: 'Our Story',
    description:
      'Three kitchens around one hearth, named suppliers, a forty-five day dry-age programme, and HMC certification with the body named.',
  },
  '/story/kitchen': {
    title: 'The Kitchen',
    description: 'Environmental portraits of the brigade, photographed at the station they run.',
  },
  '/experience': {
    title: 'Rooms & Occasions',
    description:
      "Five rooms — the main room, the chef's table, private dining, the terrace, and full buyouts for events.",
  },
  '/gallery': {
    title: 'Gallery',
    description: 'The room, the kitchen, the food and the bar.',
  },
  '/reserve': {
    title: 'Reserve a Table',
    description:
      'Reserve up to ninety days ahead. Parties above eight are handled by the private dining team.',
  },
  '/contact': {
    title: 'Contact',
    description: `${BRAND.address.line1}, ${BRAND.address.line2}, ${BRAND.address.city} ${BRAND.address.postcode}. Reservations, private dining and press enquiries.`,
  },
  '/allergens': {
    title: 'Allergens & Dietary',
    description: `The full dietary matrix for all ${DISHES.length} dishes, the finned-fish and shellfish legend, and halal certification by the ${BRAND.certification.body}.`,
  },
} as const satisfies Record<string, PageMeta>;

/** Dish chapters are per-dish, so they are derived rather than listed. */
export function dishMeta() {
  return DISHES.filter((d) => d.isSignature).map((d) => ({
    path: `/menu/${d.slug}`,
    title: d.name,
    description: d.description,
  }));
}
