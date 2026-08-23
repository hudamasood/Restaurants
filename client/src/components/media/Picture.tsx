import { useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { DUR, EASE } from '@/motion/constants';

const WIDTHS = [400, 800, 1200, 1600, 2400];

export interface PictureProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  /** Hero images are eager + high priority; everything else lazy. */
  priority?: boolean;
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
 * Admin-uploaded images run the same transforms at request time and land on
 * the same contract, so this component never needs to know the difference.
 */
export function Picture({
  src,
  alt,
  className,
  style,
  priority = false,
  sizes = '100vw',
  ratio,
  objectPosition = 'center',
}: PictureProps) {
  const [loaded, setLoaded] = useState(false);

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
          transition: `opacity ${DUR.base}s var(--ease-house)`,
        }}
      />
      <motion.img
        src={url(1600)}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={1600}
        height={1067}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: DUR.base, ease: EASE.house as unknown as number[] }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition,
        }}
      />
    </div>
  );
}
