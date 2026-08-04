import type { ReactElement } from 'react';

type PostedByProps = Readonly<{
  name?: string | null;
  className?: string;
}>;

export default function PostedBy({
  name = null,
  className = '',
}: PostedByProps): ReactElement | null {
  if (!name || !String(name).trim()) return null;
  return (
    <p className={`text-[12px] text-slate-500 ${className}`.trim()}>
      {'Posted by '}
      <span className="font-medium text-slate-700">{name.trim()}</span>
    </p>
  );
}
