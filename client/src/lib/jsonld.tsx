import { BRAND } from '@/data/brand';
import { HOURS } from '@/data/site';

const DAY_MAP: Record<string, string> = {
  Monday: 'Mo',
  Tuesday: 'Tu',
  Wednesday: 'We',
  Thursday: 'Th',
  Friday: 'Fr',
  Saturday: 'Sa',
  Sunday: 'Su',
};

/** Restaurant structured data, injected once at the app root. */
export function JsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: BRAND.name,
    description: BRAND.description,
    servesCuisine: ['South Asian', 'Grill', 'Seafood'],
    priceRange: '£££££',
    telephone: BRAND.phone,
    email: BRAND.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BRAND.address.line1,
      addressLocality: BRAND.address.city,
      postalCode: BRAND.address.postcode,
      addressCountry: 'GB',
    },
    openingHoursSpecification: HOURS.filter((h) => h.open).map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAY_MAP[h.day],
      opens: h.open,
      closes: h.close,
    })),
    acceptsReservations: true,
    hasMenu: '/menu',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
