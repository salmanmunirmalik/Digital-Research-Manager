/**
 * Grant writing draft templates aligned with major EU and international formats.
 *
 * Sources reflected (informational — always use the call-specific official template):
 * - Horizon Europe Part B (Excellence / Impact / Implementation), WP 2026–2027
 * - ERC Scientific Proposal Part I + Part II (StG / CoG / AdG)
 * - NIH Specific Aims + Research Strategy (Significance / Innovation / Approach)
 * - NSF Project Summary + Project Description (Intellectual Merit / Broader Impacts)
 * - Generic international research grant narrative
 */

export type GrantTemplateRegion = 'eu' | 'us' | 'international';

export type GrantTemplateId =
  | 'horizon_europe'
  | 'erc'
  | 'nih'
  | 'nsf'
  | 'generic';

export type GrantDraftSectionValue = {
  sectionId: string;
  content: string;
};

export type GrantWritingSection = {
  id: string;
  title: string;
  group: string;
  description: string;
  guidance: string[];
  placeholder: string;
  required: boolean;
  /** Soft target for draft length (words). */
  suggestedWords?: number;
  /** Soft target for formal proposals that use page limits. */
  suggestedPages?: number;
};

export type GrantWritingTemplate = {
  id: GrantTemplateId;
  name: string;
  shortName: string;
  region: GrantTemplateRegion;
  agency: string;
  description: string;
  /** Typical narrative page budget for full applications (approximate). */
  pageLimit?: number;
  /** Soft word budget for in-app drafts. */
  wordLimit?: number;
  evaluationCriteria: string[];
  tips: string[];
  sections: GrantWritingSection[];
  officialNotes: string[];
};

export type GrantDraftContent = {
  templateId: GrantTemplateId;
  title: string;
  researchQuestion: string;
  fundingAgency: string;
  callOrProgram: string;
  durationMonths: string;
  totalBudget: string;
  currency: string;
  sections: GrantDraftSectionValue[];
};

export const emptyGrantDraft = (templateId: GrantTemplateId = 'generic'): GrantDraftContent => {
  const template = getGrantTemplate(templateId);
  return {
    templateId,
    title: '',
    researchQuestion: '',
    fundingAgency: template.agency,
    callOrProgram: '',
    durationMonths: '',
    totalBudget: '',
    currency: template.region === 'eu' ? 'EUR' : 'USD',
    sections: template.sections.map((s) => ({ sectionId: s.id, content: '' })),
  };
};

export const GRANT_WRITING_TEMPLATES: GrantWritingTemplate[] = [
  {
    id: 'horizon_europe',
    name: 'Horizon Europe (RIA / IA / CSA)',
    shortName: 'Horizon Europe',
    region: 'eu',
    agency: 'European Commission — Horizon Europe',
    description:
      'Part B technical narrative structured around Excellence, Impact, and Implementation — the three evaluation criteria used for collaborative EU calls.',
    pageLimit: 40,
    wordLimit: 12000,
    evaluationCriteria: ['Excellence', 'Impact', 'Quality and efficiency of implementation'],
    tips: [
      'Map every objective to work packages, deliverables, and impact pathways.',
      'Keep Part A (admin/budget) out of this draft — focus on the Part B narrative.',
      'Indicative allocations (RIA/IA ~40 pp): Excellence ~18, Impact ~6, Implementation ~15.',
      'Always download the template bundled with your specific call in the Funding & Tenders Portal.',
    ],
    officialNotes: [
      'Part A is completed online (participants, budget, call-specific questions).',
      'Part B is uploaded as PDF; page limits depend on action type (e.g. RIA/IA 40, CSA 25, lump-sum variants higher).',
      'Tables, figures, and references typically count toward the page limit unless the call says otherwise.',
    ],
    sections: [
      {
        id: 'he_objectives_ambition',
        title: '1.1 Objectives and ambition',
        group: '1. Excellence',
        description: 'Clear objectives, ambition beyond state of the art, and overall concept.',
        guidance: [
          'State SMART objectives linked to the call topic.',
          'Position the work against the current state of the art.',
          'Explain novelty, TRL progression (if relevant), and interdisciplinary aspects.',
        ],
        placeholder:
          'Describe overall and specific objectives, ambition, and how the concept goes beyond the state of the art…',
        required: true,
        suggestedPages: 4,
        suggestedWords: 1200,
      },
      {
        id: 'he_methodology',
        title: '1.2 Methodology',
        group: '1. Excellence',
        description: 'Research and innovation methodology, including cross-cutting issues.',
        guidance: [
          'Detail methods, datasets, models, experimental design, and validation.',
          'Address open science, FAIR data, gender dimension, and ethics where relevant.',
          'Explain interdependencies between activities.',
        ],
        placeholder: 'Describe the overall methodology, work logic, and how methods deliver the objectives…',
        required: true,
        suggestedPages: 14,
        suggestedWords: 4000,
      },
      {
        id: 'he_pathways_impact',
        title: '2.1 Pathways towards impact',
        group: '2. Impact',
        description: 'How project results lead to the outcomes and impacts expected in the Work Programme.',
        guidance: [
          'Link outputs → outcomes → wider scientific/economic/societal impacts.',
          'Identify target groups and barriers to impact.',
          'Be concrete about scale and significance where the call still expects it.',
        ],
        placeholder: 'Explain the pathway from results to Work Programme outcomes and longer-term impacts…',
        required: true,
        suggestedPages: 3,
        suggestedWords: 900,
      },
      {
        id: 'he_maximise_impact',
        title: '2.2 Measures to maximise impact',
        group: '2. Impact',
        description: 'Dissemination, exploitation, and communication plan.',
        guidance: [
          'Cover dissemination to peers, exploitation/IP, and public communication.',
          'Name channels, KPIs, and responsibilities.',
          'Align with open science and consortium IP arrangements.',
        ],
        placeholder: 'Outline dissemination, exploitation, and communication measures…',
        required: true,
        suggestedPages: 3,
        suggestedWords: 900,
      },
      {
        id: 'he_work_plan',
        title: '3.1 Work plan and resources',
        group: '3. Implementation',
        description: 'Work packages, deliverables, milestones, risks, and resource overview.',
        guidance: [
          'Define WPs with tasks, partners, person-months, deliverables, and milestones.',
          'Include a risk table with likelihood, impact, and mitigation.',
          'Justify major equipment / purchase costs when required by the template.',
        ],
        placeholder: 'Summarise work packages, timeline, deliverables, milestones, risks, and resources…',
        required: true,
        suggestedPages: 12,
        suggestedWords: 3500,
      },
      {
        id: 'he_consortium',
        title: '3.2 Consortium capacity',
        group: '3. Implementation',
        description: 'Why this consortium can deliver the project as a whole.',
        guidance: [
          'Show complementary expertise, roles, and geographic/sector coverage.',
          'Explain management structure and decision-making.',
          'Highlight prior collaboration or unique infrastructures.',
        ],
        placeholder: 'Describe partners, roles, complementarity, and management arrangements…',
        required: true,
        suggestedPages: 3,
        suggestedWords: 900,
      },
    ],
  },
  {
    id: 'erc',
    name: 'ERC Starting / Consolidator / Advanced',
    shortName: 'ERC',
    region: 'eu',
    agency: 'European Research Council',
    description:
      'Investigator-driven frontier research proposal split into Part I (idea & vision for Step 1) and Part II (implementation for Step 2).',
    pageLimit: 12,
    wordLimit: 4500,
    evaluationCriteria: [
      'Ground-breaking nature and ambition',
      'Scientific approach',
      'Principal Investigator intellectual capacity and creativity',
    ],
    tips: [
      'Part I must stand alone — Step 1 panels often see only Part I + CV/track record.',
      'Avoid duplicating Part I content in Part II; deepen the how.',
      'Emphasise high-risk / high-gain and non-incremental thinking.',
      'Budget justification lives mainly in Part A resources; keep Part II complementary.',
    ],
    officialNotes: [
      'Part B1: Part I of the Scientific Proposal (~5 pages) + CV & Track Record (~4 pages).',
      'Part B2: Part II of the Scientific Proposal (~7 pages) + Funding ID.',
      'References typically do not count toward ERC scientific proposal page limits.',
    ],
    sections: [
      {
        id: 'erc_part1_state_of_knowledge',
        title: 'Part I — State of knowledge & challenge',
        group: 'Part B1 · Scientific Proposal (Part I)',
        description: 'Current state of knowledge and the scientific challenge or knowledge gap.',
        guidance: [
          'Open with the big question, not a literature catalogue.',
          'Make the gap and why it matters crystal clear to generalist panel members.',
        ],
        placeholder: 'Summarise the state of the field and the central scientific challenge…',
        required: true,
        suggestedPages: 1.5,
        suggestedWords: 550,
      },
      {
        id: 'erc_part1_objectives',
        title: 'Part I — Objectives & originality',
        group: 'Part B1 · Scientific Proposal (Part I)',
        description: 'Objectives and why the proposal is original, creative, and ambitious.',
        guidance: [
          'State what will be different after the work is done.',
          'Show hypothesis-driven or clearly framed research goals.',
        ],
        placeholder: 'State objectives and what makes the research original and ambitious…',
        required: true,
        suggestedPages: 2,
        suggestedWords: 700,
      },
      {
        id: 'erc_part1_strategy',
        title: 'Part I — Overall research strategy',
        group: 'Part B1 · Scientific Proposal (Part I)',
        description: 'High-level approach sufficient for Step 1 evaluation.',
        guidance: [
          'Outline the overall strategy without drowning in protocols.',
          'Include enough feasibility signal for generalists.',
        ],
        placeholder: 'Describe the overall approach or research strategy…',
        required: true,
        suggestedPages: 1.5,
        suggestedWords: 550,
      },
      {
        id: 'erc_part2_methodology',
        title: 'Part II — Methodology',
        group: 'Part B2 · Scientific Proposal (Part II)',
        description: 'Detailed methods linking objectives to expected outcomes.',
        guidance: [
          'Explain how methods deliver each objective.',
          'Include alternatives if a key approach fails.',
        ],
        placeholder: 'Detail methodology, experimental/analytical design, and validation…',
        required: true,
        suggestedPages: 3,
        suggestedWords: 1100,
      },
      {
        id: 'erc_part2_workplan',
        title: 'Part II — Work plan, risks & mitigation',
        group: 'Part B2 · Scientific Proposal (Part II)',
        description: 'Work plan, timeline, risks, and mitigating measures.',
        guidance: [
          'Show a realistic timeline and team roles where relevant.',
          'Treat risk assessment as a strength, not a weakness.',
        ],
        placeholder: 'Present work plan, milestones, scientific/technical risks, and mitigations…',
        required: true,
        suggestedPages: 3,
        suggestedWords: 1100,
      },
      {
        id: 'erc_part2_resources',
        title: 'Part II — Resources & team',
        group: 'Part B2 · Scientific Proposal (Part II)',
        description: 'Team, infrastructure, and any additional resource justification.',
        guidance: [
          'Align with Part A budget/resources; do not contradict it.',
          'Explain unique facilities or collaborations needed for feasibility.',
        ],
        placeholder: 'Describe team roles, infrastructure, and resource needs…',
        required: false,
        suggestedPages: 1,
        suggestedWords: 400,
      },
    ],
  },
  {
    id: 'nih',
    name: 'NIH Research Plan (R-series style)',
    shortName: 'NIH',
    region: 'us',
    agency: 'U.S. National Institutes of Health',
    description:
      'Classic NIH narrative centered on a one-page Specific Aims plus Research Strategy (Significance, Innovation, Approach).',
    pageLimit: 13,
    wordLimit: 5000,
    evaluationCriteria: [
      'Significance',
      'Investigator(s)',
      'Innovation',
      'Approach',
      'Environment',
    ],
    tips: [
      'Treat Specific Aims as the entire grant in miniature — many reviewers decide from this page.',
      'Aims should be related but not strictly dependent (failure of one should not collapse all).',
      'Approach should include preliminary data, pitfalls, and alternative strategies.',
      'Abstract / Project Narrative / facilities are separate attachments — keep this draft to the research plan.',
    ],
    officialNotes: [
      'SF-424 (R&R) package + PHS 398 Research Plan components.',
      'Typical R01: Specific Aims 1 page; Research Strategy often 12 pages (verify FOA).',
      'Human subjects, animals, resource sharing, and data management are usually separate attachments.',
    ],
    sections: [
      {
        id: 'nih_specific_aims',
        title: 'Specific Aims',
        group: 'Research Plan',
        description: 'One-page overview: gap, hypothesis, aims, and payoff.',
        guidance: [
          'Opening: problem, gap, and long-term goal.',
          'Central hypothesis and 2–4 related aims.',
          'Close with expected outcomes, innovation, and impact.',
        ],
        placeholder: 'Write the Specific Aims page narrative (≈1 page)…',
        required: true,
        suggestedPages: 1,
        suggestedWords: 550,
      },
      {
        id: 'nih_significance',
        title: 'Significance',
        group: 'Research Strategy',
        description: 'Importance of the problem and how the project will improve the field or health.',
        guidance: [
          'Explain the scientific premise and critical barrier.',
          'State how success will change practice, knowledge, or technology.',
        ],
        placeholder: 'Describe significance and scientific premise…',
        required: true,
        suggestedPages: 2,
        suggestedWords: 800,
      },
      {
        id: 'nih_innovation',
        title: 'Innovation',
        group: 'Research Strategy',
        description: 'What is new in concept, methods, or application.',
        guidance: [
          'Distinguish incremental from transformative elements.',
          'Explain novel frameworks, tools, or combinations of approaches.',
        ],
        placeholder: 'Explain conceptual and/or technical innovation…',
        required: true,
        suggestedPages: 1,
        suggestedWords: 400,
      },
      {
        id: 'nih_approach',
        title: 'Approach',
        group: 'Research Strategy',
        description: 'Experimental design for each aim, including pitfalls and alternatives.',
        guidance: [
          'Organize by aim with rationale, methods, analysis, and expected results.',
          'Include preliminary data, potential problems, and alternative strategies.',
          'Address rigor, biological variables, and authentication where relevant.',
        ],
        placeholder: 'Detail the approach for each Specific Aim…',
        required: true,
        suggestedPages: 8,
        suggestedWords: 2800,
      },
      {
        id: 'nih_timeline',
        title: 'Timeline & milestones',
        group: 'Supporting narrative',
        description: 'Optional project timeline often woven into Approach; captured here for drafting.',
        guidance: ['Show feasibility across the award period.', 'Include go/no-go milestones if useful.'],
        placeholder: 'Outline yearly milestones and decision points…',
        required: false,
        suggestedWords: 300,
      },
    ],
  },
  {
    id: 'nsf',
    name: 'NSF Research Proposal',
    shortName: 'NSF',
    region: 'us',
    agency: 'U.S. National Science Foundation',
    description:
      'NSF-style narrative with Project Summary (Overview, Intellectual Merit, Broader Impacts) and a Project Description.',
    pageLimit: 15,
    wordLimit: 5500,
    evaluationCriteria: ['Intellectual Merit', 'Broader Impacts'],
    tips: [
      'Both Intellectual Merit and Broader Impacts must appear as distinct, substantive threads.',
      'Project Summary is not an abstract — cover overview + both merit criteria.',
      'Do not put URLs in the Project Description (PAPPG restriction).',
      'Data Management (and mentoring plans if applicable) are usually separate documents.',
    ],
    officialNotes: [
      'Follow the current PAPPG and solicitation-specific instructions.',
      'Project Summary often limited to ~1 page / character caps in the submission system.',
      'Standard Project Description limit is commonly 15 pages unless the solicitation differs.',
    ],
    sections: [
      {
        id: 'nsf_summary_overview',
        title: 'Project Summary — Overview',
        group: 'Project Summary',
        description: 'Proposed activities, objectives, and methods.',
        guidance: ['Write for scientifically literate non-specialists.', 'State objectives and methods briefly.'],
        placeholder: 'Overview of activities, objectives, and methods…',
        required: true,
        suggestedWords: 200,
      },
      {
        id: 'nsf_summary_merit',
        title: 'Project Summary — Intellectual Merit',
        group: 'Project Summary',
        description: 'Potential to advance knowledge.',
        guidance: ['State the knowledge advance clearly.', 'Avoid vague claims of novelty.'],
        placeholder: 'Intellectual Merit summary…',
        required: true,
        suggestedWords: 150,
      },
      {
        id: 'nsf_summary_broader',
        title: 'Project Summary — Broader Impacts',
        group: 'Project Summary',
        description: 'Potential to benefit society and desired societal outcomes.',
        guidance: [
          'Be specific (education, DEI, infrastructure, public engagement, etc.).',
          'Match later Broader Impacts activities in the Project Description.',
        ],
        placeholder: 'Broader Impacts summary…',
        required: true,
        suggestedWords: 150,
      },
      {
        id: 'nsf_objectives_background',
        title: 'Objectives, background & rationale',
        group: 'Project Description',
        description: 'Motivation, prior work, and research objectives.',
        guidance: ['Define research questions/hypotheses.', 'Situate against prior NSF or related work if relevant.'],
        placeholder: 'Background, knowledge gap, and objectives…',
        required: true,
        suggestedPages: 3,
        suggestedWords: 1100,
      },
      {
        id: 'nsf_intellectual_merit',
        title: 'Intellectual Merit — research plan',
        group: 'Project Description',
        description: 'Detailed research plan advancing knowledge.',
        guidance: [
          'Describe methods, analysis, and expected contributions to the field.',
          'Include a distinct Intellectual Merit discussion as required.',
        ],
        placeholder: 'Research plan and Intellectual Merit narrative…',
        required: true,
        suggestedPages: 8,
        suggestedWords: 2800,
      },
      {
        id: 'nsf_broader_impacts',
        title: 'Broader Impacts — activities',
        group: 'Project Description',
        description: 'Concrete Broader Impacts activities and assessment.',
        guidance: [
          'List activities, audiences, and how success will be assessed.',
          'Integrate with the research rather than bolting on afterthoughts.',
        ],
        placeholder: 'Broader Impacts activities and metrics…',
        required: true,
        suggestedPages: 2,
        suggestedWords: 700,
      },
      {
        id: 'nsf_workplan',
        title: 'Work plan, team & timeline',
        group: 'Project Description',
        description: 'Management, timeline, and roles.',
        guidance: ['Show feasibility within the requested duration.', 'Clarify collaborator roles.'],
        placeholder: 'Timeline, milestones, and team responsibilities…',
        required: false,
        suggestedPages: 2,
        suggestedWords: 600,
      },
    ],
  },
  {
    id: 'generic',
    name: 'Universal research grant draft',
    shortName: 'Universal',
    region: 'international',
    agency: 'Any funder',
    description:
      'Funder-agnostic narrative covering the sections most international research grants expect. Use when the call format is unknown or mixed.',
    wordLimit: 4000,
    evaluationCriteria: ['Significance', 'Approach / feasibility', 'Impact', 'Team & resources'],
    tips: [
      'Start here to clarify the idea, then convert into a funder-specific template.',
      'Keep aims measurable and methods matched to each aim.',
      'State impact for science and for stakeholders beyond academia when relevant.',
    ],
    officialNotes: [
      'This is an internal drafting scaffold, not an official agency form.',
      'Export and remap sections into the funder’s required headings before submission.',
    ],
    sections: [
      {
        id: 'gen_summary',
        title: 'Executive summary',
        group: 'Core narrative',
        description: 'Concise overview of problem, approach, and impact.',
        guidance: ['150–250 words.', 'Readable by a non-specialist reviewer.'],
        placeholder: 'Summarise the project in one short pitch…',
        required: true,
        suggestedWords: 200,
      },
      {
        id: 'gen_background',
        title: 'Background and significance',
        group: 'Core narrative',
        description: 'Context, gap, and why the work matters now.',
        guidance: ['Cite the key knowledge gap.', 'State significance for the field and society.'],
        placeholder: 'Describe background, gap, and significance…',
        required: true,
        suggestedWords: 700,
      },
      {
        id: 'gen_objectives',
        title: 'Aims and objectives',
        group: 'Core narrative',
        description: 'Specific, measurable research aims.',
        guidance: ['Prefer 2–4 aims.', 'Avoid aims that strictly depend on each other.'],
        placeholder: 'List aims/objectives…',
        required: true,
        suggestedWords: 400,
      },
      {
        id: 'gen_methodology',
        title: 'Methodology',
        group: 'Core narrative',
        description: 'How the work will be done and evaluated.',
        guidance: ['Match methods to aims.', 'Include analysis plan and ethics/safety notes.'],
        placeholder: 'Describe methodology and analysis…',
        required: true,
        suggestedWords: 1200,
      },
      {
        id: 'gen_outcomes',
        title: 'Expected outcomes and impact',
        group: 'Core narrative',
        description: 'Deliverables, knowledge advance, and broader impact.',
        guidance: ['Separate outputs (papers, datasets, tools) from outcomes/impacts.'],
        placeholder: 'Expected results, deliverables, and impact…',
        required: true,
        suggestedWords: 500,
      },
      {
        id: 'gen_timeline',
        title: 'Timeline and milestones',
        group: 'Core narrative',
        description: 'Phasing across the project period.',
        guidance: ['Use yearly or work-package phases.', 'Include decision points.'],
        placeholder: 'Project timeline…',
        required: true,
        suggestedWords: 300,
      },
      {
        id: 'gen_budget',
        title: 'Budget justification (narrative)',
        group: 'Core narrative',
        description: 'High-level justification of major cost categories.',
        guidance: ['Explain necessity, not only totals.', 'Align with funder cost eligibility rules later.'],
        placeholder: 'Justify personnel, equipment, travel, and other major costs…',
        required: false,
        suggestedWords: 400,
      },
    ],
  },
];

const TEMPLATE_MAP = Object.fromEntries(
  GRANT_WRITING_TEMPLATES.map((t) => [t.id, t])
) as Record<GrantTemplateId, GrantWritingTemplate>;

export function getGrantTemplate(id: GrantTemplateId): GrantWritingTemplate {
  return TEMPLATE_MAP[id] ?? TEMPLATE_MAP.generic;
}

export function listGrantTemplates(region?: GrantTemplateRegion): GrantWritingTemplate[] {
  if (!region) return GRANT_WRITING_TEMPLATES;
  return GRANT_WRITING_TEMPLATES.filter((t) => t.region === region);
}

export function getSectionContent(draft: GrantDraftContent, sectionId: string): string {
  return draft.sections.find((s) => s.sectionId === sectionId)?.content ?? '';
}

export function setSectionContent(
  draft: GrantDraftContent,
  sectionId: string,
  content: string
): GrantDraftContent {
  const exists = draft.sections.some((s) => s.sectionId === sectionId);
  const sections = exists
    ? draft.sections.map((s) => (s.sectionId === sectionId ? { ...s, content } : s))
    : [...draft.sections, { sectionId, content }];
  return { ...draft, sections };
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function draftWordCount(draft: GrantDraftContent): number {
  const meta = [draft.title, draft.researchQuestion, draft.callOrProgram]
    .filter(Boolean)
    .join(' ');
  const body = draft.sections.map((s) => s.content).join(' ');
  return countWords(`${meta} ${body}`);
}

export function draftCompletion(draft: GrantDraftContent): {
  requiredTotal: number;
  requiredFilled: number;
  percent: number;
} {
  const template = getGrantTemplate(draft.templateId);
  const required = template.sections.filter((s) => s.required);
  const requiredFilled = required.filter((s) => getSectionContent(draft, s.id).trim().length > 0).length;
  const percent = required.length === 0 ? 0 : Math.round((requiredFilled / required.length) * 100);
  return { requiredTotal: required.length, requiredFilled, percent };
}

/** Flatten draft into a markdown document for export / AI prompts. */
export function draftToMarkdown(draft: GrantDraftContent): string {
  const template = getGrantTemplate(draft.templateId);
  const lines: string[] = [
    `# ${draft.title || 'Untitled grant draft'}`,
    '',
    `Template: ${template.name}`,
    draft.fundingAgency ? `Funder: ${draft.fundingAgency}` : '',
    draft.callOrProgram ? `Call / programme: ${draft.callOrProgram}` : '',
    draft.researchQuestion ? `Research question: ${draft.researchQuestion}` : '',
    draft.durationMonths ? `Duration (months): ${draft.durationMonths}` : '',
    draft.totalBudget ? `Budget: ${draft.totalBudget} ${draft.currency || ''}`.trim() : '',
    '',
  ].filter((line, idx, arr) => line !== '' || (idx > 0 && arr[idx - 1] !== ''));

  let currentGroup = '';
  for (const section of template.sections) {
    if (section.group !== currentGroup) {
      currentGroup = section.group;
      lines.push(`## ${currentGroup}`, '');
    }
    lines.push(`### ${section.title}`, '', getSectionContent(draft, section.id) || '_Not started_', '');
  }
  return lines.join('\n');
}

/** Build structured input for ProposalWritingAgent from a draft. */
export function draftToProposalAgentInput(draft: GrantDraftContent) {
  const template = getGrantTemplate(draft.templateId);
  const objectivesRaw =
    getSectionContent(draft, 'gen_objectives') ||
    getSectionContent(draft, 'nih_specific_aims') ||
    getSectionContent(draft, 'erc_part1_objectives') ||
    getSectionContent(draft, 'he_objectives_ambition');

  const methodology =
    getSectionContent(draft, 'gen_methodology') ||
    getSectionContent(draft, 'nih_approach') ||
    getSectionContent(draft, 'erc_part2_methodology') ||
    getSectionContent(draft, 'he_methodology') ||
    getSectionContent(draft, 'nsf_intellectual_merit');

  const background =
    getSectionContent(draft, 'gen_background') ||
    getSectionContent(draft, 'nih_significance') ||
    getSectionContent(draft, 'erc_part1_state_of_knowledge') ||
    getSectionContent(draft, 'nsf_objectives_background');

  const outcomesRaw =
    getSectionContent(draft, 'gen_outcomes') ||
    getSectionContent(draft, 'he_pathways_impact') ||
    getSectionContent(draft, 'nsf_broader_impacts');

  const timeline =
    getSectionContent(draft, 'gen_timeline') ||
    getSectionContent(draft, 'nih_timeline') ||
    getSectionContent(draft, 'erc_part2_workplan') ||
    getSectionContent(draft, 'he_work_plan') ||
    getSectionContent(draft, 'nsf_workplan');

  const splitList = (text: string) =>
    text
      .split(/\n+/)
      .map((l) => l.replace(/^\s*(?:\d+[.)]|[-*])\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 12);

  return {
    title: draft.title,
    researchQuestion: draft.researchQuestion || undefined,
    objectives: objectivesRaw ? splitList(objectivesRaw) : undefined,
    background: background || undefined,
    methodology: methodology || undefined,
    expectedOutcomes: outcomesRaw ? splitList(outcomesRaw) : undefined,
    timeline: timeline || undefined,
    budget: draft.totalBudget
      ? { total: Number(String(draft.totalBudget).replace(/[^\d.]/g, '')) || undefined }
      : undefined,
    grantType: 'research' as const,
    fundingAgency: draft.fundingAgency || template.agency,
    wordLimit: template.wordLimit,
    templateId: draft.templateId,
    templateName: template.name,
    evaluationCriteria: template.evaluationCriteria,
    fullMarkdown: draftToMarkdown(draft),
  };
}
