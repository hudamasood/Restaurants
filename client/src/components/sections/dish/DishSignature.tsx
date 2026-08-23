import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useTransform } from 'motion/react';
import { DUR, EASE, DEPTH } from '@/motion/constants';
import { useMotionState } from '@/motion/guards';
import { usePassProgress } from '@/motion/scroll';
import { Picture } from '@/components/media/Picture';
import { CurtainMask } from '@/components/motion/CurtainMask';
import type { Dish, MotionSignature } from '@/types';

/**
 * Eight dishes, eight distinct behaviours. A visitor who sees all eight never
 * sees the same trick twice — the single largest differentiator between this
 * and a template.
 *
 * The four signatures the spec assigns to canvas (turntable, risePour,
 * smokeClear, lidLift) are driven here by scroll-linked transforms over the
 * process stills. The moment real frame sequences and their sprite sheets
 * exist, `useSequenceFrames` in motion/scroll.ts drops in behind the same
 * component boundary without touching the page.
 */
export function DishSignature({ dish }: { dish: Dish }) {
  const signature = dish.motionSignature ?? 'macro';

  switch (signature) {
    case 'turntable':
      return <Turntable dish={dish} />;
    case 'macro':
      return <Macro dish={dish} />;
    case 'pan':
      return <Pan dish={dish} />;
    case 'lidLift':
      return <LidLift dish={dish} />;
    case 'build':
      return <Build dish={dish} />;
    case 'colourBleed':
      return <ColourBleed dish={dish} />;
    case 'risePour':
      return <RisePour dish={dish} />;
    case 'smokeClear':
      return <SmokeClear dish={dish} />;
    default:
      return <Macro dish={dish} />;
  }
}

export function signatureLabel(s: MotionSignature | undefined): string {
  const map: Record<MotionSignature, string> = {
    turntable: 'Turntable',
    macro: 'Macro',
    pan: 'Lateral pan',
    lidLift: 'Lid lift',
    build: 'Tiered build',
    colourBleed: 'Colour bleed',
    risePour: 'Rise & pour',
    smokeClear: 'Smoke clear',
  };
  return s ? map[s] : 'Macro';
}

/* ── turntable — large-format steak on a rotating base ───────────────── */
function Turntable({ dish }: { dish: Dish }) {
  const ref = useRef<HTMLDivElement>(null);
  const { progress, enabled } = usePassProgress(ref);

  const rotate = useTransform(progress, [0, 1], [-7, 7]);
  const scale = useTransform(progress, [0, 0.5, 1], [1.06, 1.0, 1.06]);

  return (
    <div ref={ref} className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
      <motion.div
        className="h-full w-full"
        style={enabled ? { rotate, scale, willChange: 'transform' } : undefined}
      >
        <Picture src={dish.media.primary} alt={dish.name} priority className="h-full w-full" sizes="100vw" />
      </motion.div>
    </div>
  );
}

/* ── macro — precious small plate. Restraint is the point. ───────────── */
function Macro({ dish }: { dish: Dish }) {
  const ref = useRef<HTMLDivElement>(null);
  const { progress, enabled } = usePassProgress(ref);
  const scale = useTransform(progress, [0, 0.6, 1], [1.3, 1.0, 1.0]);

  return (
    <div ref={ref} className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
      <motion.div className="h-full w-full" style={enabled ? { scale, willChange: 'transform' } : undefined}>
        <Picture src={dish.media.primary} alt={dish.name} priority className="h-full w-full" sizes="100vw" />
      </motion.div>
    </div>
  );
}

/* ── pan — long-format roast. Bounded, never page-level hijack. ──────── */
function Pan({ dish }: { dish: Dish }) {
  const ref = useRef<HTMLDivElement>(null);
  const { progress, enabled } = usePassProgress(ref);
  const { isMobile } = useMotionState();
  const x = useTransform(progress, [0, 1], ['0%', '-38%']);

  // Mobile: a native overflow-x swipe rather than a scroll-driven pan.
  if (isMobile) {
    return (
      <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <div style={{ width: '190%', aspectRatio: '32/9' }}>
          <Picture src={dish.media.primary} alt={dish.name} priority className="h-full w-full" sizes="190vw" />
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative overflow-hidden" style={{ aspectRatio: '21/9' }}>
      <motion.div
        style={{ width: '150%', height: '100%', ...(enabled ? { x, willChange: 'transform' } : {}) }}
      >
        <Picture src={dish.media.primary} alt={dish.name} priority className="h-full w-full" sizes="150vw" />
      </motion.div>
    </div>
  );
}

/* ── lidLift — sealed vessel, steam on its own track ─────────────────── */
function LidLift({ dish }: { dish: Dish }) {
  const ref = useRef<HTMLDivElement>(null);
  const { progress, enabled } = usePassProgress(ref);
  const frames = [dish.media.primary, ...(dish.media.process ?? [])].slice(0, 3);

  const [frame, setFrame] = useState(0);
  useMotionValueEvent(progress, 'change', (p) => {
    const i = Math.min(frames.length - 1, Math.floor(p * frames.length));
    setFrame(i);
  });

  // The steam layer is composited separately at DEPTH.far, so it drifts on
  // its own track rather than moving with the vessel.
  const steamY = useTransform(progress, [0, 1], ['10%', `${DEPTH.far}%`]);
  const steamOpacity = useTransform(progress, [0.2, 0.5, 0.9], [0, 0.55, 0]);

  return (
    <div ref={ref} className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
      {frames.map((src, i) => (
        <motion.div
          key={src}
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: frame === i ? 1 : 0 }}
          transition={{ duration: 0.7, ease: EASE.house }}
        >
          <Picture src={src} alt={i === 0 ? dish.name : ''} priority={i === 0} className="h-full w-full" sizes="100vw" />
        </motion.div>
      ))}

      {enabled && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-2/3"
          style={{
            y: steamY,
            opacity: steamOpacity,
            background:
              'radial-gradient(60% 70% at 50% 80%, rgb(233 227 215 / 0.5), transparent 70%)',
            filter: 'blur(18px)',
          }}
        />
      )}
    </div>
  );
}

/* ── build — tiers entering bottom-to-top at 80ms stagger ────────────── */
function Build({ dish }: { dish: Dish }) {
  const tiers = [dish.media.primary, ...(dish.media.process ?? [])].slice(0, 3);

  return (
    <div className="relative" style={{ aspectRatio: '4/3' }}>
      {/* Reversed so the bottom tier lands first. */}
      {[...tiers].reverse().map((src, i) => (
        <CurtainMask
          key={src}
          from="top"
          delay={i * 0.08}
          className="absolute inset-0"
          margin="0px 0px -15% 0px"
        >
          <Picture
            src={src}
            alt={i === tiers.length - 1 ? dish.name : ''}
            className="h-full w-full"
            sizes="100vw"
            priority={i === 0}
          />
        </CurtainMask>
      ))}
    </div>
  );
}

/* ── colourBleed — the page itself warms while the dish is in view ───── */
function ColourBleed({ dish }: { dish: Dish }) {
  const ref = useRef<HTMLDivElement>(null);
  const { progress, enabled } = usePassProgress(ref);

  useMotionValueEvent(progress, 'change', (p) => {
    if (!enabled) return;
    // A triangular ramp: warm on the way in, cool on the way out.
    const t = 1 - Math.abs(p - 0.5) * 2;
    const mix = Math.max(0, Math.min(1, t));
    document.documentElement.style.setProperty(
      '--accent-live',
      `color-mix(in srgb, var(--color-ember) ${Math.round(mix * 100)}%, var(--color-saffron))`,
    );
  });

  useEffect(() => {
    return () => {
      document.documentElement.style.setProperty('--accent-live', 'var(--color-saffron)');
    };
  }, []);

  const scale = useTransform(progress, [0, 1], [1.08, 1]);

  return (
    <div ref={ref} className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
      <motion.div className="h-full w-full" style={enabled ? { scale } : undefined}>
        <Picture src={dish.media.primary} alt={dish.name} priority className="h-full w-full" sizes="100vw" />
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'var(--accent-live)',
          mixBlendMode: 'overlay',
          opacity: useTransform(progress, [0, 0.5, 1], [0, 0.22, 0]),
        }}
      />
    </div>
  );
}

/* ── risePour — scroll-scrubbed rise, pour on hover or tap ───────────── */
function RisePour({ dish }: { dish: Dish }) {
  const ref = useRef<HTMLDivElement>(null);
  const { progress, enabled } = usePassProgress(ref);
  const [poured, setPoured] = useState(false);
  const { isTouch } = useMotionState();

  // The rise: the dish grows out of the dish, clipped from the base.
  const clip = useTransform(progress, [0.1, 0.6], ['inset(38% 0 0 0)', 'inset(0% 0 0 0)']);
  const scale = useTransform(progress, [0.1, 0.6], [1.12, 1]);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden"
      style={{ aspectRatio: '4/3' }}
      onMouseEnter={() => !isTouch && setPoured(true)}
      onMouseLeave={() => !isTouch && setPoured(false)}
      onClick={() => isTouch && setPoured((v) => !v)}
    >
      <motion.div
        className="h-full w-full"
        style={enabled ? { clipPath: clip, scale, willChange: 'clip-path, transform' } : undefined}
      >
        <Picture src={dish.media.primary} alt={dish.name} priority className="h-full w-full" sizes="100vw" />
      </motion.div>

      {/* The pour */}
      {dish.media.process?.[0] && (
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: poured ? 1 : 0 }}
          transition={{ duration: DUR.base, ease: EASE.house }}
        >
          <Picture src={dish.media.process[0]} alt="" className="h-full w-full" sizes="100vw" />
        </motion.div>
      )}

      <div className="pointer-events-none absolute bottom-5 left-5">
        <span className="u-mono" style={{ color: 'var(--color-bone-dim)' }}>
          {isTouch ? 'Tap to pour' : 'Hover to pour'}
        </span>
      </div>
    </div>
  );
}

/* ── smokeClear — dome lift, blur resolving on the glass ─────────────── */
function SmokeClear({ dish }: { dish: Dish }) {
  const ref = useRef<HTMLDivElement>(null);
  const { progress, enabled } = usePassProgress(ref);

  const blur = useTransform(progress, [0.15, 0.65], [8, 0]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  const smokeOpacity = useTransform(progress, [0.1, 0.4, 0.75], [0.85, 0.5, 0]);
  const smokeY = useTransform(progress, [0, 1], ['0%', '-40%']);

  return (
    <div ref={ref} className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
      <motion.div className="h-full w-full" style={enabled ? { filter } : undefined}>
        <Picture src={dish.media.primary} alt={dish.name} priority className="h-full w-full" sizes="100vw" />
      </motion.div>

      {enabled && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: smokeOpacity,
            y: smokeY,
            background:
              'radial-gradient(70% 60% at 50% 55%, rgb(233 227 215 / 0.42), transparent 72%)',
            filter: 'blur(24px)',
          }}
        />
      )}
    </div>
  );
}
