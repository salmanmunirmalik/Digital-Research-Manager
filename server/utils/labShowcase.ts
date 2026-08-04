/**
 * Shared helpers for lab showcase / directory mapping.
 */
export const LOOKING_FOR_OPTIONS = [
  { id: 'collaborators', label: 'Collaborators' },
  { id: 'phd_students', label: 'PhD students' },
  { id: 'postdocs', label: 'Postdocs' },
  { id: 'co_pis', label: 'Co-PIs / joint grants' },
  { id: 'equipment', label: 'Equipment partners' },
  { id: 'industry', label: 'Industry partners' },
  { id: 'methods', label: 'Method exchange' },
] as const;

export const parseJsonList = (value: unknown): string[] => {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value !== 'string') return [];
  const raw = value.trim();
  if (!raw) return [];
  if (raw.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item)).filter(Boolean);
    } catch {
      /* fall through */
    }
  }
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
};

export const toJsonList = (value: unknown): string => JSON.stringify(parseJsonList(value));
