import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { DUR, EASE } from '@/motion/constants';
import { useMotionState } from '@/motion/guards';
import { useScrollDirection, useScrolledPast } from '@/motion/scroll';
import { useOverlay, useScrollLock, useEscape } from '@/app/overlay';
import { Wordmark } from './Wordmark';

const LINKS = [
  { to: '/menu', label: 'The Menu' },
  { to: '/still-room', label: 'Still Room' },
  { to: '/story', label: 'Story' },
  { to: '/experience', label: 'Rooms' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

export function Nav() {
  const location = useLocation();
  const { isTablet } = useMotionState();
  const { any: overlayOpen } = useOverlay();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const solid = useScrolledPast(
    typeof window !== 'undefined' ? window.innerHeight * 0.8 : 800,
  );
  const hiddenByScroll = useScrollDirection(
    typeof window !== 'undefined' ? window.innerHeight * 1.2 : 1200,
  );

  // Never hides while an overlay is open.
  const hidden = hiddenByScroll && !overlayOpen && !drawerOpen;

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header
        data-scrolled={solid}
        data-hidden={hidden}
        className="nav-shell fixed inset-x-0 top-0 z-[90]"
        style={{
          background: solid ? 'rgb(11 11 12 / 0.92)' : 'transparent',
          backdropFilter: solid && !isTablet ? 'blur(12px)' : undefined,
          borderBottom: `1px solid ${solid ? 'var(--color-smoke)' : 'transparent'}`,
          transitionProperty: 'transform, background-color, border-color, backdrop-filter',
          transitionDuration: `300ms, ${DUR.short}s, ${DUR.short}s, ${DUR.short}s`,
          transitionTimingFunction: 'var(--ease-house)',
        }}
      >
        <div
          className="u-shell flex items-center justify-between"
          style={{
            height: 'var(--nav-h)',
            transition: `height ${DUR.short}s var(--ease-house)`,
          }}
        >
          <Link to="/" aria-label={`${'Marrow & Hearth'} — home`} className="relative z-10">
            <Wordmark size="md" />
          </Link>

          {/* Desktop links */}
          <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className="u-mono link-rule">
                {({ isActive }) => (
                  <span
                    data-active={isActive}
                    className="link-rule"
                    style={{
                      color: isActive ? 'var(--color-bone)' : 'var(--color-bone-dim)',
                      transition: `color ${DUR.short}s var(--ease-house)`,
                    }}
                  >
                    {link.label}
                  </span>
                )}
              </NavLink>
            ))}
            <Link to="/reserve" className="btn btn--outline" style={{ padding: '0.9em 1.6em' }}>
              <span>Reserve</span>
            </Link>
          </nav>

          {/* Mobile toggle */}
          <button
            type="button"
            className="relative z-10 flex h-11 w-11 items-center justify-center lg:hidden"
            aria-expanded={drawerOpen}
            aria-controls="nav-drawer"
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            <MenuIcon open={drawerOpen} />
          </button>
        </div>
      </header>

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

/** Two 20px lines morphing to an X. Transform only, 300ms. */
function MenuIcon({ open }: { open: boolean }) {
  const line = {
    display: 'block',
    width: 22,
    height: 1,
    background: 'var(--color-bone)',
    transition: `transform 300ms var(--ease-house)`,
  } as const;

  return (
    <span className="relative block" style={{ width: 22, height: 12 }} aria-hidden="true">
      <motion.span
        style={{ ...line, position: 'absolute', top: 0 }}
        animate={{ y: open ? 5.5 : 0, rotate: open ? 45 : 0 }}
        transition={{ duration: 0.3, ease: EASE.house }}
      />
      <motion.span
        style={{ ...line, position: 'absolute', top: 11 }}
        animate={{ y: open ? -5.5 : 0, rotate: open ? -45 : 0 }}
        transition={{ duration: 0.3, ease: EASE.house }}
      />
    </span>
  );
}

function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { canAnimate } = useMotionState();
  useScrollLock(open, 'nav');
  useEscape(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="nav-drawer"
          className="fixed inset-0 z-[85] flex flex-col lg:hidden"
          style={{ background: 'var(--color-ink)' }}
          initial={canAnimate ? { clipPath: 'inset(100% 0 0 0)' } : { opacity: 0 }}
          animate={canAnimate ? { clipPath: 'inset(0% 0 0 0)' } : { opacity: 1 }}
          exit={canAnimate ? { clipPath: 'inset(100% 0 0 0)' } : { opacity: 0 }}
          transition={{
            duration: canAnimate ? DUR.short : DUR.micro,
            ease: EASE.house,
          }}
        >
          <div
            className="u-shell flex flex-1 flex-col justify-center gap-1"
            style={{ paddingTop: 'var(--nav-h)' }}
          >
            {LINKS.map((link, i) => (
              <span key={link.to} style={{ display: 'block', overflow: 'hidden' }}>
                <motion.span
                  style={{ display: 'block' }}
                  initial={canAnimate ? { y: '110%' } : { opacity: 0 }}
                  animate={canAnimate ? { y: '0%' } : { opacity: 1 }}
                  transition={{
                    duration: canAnimate ? DUR.base : DUR.micro,
                    delay: canAnimate ? 0.15 + i * 0.06 : 0,
                    ease: EASE.house,
                  }}
                >
                  <Link
                    to={link.to}
                    onClick={onClose}
                    className="u-display block py-2"
                    style={{ fontSize: 'clamp(2rem, 9vw, 3rem)', color: 'var(--color-bone)' }}
                  >
                    {link.label}
                  </Link>
                </motion.span>
              </span>
            ))}

            {/* RESERVE last, deliberately */}
            <motion.div
              className="pt-10"
              initial={canAnimate ? { opacity: 0, y: 12 } : { opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: canAnimate ? DUR.base : DUR.micro,
                delay: canAnimate ? 0.15 + LINKS.length * 0.06 : 0,
                ease: EASE.house,
              }}
            >
              <Link to="/reserve" onClick={onClose} className="btn btn--filled w-full">
                <span>Reserve a table</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
