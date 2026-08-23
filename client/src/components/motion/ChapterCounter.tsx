import { motion } from 'motion/react';
import { DUR, EASE } from '@/motion/constants';

/**
 * "03 / 08" — mono, tabular figures so the layout never shifts as it ticks.
 * The digits themselves are not animated; only the container fades in.
 */
export function ChapterCounter({
  current,
  total,
  className,
  tone = 'dim',
}: {
  current: number;
  total: number;
  className?: string;
  tone?: 'dim' | 'bone';
}) {
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <motion.div
      className={`u-num flex items-center gap-2 ${className ?? ''}`}
      style={{
        fontSize: 'var(--t-label)',
        letterSpacing: '0.18em',
        color: tone === 'bone' ? 'var(--color-bone)' : 'var(--color-bone-dim)',
      }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: DUR.base, ease: EASE.house }}
    >
      <span style={{ color: 'var(--color-bone)' }}>{pad(current)}</span>
      <span
        aria-hidden="true"
        style={{ width: 22, height: 1, background: 'var(--color-bone-ghost)' }}
      />
      <span>{pad(total)}</span>
    </motion.div>
  );
}
