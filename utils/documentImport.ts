/**
 * Shared Word/text extraction for import modals across the app.
 */
export async function extractTextFromDocx(file: File): Promise<{ text: string; html: string }> {
  const mammoth = await import('mammoth');
  const buffer = await file.arrayBuffer();
  const [textResult, htmlResult] = await Promise.all([
    mammoth.extractRawText({ arrayBuffer: buffer }),
    mammoth.convertToHtml({ arrayBuffer: buffer }),
  ]);
  return {
    text: textResult.value || '',
    html: htmlResult.value || '',
  };
}

export function firstNonEmptyLine(text: string): string {
  return (
    text
      .split(/\n+/)
      .map((l) => l.trim())
      .find((l) => l.length > 0) || ''
  );
}

export function guessTitleFromText(raw: string, filename?: string): string {
  const first = firstNonEmptyLine(raw)
    .replace(/^#+\s*/, '')
    .replace(/^title[:\s-]*/i, '')
    .trim();
  if (first && first.length <= 120) return first;
  if (filename) {
    return filename
      .replace(/\.(docx|doc|txt|md|rtf)$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();
  }
  return 'Imported document';
}

export function splitListItems(block: string): string[] {
  return block
    .split(/\n+/)
    .map((l) => l.replace(/^[-*•]\s+/, '').replace(/^\d+[\.)]\s+/, '').trim())
    .filter(Boolean);
}

export type SectionMap = Record<string, string[]>;

/** Split text into buckets keyed by section aliases. */
export function bucketByHeadings(
  rawInput: string,
  sectionAliases: Record<string, string[]>
): { buckets: SectionMap; detected: string[]; preamble: string[] } {
  const raw = rawInput.replace(/\r\n/g, '\n').trim();
  const lines = raw.split('\n');
  const buckets: SectionMap = {};
  const detected = new Set<string>();
  const preamble: string[] = [];
  let current: string | null = null;

  const normalize = (line: string) =>
    line
      .replace(/^#+\s*/, '')
      .replace(/^\d+[\.)]\s*/, '')
      .replace(/^section\s+\d+[:.\s-]*/i, '')
      .replace(/^\d+\s+/, '')
      .replace(/[:.\s]+$/, '')
      .trim()
      .toLowerCase();

  const matchKey = (line: string): string | null => {
    const norm = normalize(line);
    if (!norm || norm.length > 80) return null;
    for (const [key, aliases] of Object.entries(sectionAliases)) {
      for (const a of aliases) {
        if (
          norm === a ||
          norm.startsWith(`${a} `) ||
          (norm.length < 48 && norm.includes(a))
        ) {
          return key;
        }
      }
    }
    return null;
  };

  for (const line of lines) {
    const key = matchKey(line.trim());
    if (key) {
      current = key;
      detected.add(key);
      if (!buckets[key]) buckets[key] = [];
      continue;
    }
    if (current) buckets[current].push(line);
    else if (line.trim()) preamble.push(line);
  }

  return { buckets, detected: Array.from(detected), preamble };
}

export function joinBucket(buckets: SectionMap, key: string): string {
  return (buckets[key] || []).join('\n').trim();
}

/** Preview metadata returned alongside entity-specific payload */
export type ImportPreviewMeta = {
  title: string;
  summary: string;
  detectedSections: string[];
  rawPreview: string;
};

export type DocumentImportResult<T> = ImportPreviewMeta & {
  payload: T;
};
