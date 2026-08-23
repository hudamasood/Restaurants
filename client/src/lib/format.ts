export function price(n: number): string {
  return `£${n.toFixed(0)}`;
}

export function reference(): string {
  const chars = 'ACDEFGHJKLMNPQRTUVWXY34679';
  const pick = () => chars[Math.floor(Math.random() * chars.length)];
  return `MH-${pick()}${pick()}${pick()}${pick()}`;
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatDateShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

/** Dietary tokens shown on a card, in a fixed order so cards stay scannable. */
export function dietaryTokens(d: {
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  seafoodClass: 'none' | 'finned' | 'shellfish';
}): string[] {
  const out: string[] = [];
  if (d.vegan) out.push('Vegan');
  else if (d.vegetarian) out.push('Veg');
  if (d.glutenFree) out.push('GF');
  if (d.seafoodClass === 'finned') out.push('Finned fish');
  if (d.seafoodClass === 'shellfish') out.push('Shellfish');
  return out;
}
