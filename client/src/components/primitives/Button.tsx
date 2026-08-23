import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

type Variant = 'filled' | 'outline' | 'ghost' | 'link';

interface Base {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  full?: boolean;
}

interface AsLink extends Base {
  to: string;
  onClick?: never;
  type?: never;
  disabled?: never;
}

interface AsButton extends Base {
  to?: never;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function Button({
  children,
  variant = 'outline',
  className,
  full,
  ...rest
}: AsLink | AsButton) {
  const cls = `btn btn--${variant} ${full ? 'w-full' : ''} ${className ?? ''}`;

  if ('to' in rest && rest.to) {
    return (
      <Link to={rest.to} className={cls}>
        <span>{children}</span>
      </Link>
    );
  }

  const { onClick, type = 'button', disabled } = rest as AsButton;
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      <span>{children}</span>
    </button>
  );
}

export function Token({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'signature' | 'share';
}) {
  const mod = tone === 'signature' ? 'tok--sig' : tone === 'share' ? 'tok--share' : '';
  return <span className={`tok ${mod}`}>{children}</span>;
}
