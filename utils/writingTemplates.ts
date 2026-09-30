/**
 * Research Writing Studio templates — international standards for papers,
 * reviews, proposals, grants, and common research documents.
 *
 * Informational only: always follow the target journal/funder/institution template.
 */

import {
  GRANT_WRITING_TEMPLATES,
  GrantWritingTemplate,
  getGrantTemplate,
  type GrantTemplateId,
} from './grantWritingTemplates';

export type WritingDocType =
  | 'research_paper'
  | 'review_paper'
  | 'research_proposal'
  | 'grant'
  | 'other';

export type CitationStyle =
  | 'APA'
  | 'MLA'
  | 'Chicago'
  | 'IEEE'
  | 'Nature'
  | 'Science'
  | 'Vancouver';

export type WritingSection = {
  id: string;
  title: string;
  group: string;
  description: string;
  guidance: string[];
  placeholder: string;
  required: boolean;
  suggestedWords?: number;
  /** Agent hint for AI assist */
  assistHint?: string;
  /** Outline parent (Level-2 subsections) */
  parentId?: string;
  /** 1 = section, 2 = subsection */
  level?: 1 | 2;
  /** none | decimal | inherit template policy */
  numbering?: 'none' | 'decimal' | 'inherit';
};

export type WritingTemplate = {
  id: string;
  docType: WritingDocType;
  name: string;
  shortName: string;
  region: 'international' | 'eu' | 'us' | 'uk';
  description: string;
  standards: string[];
  evaluationCriteria: string[];
  tips: string[];
  officialNotes: string[];
  defaultCitationStyle: CitationStyle;
  wordLimit?: number;
  pageLimit?: number;
  sections: WritingSection[];
  /** Default numbering for sections that use numbering: 'inherit' */
  numberingPolicy?: 'none' | 'decimal';
  /** Prefer this agent for full-draft assist */
  primaryAgent:
    | 'paper_writing'
    | 'literature_review'
    | 'proposal_writing'
    | 'abstract_writing';
};

export type WritingDraftSectionValue = {
  sectionId: string;
  content: string;
};

export type WritingDraftContent = {
  templateId: string;
  docType: WritingDocType;
  title: string;
  subtitle?: string;
  researchQuestion: string;
  targetVenue: string;
  keywords: string[];
  citationStyle: CitationStyle;
  abstract?: string;
  sections: WritingDraftSectionValue[];
  /** Extra meta for grants (optional) */
  fundingAgency?: string;
  callOrProgram?: string;
  /** Journal preset id from utils/journalPresets */
  journalPresetId?: string;
  /** Soft limits from venue preset (guidance only) */
  wordLimitHint?: number;
  abstractLimitHint?: number;
  /** Override template numbering for outline/export */
  numberingPolicy?: 'none' | 'decimal';
  /** Body text alignment for editor / preview / export */
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  /** Outline structure version (2 = parent/level aware) */
  structureVersion?: number;
  /** Author-added subsections merged into template at runtime */
  customSections?: WritingSection[];
};

export const DOC_TYPE_LABELS: Record<WritingDocType, string> = {
  research_paper: 'Research paper',
  review_paper: 'Review paper',
  research_proposal: 'Research proposal',
  grant: 'Grant application',
  other: 'Other research document',
};

export const CITATION_STYLES: CitationStyle[] = [
  'APA',
  'MLA',
  'Chicago',
  'IEEE',
  'Nature',
  'Science',
  'Vancouver',
];

/** Lean IMRaD — classic journal outline (add subsections only when you need them). */
const PAPER_IMRAD: WritingSection[] = [
  {
    id: 'title',
    title: 'Title',
    group: 'Front matter',
    description: 'Specific, informative title that states the main finding or question.',
    guidance: [
      'Prefer declarative or informative titles over vague topic labels.',
      'Avoid abbreviations unless universally known in the field.',
    ],
    placeholder: 'Working title…',
    required: true,
    suggestedWords: 15,
    assistHint: 'Suggest 3 alternative titles aligned with high-impact journal norms.',
    level: 1,
    numbering: 'none',
  },
  {
    id: 'abstract',
    title: 'Abstract',
    group: 'Front matter',
    description: 'Structured or unstructured summary of background, methods, results, conclusions.',
    guidance: [
      'Many journals use structured abstracts (Background / Methods / Results / Conclusions).',
      'State the main quantitative result; avoid “results will be discussed”.',
      'Add keywords in Document details (not a separate section).',
    ],
    placeholder: 'Background… Methods… Results… Conclusions…',
    required: true,
    suggestedWords: 200,
    assistHint: 'Draft a structured abstract suitable for a high-impact journal.',
    level: 1,
    numbering: 'none',
  },
  {
    id: 'introduction',
    title: 'Introduction',
    group: 'Main text',
    description: 'Context, gap, and research question / hypothesis.',
    guidance: [
      'Funnel: broad context → specific gap → question/hypothesis → approach preview.',
      'Cite primary literature; end with clear aims or hypotheses.',
    ],
    placeholder: 'Establish context, the knowledge gap, and your aims…',
    required: true,
    suggestedWords: 800,
    assistHint: 'Draft an introduction that ends with clear aims/hypotheses.',
    level: 1,
    numbering: 'none',
  },
  {
    id: 'methods',
    title: 'Methods',
    group: 'Main text',
    description: 'Design, procedures, materials, and analysis — enough to reproduce.',
    guidance: [
      'Cover study design / sample, procedures & materials, and statistical analysis in one flow.',
      'Include ethics approvals and registration numbers when applicable.',
      'Use Add subsection only if the journal expects separate Methods headings.',
      'Follow EQUATOR / field reporting guidelines when relevant.',
    ],
    placeholder:
      'Design and sample…\n\nProcedures and materials…\n\nStatistical analysis…',
    required: true,
    suggestedWords: 1200,
    assistHint: 'Draft methods covering design, procedures, and analysis.',
    level: 1,
    numbering: 'none',
  },
  {
    id: 'results',
    title: 'Results',
    group: 'Main text',
    description: 'Findings without extended interpretation; figures/tables first.',
    guidance: [
      'Lead with the primary outcome; secondary analyses follow.',
      'Report effect sizes, uncertainty (CI), and exact p-values where used.',
    ],
    placeholder: 'Primary findings, secondary analyses, figure/table callouts…',
    required: true,
    suggestedWords: 1000,
    assistHint: 'Draft a results narrative that prioritizes primary outcomes and effect sizes.',
    level: 1,
    numbering: 'none',
  },
  {
    id: 'discussion',
    title: 'Discussion',
    group: 'Main text',
    description: 'Interpretation, limitations, implications — and a short take-home if needed.',
    guidance: [
      'Open with the main answer to the research question.',
      'Compare to prior work; state limitations honestly.',
      'End with implications / next steps (skip a separate Conclusion unless the journal requires one).',
    ],
    placeholder: 'Interpretation, literature context, limitations, implications…',
    required: true,
    suggestedWords: 1000,
    assistHint: 'Draft a discussion with limitations and implications for the field.',
    level: 1,
    numbering: 'none',
  },
  {
    id: 'declarations',
    title: 'Declarations',
    group: 'Back matter',
    description: 'Acknowledgements, data/code availability, and competing interests.',
    guidance: [
      'Acknowledgements / funding (grant numbers as required).',
      'Data and code availability (repository links / DOIs).',
      'Competing interests (or “The authors declare no competing interests”).',
    ],
    placeholder:
      'Acknowledgements…\n\nData / code availability…\n\nCompeting interests…',
    required: false,
    suggestedWords: 120,
    level: 1,
    numbering: 'none',
  },
];

/** Legacy IMRAD section ids collapsed into Methods / Discussion / Declarations. */
const LEGACY_METHODS_SECTION_IDS = [
  'methods_design',
  'methods_procedures',
  'methods_analysis',
] as const;
const LEGACY_DISCUSSION_SECTION_IDS = ['conclusion'] as const;
const LEGACY_DECLARATIONS_SECTION_IDS = [
  'acknowledgements',
  'data_availability',
  'competing_interests',
] as const;

/**
 * Fold older multi-section paper drafts into the lean IMRaD outline
 * so authors keep text when the template is simplified.
 */
export function collapseLegacyPaperSections(
  draft: WritingDraftContent
): WritingDraftContent {
  const byId = new Map(draft.sections.map((s) => [s.sectionId, s.content || '']));
  const take = (ids: readonly string[]) =>
    ids
      .map((id) => (byId.get(id) || '').trim())
      .filter(Boolean)
      .join('\n\n');

  const drop = new Set<string>([
    ...LEGACY_METHODS_SECTION_IDS,
    ...LEGACY_DISCUSSION_SECTION_IDS,
    ...LEGACY_DECLARATIONS_SECTION_IDS,
    'keywords',
  ]);

  const methodsExtra = take(LEGACY_METHODS_SECTION_IDS);
  const discussionExtra = take(LEGACY_DISCUSSION_SECTION_IDS);
  const declarationsExtra = take(LEGACY_DECLARATIONS_SECTION_IDS);
  const keywordsRaw = (byId.get('keywords') || '').trim();

  let keywords = draft.keywords || [];
  if (keywordsRaw && !keywords.length) {
    keywords = keywordsRaw
      .split(/[;,\n]+/)
      .map((k) => k.trim())
      .filter(Boolean);
  }

  const mergeInto = (id: string, extra: string) => {
    if (!extra) return;
    const cur = (byId.get(id) || '').trim();
    byId.set(id, cur ? `${cur}\n\n${extra}` : extra);
  };
  mergeInto('methods', methodsExtra);
  mergeInto('discussion', discussionExtra);
  mergeInto('declarations', declarationsExtra);

  const sections = draft.sections
    .filter((s) => !drop.has(s.sectionId))
    .map((s) => ({
      ...s,
      content: byId.has(s.sectionId) ? byId.get(s.sectionId)! : s.content,
    }));

  if (declarationsExtra && !sections.some((s) => s.sectionId === 'declarations')) {
    sections.push({ sectionId: 'declarations', content: byId.get('declarations') || '' });
  }

  return { ...draft, keywords, sections };
}

/** Auto-generated bibliography section (cite-while-writing). */
export const REFERENCES_SECTION: WritingSection = {
  id: 'references',
  title: 'References',
  group: 'Back matter',
  description:
    'Bibliography built automatically from citations you insert while writing. Change citation style anytime — this list updates.',
  guidance: [
    'Cite papers in earlier sections with Insert citation (or Cite here in the library).',
    'This list is ordered by first appearance in the manuscript for numbered styles.',
    'Export includes this References section with formatted entries.',
  ],
  placeholder: 'Citations you insert while writing appear here automatically…',
  required: false,
  level: 1,
  numbering: 'none',
};

/** Insert References before acknowledgements / after main text when missing. */
export function withReferencesSection(sections: WritingSection[]): WritingSection[] {
  if (sections.some((s) => s.id === 'references')) return sections;
  const backMatterStart = sections.findIndex((s) =>
    ['declarations', 'acknowledgements', 'data_availability', 'competing_interests', 'funding'].includes(
      s.id
    )
  );
  const insertAt = backMatterStart >= 0 ? backMatterStart : sections.length;
  return [
    ...sections.slice(0, insertAt),
    REFERENCES_SECTION,
    ...sections.slice(insertAt),
  ];
}

const REVIEW_SECTIONS: WritingSection[] = [
  {
    id: 'title',
    title: 'Title',
    group: 'Front matter',
    description: 'Indicate scope (narrative / systematic / scoping) and topic.',
    guidance: [
      'Systematic reviews often include “systematic review” or “meta-analysis” in the title (PRISMA).',
    ],
    placeholder: 'Review title…',
    required: true,
    suggestedWords: 15,
  },
  {
    id: 'abstract',
    title: 'Abstract',
    group: 'Front matter',
    description: 'For systematic reviews, prefer PRISMA-style structured abstracts.',
    guidance: [
      'Background, Objectives, Methods (sources/dates), Results, Conclusions.',
      'Register protocols (PROSPERO) when applicable and cite registration.',
    ],
    placeholder: 'Structured abstract…',
    required: true,
    suggestedWords: 250,
    assistHint: 'Draft a PRISMA-informed structured abstract.',
  },
  {
    id: 'introduction',
    title: 'Introduction / Rationale',
    group: 'Main text',
    description: 'Why this review is needed and what question it answers.',
    guidance: [
      'State the review question (PICO/PECO or equivalent).',
      'Explain how this review differs from prior reviews.',
    ],
    placeholder: 'Rationale and review question…',
    required: true,
    suggestedWords: 700,
    level: 1,
    numbering: 'none',
  },
  {
    id: 'methods',
    title: 'Methods',
    group: 'Main text',
    description: 'Overview of review methods; detail in subsections.',
    guidance: ['Brief overview; use Search and Synthesis subsections for PRISMA items.'],
    placeholder: 'Methods overview…',
    required: true,
    suggestedWords: 150,
    level: 1,
    numbering: 'none',
  },
  {
    id: 'methods_search',
    title: 'Search & selection',
    group: 'Main text',
    parentId: 'methods',
    level: 2,
    numbering: 'inherit',
    description: 'Databases, dates, eligibility, screening process.',
    guidance: [
      'List databases, search dates, and key search terms (full strategy in supplement).',
      'Describe dual screening, conflict resolution, and inclusion/exclusion criteria.',
      'For systematic reviews, follow PRISMA 2020 reporting items.',
    ],
    placeholder: 'Search strategy, eligibility, screening…',
    required: true,
    suggestedWords: 600,
  },
  {
    id: 'methods_synthesis',
    title: 'Appraisal & synthesis',
    group: 'Main text',
    parentId: 'methods',
    level: 2,
    numbering: 'inherit',
    description: 'Risk of bias, data extraction, synthesis approach.',
    guidance: [
      'Name tools (RoB 2, ROBINS-I, GRADE, etc.) when used.',
      'State whether meta-analysis, narrative synthesis, or mixed methods.',
    ],
    placeholder: 'Appraisal tools and synthesis methods…',
    required: true,
    suggestedWords: 500,
  },
  {
    id: 'results',
    title: 'Results',
    group: 'Main text',
    description: 'Overview of review results; detail in subsections.',
    guidance: ['Brief overview; expand in study characteristics and synthesis subsections.'],
    placeholder: 'Results overview…',
    required: true,
    suggestedWords: 150,
    level: 1,
    numbering: 'none',
  },
  {
    id: 'results_overview',
    title: 'Study selection & characteristics',
    group: 'Main text',
    parentId: 'results',
    level: 2,
    numbering: 'inherit',
    description: 'PRISMA flow, included studies, and descriptive tables.',
    guidance: [
      'Report numbers at each screening stage.',
      'Summarize study designs, populations, and interventions/exposures.',
    ],
    placeholder: 'Flow diagram narrative and study characteristics…',
    required: true,
    suggestedWords: 800,
  },
  {
    id: 'results_synthesis',
    title: 'Findings & synthesis',
    group: 'Main text',
    parentId: 'results',
    level: 2,
    numbering: 'inherit',
    description: 'Thematic or quantitative synthesis of evidence.',
    guidance: [
      'Organize by outcome or theme; avoid study-by-study laundry lists when possible.',
      'Report heterogeneity and certainty of evidence when applicable.',
    ],
    placeholder: 'Synthesized findings…',
    required: true,
    suggestedWords: 1200,
    assistHint: 'Synthesize themes/gaps across the literature for this review question.',
  },
  {
    id: 'discussion',
    title: 'Discussion',
    group: 'Main text',
    description: 'Interpretation, gaps, practice/research implications, limitations.',
    guidance: [
      'Contrast with prior reviews; highlight actionable research gaps.',
      'Discuss publication bias and evidence certainty limitations.',
    ],
    placeholder: 'Interpretation and gaps…',
    required: true,
    suggestedWords: 900,
  },
  {
    id: 'conclusion',
    title: 'Conclusion',
    group: 'Main text',
    description: 'Take-home messages for researchers and practitioners.',
    guidance: ['Keep concise; no new citations that introduce new claims.'],
    placeholder: 'Conclusions…',
    required: true,
    suggestedWords: 200,
  },
];

const PROPOSAL_SECTIONS: WritingSection[] = [
  {
    id: 'title',
    title: 'Project title',
    group: 'Overview',
    description: 'Clear working title for the proposed research.',
    guidance: ['Avoid jargon overload; make the contribution visible.'],
    placeholder: 'Project title…',
    required: true,
    suggestedWords: 15,
  },
  {
    id: 'summary',
    title: 'Executive summary / abstract',
    group: 'Overview',
    description: 'Standalone summary for reviewers who may only read this page.',
    guidance: [
      'Problem → approach → expected contribution → feasibility in ~300–500 words.',
    ],
    placeholder: 'Executive summary…',
    required: true,
    suggestedWords: 400,
    assistHint: 'Draft a reviewer-friendly executive summary.',
  },
  {
    id: 'background',
    title: 'Background and significance',
    group: 'Science case',
    description: 'State of the art and why the problem matters.',
    guidance: [
      'Cite key papers; quantify the gap where possible.',
      'Link significance to scientific, clinical, societal, or industrial impact.',
    ],
    placeholder: 'Background and significance…',
    required: true,
    suggestedWords: 800,
  },
  {
    id: 'objectives',
    title: 'Aims and objectives',
    group: 'Science case',
    description: 'Primary aim and specific, measurable objectives.',
    guidance: [
      'Use SMART objectives; map each to methods and deliverables.',
      'Distinguish hypotheses from exploratory aims.',
    ],
    placeholder: 'Aim 1… Objective 1.1…',
    required: true,
    suggestedWords: 400,
  },
  {
    id: 'methodology',
    title: 'Research design and methodology',
    group: 'Approach',
    description: 'How objectives will be achieved.',
    guidance: [
      'Justify design choices; include analysis plan and contingencies.',
      'Address ethics, biosafety, and data management at a high level.',
    ],
    placeholder: 'Design, methods, analysis…',
    required: true,
    suggestedWords: 1200,
    assistHint: 'Draft a rigorous methodology linked to each objective.',
  },
  {
    id: 'workplan',
    title: 'Work plan and timeline',
    group: 'Approach',
    description: 'Milestones, work packages, and Gantt-style schedule.',
    guidance: ['Include dependencies and risk buffers.'],
    placeholder: 'Year 1… Year 2… milestones…',
    required: true,
    suggestedWords: 400,
  },
  {
    id: 'outcomes',
    title: 'Expected outcomes and impact',
    group: 'Impact',
    description: 'Deliverables, publications, datasets, and broader impact.',
    guidance: [
      'Separate scientific outputs from pathways to impact.',
    ],
    placeholder: 'Outcomes and impact…',
    required: true,
    suggestedWords: 400,
  },
  {
    id: 'resources',
    title: 'Resources, team, and budget overview',
    group: 'Feasibility',
    description: 'People, facilities, and high-level budget justification.',
    guidance: [
      'Show access to essential infrastructure and collaborators.',
      'Detailed line-item budgets usually live in institutional forms.',
    ],
    placeholder: 'Team, facilities, budget narrative…',
    required: true,
    suggestedWords: 500,
  },
  {
    id: 'risks',
    title: 'Risks and mitigation',
    group: 'Feasibility',
    description: 'Technical, recruitment, and timeline risks.',
    guidance: ['Pair each major risk with a mitigation and residual risk.'],
    placeholder: 'Risk → mitigation…',
    required: false,
    suggestedWords: 300,
  },
];

const OTHER_TEMPLATES_SECTIONS: Record<string, WritingSection[]> = {
  conference_abstract: [
    {
      id: 'title',
      title: 'Title',
      group: 'Abstract',
      description: 'Conference abstract title.',
      guidance: ['Match conference style guide (often title case).'],
      placeholder: 'Title…',
      required: true,
      suggestedWords: 15,
    },
    {
      id: 'body',
      title: 'Abstract body',
      group: 'Abstract',
      description: 'Single-paragraph or structured conference abstract.',
      guidance: [
        'Respect strict word/character limits.',
        'Include one clear result and implication.',
      ],
      placeholder: 'Abstract…',
      required: true,
      suggestedWords: 250,
      assistHint: 'Draft a conference abstract within the word limit.',
    },
  ],
  cover_letter: [
    {
      id: 'salutation',
      title: 'Salutation & editor address',
      group: 'Letter',
      description: 'Editor name and journal.',
      guidance: ['Address the handling editor by name when known.'],
      placeholder: 'Dear Dr. … / Dear Editor…',
      required: true,
      suggestedWords: 30,
    },
    {
      id: 'body',
      title: 'Letter body',
      group: 'Letter',
      description: 'Why this manuscript fits the journal and what is novel.',
      guidance: [
        'State title, article type, and originality/ethics statements.',
        'Suggest reviewers only if invited by the journal.',
      ],
      placeholder: 'We submit… Novelty… Fit…',
      required: true,
      suggestedWords: 400,
      assistHint: 'Draft a professional journal submission cover letter.',
    },
  ],
  progress_report: [
    {
      id: 'summary',
      title: 'Period summary',
      group: 'Report',
      description: 'What was planned vs achieved in the reporting period.',
      guidance: ['Lead with milestones met; then deviations.'],
      placeholder: 'Summary of progress…',
      required: true,
      suggestedWords: 400,
    },
    {
      id: 'results',
      title: 'Key results',
      group: 'Report',
      description: 'Evidence of progress (data, papers, deliverables).',
      guidance: ['Attach figures/tables as appendices when needed.'],
      placeholder: 'Results…',
      required: true,
      suggestedWords: 800,
    },
    {
      id: 'next_period',
      title: 'Plans for next period',
      group: 'Report',
      description: 'Upcoming work, risks, and resource needs.',
      guidance: ['Be concrete about timelines.'],
      placeholder: 'Next steps…',
      required: true,
      suggestedWords: 400,
    },
  ],
  methods_note: [
    {
      id: 'overview',
      title: 'Method overview',
      group: 'Methods note',
      description: 'Purpose and scope of the method.',
      guidance: ['State what problem the method solves.'],
      placeholder: 'Overview…',
      required: true,
      suggestedWords: 300,
    },
    {
      id: 'protocol',
      title: 'Step-by-step protocol',
      group: 'Methods note',
      description: 'Reproducible procedure.',
      guidance: ['Number steps; include critical parameters and QC checks.'],
      placeholder: '1. … 2. …',
      required: true,
      suggestedWords: 1000,
    },
    {
      id: 'validation',
      title: 'Validation / example',
      group: 'Methods note',
      description: 'Performance metrics or example application.',
      guidance: ['Include limitations and troubleshooting.'],
      placeholder: 'Validation…',
      required: false,
      suggestedWords: 400,
    },
  ],
};

function grantToWritingTemplate(g: GrantWritingTemplate): WritingTemplate {
  // Infer parent parts from group labels (e.g. "1. Excellence") and L2 children
  const groupIds = new Map<string, string>();
  const parents: WritingSection[] = [];
  for (const s of g.sections) {
    if (!groupIds.has(s.group)) {
      const pid = `part_${s.group
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')}`;
      groupIds.set(s.group, pid);
      parents.push({
        id: pid,
        title: s.group.replace(/^\d+\.\s*/, ''),
        group: s.group,
        description: `${g.shortName} — ${s.group}`,
        guidance: [],
        placeholder: '',
        required: false,
        level: 1,
        numbering: 'decimal',
        suggestedWords: 0,
      });
    }
  }
  const children: WritingSection[] = g.sections.map((s) => ({
    id: s.id,
    title: s.title.replace(/^\d+(\.\d+)*\s+/, ''),
    group: s.group,
    description: s.description,
    guidance: s.guidance,
    placeholder: s.placeholder,
    required: s.required,
    suggestedWords: s.suggestedWords,
    assistHint: `Draft the “${s.title}” section for a ${g.shortName} application.`,
    parentId: groupIds.get(s.group),
    level: 2,
    numbering: 'inherit',
  }));
  // Interleave: parent then its children (preserve group order)
  const ordered: WritingSection[] = [];
  const seenParent = new Set<string>();
  for (const s of g.sections) {
    const pid = groupIds.get(s.group)!;
    if (!seenParent.has(pid)) {
      seenParent.add(pid);
      const p = parents.find((x) => x.id === pid);
      if (p) ordered.push(p);
    }
    const child = children.find((c) => c.id === s.id);
    if (child) ordered.push(child);
  }
  return {
    id: `grant_${g.id}`,
    docType: 'grant',
    name: g.name,
    shortName: g.shortName,
    region: g.region === 'international' ? 'international' : g.region,
    description: g.description,
    standards: g.evaluationCriteria,
    evaluationCriteria: g.evaluationCriteria,
    tips: g.tips,
    officialNotes: g.officialNotes,
    defaultCitationStyle: 'APA',
    wordLimit: g.wordLimit,
    pageLimit: g.pageLimit,
    numberingPolicy: 'decimal',
    primaryAgent: 'proposal_writing',
    sections: withReferencesSection(ordered),
  };
}

export const WRITING_TEMPLATES: WritingTemplate[] = [
  {
    id: 'paper_imrad_journal',
    docType: 'research_paper',
    name: 'Original research (IMRaD)',
    shortName: 'IMRaD paper',
    region: 'international',
    description:
      'Classic IMRaD article outline (Abstract → Introduction → Methods → Results → Discussion → References). Add subsections only when you need them.',
    standards: [
      'IMRaD structure',
      'ICMJE Recommendations (authorship, conflicts, trial registration)',
      'EQUATOR / field reporting guidelines',
      'Data availability expectations (Plan S / journal policies)',
    ],
    evaluationCriteria: [
      'Novelty and significance',
      'Methodological rigor and reproducibility',
      'Clarity of results and figures',
      'Appropriate statistics and claims',
      'Citation of prior work',
    ],
    tips: [
      'Write Results and figures before polishing the Introduction.',
      'Match word limits and abstract style to the target journal.',
      'Preprint + journal dual-submission policies vary — check both.',
    ],
    officialNotes: [
      'Nature / Science / Cell family journals have house styles and shorter formats; adapt section lengths.',
      'Always use the journal’s author checklist before submission.',
    ],
    defaultCitationStyle: 'Nature',
    wordLimit: 5000,
    numberingPolicy: 'none',
    primaryAgent: 'paper_writing',
    sections: withReferencesSection(PAPER_IMRAD),
  },
  {
    id: 'paper_short_comms',
    docType: 'research_paper',
    name: 'Short communication / letter',
    shortName: 'Short paper',
    region: 'international',
    description:
      'Compact format for rapid or focused findings (letters, briefs, short communications).',
    standards: ['Journal letter/brief format', 'Single main message'],
    evaluationCriteria: ['Clarity of advance', 'Tight methods', 'Figure quality'],
    tips: ['One primary figure panel set; minimal secondary analyses.'],
    officialNotes: ['Word and figure limits are strict — check the journal.'],
    defaultCitationStyle: 'Nature',
    wordLimit: 1500,
    primaryAgent: 'paper_writing',
    sections: withReferencesSection(
      PAPER_IMRAD.filter((s) =>
        [
          'title',
          'abstract',
          'introduction',
          'methods',
          'results',
          'discussion',
          'declarations',
        ].includes(s.id)
      ).map((s) =>
        s.id === 'introduction' || s.id === 'discussion'
          ? { ...s, suggestedWords: Math.round((s.suggestedWords || 400) * 0.4) }
          : s
      )
    ),
  },
  {
    id: 'review_narrative',
    docType: 'review_paper',
    name: 'Narrative / critical review',
    shortName: 'Narrative review',
    region: 'international',
    description:
      'Expert synthesis of a field with critical appraisal — common for invited reviews.',
    standards: ['Critical synthesis', 'Transparent search when claimed'],
    evaluationCriteria: ['Coverage', 'Critical insight', 'Gap identification', 'Readability'],
    tips: ['Lead with a conceptual framework; avoid annotated bibliography style.'],
    officialNotes: ['Many journals invite reviews; unsolicited reviews have lower acceptance.'],
    defaultCitationStyle: 'APA',
    wordLimit: 8000,
    primaryAgent: 'literature_review',
    sections: withReferencesSection(
      REVIEW_SECTIONS.map((s) =>
        s.id.startsWith('methods_')
          ? {
              ...s,
              required: false,
              description: s.description + ' (lighter for narrative reviews).',
            }
          : s
      )
    ),
  },
  {
    id: 'review_systematic',
    docType: 'review_paper',
    name: 'Systematic review (PRISMA-informed)',
    shortName: 'Systematic review',
    region: 'international',
    description:
      'Protocol-driven evidence synthesis aligned with PRISMA 2020 reporting items.',
    standards: ['PRISMA 2020', 'PROSPERO registration (recommended)', 'Cochrane handbook (if applicable)'],
    evaluationCriteria: [
      'Protocol fidelity',
      'Search completeness',
      'Risk-of-bias handling',
      'Certainty of evidence',
    ],
    tips: [
      'Register the protocol before screening when possible.',
      'Publish the full search strategy as a supplement.',
    ],
    officialNotes: [
      'PRISMA is a reporting guideline, not a quality scale — still follow it item-by-item.',
    ],
    defaultCitationStyle: 'Vancouver',
    wordLimit: 10000,
    numberingPolicy: 'none',
    primaryAgent: 'literature_review',
    sections: withReferencesSection(REVIEW_SECTIONS),
  },
  {
    id: 'proposal_institutional',
    docType: 'research_proposal',
    name: 'Institutional / thesis research proposal',
    shortName: 'Research proposal',
    region: 'international',
    description:
      'Standard research proposal for university committees, ethics boards, and lab project kickoff.',
    standards: ['Aims–methods–feasibility coherence', 'Ethics & data management'],
    evaluationCriteria: ['Significance', 'Approach', 'Feasibility', 'Investigator readiness'],
    tips: ['Map each objective to methods, milestones, and risks.'],
    officialNotes: ['Institutional forms may require additional ethics/GDPR annexes.'],
    defaultCitationStyle: 'APA',
    wordLimit: 5000,
    primaryAgent: 'proposal_writing',
    sections: withReferencesSection(PROPOSAL_SECTIONS),
  },
  {
    id: 'proposal_fellowship',
    docType: 'research_proposal',
    name: 'Fellowship / career development proposal',
    shortName: 'Fellowship proposal',
    region: 'international',
    description:
      'Candidate-centred proposal emphasizing training plan, mentorship, and career trajectory.',
    standards: ['Candidate potential', 'Training plan', 'Research plan'],
    evaluationCriteria: ['Candidate', 'Mentors/environment', 'Research plan', 'Training'],
    tips: ['Balance science excellence with a concrete training and mentorship plan.'],
    officialNotes: ['Agency-specific pages (e.g. NIH K, Marie Skłodowska-Curie) override this scaffold.'],
    defaultCitationStyle: 'APA',
    wordLimit: 4000,
    primaryAgent: 'proposal_writing',
    sections: withReferencesSection([
      ...PROPOSAL_SECTIONS.slice(0, 5),
      {
        id: 'training_plan',
        title: 'Training and career development plan',
        group: 'Candidate',
        description: 'Skills to acquire, courses, mentoring structure.',
        guidance: ['Link training activities to career goals and research aims.'],
        placeholder: 'Training plan…',
        required: true,
        suggestedWords: 500,
      },
      ...PROPOSAL_SECTIONS.slice(5),
    ]),
  },
  ...GRANT_WRITING_TEMPLATES.map(grantToWritingTemplate),
  {
    id: 'other_conference_abstract',
    docType: 'other',
    name: 'Conference abstract',
    shortName: 'Conference abstract',
    region: 'international',
    description: 'Submission abstract for meetings and congresses.',
    standards: ['Conference word/character limits'],
    evaluationCriteria: ['Clarity', 'Novelty', 'Fit to session'],
    tips: ['Write the result sentence first, then wrap context.'],
    officialNotes: [],
    defaultCitationStyle: 'APA',
    wordLimit: 300,
    primaryAgent: 'abstract_writing',
    sections: withReferencesSection(OTHER_TEMPLATES_SECTIONS.conference_abstract),
  },
  {
    id: 'other_cover_letter',
    docType: 'other',
    name: 'Journal cover letter',
    shortName: 'Cover letter',
    region: 'international',
    description: 'Submission letter highlighting novelty and journal fit.',
    standards: ['Journal author guidelines'],
    evaluationCriteria: ['Fit', 'Novelty statement', 'Ethics declarations'],
    tips: ['Do not paste the abstract verbatim — sell the advance.'],
    officialNotes: [],
    defaultCitationStyle: 'APA',
    wordLimit: 500,
    primaryAgent: 'abstract_writing',
    sections: OTHER_TEMPLATES_SECTIONS.cover_letter,
  },
  {
    id: 'other_progress_report',
    docType: 'other',
    name: 'Progress / interim report',
    shortName: 'Progress report',
    region: 'international',
    description: 'Funder or supervisor progress report for a reporting period.',
    standards: ['Milestone reporting'],
    evaluationCriteria: ['Delivery vs plan', 'Risk management'],
    tips: ['Quantify progress; attach evidence.'],
    officialNotes: [],
    defaultCitationStyle: 'APA',
    wordLimit: 3000,
    primaryAgent: 'proposal_writing',
    sections: withReferencesSection(OTHER_TEMPLATES_SECTIONS.progress_report),
  },
  {
    id: 'other_methods_note',
    docType: 'other',
    name: 'Methods / protocol note',
    shortName: 'Methods note',
    region: 'international',
    description: 'Standalone methods description for protocols.io-style sharing or supplements.',
    standards: ['Reproducibility', 'FAIR methods'],
    evaluationCriteria: ['Clarity', 'Completeness', 'Validation'],
    tips: ['Version the protocol; note critical reagents.'],
    officialNotes: [],
    defaultCitationStyle: 'APA',
    wordLimit: 2500,
    primaryAgent: 'paper_writing',
    sections: withReferencesSection(OTHER_TEMPLATES_SECTIONS.methods_note),
  },
];

export function getWritingTemplate(id: string): WritingTemplate {
  const found = WRITING_TEMPLATES.find((t) => t.id === id);
  const base = found || WRITING_TEMPLATES[0];
  return {
    ...base,
    numberingPolicy: base.numberingPolicy ?? (base.docType === 'grant' ? 'decimal' : 'none'),
    sections: withReferencesSection(base.sections),
  };
}

export function listWritingTemplates(docType?: WritingDocType): WritingTemplate[] {
  if (!docType) return WRITING_TEMPLATES;
  return WRITING_TEMPLATES.filter((t) => t.docType === docType);
}

export function emptyWritingDraft(
  templateId: string = 'paper_imrad_journal'
): WritingDraftContent {
  const template = getWritingTemplate(templateId);
  return {
    templateId: template.id,
    docType: template.docType,
    title: '',
    subtitle: '',
    researchQuestion: '',
    targetVenue: '',
    keywords: [],
    citationStyle: template.defaultCitationStyle,
    structureVersion: 2,
    sections: template.sections.map((s) => ({ sectionId: s.id, content: '' })),
    fundingAgency: template.docType === 'grant' ? undefined : undefined,
  };
}

export function getSectionContent(draft: WritingDraftContent, sectionId: string): string {
  return draft.sections.find((s) => s.sectionId === sectionId)?.content || '';
}

export function setSectionContent(
  draft: WritingDraftContent,
  sectionId: string,
  content: string
): WritingDraftContent {
  const has = draft.sections.some((s) => s.sectionId === sectionId);
  const sections = has
    ? draft.sections.map((s) => (s.sectionId === sectionId ? { ...s, content } : s))
    : [...draft.sections, { sectionId, content }];
  return { ...draft, sections };
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function draftWordCount(draft: WritingDraftContent): number {
  const meta = [draft.title, draft.researchQuestion, draft.abstract, ...(draft.keywords || [])]
    .filter(Boolean)
    .join(' ');
  const body = draft.sections.map((s) => s.content).join(' ');
  return countWords(`${meta} ${body}`);
}

export function draftCompletion(draft: WritingDraftContent): {
  requiredTotal: number;
  requiredFilled: number;
  percent: number;
} {
  const template = getWritingTemplate(draft.templateId);
  const required = template.sections.filter((s) => s.required);
  const requiredFilled = required.filter((s) => {
    if (s.id === 'title') return Boolean(draft.title?.trim());
    if (getSectionContent(draft, s.id).trim()) return true;
    const children = template.sections.filter((c) => c.parentId === s.id);
    return children.some((c) => getSectionContent(draft, c.id).trim().length > 0);
  }).length;
  const percent = required.length === 0 ? 0 : Math.round((requiredFilled / required.length) * 100);
  return { requiredTotal: required.length, requiredFilled, percent };
}

export function draftToMarkdown(draft: WritingDraftContent): string {
  const template = getWritingTemplate(draft.templateId);
  const sections = [
    ...template.sections,
    ...(draft.customSections || []).filter(
      (c) => !template.sections.some((s) => s.id === c.id)
    ),
  ];
  const lines: string[] = [
    `# ${draft.title || 'Untitled draft'}`,
    draft.subtitle ? `*${draft.subtitle}*` : '',
    '',
    `Type: ${DOC_TYPE_LABELS[draft.docType]}`,
    `Template: ${template.name}`,
    draft.targetVenue ? `Target venue / funder: ${draft.targetVenue}` : '',
    draft.researchQuestion ? `Research question: ${draft.researchQuestion}` : '',
    draft.keywords?.length ? `Keywords: ${draft.keywords.join('; ')}` : '',
    `Citation style: ${draft.citationStyle}`,
    '',
  ].filter((line, idx, arr) => line !== '' || (idx > 0 && arr[idx - 1] !== ''));

  let currentGroup = '';
  for (const section of sections) {
    if (section.id === 'title') continue;
    if (section.group !== currentGroup && !section.parentId) {
      currentGroup = section.group;
      lines.push(`## ${currentGroup}`, '');
    }
    const depth = section.level ?? (section.parentId ? 2 : 1);
    const hashes = '#'.repeat(Math.min(6, depth + 2));
    lines.push(
      `${hashes} ${section.title}`,
      '',
      getSectionContent(draft, section.id) || '_Not started_',
      ''
    );
  }
  return lines.join('\n');
}

/** Map grant template ids used elsewhere into writing template ids. */
export function grantTemplateToWritingId(grantId: GrantTemplateId | string): string {
  return `grant_${grantId}`;
}

export function writingIdToGrantTemplateId(writingId: string): GrantTemplateId | null {
  if (!writingId.startsWith('grant_')) return null;
  const id = writingId.replace(/^grant_/, '') as GrantTemplateId;
  try {
    getGrantTemplate(id);
    return id;
  } catch {
    return null;
  }
}
