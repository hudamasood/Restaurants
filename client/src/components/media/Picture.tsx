import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { DUR } from '@/motion/constants';

const WIDTHS = [400, 800, 1200, 1600, 2400];

export interface PictureProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  /** Hero images are eager + high priority; everything else lazy. */
  priority?: boolean;
  /**
   * Fetch immediately, but behind the LCP image.
   *
   * For a picture that is off-screen at load yet must be decoded before it is
   * revealed — a pinned stage the scroll arrives at with no time to spare.
   * Lazy loading starts the request only once the viewport is close, which on
   * a full-bleed stage means the placeholder is what the transition uncovers.
   * `fetchpriority=low` keeps it from queueing ahead of the hero.
   */
  eager?: boolean;
  sizes?: string;
  /** Intrinsic ratio, reserved so nothing shifts on load. */
  ratio?: string;
  objectPosition?: string;
}

/**
 * Reads the media manifest contract: srcset across five widths, an LQIP
 * placeholder, intrinsic dimensions reserved via aspect-ratio, and a
 * priority flag.
 *
 * The fade-in is a CSS transition on a plain <img> rather than a motion
 * value. An image is the one thing on the page that must never depend on an
 * animation frame to become visible — a JS-driven opacity that stalls leaves
 * the whole page black.
 *
 * Admin-uploaded images run the same transforms at request time and land on
 * the same contract, so this component never needs to know the difference.
 */
export function Picture({
  src,
  alt,
  className,
  style,
  priority = false,
  eager = false,
  sizes = '100vw',
  ratio,
  objectPosition = 'center',
}: PictureProps) {
  const [loaded, setLoaded] = useState(false);
  // An image that was already decoded at first paint should not fade at all.
  // Fading it means its visibility depends on a transition completing, and a
  // transition that never runs leaves the picture invisible.
  const [instant, setInstant] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  /**
   * A cached image is already `complete` before React attaches onLoad, so the
   * event never fires. Every warm-cache visit hit this. Check the element
   * directly on mount.
   */
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setInstant(true);
      setLoaded(true);
    }
  }, [src]);

  const url = (w: number, q = 78) => {
    const sep = src.includes('?') ? '&' : '?';
    return `${src}${sep}w=${w}&q=${q}&auto=format&fit=crop`;
  };

  const srcSet = WIDTHS.map((w) => `${url(w)} ${w}w`).join(', ');

  return (
    <div
      className={`relative overflow-hidden ${className ?? ''}`}
      style={{ aspectRatio: ratio, background: 'var(--color-ash)', ...style }}
    >
      {/* LQIP stand-in — a toned block, never a spinner */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(150deg, var(--color-ash-2), var(--color-ash))',
          opacity: loaded ? 0 : 1,
          transition: instant ? 'none' : `opacity ${DUR.base}s var(--ease-house)`,
        }}
      />
      <img
        ref={imgRef}
        src={url(1600)}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={1600}
        height={1067}
        loading={priority || eager ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : eager ? 'low' : 'auto'}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition,
          opacity: loaded ? 1 : 0,
          transition: instant ? 'none' : `opacity ${DUR.base}s var(--ease-house)`,
        }}
      />
    </div>
  );
}
