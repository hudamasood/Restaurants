import { BRAND } from '@/data/brand';

/**
 * Every occurrence of the name routes through here and through the BRAND
 * constant, so locking or changing the name is a one-line edit rather than a
 * search across the component tree.
 */
export function Wordmark({
  size = 'md',
  tone = 'bone',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'bone' | 'ink' | 'dim';
  className?: string;
}) {
  const scale = {
    sm: 'clamp(0.75rem, 1.1vw, 0.875rem)',
    md: 'clamp(0.875rem, 1.4vw, 1.0625rem)',
    lg: 'clamp(1.25rem, 3vw, 2rem)',
  }[size];

  const colour = {
    bone: 'var(--color-bone)',
    ink: 'var(--color-ink)',
    dim: 'var(--color-bone-dim)',
  }[tone];

  return (
    <span
      className={`u-display block whitespace-nowrap ${className ?? ''}`}
      style={{
        fontSize: scale,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: colour,
        lineHeight: 1,
      }}
    >
      {BRAND.nameShort}
    </span>
  );
}
