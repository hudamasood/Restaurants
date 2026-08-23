import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BRAND } from '@/data/brand';
import { HOURS, todayHours, isOpenNow } from '@/data/site';
import { DUR, EASE } from '@/motion/constants';
import { useMotionState } from '@/motion/guards';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Wordmark } from './Wordmark';

export function Footer() {
  const { preference, setPreference, systemReduced, canAnimate } = useMotionState();
  const today = todayHours();
  const open = isOpenNow();

  return (
    <footer
      className="relative overflow-hidden pt-20 pb-10 lg:pt-28"
      style={{ borderTop: '1px solid transparent' }}
    >
      {/* Hairline top rule draws left-to-right as the footer enters */}
      <motion.div
        className="absolute inset-x-0 top-0 origin-left"
        style={{ height: 1, background: 'var(--color-smoke)' }}
        initial={{ scaleX: canAnimate ? 0 : 1 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: '0px 0px -20% 0px' }}
        transition={{
          duration: canAnimate ? DUR.long : DUR.micro,
          ease: EASE.house as unknown as number[],
        }}
      />

      <div className="u-shell">
        <RevealGroup
          interval={0.09}
          className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4"
          margin="0px 0px -20% 0px"
        >
          {/* Hours */}
          <RevealItem>
            <h3 className="u-mono mb-6" style={{ color: 'var(--color-bone-faint)' }}>
              Hours
            </h3>
            <p className="u-mono mb-5 flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="inline-block rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  background: open ? 'var(--color-ok)' : 'var(--color-bone-ghost)',
                }}
              />
              <span style={{ color: open ? 'var(--color-bone)' : 'var(--color-bone-dim)' }}>
                {open ? 'Open now' : 'Closed'} · {today.short}
              </span>
            </p>
            <ul className="flex flex-col gap-2">
              {HOURS.map((h) => (
                <li
                  key={h.day}
                  className="u-num flex justify-between gap-4"
                  style={{
                    fontSize: '0.75rem',
                    color:
                      h.short === today.short ? 'var(--color-bone)' : 'var(--color-bone-dim)',
                  }}
                >
                  <span>{h.short}</span>
                  <span>{h.open ? `${h.open} — ${h.close}` : 'Closed'}</span>
                </li>
              ))}
            </ul>
          </RevealItem>

          {/* Find us */}
          <RevealItem>
            <h3 className="u-mono mb-6" style={{ color: 'var(--color-bone-faint)' }}>
              Find us
            </h3>
            <address
              className="not-italic"
              style={{ color: 'var(--color-bone-dim)', lineHeight: 1.8 }}
            >
              {BRAND.address.line1}
              <br />
              {BRAND.address.line2}
              <br />
              {BRAND.address.city} {BRAND.address.postcode}
            </address>
            <div className="mt-5 flex flex-col gap-2">
              <a href={`tel:${BRAND.phone.replace(/\s/g, '')}`} className="u-mono link-rule w-fit">
                {BRAND.phone}
              </a>
              <a href={`mailto:${BRAND.email}`} className="u-mono link-rule w-fit">
                {BRAND.email}
              </a>
            </div>
          </RevealItem>

          {/* Navigate */}
          <RevealItem>
            <h3 className="u-mono mb-6" style={{ color: 'var(--color-bone-faint)' }}>
              Navigate
            </h3>
            <ul className="flex flex-col gap-3">
              {[
                { to: '/menu', label: 'The Menu' },
                { to: '/still-room', label: 'The Still Room' },
                { to: '/story', label: 'Our Story' },
                { to: '/story/kitchen', label: 'The Kitchen' },
                { to: '/experience', label: 'Rooms & Occasions' },
                { to: '/gallery', label: 'Gallery' },
                { to: '/reserve', label: 'Reserve' },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="u-mono link-rule"
                    style={{ color: 'var(--color-bone-dim)' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </RevealItem>

          {/* Detail */}
          <RevealItem>
            <h3 className="u-mono mb-6" style={{ color: 'var(--color-bone-faint)' }}>
              Detail
            </h3>
            <ul className="mb-7 flex flex-col gap-3">
              {[
                { to: '/allergens', label: 'Allergens & Dietary' },
                { to: '/legal/privacy', label: 'Privacy' },
                { to: '/legal/accessibility', label: 'Accessibility' },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="u-mono link-rule"
                    style={{ color: 'var(--color-bone-dim)' }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p
              className="u-mono mb-2"
              style={{ color: 'var(--color-bone-faint)', letterSpacing: '0.14em' }}
            >
              Certified
            </p>
            <p style={{ color: 'var(--color-bone-dim)', fontSize: '0.8125rem', lineHeight: 1.6 }}>
              {BRAND.certification.body}
              <br />
              <span className="u-num" style={{ fontSize: '0.75rem' }}>
                {BRAND.certification.reference}
              </span>
            </p>

            {/* Visible motion toggle, independent of the OS setting */}
            <div className="mt-7">
              <p className="u-mono mb-3" style={{ color: 'var(--color-bone-faint)' }}>
                Motion
              </p>
              <div className="flex" style={{ border: '1px solid var(--color-smoke)' }}>
                {(['full', 'reduced'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPreference(p)}
                    aria-pressed={preference === p}
                    className="u-mono flex-1 px-3 py-2.5"
                    style={{
                      background: preference === p ? 'var(--color-ash-3)' : 'transparent',
                      color: preference === p ? 'var(--color-bone)' : 'var(--color-bone-faint)',
                      transition: `all ${DUR.short}s var(--ease-house)`,
                    }}
                  >
                    {p === 'full' ? 'On' : 'Reduced'}
                  </button>
                ))}
              </div>
              {systemReduced && (
                <p
                  className="u-mono mt-2.5"
                  style={{ color: 'var(--color-bone-faint)', letterSpacing: '0.1em' }}
                >
                  Following your system setting
                </p>
              )}
            </div>
          </RevealItem>
        </RevealGroup>

        {/* Wordmark last, +400ms */}
        <motion.div
          className="mt-20 flex flex-col gap-8 border-t pt-9 sm:flex-row sm:items-end sm:justify-between"
          style={{ borderColor: 'var(--color-smoke)' }}
          initial={{ opacity: canAnimate ? 0 : 1, y: canAnimate ? 16 : 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
          transition={{
            duration: canAnimate ? DUR.base : DUR.micro,
            delay: canAnimate ? 0.4 : 0,
            ease: EASE.house as unknown as number[],
          }}
        >
          <div>
            <Wordmark size="lg" />
            <p className="u-mono mt-4" style={{ color: 'var(--color-bone-faint)' }}>
              {BRAND.claim}
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:items-end">
            <ul className="flex gap-6">
              {BRAND.social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="u-mono link-rule"
                    style={{ color: 'var(--color-bone-dim)' }}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="u-mono" style={{ color: 'var(--color-bone-ghost)' }}>
              © {new Date().getFullYear()} {BRAND.name}
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
