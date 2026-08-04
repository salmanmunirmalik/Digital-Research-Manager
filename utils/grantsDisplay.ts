/** Display helpers for Grants & Funding listings */

export type DeadlineUrgency = 'closing_soon' | 'upcoming' | 'rolling';

export const FUNDING_TYPE_OPTIONS = [
  { value: 'research_grant', label: 'Research grant' },
  { value: 'fellowship', label: 'Fellowship' },
  { value: 'seed', label: 'Seed / pilot' },
  { value: 'travel', label: 'Travel / mobility' },
  { value: 'other', label: 'Other' },
] as const;

export const CAREER_STAGE_OPTIONS = [
  { value: 'student', label: 'Student / trainee' },
  { value: 'postdoc', label: 'Postdoctoral' },
  { value: 'early_career', label: 'Early career' },
  { value: 'mid_career', label: 'Mid career' },
  { value: 'senior', label: 'Senior / established' },
  { value: 'any', label: 'Any stage' },
] as const;

const FUNDING_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  FUNDING_TYPE_OPTIONS.map((o) => [o.value, o.label])
);

const REASON_LABELS: Record<string, string> = {
  discipline_match: 'Discipline match',
  keyword_match: 'Keyword match',
  region_match: 'Region match',
  funding_type_match: 'Funding type match',
  career_stage_check: 'Career stage',
};

const currencySymbol = (currency?: string | null) => {
  const c = (currency || 'USD').toUpperCase();
  if (c === 'USD') return '$';
  if (c === 'EUR') return '€';
  if (c === 'GBP') return '£';
  return `${c} `;
};

const formatNumber = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);

export const fundingTypeLabel = (type?: string | null) => {
  if (!type) return 'Funding';
  return FUNDING_TYPE_LABELS[type] || type.replace(/_/g, ' ');
};

export const reasonLabel = (reason: string) =>
  REASON_LABELS[reason] || reason.replace(/_/g, ' ');

export const formatFundingAmount = (
  min?: number | null,
  max?: number | null,
  currency?: string | null
) => {
  const sym = currencySymbol(currency);
  const hasMin = min != null && !Number.isNaN(Number(min));
  const hasMax = max != null && !Number.isNaN(Number(max));
  if (!hasMin && !hasMax) return 'Amount not specified';
  if (hasMin && hasMax) {
    if (Number(min) === Number(max)) return `${sym}${formatNumber(Number(min))}`;
    return `${sym}${formatNumber(Number(min))} – ${sym}${formatNumber(Number(max))}`;
  }
  if (hasMax) return `Up to ${sym}${formatNumber(Number(max))}`;
  return `From ${sym}${formatNumber(Number(min))}`;
};

export const parseDeadlineDate = (deadline?: string | null): Date | null => {
  if (!deadline) return null;
  const match = String(deadline).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const d = new Date(deadline);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDeadlineLabel = (deadline?: string | null) => {
  const d = parseDeadlineDate(deadline);
  if (!d) return 'Rolling deadline';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const deadlineUrgency = (deadline?: string | null): DeadlineUrgency => {
  const d = parseDeadlineDate(deadline);
  if (!d) return 'rolling';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'upcoming';
  if (diffDays <= 14) return 'closing_soon';
  return 'upcoming';
};

export const deadlineUrgencyLabel = (urgency: DeadlineUrgency) => {
  if (urgency === 'closing_soon') return 'Closing soon';
  if (urgency === 'rolling') return 'Rolling';
  return 'Open';
};

export const isClosingWithinDays = (deadline: string | null | undefined, days: number) => {
  const d = parseDeadlineDate(deadline);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
};

export const careerStageLabel = (stage?: string | null) => {
  if (!stage) return '';
  const found = CAREER_STAGE_OPTIONS.find((o) => o.value === stage);
  return found?.label || stage;
};
