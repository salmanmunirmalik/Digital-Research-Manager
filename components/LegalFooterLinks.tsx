import React from 'react';
import { Link } from 'react-router-dom';

type LegalFooterLinksProps = {
  readonly variant?: 'dark' | 'light' | 'muted';
  readonly className?: string;
};

function linkClassFor(variant: 'dark' | 'light' | 'muted'): string {
  if (variant === 'dark') return 'text-slate-400 hover:text-white';
  if (variant === 'muted') return 'text-gray-500 hover:text-indigo-600';
  return 'text-slate-500 hover:text-slate-800';
}

/**
 * Compact legal footer: Privacy + Terms only.
 * Cookie policy, preferences, and rights live under Privacy.
 */
function LegalFooterLinks({
  variant = 'light',
  className = ''
}: LegalFooterLinksProps): React.ReactElement {
  const linkClass = `transition-colors ${linkClassFor(variant)}`;

  return (
    <nav className={`inline-flex flex-wrap items-center gap-x-4 gap-y-2 text-xs ${className}`} aria-label="Legal">
      <Link to="/privacy" className={linkClass}>
        {'Privacy'}
      </Link>
      <Link to="/terms" className={linkClass}>
        {'Terms'}
      </Link>
    </nav>
  );
}

export default LegalFooterLinks;
