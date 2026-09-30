import React from 'react';

export type PageAccent = 'sky' | 'amber' | 'emerald' | 'teal' | 'orange' | 'rose';

const ACCENT: Record<
  PageAccent,
  { wash: string; iconWell: string; ring: string; stat: string }
> = {
  sky: {
    wash: 'from-sky-50/95 via-white to-slate-50/80',
    iconWell: 'bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-sky-200/60',
    ring: 'ring-sky-200/60',
    stat: 'from-sky-50/80 to-white border-sky-100',
  },
  amber: {
    wash: 'from-amber-50/95 via-white to-slate-50/80',
    iconWell: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-200/60',
    ring: 'ring-amber-200/60',
    stat: 'from-amber-50/80 to-white border-amber-100',
  },
  emerald: {
    wash: 'from-emerald-50/90 via-white to-slate-50/80',
    iconWell: 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-200/60',
    ring: 'ring-emerald-200/60',
    stat: 'from-emerald-50/80 to-white border-emerald-100',
  },
  teal: {
    wash: 'from-teal-50/95 via-white to-slate-50/80',
    iconWell: 'bg-gradient-to-br from-teal-500 to-cyan-700 text-white shadow-teal-200/60',
    ring: 'ring-teal-200/60',
    stat: 'from-teal-50/80 to-white border-teal-100',
  },
  orange: {
    wash: 'from-orange-50/95 via-white to-slate-50/80',
    iconWell: 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-200/50',
    ring: 'ring-orange-200/60',
    stat: 'from-orange-50/80 to-white border-orange-100',
  },
  rose: {
    wash: 'from-rose-50/90 via-white to-slate-50/80',
    iconWell: 'bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-rose-200/50',
    ring: 'ring-rose-200/60',
    stat: 'from-rose-50/80 to-white border-rose-100',
  },
};

export interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  accent?: PageAccent;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/** Dashboard-style page chrome: soft tinted wash + optional gradient icon well. */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  accent = 'sky',
  icon,
  actions,
  children,
  className = '',
}) => {
  const theme = ACCENT[accent];

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-gradient-to-br ${theme.wash} px-5 py-5 sm:px-6 shadow-sm ring-1 ${theme.ring} ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          {icon ? (
            <div
              className={`p-2.5 rounded-xl shrink-0 shadow-md ${theme.iconWell}`}
              aria-hidden="true"
            >
              <span className="block w-5 h-5 [&>svg]:w-5 [&>svg]:h-5">{icon}</span>
            </div>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              {title}
            </h1>
            {subtitle ? (
              <div className="mt-1.5 text-[14px] text-slate-600 leading-relaxed">{subtitle}</div>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:pt-0.5">
            {actions}
          </div>
        ) : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
};

export interface PageStatProps {
  label: string;
  value: React.ReactNode;
  accent?: PageAccent;
  action?: React.ReactNode;
  className?: string;
}

/** Soft tinted metric tile — pairs with PageHeader accents. */
export const PageStat: React.FC<PageStatProps> = ({
  label,
  value,
  accent = 'sky',
  action,
  className = '',
}) => {
  const theme = ACCENT[accent];
  return (
    <div
      className={`bg-gradient-to-br ${theme.stat} border rounded-xl px-4 py-3 shadow-sm ${className}`}
    >
      <div className="text-[12px] text-slate-500">{label}</div>
      <div className="flex items-center justify-between gap-2 mt-0.5">
        <div className="text-xl font-semibold text-slate-900">{value}</div>
        {action}
      </div>
    </div>
  );
};

/** White/translucent content panel that sits under a PageHeader. */
export const PagePanel: React.FC<{
  children: React.ReactNode;
  className?: string;
  accent?: PageAccent;
  title?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ children, className = '', accent, title, action }) => {
  const ring = accent ? ACCENT[accent].ring : 'ring-slate-200/40';
  return (
    <div
      className={`bg-white/90 backdrop-blur-[2px] rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-sm ring-1 ${ring} ${className}`}
    >
      {title || action ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          {title ? (
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h2>
          ) : (
            <span />
          )}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
};

export default PageHeader;
