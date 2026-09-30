/**
 * Manuscript outline structure — tree, numbering, in-body headings, TOC.
 * Draft content stays flat by sectionId; templates carry parent/level metadata.
 */

import type { WritingDraftContent, WritingSection, WritingTemplate } from './writingTemplates';
import { getSectionContent, countWords } from './writingTemplates';

export type SectionNumbering = 'none' | 'decimal' | 'inherit';
export type SectionLevel = 1 | 2;
export type TemplateNumberingPolicy = 'none' | 'decimal';

export type OutlineNode = {
  section: WritingSection;
  level: SectionLevel;
  numberLabel: string;
  displayTitle: string;
  children: OutlineNode[];
  depth: number;
};

export type InBodyHeading = {
  level: 2 | 3;
  title: string;
  lineIndex: number;
  raw: string;
};

export type TocEntry = {
  id: string;
  title: string;
  numberLabel: string;
  depth: number;
  kind: 'section' | 'heading';
  sectionId?: string;
};

const HEADING_LINE_RE = /^(#{2,3})\s+(.+?)\s*$/;

/** Default level/numbering when templates omit fields (legacy drafts). */
export function normalizeSectionMeta(section: WritingSection): WritingSection {
  return {
    ...section,
    level: section.level ?? (section.parentId ? 2 : 1),
    numbering: section.numbering ?? (section.parentId ? 'inherit' : 'none'),
  };
}

export function normalizeTemplateSections(sections: WritingSection[]): WritingSection[] {
  return sections.map(normalizeSectionMeta);
}

export function getNumberingPolicy(
  template: WritingTemplate,
  draft?: { numberingPolicy?: 'none' | 'decimal' }
): TemplateNumberingPolicy {
  return draft?.numberingPolicy ?? template.numberingPolicy ?? 'none';
}

/** Depth-first flatten respecting parent/child order. */
export function flattenSections(sections: WritingSection[]): WritingSection[] {
  const normalized = normalizeTemplateSections(sections);
  const byParent = new Map<string | null, WritingSection[]>();
  for (const s of normalized) {
    const key = s.parentId || null;
    const list = byParent.get(key) || [];
    list.push(s);
    byParent.set(key, list);
  }
  // Preserve original order within each sibling group
  const orderIndex = new Map(normalized.map((s, i) => [s.id, i]));
  for (const [, list] of byParent) {
    list.sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0));
  }

  const out: WritingSection[] = [];
  const visit = (parentId: string | null) => {
    for (const s of byParent.get(parentId) || []) {
      out.push(s);
      visit(s.id);
    }
  };
  // Roots: no parentId, or parent missing from list
  const ids = new Set(normalized.map((s) => s.id));
  const roots = normalized.filter((s) => !s.parentId || !ids.has(s.parentId));
  // If some roots appear mid-list due to missing parents, still DFS from true roots only once
  const rootIds = new Set(roots.map((r) => r.id));
  const orderedRoots = (byParent.get(null) || []).filter((s) => rootIds.has(s.id));
  const orphanRoots = roots.filter((r) => r.parentId && !ids.has(r.parentId));
  for (const s of [...orderedRoots, ...orphanRoots]) {
    if (out.some((x) => x.id === s.id)) continue;
    out.push(s);
    visit(s.id);
  }
  // Any leftover (cycles / orphans)
  for (const s of normalized) {
    if (!out.some((x) => x.id === s.id)) out.push(s);
  }
  return out;
}

function resolveNumbering(
  section: WritingSection,
  policy: TemplateNumberingPolicy
): 'none' | 'decimal' {
  const n = section.numbering ?? 'none';
  if (n === 'none') return 'none';
  if (n === 'decimal') return 'decimal';
  // inherit
  return policy === 'decimal' ? 'decimal' : 'none';
}

/** Build outline tree with auto-generated number labels. */
export function buildSectionTree(
  sections: WritingSection[],
  policy: TemplateNumberingPolicy = 'none'
): OutlineNode[] {
  const flat = flattenSections(sections);
  const byId = new Map(flat.map((s) => [s.id, s]));
  const childrenOf = new Map<string | null, WritingSection[]>();
  for (const s of flat) {
    const p = s.parentId && byId.has(s.parentId) ? s.parentId : null;
    const list = childrenOf.get(p) || [];
    list.push(s);
    childrenOf.set(p, list);
  }

  let l1Counter = 0;
  const l2Counters = new Map<string, number>();

  const build = (parentId: string | null, depth: number, parentNumber: string): OutlineNode[] => {
    const siblings = childrenOf.get(parentId) || [];
    return siblings.map((section) => {
      const level = (section.level ?? (section.parentId ? 2 : 1)) as SectionLevel;
      const numbering = resolveNumbering(section, policy);
      let numberLabel = '';
      if (numbering === 'decimal') {
        if (level === 1 || !parentId) {
          l1Counter += 1;
          numberLabel = String(l1Counter);
        } else {
          const n = (l2Counters.get(parentId) || 0) + 1;
          l2Counters.set(parentId, n);
          numberLabel = parentNumber ? `${parentNumber}.${n}` : String(n);
        }
      }
      const displayTitle = numberLabel
        ? `${numberLabel} ${stripLeadingNumber(section.title)}`
        : stripLeadingNumber(section.title);
      const children = build(section.id, depth + 1, numberLabel || parentNumber);
      return {
        section,
        level,
        numberLabel,
        displayTitle,
        children,
        depth,
      };
    });
  };

  return build(null, 0, '');
}

/** Strip cosmetic "1.1 " / "1. " prefixes from titles when we auto-number. */
export function stripLeadingNumber(title: string): string {
  return title.replace(/^\d+(\.\d+)*\s+/, '').trim();
}

export function formatSectionNumber(
  sectionId: string,
  sections: WritingSection[],
  policy: TemplateNumberingPolicy = 'none'
): string {
  const tree = buildSectionTree(sections, policy);
  const walk = (nodes: OutlineNode[]): string | null => {
    for (const n of nodes) {
      if (n.section.id === sectionId) return n.numberLabel;
      const found = walk(n.children);
      if (found != null) return found;
    }
    return null;
  };
  return walk(tree) || '';
}

export function findOutlineNode(
  sectionId: string,
  sections: WritingSection[],
  policy: TemplateNumberingPolicy = 'none'
): OutlineNode | null {
  const tree = buildSectionTree(sections, policy);
  const walk = (nodes: OutlineNode[]): OutlineNode | null => {
    for (const n of nodes) {
      if (n.section.id === sectionId) return n;
      const found = walk(n.children);
      if (found) return found;
    }
    return null;
  };
  return walk(tree);
}

/** Parse ## / ### lines from section body text. */
export function parseInBodyHeadings(text: string): InBodyHeading[] {
  const lines = (text || '').split(/\n/);
  const out: InBodyHeading[] = [];
  lines.forEach((line, lineIndex) => {
    const m = line.match(HEADING_LINE_RE);
    if (!m) return;
    out.push({
      level: m[1].length === 2 ? 2 : 3,
      title: m[2].trim(),
      lineIndex,
      raw: line,
    });
  });
  return out;
}

/** Split body into blocks for preview/export (paragraphs + headings). */
export function parseBodyBlocks(
  text: string
): Array<{ kind: 'heading'; level: 2 | 3; title: string } | { kind: 'paragraph'; text: string }> {
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: Array<
    { kind: 'heading'; level: 2 | 3; title: string } | { kind: 'paragraph'; text: string }
  > = [];
  let para: string[] = [];
  const flush = () => {
    const t = para.join('\n').trim();
    if (t) blocks.push({ kind: 'paragraph', text: t });
    para = [];
  };
  for (const line of lines) {
    const m = line.match(HEADING_LINE_RE);
    if (m) {
      flush();
      blocks.push({
        kind: 'heading',
        level: m[1].length === 2 ? 2 : 3,
        title: m[2].trim(),
      });
    } else {
      para.push(line);
    }
  }
  flush();
  return blocks;
}

export function buildToc(
  template: WritingTemplate,
  draft: WritingDraftContent
): TocEntry[] {
  const policy = getNumberingPolicy(template);
  const tree = buildSectionTree(template.sections, policy);
  const entries: TocEntry[] = [];

  const walk = (nodes: OutlineNode[]) => {
    for (const n of nodes) {
      if (n.section.id === 'title') {
        walk(n.children);
        continue;
      }
      entries.push({
        id: `sec:${n.section.id}`,
        title: stripLeadingNumber(n.section.title),
        numberLabel: n.numberLabel,
        depth: n.depth,
        kind: 'section',
        sectionId: n.section.id,
      });
      const body = getSectionContent(draft, n.section.id);
      for (const h of parseInBodyHeadings(body)) {
        entries.push({
          id: `h:${n.section.id}:${h.lineIndex}`,
          title: h.title,
          numberLabel: '',
          depth: n.depth + (h.level === 2 ? 1 : 2),
          kind: 'heading',
          sectionId: n.section.id,
        });
      }
      walk(n.children);
    }
  };
  walk(tree);
  return entries;
}

/** Ensure draft has a content slot for every template section (incl. new L2). */
export function ensureDraftSections(
  draft: WritingDraftContent,
  template: WritingTemplate
): WritingDraftContent {
  const have = new Set(draft.sections.map((s) => s.sectionId));
  const missing = template.sections
    .filter((s) => !have.has(s.id))
    .map((s) => ({ sectionId: s.id, content: '' }));
  if (!missing.length && draft.structureVersion === 2) return draft;
  return {
    ...draft,
    structureVersion: 2,
    sections: [...draft.sections, ...missing],
  };
}

/** Create a user subsection under a Level-1 parent. */
export function addSubsection(
  draft: WritingDraftContent,
  template: WritingTemplate,
  parentId: string,
  title: string
): { draft: WritingDraftContent; templateSections: WritingSection[]; newId: string } {
  const parent = template.sections.find((s) => s.id === parentId);
  if (!parent) {
    return { draft, templateSections: template.sections, newId: '' };
  }
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
  const newId = `custom_${parentId}_${slug || 'sub'}_${Date.now().toString(36)}`;
  const newSection: WritingSection = {
    id: newId,
    title: title.trim() || 'Untitled subsection',
    group: parent.group,
    description: `Subsection of ${parent.title}`,
    guidance: [],
    placeholder: 'Write this subsection…',
    required: false,
    parentId,
    level: 2,
    numbering: 'inherit',
    suggestedWords: 400,
  };
  const parentIdx = template.sections.findIndex((s) => s.id === parentId);
  // Insert after last existing child of parent, or right after parent
  let insertAt = parentIdx + 1;
  for (let i = parentIdx + 1; i < template.sections.length; i++) {
    if (template.sections[i].parentId === parentId) insertAt = i + 1;
    else if (!template.sections[i].parentId) break;
    else if (template.sections[i].parentId !== parentId) break;
  }
  const templateSections = [
    ...template.sections.slice(0, insertAt),
    newSection,
    ...template.sections.slice(insertAt),
  ];
  const nextDraft = {
    ...draft,
    structureVersion: 2 as const,
    customSections: [...(draft.customSections || []), newSection],
    sections: [...draft.sections, { sectionId: newId, content: '' }],
  };
  return { draft: nextDraft, templateSections, newId };
}

/** Remove an author-added subsection (ids from addSubsection / customSections). */
export function removeSubsection(
  draft: WritingDraftContent,
  sectionId: string
): { draft: WritingDraftContent; parentId: string | null; removed: boolean } {
  const customs = draft.customSections || [];
  const target = customs.find((s) => s.id === sectionId);
  if (!target) {
    return { draft, parentId: null, removed: false };
  }
  return {
    draft: {
      ...draft,
      structureVersion: 2,
      customSections: customs.filter((s) => s.id !== sectionId),
      sections: draft.sections.filter((s) => s.sectionId !== sectionId),
    },
    parentId: target.parentId || null,
    removed: true,
  };
}

export function mergeCustomSections(
  templateSections: WritingSection[],
  draft: WritingDraftContent
): WritingSection[] {
  const customs = draft.customSections || [];
  if (!customs.length) return normalizeTemplateSections(templateSections);
  const have = new Set(templateSections.map((s) => s.id));
  let merged = [...templateSections];
  for (const c of customs) {
    if (have.has(c.id)) continue;
    const parentIdx = merged.findIndex((s) => s.id === c.parentId);
    const at = parentIdx >= 0 ? parentIdx + 1 : merged.length;
    // find end of children
    let insertAt = at;
    if (parentIdx >= 0) {
      insertAt = parentIdx + 1;
      for (let i = parentIdx + 1; i < merged.length; i++) {
        if (merged[i].parentId === c.parentId) insertAt = i + 1;
        else break;
      }
    }
    merged = [...merged.slice(0, insertAt), c, ...merged.slice(insertAt)];
    have.add(c.id);
  }
  return normalizeTemplateSections(merged);
}

export function sectionWordCount(draft: WritingDraftContent, sectionId: string): number {
  return countWords(getSectionContent(draft, sectionId));
}

/** Insert a markdown heading marker at the start of a line in plain text. */
export function insertHeadingMarker(
  text: string,
  caretOffset: number,
  level: 2 | 3
): { text: string; cursor: number } {
  const prefix = level === 2 ? '## ' : '### ';
  const before = text.slice(0, caretOffset);
  const after = text.slice(caretOffset);
  const lineStart = before.lastIndexOf('\n') + 1;
  const line = text.slice(lineStart, caretOffset + after.search(/\n|$/));
  const stripped = line.replace(/^#{1,6}\s+/, '');
  const lineEnd = lineStart + line.length;
  const next =
    text.slice(0, lineStart) + prefix + stripped + text.slice(lineEnd);
  const cursor = lineStart + prefix.length + stripped.length;
  return { text: next, cursor };
}
