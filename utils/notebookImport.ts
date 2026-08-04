import {
  bucketByHeadings,
  guessTitleFromText,
  joinBucket,
  type DocumentImportResult,
} from './documentImport';

export type NotebookImportPayload = {
  entry_type: 'experiment' | 'idea' | 'results' | 'problem';
  title: string;
  description: string;
  content: string;
  objectives: string;
  methodology: string;
  results: string;
  conclusions: string;
  tags: string[];
};

const ALIASES: Record<string, string[]> = {
  objectives: ['objective', 'objectives', 'aim', 'aims', 'purpose', 'goal'],
  methodology: ['methodology', 'methods', 'method', 'procedure', 'protocol'],
  results: ['results', 'findings', 'data', 'outcomes'],
  conclusions: ['conclusions', 'conclusion', 'discussion', 'next steps'],
  problem: ['problem', 'issue', 'troubleshooting', 'blocker'],
  idea: ['idea', 'hypothesis', 'proposal'],
};

export function smartParseNotebookText(
  rawInput: string,
  opts?: { filename?: string; entryType?: NotebookImportPayload['entry_type'] }
): DocumentImportResult<NotebookImportPayload> {
  const raw = rawInput.trim();
  const { buckets, detected, preamble } = bucketByHeadings(raw, ALIASES);
  const title = guessTitleFromText(raw, opts?.filename);
  const bodyFallback =
    preamble.length > 1 ? preamble.slice(1).join('\n').trim() : raw;

  let entry_type: NotebookImportPayload['entry_type'] =
    opts?.entryType || 'experiment';
  if (!opts?.entryType) {
    if (detected.includes('idea') || /hypothesis/i.test(raw.slice(0, 400))) {
      entry_type = 'idea';
    } else if (detected.includes('problem') || /troubleshoot|failed|error/i.test(raw.slice(0, 400))) {
      entry_type = 'problem';
    } else if (detected.includes('results') && !detected.includes('methodology')) {
      entry_type = 'results';
    }
  }

  const objectives = joinBucket(buckets, 'objectives');
  const methodology = joinBucket(buckets, 'methodology');
  const results = joinBucket(buckets, 'results');
  const conclusions = joinBucket(buckets, 'conclusions');
  const problem = joinBucket(buckets, 'problem');
  const idea = joinBucket(buckets, 'idea');

  const description =
    objectives.split('\n')[0] ||
    idea.split('\n')[0] ||
    bodyFallback.split('\n')[0] ||
    `Imported from ${opts?.filename || 'pasted text'}`;

  const contentParts = [
    objectives && `## Objectives\n${objectives}`,
    methodology && `## Methodology\n${methodology}`,
    results && `## Results\n${results}`,
    conclusions && `## Conclusions\n${conclusions}`,
    problem && `## Problem\n${problem}`,
    idea && `## Idea\n${idea}`,
  ].filter(Boolean);

  const content =
    contentParts.join('\n\n') ||
    bodyFallback ||
    raw;

  const payload: NotebookImportPayload = {
    entry_type,
    title: title.slice(0, 200),
    description: description.slice(0, 500),
    content,
    objectives: objectives || (entry_type === 'idea' ? idea : ''),
    methodology,
    results: results || (entry_type === 'problem' ? problem : ''),
    conclusions,
    tags: ['imported', entry_type, ...(opts?.filename?.toLowerCase().endsWith('.docx') ? ['word'] : [])],
  };

  return {
    title: payload.title,
    summary: payload.description,
    detectedSections: detected.length ? detected : [entry_type],
    rawPreview: raw,
    payload,
  };
}

/** Map import payload onto the right notebook form fields. */
export function notebookPayloadToFormInitial(payload: NotebookImportPayload) {
  const lines = (text: string) =>
    text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 20);

  switch (payload.entry_type) {
    case 'idea':
      return {
        entry_type: 'idea' as const,
        title: payload.title,
        description: payload.description || payload.objectives,
        notes: payload.content,
        tags: payload.tags,
      };
    case 'results':
      return {
        entry_type: 'results' as const,
        title: payload.title,
        description: payload.description,
        methodology: payload.methodology,
        conclusions: payload.conclusions,
        key_findings: lines(payload.results),
        tags: payload.tags,
      };
    case 'problem':
      return {
        entry_type: 'problem' as const,
        title: payload.title,
        description: payload.description || payload.content,
        symptoms: lines(payload.results || payload.content),
        tags: payload.tags,
      };
    case 'experiment':
    default:
      return {
        entry_type: 'experiment' as const,
        title: payload.title,
        description: [
          payload.description,
          payload.objectives && `Objectives:\n${payload.objectives}`,
          payload.methodology && `Methodology:\n${payload.methodology}`,
          payload.results && `Results:\n${payload.results}`,
          payload.conclusions && `Conclusions:\n${payload.conclusions}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
        protocolModifications: payload.methodology,
        troubleshooting: payload.conclusions,
        resultsLink: payload.results,
      };
  }
}
