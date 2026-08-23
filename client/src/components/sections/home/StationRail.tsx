import { useCallback, useEffect, useRef, useState } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { Link } from 'react-router-dom';
import { DUR, EASE } from '@/motion/constants';
import { useMotionState } from '@/motion/guards';
import { StickyStage } from '@/components/motion/StickyStage';
import { Picture } from '@/components/media/Picture';
import { LineMaskControlled } from '@/components/motion/LineMask';
import { CursorTrail } from '@/components/motion/CursorTrail';
import { STATIONS } from '@/data/menu';

const LAST = STATIONS.length - 1;

/**
 * Two input modes sharing one continuous MotionValue.
 *
 * Scroll mode derives `station` from the section's progress. Drag mode
 * suspends that derivation and follows pointer Y. On release the value
 * settles to the nearest station and the page scroll position is set to
 * match — the modes must never diverge, because the commonest bug in this
 * pattern is releasing a drag, then scrolling, and having the imagery jump
 * backwards.
 */
export function StationRail() {
  return (
    <StickyStage
      id="stations"
      height={200}
      heightTablet={150}
      mobile={<RailMobile />}
      className="relative"
    >
      {(progress, enabled) => <RailStage progress={progress} enabled={enabled} />}
    </StickyStage>
  );
}

function RailStage({ progress, enabled }: { progress: MotionValue<number>; enabled: boolean }) {
  const station = useMotionValue(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [settled, setSettled] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const { canAnimate, isTablet, isTouch } = useMotionState();

  const draggable = canAnimate && !isTouch && !isTablet;

  // Scroll mode — suspended while dragging.
  useMotionValueEvent(progress, 'change', (p) => {
    if (dragging) return;
    station.set(Math.max(0, Math.min(LAST, p * LAST * 1.0001)));
  });

  useMotionValueEvent(station, 'change', (v) => {
    const nearest = Math.round(v);
    setSettled((prev) => (prev === nearest ? prev : nearest));
  });

  const applyPointer = useCallback(
    (clientY: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const ratio = (clientY - rect.top) / rect.height;
      station.set(Math.max(0, Math.min(LAST, ratio * LAST)));
    },
    [station],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (!draggable) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(true);
    applyPointer(e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    applyPointer(e.clientY);
  };

  const onPointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);

    const target = Math.round(station.get());
    animate(station, target, {
      duration: DUR.base,
      ease: EASE.house as unknown as number[],
      onComplete: () => {
        // Re-sync the page scroll so the two modes never diverge.
        const section = sectionRef.current?.closest('.stage-track') as HTMLElement | null;
        if (!section) return;
        const top = section.offsetTop;
        const travel = section.offsetHeight - window.innerHeight;
        window.scrollTo({ top: top + (target / LAST) * travel });
      },
    });
  }, [dragging, station]);

  useEffect(() => {
    if (!dragging) return;
    const up = () => onPointerUp();
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [dragging, onPointerUp]);

  const indicatorY = useTransform(station, [0, LAST], ['0%', '100%']);
  const active = STATIONS[settled];

  return (
    <div ref={sectionRef} className="u-grain relative h-full w-full overflow-hidden">
      {/* Stacked station imagery — opacity from distance, so a mid-drag
          position shows a genuine blend of two stations. */}
      {STATIONS.map((s, i) => (
        <StationImage key={s.id} src={s.image} index={i} station={station} enabled={enabled} />
      ))}

      <div className="u-scrim-left" />

      <div className="relative z-10 flex h-full items-center">
        <div className="u-shell flex w-full items-center gap-10 lg:gap-20">
          {/* The rail */}
          <div className="flex shrink-0 items-stretch gap-5 lg:gap-8">
            <div
              ref={trackRef}
              className="relative"
              style={{
                width: 2,
                height: 'min(46vh, 340px)',
                background: 'var(--color-smoke)',
                cursor: draggable ? (dragging ? 'grabbing' : 'grab') : 'default',
                touchAction: 'none',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              role={draggable ? 'slider' : undefined}
              aria-label={draggable ? 'Station' : undefined}
              aria-valuemin={draggable ? 1 : undefined}
              aria-valuemax={draggable ? STATIONS.length : undefined}
              aria-valuenow={draggable ? settled + 1 : undefined}
              aria-valuetext={draggable ? active.name : undefined}
              tabIndex={draggable ? 0 : undefined}
              onKeyDown={(e) => {
                if (!draggable) return;
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                  animate(station, Math.min(LAST, settled + 1), { duration: DUR.short });
                }
                if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                  animate(station, Math.max(0, settled - 1), { duration: DUR.short });
                }
              }}
            >
              {/* Indicator — the section's single saffron use */}
              <motion.span
                className="absolute"
                style={{
                  left: -2,
                  top: 0,
                  width: 6,
                  height: '22%',
                  background: 'var(--color-saffron)',
                  y: indicatorY,
                  translateY: '-0%',
                  willChange: 'transform',
                }}
              >
                <motion.span
                  className="absolute inset-0"
                  animate={{ opacity: dragging ? 0.35 : 0 }}
                  style={{
                    background: 'var(--color-saffron)',
                    filter: 'blur(8px)',
                  }}
                  transition={{ duration: DUR.short }}
                />
              </motion.span>
            </div>

            {/* Labels */}
            <ul className="flex flex-col justify-between py-1">
              {STATIONS.map((s, i) => (
                <li key={s.id}>
                  <Link
                    to={`/menu?station=${s.id}`}
                    className="u-mono block whitespace-nowrap py-1"
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(i)}
                    onBlur={() => setHovered(null)}
                    style={{
                      color: settled === i ? 'var(--color-bone)' : 'var(--color-bone-faint)',
                      opacity: settled === i ? 1 : 0.55,
                      transition: `all ${DUR.short}s var(--ease-house)`,
                    }}
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Active station copy */}
          <div className="min-w-0 flex-1">
            <p className="u-mono mb-5" style={{ color: 'var(--color-bone-faint)' }}>
              {String(settled + 1).padStart(2, '0')} / {String(STATIONS.length).padStart(2, '0')}
            </p>

            <div key={active.id}>
              {/* Line masks look broken mid-drag, so during a drag this is
                  opacity only and the mask runs on settle. */}
              {dragging ? (
                <h2
                  className="u-display mb-5"
                  style={{ fontSize: 'var(--t-section)', opacity: 0.85 }}
                >
                  {active.name}
                </h2>
              ) : (
                <LineMaskControlled
                  text={active.name}
                  state="in"
                  className="u-display mb-5"
                  key={active.id}
                />
              )}
              <p
                className="u-measure mb-8"
                style={{ color: 'var(--color-bone-dim)', maxWidth: '46ch' }}
              >
                {active.description}
              </p>
            </div>

            <Link to={`/menu?station=${active.id}`} className="btn btn--ghost">
              <span>See the {active.name.toLowerCase()} dishes</span>
            </Link>

            {draggable && (
              <p
                className="u-mono mt-10"
                style={{ color: 'var(--color-bone-ghost)', letterSpacing: '0.14em' }}
              >
                Drag the rail, or keep scrolling
              </p>
            )}
          </div>
        </div>
      </div>

      <CursorTrail
        images={hovered !== null ? STATIONS[hovered].thumbnails : []}
        active={hovered !== null && !dragging}
      />
    </div>
  );
}

function StationImage({
  src,
  index,
  station,
  enabled,
}: {
  src: string;
  index: number;
  station: MotionValue<number>;
  enabled: boolean;
}) {
  // Opacity falls off with distance, so two stations genuinely blend mid-drag.
  const opacity = useTransform(station, (v) => Math.max(0, 1 - Math.abs(v - index)));

  return (
    <motion.div className="absolute inset-0" style={{ opacity: enabled ? opacity : index === 0 ? 1 : 0 }}>
      <Picture src={src} alt="" className="h-full w-full" sizes="100vw" objectPosition="center" />
    </motion.div>
  );
}

/**
 * Mobile: a horizontal sticky tab bar and a full-bleed scroll-snap carousel,
 * with tab state bound to carousel position. Genuinely better on touch than
 * a drag target would be.
 */
function RailMobile() {
  const [index, setIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIndex(Math.max(0, Math.min(LAST, i)));
  };

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="relative" style={{ height: '100svh' }}>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex h-full snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {STATIONS.map((s) => (
          <div key={s.id} className="relative h-full w-full shrink-0 snap-center">
            <Picture src={s.image} alt="" className="h-full w-full" sizes="100vw" />
            <div className="u-scrim" />
            <div className="absolute inset-x-0 bottom-0 pb-32">
              <div className="u-shell">
                <h2 className="u-display mb-4" style={{ fontSize: 'var(--t-section)' }}>
                  {s.name}
                </h2>
                <p style={{ color: 'var(--color-bone-dim)' }}>{s.description}</p>
                <Link to={`/menu?station=${s.id}`} className="btn btn--ghost mt-5">
                  <span>See the dishes</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky tab bar */}
      <div className="absolute inset-x-0 bottom-0 pb-7">
        <div className="u-shell flex gap-2">
          {STATIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              className="u-mono flex-1 py-3"
              aria-current={index === i}
              style={{
                borderTop: `1px solid ${index === i ? 'var(--color-saffron)' : 'var(--color-smoke)'}`,
                color: index === i ? 'var(--color-bone)' : 'var(--color-bone-faint)',
                transition: `all ${DUR.short}s var(--ease-house)`,
                fontSize: '0.5625rem',
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
