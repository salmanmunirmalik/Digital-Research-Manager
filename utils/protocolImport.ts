import type { ProtocolFormValues } from '../components/ProtocolForm';

const SECTION_ALIASES: Record<keyof Pick<
  ProtocolFormValues,
  | 'objective'
  | 'background'
  | 'scope'
  | 'sample_requirements'
  | 'experimental_conditions'
  | 'reagent_setup'
  | 'materials'
  | 'equipment'
  | 'safety_notes'
  | 'controls'
  | 'procedure'
  | 'expected_results'
  | 'troubleshooting'
  | 'references'
>, string[]> = {
  objective: ['objective', 'aim', 'purpose', 'goal', 'overview'],
  background: ['background', 'introduction', 'context', 'rationale'],
  scope: ['scope', 'applicability', 'applies to'],
  sample_requirements: [
    'sample requirements',
    'sample / starting material',
    'starting material',
    'samples',
    'specimen',
  ],
  experimental_conditions: [
    'experimental conditions',
    'conditions',
    'conditions & parameters',
    'parameters',
    'run conditions',
  ],
  reagent_setup: [
    'reagent setup',
    'reagent & buffer setup',
    'buffer setup',
    'preparation',
    'reagent preparation',
  ],
  materials: [
    'materials',
    'reagents',
    'materials / reagents',
    'materials/reagents',
    'consumables',
    'supplies',
  ],
  equipment: ['equipment', 'instruments', 'apparatus', 'tools'],
  safety_notes: ['safety', 'safety notes', 'hazards', 'ppe', 'precautions', 'warnings'],
  controls: [
    'controls',
    'controls & acceptance criteria',
    'acceptance criteria',
    'quality control',
    'qc',
  ],
  procedure: [
    'procedure',
    'method',
    'methods',
    'protocol',
    'steps',
    'stepwise procedure',
    'experimental procedure',
    'workflow',
  ],
  expected_results: ['expected results', 'results', 'outcomes', 'anticipated results'],
  troubleshooting: ['troubleshooting', 'trouble shooting', 'common issues', 'faq'],
  references: ['references', 'bibliography', 'citations', 'literature'],
};

function normalizeHeading(line: string): string {
  return line
    .replace(/^#+\s*/, '')
    .replace(/^\d+[\.)]\s*/, '')
    .replace(/^section\s+\d+[:.\s-]*/i, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/[:.\s]+$/, '')
    .trim()
    .toLowerCase();
}

function matchSection(line: string): keyof typeof SECTION_ALIASES | null {
  const norm = normalizeHeading(line);
  if (!norm || norm.length > 80) return null;
  const stripped = norm.replace(/^\d+\s+/, '');

  for (const [key, aliases] of Object.entries(SECTION_ALIASES) as [
    keyof typeof SECTION_ALIASES,
    string[],
  ][]) {
    for (const a of aliases) {
      if (
        norm === a ||
        stripped === a ||
        norm.startsWith(`${a} `) ||
        stripped.startsWith(`${a} `)
      ) {
        return key;
      }
      // Short headings that contain the alias (e.g. "3. materials / reagents")
      if (norm.length < 48 && (norm.includes(a) || stripped.includes(a))) {
        return key;
      }
    }
  }
  return null;
}

function splitListItems(block: string): string[] {
  return block
    .split(/\n+/)
    .map((l) => l.replace(/^[-*•]\s+/, '').replace(/^\d+[\.)]\s+/, '').trim())
    .filter(Boolean);
}

function firstNonEmptyLine(text: string): string {
  return (
    text
      .split(/\n+/)
      .map((l) => l.trim())
      .find((l) => l.length > 0) || ''
  );
}

function guessTitle(raw: string, filename?: string): string {
  const first = firstNonEmptyLine(raw)
    .replace(/^#+\s*/, '')
    .replace(/^title[:\s-]*/i, '')
    .trim();
  if (first && first.length <= 120 && !matchSection(first)) return first;
  if (filename) {
    return filename
      .replace(/\.(docx|doc|txt|md|rtf)$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();
  }
  return 'Imported protocol';
}

/**
 * Smart-parse free text or Word-extracted text into protocol form fields.
 * Detects common SOP headings and list items.
 */
export function smartParseProtocolText(
  rawInput: string,
  opts?: { filename?: string }
): Partial<ProtocolFormValues> & { rawPreview: string; detectedSections: string[] } {
  const raw = rawInput.replace(/\r\n/g, '\n').trim();
  const lines = raw.split('\n');
  const buckets: Partial<Record<keyof typeof SECTION_ALIASES, string[]>> = {};
  let current: keyof typeof SECTION_ALIASES | null = null;
  const preamble: string[] = [];
  const detected = new Set<string>();

  for (const line of lines) {
    const section = matchSection(line.trim());
    if (section) {
      current = section;
      detected.add(section);
      if (!buckets[section]) buckets[section] = [];
      continue;
    }
    if (current) {
      buckets[current]!.push(line);
    } else if (line.trim()) {
      preamble.push(line);
    }
  }

  const join = (key: keyof typeof SECTION_ALIASES) =>
    (buckets[key] || []).join('\n').trim();

  const materials = buckets.materials ? splitListItems(join('materials')) : [];
  const equipment = buckets.equipment ? splitListItems(join('equipment')) : [];
  const references = buckets.references ? splitListItems(join('references')) : [];

  let procedure = join('procedure');
  if (!procedure && !detected.size) {
    // No headings — treat body as procedure (skip title line)
    const bodyLines = [...preamble];
    if (bodyLines.length > 1) bodyLines.shift();
    procedure = bodyLines.join('\n').trim() || raw;
  }

  const title = guessTitle(raw, opts?.filename);
  const description =
    join('objective').split('\n')[0]?.slice(0, 280) ||
    firstNonEmptyLine(raw).slice(0, 280) ||
    `Imported from ${opts?.filename || 'pasted text'}`;

  const tags = ['imported'];
  if (opts?.filename?.toLowerCase().endsWith('.docx')) tags.push('word');
  if (opts?.filename?.toLowerCase().endsWith('.doc')) tags.push('word');

  return {
    title,
    description,
    category: 'other',
    difficulty_level: 'intermediate',
    estimated_duration: Math.max(30, Math.min(480, Math.round(procedure.split(/\n/).length * 3))),
    objective: join('objective') || description,
    background: join('background'),
    scope: join('scope'),
    sample_requirements: join('sample_requirements'),
    experimental_conditions: join('experimental_conditions'),
    reagent_setup: join('reagent_setup'),
    materials,
    equipment,
    safety_notes: join('safety_notes'),
    controls: join('controls'),
    procedure: procedure || raw,
    expected_results: join('expected_results'),
    troubleshooting: join('troubleshooting'),
    references,
    tags,
    privacy_level: 'lab',
    version: '1.0',
    video_url: '',
    rawPreview: raw,
    detectedSections: Array.from(detected),
  };
}

/** Map a stored protocol row/content back into ProtocolFormValues for edit. */
export function protocolToFormValues(protocol: {
  title?: string;
  description?: string;
  category?: string;
  difficulty_level?: string;
  estimated_duration?: number;
  materials?: unknown;
  safety_notes?: unknown;
  tags?: unknown;
  privacy_level?: string;
  version?: string;
  content?: string;
  objective?: string;
  background?: string;
  expected_results?: string;
  equipment?: unknown;
  references?: unknown;
  procedure?: unknown;
  video_url?: string;
}): Partial<ProtocolFormValues> {
  const content =
    typeof protocol.content === 'string' && protocol.content.trim()
      ? protocol.content
      : '';

  const fromContent = content
    ? smartParseProtocolText(content)
    : ({ detectedSections: [], rawPreview: '' } as ReturnType<typeof smartParseProtocolText>);

  const asStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {
        return value
          .split(/\n|,/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    return [];
  };

  const safety =
    Array.isArray(protocol.safety_notes)
      ? protocol.safety_notes.join('\n')
      : typeof protocol.safety_notes === 'string'
        ? protocol.safety_notes
        : fromContent.safety_notes || '';

  let procedureText = fromContent.procedure || '';
  if (!procedureText && Array.isArray(protocol.procedure)) {
    procedureText = protocol.procedure
      .map((s: any, i: number) => {
        const title = s.title || `Step ${i + 1}`;
        const desc = s.description || '';
        return `${i + 1}. ${title}${desc ? `\n${desc}` : ''}`;
      })
      .join('\n\n');
  }

  return {
    title: protocol.title || fromContent.title || '',
    description: protocol.description || fromContent.description || '',
    category: protocol.category || fromContent.category || 'other',
    difficulty_level: (protocol.difficulty_level as ProtocolFormValues['difficulty_level']) ||
      'intermediate',
    estimated_duration: Number(protocol.estimated_duration) || fromContent.estimated_duration || 60,
    objective: protocol.objective || fromContent.objective || '',
    background: protocol.background || fromContent.background || '',
    scope: fromContent.scope || '',
    sample_requirements: fromContent.sample_requirements || '',
    experimental_conditions: fromContent.experimental_conditions || '',
    reagent_setup: fromContent.reagent_setup || '',
    materials: asStringArray(protocol.materials).length
      ? asStringArray(protocol.materials)
      : fromContent.materials || [],
    equipment: asStringArray(protocol.equipment).length
      ? asStringArray(protocol.equipment)
      : fromContent.equipment || [],
    safety_notes: safety,
    controls: fromContent.controls || '',
    procedure: procedureText,
    expected_results: protocol.expected_results || fromContent.expected_results || '',
    troubleshooting: fromContent.troubleshooting || '',
    references: asStringArray(protocol.references).length
      ? asStringArray(protocol.references)
      : fromContent.references || [],
    tags: asStringArray(protocol.tags).length
      ? asStringArray(protocol.tags)
      : fromContent.tags || [],
    privacy_level: (protocol.privacy_level as ProtocolFormValues['privacy_level']) || 'lab',
    version: protocol.version || '1.0',
    video_url: protocol.video_url || '',
  };
}

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
