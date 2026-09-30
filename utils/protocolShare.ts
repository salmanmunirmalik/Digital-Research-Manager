/** Shareable protocol identity helpers */

export function protocolRefCode(id: string): string {
  const hex = String(id || '')
    .replace(/[^a-fA-F0-9]/g, '')
    .slice(0, 8)
    .toUpperCase();
  return hex ? `SOP-${hex}` : 'SOP-UNKNOWN';
}

export function protocolSharePath(id: string): string {
  return `/protocols/${encodeURIComponent(id)}`;
}

export function protocolShareUrl(id: string, origin = typeof window !== 'undefined' ? window.location.origin : ''): string {
  return `${origin}${protocolSharePath(id)}`;
}

/** Normalize YouTube watch / short / embed URLs to an embeddable URL */
export function youtubeEmbedUrl(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const url = raw.trim();
  if (!url) return null;

  if (/youtube\.com\/embed\//i.test(url)) {
    return url.split('?')[0];
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{6,})/i,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i,
  ];

  for (const re of patterns) {
    const m = url.match(re);
    if (m?.[1]) return `https://www.youtube.com/embed/${m[1]}`;
  }

  return null;
}

export function formatDurationMinutes(total?: number | null): string {
  const n = Number(total) || 0;
  if (n <= 0) return '—';
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
