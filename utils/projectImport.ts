import {
  bucketByHeadings,
  guessTitleFromText,
  joinBucket,
  type DocumentImportResult,
} from './documentImport';

export type ProjectImportPayload = {
  project_title: string;
  project_description: string;
  project_type?: string;
  research_field?: string;
  project_code?: string;
};

const ALIASES: Record<string, string[]> = {
  description: [
    'description',
    'abstract',
    'summary',
    'overview',
    'background',
    'aims',
    'objectives',
    'goals',
    'scope',
  ],
  field: ['research field', 'field', 'discipline', 'domain'],
  type: ['project type', 'type', 'category'],
};

function inferProjectType(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('clinical')) return 'clinical_trial';
  if (t.includes('collaborat')) return 'collaboration';
  if (t.includes('contract')) return 'contract_research';
  if (t.includes('applied')) return 'applied_research';
  return 'basic_research';
}

export function smartParseProjectText(
  rawInput: string,
  opts?: { filename?: string }
): DocumentImportResult<ProjectImportPayload> {
  const raw = rawInput.trim();
  const { buckets, detected, preamble } = bucketByHeadings(raw, ALIASES);
  const title = guessTitleFromText(raw, opts?.filename);
  const description =
    joinBucket(buckets, 'description') ||
    (preamble.length > 1 ? preamble.slice(1).join('\n').trim() : raw);

  const fieldLine = joinBucket(buckets, 'field');
  const typeLine = joinBucket(buckets, 'type');

  const codeBase = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const payload: ProjectImportPayload = {
    project_title: title.slice(0, 200),
    project_description: description.slice(0, 5000),
    project_type: typeLine || inferProjectType(raw),
    research_field: fieldLine.split('\n')[0]?.slice(0, 120) || '',
    project_code: codeBase ? `${codeBase}-${new Date().getFullYear()}` : '',
  };

  return {
    title: payload.project_title,
    summary: payload.project_description.slice(0, 240),
    detectedSections: detected.length ? detected : ['description'],
    rawPreview: raw,
    payload,
  };
}
