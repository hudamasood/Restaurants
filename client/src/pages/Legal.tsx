import { Navigate, useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { LineMask } from '@/components/motion/LineMask';
import { Reveal } from '@/components/motion/Reveal';
import { BRAND } from '@/data/brand';

const PAGES: Record<string, { title: string; intro: string; sections: { h: string; p: string }[] }> = {
  privacy: {
    title: 'Privacy',
    intro:
      'We collect the least we can get away with, keep it for as short a time as we can, and never sell it.',
    sections: [
      {
        h: 'What we collect',
        p: 'For a reservation: your name, email, phone number, party size and any dietary or accessibility notes you choose to give us. For an enquiry: your name, email and message. We do not run public accounts, so there is no password and no profile.',
      },
      {
        h: 'Why we collect it',
        p: 'To hold your table, to reach you if something changes, and to make sure the kitchen knows about an allergy before you sit down. Dietary notes are treated as health information and are seen only by the kitchen and the floor team on the night.',
      },
      {
        h: 'How long we keep it',
        p: 'Reservation records are kept for twenty-four months so we can recognise a returning guest and honour a stated allergy. Enquiry emails are kept for twelve months. After that both are deleted.',
      },
      {
        h: 'Who else sees it',
        p: 'Our booking database, our transactional email provider and our hosting provider — each contractually bound to process data only on our instruction. Nobody else. We do not sell data and we do not share it with advertisers.',
      },
      {
        h: 'Your rights',
        p: 'You can ask for a copy of what we hold, ask us to correct it, or ask us to delete it. Write to the address below and we will respond within thirty days.',
      },
      {
        h: 'Analytics',
        p: 'We measure page performance — load times and layout stability — without cookies and without tracking individuals across sites. There is no advertising pixel on this site.',
      },
    ],
  },
  accessibility: {
    title: 'Accessibility',
    intro:
      'This site targets WCAG 2.1 AA, and the building is step-free from the main entrance. Where we fall short, we would like to hear about it.',
    sections: [
      {
        h: 'Motion',
        p: 'Every animation on this site respects the operating system’s reduced-motion setting. There is also a visible toggle in the footer, so you can turn motion down without changing a system preference. With motion reduced, pinned sections become ordinary stacked content, sequences render a single frame, and the review carousel stops advancing on its own.',
      },
      {
        h: 'Keyboard',
        p: 'Every interactive element is reachable by keyboard and shows a visible focus ring. Overlays trap focus while open, return focus to the element that opened them, and close on Escape as well as the browser Back button.',
      },
      {
        h: 'Contrast and text',
        p: 'Every text-over-image pairing carries a gradient scrim and meets a 4.5:1 contrast ratio. Text resizes with the browser setting and the layout reflows to 320px without horizontal scrolling.',
      },
      {
        h: 'Screen readers',
        p: 'Decorative imagery is hidden from assistive technology. Text that is split into lines for animation is duplicated in an unfragmented, visually-hidden node so it is read as one continuous string.',
      },
      {
        h: 'In the building',
        p: 'Step-free access from the main entrance, an accessible WC on the ground floor, and two accessible parking bays on Wharfside Street. The chef’s table is reached by three steps; tell us when you book and we will seat you in the main room instead, with the same menu.',
      },
      {
        h: 'Tell us',
        p: 'If something on this site or in the building does not work for you, email us and we will fix it. We treat accessibility problems as bugs, not as feedback.',
      },
    ],
  },
};

export default function Legal() {
  const { page } = useParams<{ page: string }>();
  const content = page ? PAGES[page] : undefined;

  if (!content) return <Navigate to="/" replace />;

  return (
    <PageShell title={content.title} description={content.intro}>
      <div className="u-shell" style={{ paddingTop: 'calc(var(--nav-h) + 6rem)', paddingBottom: '7rem' }}>
        <Reveal y={0}>
          <p className="u-mono mb-7" style={{ color: 'var(--color-saffron)' }}>
            {content.title}
          </p>
        </Reveal>
        <LineMask text={content.intro} as="h1" className="u-display t-section mb-16" animateOnMount />

        <div className="grid gap-x-16 gap-y-12 lg:grid-cols-2">
          {content.sections.map((s, i) => (
            <Reveal key={s.h} delay={i * 0.05}>
              <div className="border-t pt-6" style={{ borderColor: 'var(--color-smoke)' }}>
                <h2 className="u-mono mb-4" style={{ color: 'var(--color-bone)' }}>
                  {s.h}
                </h2>
                <p style={{ color: 'var(--color-bone-dim)', lineHeight: 1.8, maxWidth: '52ch' }}>
                  {s.p}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16">
          <div className="border-t pt-8" style={{ borderColor: 'var(--color-smoke)' }}>
            <p className="u-mono mb-3" style={{ color: 'var(--color-bone-faint)' }}>
              Write to us
            </p>
            <address className="not-italic" style={{ color: 'var(--color-bone-dim)', lineHeight: 1.8 }}>
              {BRAND.name}
              <br />
              {BRAND.address.line1}, {BRAND.address.line2}
              <br />
              {BRAND.address.city} {BRAND.address.postcode}
              <br />
              <a href={`mailto:${BRAND.email}`} className="link-rule" style={{ color: 'var(--color-bone)' }}>
                {BRAND.email}
              </a>
            </address>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
