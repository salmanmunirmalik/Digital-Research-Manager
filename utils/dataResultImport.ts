import type { DataResultFormValues } from '../components/DataResultForm';
import {
  bucketByHeadings,
  guessTitleFromText,
  joinBucket,
  type DocumentImportResult,
} from './documentImport';

const ALIASES: Record<string, string[]> = {
  summary: ['summary', 'abstract', 'overview'],
  description: ['description', 'background', 'introduction', 'context'],
  methodology: ['methodology', 'methods', 'method', 'procedure', 'experimental'],
  results: ['results', 'findings', 'data', 'outcomes'],
  conclusions: ['conclusions', 'conclusion', 'discussion', 'interpretation'],
};

export function smartParseDataResultText(
  rawInput: string,
  opts?: { filename?: string }
): DocumentImportResult<Partial<DataResultFormValues>> {
  const raw = rawInput.trim();
  const { buckets, detected, preamble } = bucketByHeadings(raw, ALIASES);
  const title = guessTitleFromText(raw, opts?.filename);
  const summary =
    joinBucket(buckets, 'summary') ||
    joinBucket(buckets, 'description').split('\n')[0] ||
    preamble.slice(1).join(' ').slice(0, 280) ||
    `Imported from ${opts?.filename || 'pasted text'}`;

  const bodyFallback = preamble.length > 1 ? preamble.slice(1).join('\n').trim() : raw;

  const payload: Partial<DataResultFormValues> = {
    title,
    type: 'document',
    category: 'other',
    summary: summary.slice(0, 500),
    description: joinBucket(buckets, 'description') || bodyFallback.slice(0, 2000),
    methodology: joinBucket(buckets, 'methodology'),
    results: joinBucket(buckets, 'results') || (!detected.length ? bodyFallback : ''),
    conclusions: joinBucket(buckets, 'conclusions'),
    tags: ['imported', ...(opts?.filename?.toLowerCase().endsWith('.docx') ? ['word'] : [])],
    privacy_level: 'lab',
    fileNames: opts?.filename ? [opts.filename] : [],
    metadata: {},
  };

  return {
    title,
    summary: payload.summary || '',
    detectedSections: detected,
    rawPreview: raw,
    payload,
  };
}
