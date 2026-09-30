/**
 * Shared interest / expertise overlap helpers for grants, networking, and marketplace.
 */

export const parseInterestList = (value: unknown): string[] => {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) {
    return value.map(String).map((s) => s.trim()).filter(Boolean);
  }
  const raw = String(value).trim();
  if (!raw) return [];
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((s) => s.trim()).filter(Boolean);
      }
    } catch {
      /* fall through */
    }
  }
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
};

export const normalizeInterestList = (items: string[] = []): string[] =>
  items.map((item) => item.trim().toLowerCase()).filter(Boolean);

/** True if two tags are equal or one contains the other (after normalize). */
export const tagsLooselyMatch = (a: string, b: string): boolean => {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 3 && b.includes(a)) return true;
  if (b.length >= 3 && a.includes(b)) return true;
  return false;
};

/**
 * Overlap in [0, 1]: shared / max(list sizes).
 * Uses loose substring matching so "cancer biology" ≈ "cancer".
 */
export const computeOverlapScore = (left: string[], right: string[]): number => {
  const a = normalizeInterestList(left);
  const b = normalizeInterestList(right);
  if (a.length === 0 || b.length === 0) return 0;

  const shared = a.filter((av) => b.some((bv) => tagsLooselyMatch(av, bv)));
  if (shared.length === 0) return 0;
  return shared.length / Math.max(a.length, b.length);
};

/** 0–100 score for ranking directories against a viewer's interests. */
export const softMatchScore = (viewerInterests: string[], candidateTags: string[]): number => {
  const overlap = computeOverlapScore(viewerInterests, candidateTags);
  return Math.round(overlap * 10000) / 100;
};

export const buildInterestMatchReasons = (
  viewerInterests: string[],
  candidateTags: string[]
): string[] => {
  const reasons: string[] = [];
  if (computeOverlapScore(viewerInterests, candidateTags) > 0) {
    reasons.push('interest_match');
  }
  return reasons;
};

export const toInterestJson = (items: string[] = []): string =>
  JSON.stringify(
    [...new Set(items.map((s) => s.trim()).filter(Boolean))]
  );
