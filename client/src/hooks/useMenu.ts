import { useQuery } from '@tanstack/react-query';
import { getMenu } from '@/lib/api';
import {
  DISHES as SEED_DISHES,
  STATIONS as SEED_STATIONS,
  COURSES as SEED_COURSES,
} from '@/data/menu';
import type { Course, Dish, Station } from '@/types';

export interface Menu {
  stations: Station[];
  courses: Course[];
  dishes: Dish[];
  /** True while the live copy is still in flight and seed data is showing. */
  isSeed: boolean;
}

const SEED: Omit<Menu, 'isSeed'> = {
  stations: SEED_STATIONS,
  courses: SEED_COURSES,
  dishes: SEED_DISHES,
};

/**
 * The menu, live from the database, with the bundled copy as the initial
 * value rather than a spinner.
 *
 * The database is the source of truth — it is what the admin will edit, and
 * what carries availability. But this site's first impression is a cinematic
 * full-viewport hero, and making that wait on a round-trip to trade a
 * complete page for a skeleton would be a poor bargain. So the bundled copy
 * paints immediately and the live copy replaces it on arrival, which is also
 * what keeps an outage from emptying the menu.
 *
 * The two are kept identical by a parity test, so the swap is invisible
 * unless something genuinely changed in the database.
 */
export function useMenu(): Menu {
  const query = useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      const r = await getMenu();
      if (!r.ok) throw new Error(r.message);
      return r.data;
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const data = query.data ?? SEED;
  return { ...data, isSeed: !query.data };
}

/** Signature dishes, in menu order. */
export function useSignatureDishes(): Dish[] {
  return useMenu().dishes.filter((d) => d.isSignature);
}
