import type { Chef, DayHours, Experience, GalleryItem, Review, SeatingArea } from '@/types';
import { img } from './brand';

export const HERO_CHAPTERS = [
  {
    id: 'h1',
    headline: 'Three kitchens, one fire',
    body: 'Tandoor and dum, an open grill, and a sea station. One hearth feeds all three.',
    image: img('1555939594-58d7cb561ad1'),
  },
  {
    id: 'h2',
    headline: 'Forty-five days on the bone',
    body: 'Aged in our own cabinet at 1°C, trimmed to a third of its weight, carved at your table.',
    image: img('1544025162-d76694265947'),
  },
  {
    id: 'h3',
    headline: 'A bar with no bottles',
    body: 'Clarified, fermented, casked and smoked. The technique is the point, not the absence.',
    image: img('1470124182917-cc6e71b22ecc'),
  },
];

export const CHEFS: Chef[] = [
  {
    id: 'c1',
    name: 'Zaynab Qureshi',
    role: 'Executive Chef',
    station: 'tandoor',
    bio: 'Zaynab spent eleven years between Lahore and Lyon before deciding the two were not as far apart as everyone told her. She runs the dum kitchen personally and will not let anyone else seal a handi — a habit the rest of the brigade has stopped arguing about. Her rule for the pass is that a dish leaves when it is right, and that a table waiting is cheaper than a dish that is not.',
    quote:
      'A sealed pot is a promise you cannot check. You either did the work at four o’clock or you did not.',
    image: img('1577219491135-ce391730fb2c'),
  },
  {
    id: 'c2',
    name: 'Idris Bello',
    role: 'Head of Fire',
    station: 'grill',
    bio: 'Idris built the hearth himself, twice, because the first one did not draw properly and he refused to cook on it. He banks the coals four times a service and can tell the temperature of the grill by holding a hand over it, which he insists is not a party trick but a consequence of doing it every night for nine years. He is responsible for the ageing cabinet and guards its key.',
    quote: 'Rest it longer than you think. Everyone rushes the last twenty minutes and everyone can taste it.',
    image: img('1583394293214-28ded15ee548'),
  },
];

export const EXPERIENCES: Experience[] = [
  {
    id: 'e1',
    name: 'The Main Room',
    capacity: '64 covers',
    description:
      'A single long room under a barrel-vaulted ceiling, with the hearth open along one wall so the fire is visible from every table. Banquettes down one side, loose tables down the other, and deliberately low light — bright enough to read the menu, dark enough that the fire is the brightest thing in the room.',
    image: img('1414235077428-338989a2e8c0'),
  },
  {
    id: 'e2',
    name: "The Chef's Table",
    capacity: '8 covers',
    description:
      'A single slab of elm set directly against the pass, close enough to hear the tickets called. Eight seats, one seating a night, and a menu decided that afternoon based on what came in. Zaynab cooks the last three courses in front of you and explains none of them unless asked.',
    image: img('1556910103-1c02745aae4d'),
  },
  {
    id: 'e3',
    name: 'Private Dining',
    capacity: '10–24 covers',
    description:
      'A separate room behind the still room, panelled in smoked oak, with its own service door so nothing crosses the main floor. Suitable for a board dinner or a wedding party, and the only room in the house where we will move the furniture.',
    image: img('1550966871-3ed3cdb5ed0c'),
  },
  {
    id: 'e4',
    name: 'The Terrace',
    capacity: '28 covers',
    description:
      'Covered, heated and open through the winter, looking down onto the wharf. The full menu is served here with one exception — the soufflé does not survive the walk, and we would rather say so than send a collapsed one.',
    image: img('1519167758481-83f550bb49b3'),
  },
  {
    id: 'e5',
    name: 'Events',
    capacity: 'Up to 120',
    description:
      'Full buyouts for standing receptions or seated dinners, with the hearth and the still room both working. We have done book launches, two nikahs and one wake. The kitchen scales; the room does not change.',
    image: img('1528605248644-14dd04022da1'),
  },
];

export const REVIEWS: Review[] = [
  {
    id: 'r1',
    quote:
      'The most serious cooking over fire in London right now, and the fact that you cannot get a drink is beside the point within about ten minutes of sitting down.',
    source: 'The Observer',
    attribution: 'Restaurant of the Year, shortlist',
  },
  {
    id: 'r2',
    quote:
      'I went expecting the alcohol-free thing to feel like a compromise. The tamarind old fashioned has more going on in it than most cocktail lists I have worked through this year.',
    source: 'CODE Hospitality',
    attribution: 'Bar programme of the month',
  },
  {
    id: 'r3',
    quote:
      'A biryani sealed at four in the afternoon and opened at your table, and a tomahawk aged forty-five days. Two dishes that would each carry a restaurant on their own.',
    source: 'Financial Times',
    attribution: 'How To Spend It',
  },
];

export const GALLERY: GalleryItem[] = [
  { id: 'g01', category: 'room', caption: 'The main room, before service', image: img('1414235077428-338989a2e8c0'), tall: true },
  { id: 'g02', category: 'kitchen', caption: 'Banking the coals', image: img('1556910103-1c02745aae4d') },
  { id: 'g03', category: 'food', caption: 'Forty-five days', image: img('1544025162-d76694265947') },
  { id: 'g04', category: 'bar', caption: 'The still room', image: img('1470124182917-cc6e71b22ecc'), tall: true },
  { id: 'g05', category: 'food', caption: 'The seal, unbroken', image: img('1601050690597-df0568f70950') },
  { id: 'g06', category: 'room', caption: 'Terrace, winter', image: img('1519167758481-83f550bb49b3') },
  { id: 'g07', category: 'kitchen', caption: 'The clay wall at 480°C', image: img('1585032226651-759b368d7246'), tall: true },
  { id: 'g08', category: 'food', caption: 'Landed this morning', image: img('1580476262798-bddd9f4b7369') },
  { id: 'g09', category: 'bar', caption: 'Ninety seconds of applewood', image: img('1536935338788-846bb9981813') },
  { id: 'g10', category: 'room', caption: "The chef's table", image: img('1552566626-52f8b828add9') },
  { id: 'g11', category: 'food', caption: 'Ratanjot, not tomato', image: img('1589302168068-964664d93dc0'), tall: true },
  { id: 'g12', category: 'kitchen', caption: 'The pass, mid-service', image: img('1517248135467-4c7edcad34c4') },
  { id: 'g13', category: 'bar', caption: 'Clarified until it pours clear', image: img('1595475207225-428b62bda831') },
  { id: 'g14', category: 'food', caption: 'Twenty-two minutes', image: img('1563729784474-d77dbb933a9e') },
  { id: 'g15', category: 'room', caption: 'Private dining, smoked oak', image: img('1550966871-3ed3cdb5ed0c'), tall: true },
  { id: 'g16', category: 'kitchen', caption: 'Hand-minced, hung on the skewer', image: img('1555939594-58d7cb561ad1') },
  { id: 'g17', category: 'bar', caption: 'Three weeks in charred oak', image: img('1514933651103-005eec06c04b') },
  { id: 'g18', category: 'food', caption: 'Carved at the table', image: img('1600891964092-4316c288032e') },
];

export const GALLERY_STRIP = GALLERY.slice(0, 7);

export const HOURS: DayHours[] = [
  { day: 'Monday', short: 'Mon', open: null, close: null, note: 'Closed' },
  { day: 'Tuesday', short: 'Tue', open: '17:30', close: '23:00' },
  { day: 'Wednesday', short: 'Wed', open: '17:30', close: '23:00' },
  { day: 'Thursday', short: 'Thu', open: '17:30', close: '23:30' },
  { day: 'Friday', short: 'Fri', open: '12:00', close: '00:00' },
  { day: 'Saturday', short: 'Sat', open: '12:00', close: '00:00' },
  { day: 'Sunday', short: 'Sun', open: '12:00', close: '22:00' },
];

export const SEATING_AREAS: SeatingArea[] = [
  {
    id: 's1',
    name: 'The Main Room',
    note: 'Under the vault, with the hearth in view.',
    minParty: 1,
    maxParty: 8,
    image: img('1414235077428-338989a2e8c0'),
  },
  {
    id: 's2',
    name: 'The Terrace',
    note: 'Covered and heated. Full menu except the soufflé.',
    minParty: 1,
    maxParty: 6,
    image: img('1519167758481-83f550bb49b3'),
  },
  {
    id: 's3',
    name: "The Chef's Table",
    note: 'One seating a night. Minimum four guests.',
    minParty: 4,
    maxParty: 8,
    image: img('1556910103-1c02745aae4d'),
  },
  {
    id: 's4',
    name: 'Private Dining',
    note: 'Behind the still room. Ten guests and above.',
    minParty: 10,
    maxParty: 24,
    image: img('1550966871-3ed3cdb5ed0c'),
  },
];

export const STORY_MILESTONES = [
  {
    id: 'm1',
    label: 'The three kitchens',
    heading: 'One hearth, feeding three ways',
    body: 'The room was built around a single fire. The tandoor wall draws off it, the grill sits open to it, and the sea station works cold beside it because the two need each other in a kitchen this size. Nothing was retrofitted — the building was gutted to the brick and the flue was the first thing designed.',
    image: img('1556910103-1c02745aae4d'),
  },
  {
    id: 'm2',
    label: 'Sourcing',
    heading: 'Named suppliers, or we do not serve it',
    body: 'Lamb comes from the Elwy Valley, fish from Brixham and Peterhead day boats, greens from two farms in Kent that we visit rather than phone. If a supplier cannot tell us the farm, we do not put it on the menu. This is not romance; it is the only way a kitchen can answer a guest honestly.',
    image: img('1466637574441-749b8f19452f'),
  },
  {
    id: 'm3',
    label: 'The dry-age programme',
    heading: 'Forty-five days, and a third of the weight gone',
    body: 'Our cabinet holds at 1°C and 82% humidity, and we age on the bone for forty-five days. Roughly a third of the weight leaves as water and another portion is trimmed away as crust. What is left is expensive because most of what we bought is now in the bin, and that is the honest explanation for the price.',
    image: img('1544025162-d76694265947'),
  },
  {
    id: 'm4',
    label: 'Certification',
    heading: 'HMC-certified, and the certificate is on the wall',
    body: 'Every piece of meat in this building is certified by the Halal Monitoring Committee and hand-slaughtered. The certificate is renewed annually, it hangs by the entrance, and a copy is available on request. We name the body because a claim without a named certifier is not a claim.',
    image: img('1517248135467-4c7edcad34c4'),
  },
];

export const DRINK_FAMILIES = [
  {
    id: 'f1',
    name: 'Clarified',
    technique: 'Milk-washed and filtered',
    description:
      'Juice is curdled with milk and warm acid, then filtered until the colour drops out and only weight, structure and aroma remain. It takes between twelve and eighteen hours and produces a drink that looks like water and does not taste like it.',
    image: img('1560512823-829485b8bf24'),
  },
  {
    id: 'f2',
    name: 'Fermented & Aged',
    technique: 'Wild ferment, cask rest',
    description:
      'Wild ferments started in-house and rested in charred oak for up to three weeks. This is the family that answers the objection about alcohol-free drinks having no depth — tannin and oxidation do most of what people credit to spirit.',
    image: img('1470124182917-cc6e71b22ecc'),
  },
  {
    id: 'f3',
    name: 'Fire & Smoke',
    technique: 'Charred, smoked, fat-washed',
    description:
      'Fruit blackened on the same grill the meat goes on, cold smoke run through a chamber for hours, and ghee fat-washing for a mouthfeel juice cannot reach on its own. The most technically demanding family on the list.',
    image: img('1536935338788-846bb9981813'),
  },
];

/** Today's hours, live from the schedule. */
export function todayHours(): DayHours {
  const idx = new Date().getDay(); // 0 = Sunday
  const map = [6, 0, 1, 2, 3, 4, 5];
  return HOURS[map[idx]];
}

export function isOpenNow(): boolean {
  const t = todayHours();
  if (!t.open || !t.close) return false;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = t.open.split(':').map(Number);
  const [ch, cm] = t.close.split(':').map(Number);
  const openM = oh * 60 + om;
  let closeM = ch * 60 + cm;
  if (closeM <= openM) closeM += 24 * 60;
  return mins >= openM && mins <= closeM;
}
