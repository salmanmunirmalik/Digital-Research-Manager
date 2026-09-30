import {
  buildSectionTree,
  flattenSections,
  parseInBodyHeadings,
  parseBodyBlocks,
  addSubsection,
  removeSubsection,
  stripLeadingNumber,
} from '../../utils/writingStructure';
import type { WritingSection } from '../../utils/writingTemplates';
import { emptyWritingDraft, collapseLegacyPaperSections, getSectionContent } from '../../utils/writingTemplates';

const sample: WritingSection[] = [
  {
    id: 'methods',
    title: 'Methods',
    group: 'Main text',
    description: '',
    guidance: [],
    placeholder: '',
    required: true,
    level: 1,
    numbering: 'none',
  },
  {
    id: 'methods_design',
    title: 'Study design',
    group: 'Main text',
    parentId: 'methods',
    level: 2,
    numbering: 'inherit',
    description: '',
    guidance: [],
    placeholder: '',
    required: false,
  },
  {
    id: 'methods_analysis',
    title: 'Statistical analysis',
    group: 'Main text',
    parentId: 'methods',
    level: 2,
    numbering: 'inherit',
    description: '',
    guidance: [],
    placeholder: '',
    required: false,
  },
];

describe('writingStructure', () => {
  it('flattens parent before children', () => {
    const ids = flattenSections(sample).map((s) => s.id);
    expect(ids).toEqual(['methods', 'methods_design', 'methods_analysis']);
  });

  it('builds decimal numbers when policy is decimal', () => {
    const withDecimal = sample.map((s) =>
      s.id === 'methods' ? { ...s, numbering: 'decimal' as const } : s
    );
    const tree = buildSectionTree(withDecimal, 'decimal');
    expect(tree[0].numberLabel).toBe('1');
    expect(tree[0].children[0].numberLabel).toBe('1.1');
    expect(tree[0].children[1].numberLabel).toBe('1.2');
  });

  it('parses in-body headings', () => {
    const text = 'Intro para\n## Design\nDetails\n### Nested\nMore';
    expect(parseInBodyHeadings(text)).toEqual([
      { level: 2, title: 'Design', lineIndex: 1, raw: '## Design' },
      { level: 3, title: 'Nested', lineIndex: 3, raw: '### Nested' },
    ]);
    const blocks = parseBodyBlocks(text);
    expect(blocks[0]).toEqual({ kind: 'paragraph', text: 'Intro para' });
    expect(blocks[1]).toEqual({ kind: 'heading', level: 2, title: 'Design' });
  });

  it('adds a custom subsection to the draft', () => {
    const draft = emptyWritingDraft('paper_imrad_journal');
    const template = {
      id: 'paper_imrad_journal',
      sections: sample,
    } as any;
    const { draft: next, newId } = addSubsection(draft, template, 'methods', 'Ethics');
    expect(newId).toMatch(/^custom_methods_/);
    expect(next.customSections?.some((s) => s.id === newId)).toBe(true);
    expect(next.sections.some((s) => s.sectionId === newId)).toBe(true);
  });

  it('removes a custom subsection from the draft', () => {
    const draft = emptyWritingDraft('paper_imrad_journal');
    const template = {
      id: 'paper_imrad_journal',
      sections: sample,
    } as any;
    const { draft: withSub, newId } = addSubsection(draft, template, 'methods', 'Ethics');
    const filled = {
      ...withSub,
      sections: withSub.sections.map((s) =>
        s.sectionId === newId ? { ...s, content: 'Ethics text' } : s
      ),
    };
    const { draft: next, parentId, removed } = removeSubsection(filled, newId);
    expect(removed).toBe(true);
    expect(parentId).toBe('methods');
    expect(next.customSections?.some((s) => s.id === newId)).toBe(false);
    expect(next.sections.some((s) => s.sectionId === newId)).toBe(false);
  });

  it('lean IMRaD template has a short flat outline', () => {
    const draft = emptyWritingDraft('paper_imrad_journal');
    const ids = draft.sections.map((s) => s.sectionId);
    expect(ids).toEqual([
      'title',
      'abstract',
      'introduction',
      'methods',
      'results',
      'discussion',
      'references',
      'declarations',
    ]);
  });

  it('collapses legacy paper subsections into Methods / Discussion / Declarations', () => {
    const collapsed = collapseLegacyPaperSections({
      ...emptyWritingDraft('paper_imrad_journal'),
      sections: [
        { sectionId: 'methods', content: 'Overview' },
        { sectionId: 'methods_design', content: 'RCT design' },
        { sectionId: 'methods_analysis', content: 'ANOVA' },
        { sectionId: 'discussion', content: 'Main discussion' },
        { sectionId: 'conclusion', content: 'Take-home' },
        { sectionId: 'acknowledgements', content: 'Thanks funders' },
        { sectionId: 'keywords', content: 'alpha; beta' },
      ],
    });
    expect(collapsed.sections.some((s) => s.sectionId === 'methods_design')).toBe(false);
    expect(getSectionContent(collapsed, 'methods')).toContain('RCT design');
    expect(getSectionContent(collapsed, 'methods')).toContain('ANOVA');
    expect(getSectionContent(collapsed, 'discussion')).toContain('Take-home');
    expect(getSectionContent(collapsed, 'declarations')).toContain('Thanks funders');
    expect(collapsed.keywords).toEqual(['alpha', 'beta']);
  });

  it('strips leading numbers from titles', () => {
    expect(stripLeadingNumber('1.1 Objectives')).toBe('Objectives');
  });
});
