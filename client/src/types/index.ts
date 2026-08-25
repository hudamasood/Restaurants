export type StationId = 'tandoor' | 'grill' | 'sea' | 'still' | 'garden';

export type CourseId =
  | 'begin'
  | 'principal'
  | 'alongside'
  | 'dessert'
  | 'zeroProof'
  | 'coffeeTea';

export type SeafoodClass = 'none' | 'finned' | 'shellfish';

export type MotionSignature =
  | 'turntable'
  | 'macro'
  | 'pan'
  | 'lidLift'
  | 'build'
  | 'colourBleed'
  | 'risePour'
  | 'smokeClear';

export interface Dietary {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  containsNuts: boolean;
  containsDairy: boolean;
  /** First-class, not an allergen string — it drives a filter, a legend and a card token. */
  seafoodClass: SeafoodClass;
  allergens: string[];
}

export interface ProvenancePair {
  label: string;
  value: string;
}

export interface Dish {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  station: StationId;
  course: CourseId;
  price: number;
  priceNote?: string;
  ingredients: string[];
  dietary: Dietary;
  provenance: ProvenancePair[];
  isSignature: boolean;
  motionSignature?: MotionSignature;
  media: {
    primary: string;
    landscape?: string;
    square?: string;
    process?: string[];
    /** Homepage signature-chapter frame. Falls back to `primary`.
     * Exists so the landing page's established look is fixed independently of
     * the menu card, which is chosen purely for dish accuracy. */
    home?: string;
  };
  pairedDrink?: string;
  isAvailable: boolean;
  pickupEligible: boolean;
  isShared?: boolean;
  sortOrder: number;
}

export interface Station {
  id: StationId;
  name: string;
  tagline: string;
  description: string;
  image: string;
  thumbnails: string[];
}

export interface Course {
  id: CourseId;
  name: string;
}

export interface Chef {
  id: string;
  name: string;
  role: string;
  station: StationId;
  bio: string;
  quote?: string;
  image: string;
}

export interface Experience {
  id: string;
  name: string;
  capacity: string;
  description: string;
  image: string;
}

export interface Review {
  id: string;
  quote: string;
  source: string;
  attribution: string;
}

export interface GalleryItem {
  id: string;
  category: 'room' | 'kitchen' | 'food' | 'bar';
  caption: string;
  image: string;
  /** Masonry span weight. */
  tall?: boolean;
}

export interface DayHours {
  day: string;
  short: string;
  open: string | null;
  close: string | null;
  note?: string;
}

export interface SeatingArea {
  id: string;
  name: string;
  note: string;
  minParty: number;
  maxParty: number;
  image: string;
}

export interface ReservationDraft {
  date: string | null;
  time: string | null;
  partySize: number | null;
  seatingArea: string | null;
  name: string;
  email: string;
  phone: string;
  occasion: string;
  dietaryNotes: string;
  accessibilityNotes: string;
}

export interface Reservation extends ReservationDraft {
  reference: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'noShow';
  createdAt: string;
}
