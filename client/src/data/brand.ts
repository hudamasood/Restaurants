/**
 * One constant for the name. It touches the wordmark, the loader, page
 * titles, JSON-LD, OG tags, email templates, the reservation reference
 * prefix and the footer — so it lives here and nowhere else.
 */
export const BRAND = {
  name: 'Marrow & Hearth',
  nameShort: 'Marrow & Hearth',
  initials: 'MH',
  tagline: 'Three kitchens, one fire',
  claim: 'No alcohol. No compromise.',
  description:
    'Three kitchens — Tandoor & Dum, The Grill, The Sea — and a zero-proof bar programme built with the same rigour.',
  address: {
    line1: '114 Wharfside Street',
    line2: 'Fitzrovia',
    city: 'London',
    postcode: 'W1T 4QP',
    country: 'United Kingdom',
  },
  phone: '+44 20 7946 0114',
  email: 'reservations@marrowandhearth.com',
  certification: {
    body: 'Halal Monitoring Committee',
    reference: 'HMC · 4417-B',
    note: 'All meat is HMC-certified hand-slaughtered. Certification is renewed annually and the current certificate is available on request.',
  },
  social: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'X', href: 'https://x.com' },
    { label: 'LinkedIn', href: 'https://linkedin.com' },
  ],
} as const;

/** Feature flags. Ordering is built in full but dark at launch. */
export const FEATURES = {
  // Optional chaining so this module can also be imported outside Vite,
  // for example by the seed script.
  ordering: import.meta.env?.VITE_FEATURE_ORDERING === 'true',
  reviews: true,
} as const;

/** Image helper — one place that knows how a source URL is shaped. */
export function img(id: string): string {
  return `https://images.unsplash.com/photo-${id}`;
}
