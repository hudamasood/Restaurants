import { Link } from 'react-router-dom';
import { Picture } from '@/components/media/Picture';
import { Token } from '@/components/primitives/Button';
import { price, dietaryTokens } from '@/lib/format';
import type { Dish } from '@/types';

/**
 * Used by DishGrid, OrderGrid and PairedDrink through a variant prop, rather
 * than being forked three ways.
 *
 * Hover: image scales 1.04, the price slides in from the right, and a
 * hairline rule draws under the name. No shadow lift, no border glow, no card
 * translate — those three are the default "AI website" hover and all wrong
 * for this register.
 */
export function DishCard({
  dish,
  variant = 'grid',
  onQuickView,
}: {
  dish: Dish;
  variant?: 'grid' | 'compact' | 'drink';
  onQuickView?: (dish: Dish) => void;
}) {
  const tokens = dietaryTokens(dish.dietary);
  const isDrink = variant === 'drink';

  const body = (
    <>
      <div className="relative overflow-hidden">
        <Picture
          src={dish.media.primary}
          alt={dish.name}
          ratio={isDrink ? '4/5' : '3/4'}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="w-full transition-transform duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
        />
        {dish.isSignature && (
          <span className="absolute left-3 top-3">
            <Token tone="signature">Signature</Token>
          </span>
        )}
      </div>

      <div className="pt-5">
        <h3
          className="u-display relative mb-2 inline-block"
          style={{ fontSize: 'var(--t-dish)', lineHeight: 1.2 }}
        >
          {dish.name}
          <span
            aria-hidden="true"
            className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
            style={{ background: 'var(--color-bone-ghost)' }}
          />
        </h3>

        <p
          className="mb-4"
          style={{
            color: 'var(--color-bone-dim)',
            fontSize: '0.875rem',
            lineHeight: 1.55,
            // Drink cards need two lines where dish cards need one — the
            // technique in the copy is what carries the price.
            display: '-webkit-box',
            WebkitLineClamp: isDrink ? 3 : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {dish.description}
        </p>

        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {tokens.map((t) => (
              <Token key={t}>{t}</Token>
            ))}
            {dish.isShared && <Token tone="share">To share</Token>}
          </div>

          <span
            className="u-num shrink-0 translate-x-2 opacity-70 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
            style={{ color: 'var(--color-bone)', fontSize: '0.875rem' }}
          >
            {price(dish.price)}
          </span>
        </div>
      </div>
    </>
  );

  // Signature cards bypass quick-view for the full chapter page.
  if (dish.isSignature) {
    return (
      <Link to={`/menu/${dish.slug}`} className="group block">
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onQuickView?.(dish)}
      className="group block w-full text-left"
    >
      {body}
    </button>
  );
}

export function DishCardSkeleton() {
  return (
    <div>
      <div className="skeleton w-full" style={{ aspectRatio: '3/4' }} />
      <div className="pt-5">
        <div className="skeleton mb-3" style={{ height: 20, width: '70%' }} />
        <div className="skeleton mb-2" style={{ height: 12, width: '100%' }} />
        <div className="skeleton" style={{ height: 12, width: '45%' }} />
      </div>
    </div>
  );
}
