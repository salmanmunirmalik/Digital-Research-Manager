/**
 * Journal-oriented export for Writing Studio drafts (PDF, Word-compatible .doc, Markdown).
 */
import { jsPDF } from 'jspdf';
import {
  WritingDraftContent,
  getWritingTemplate,
  getSectionContent,
  draftWordCount,
  DOC_TYPE_LABELS,
} from './writingTemplates';
import {
  buildSectionTree,
  getNumberingPolicy,
  mergeCustomSections,
  parseBodyBlocks,
  type OutlineNode,
} from './writingStructure';

const MARGIN = 20;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = PAGE_HEIGHT - 14;

function wrapLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  const normalized = (text || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];
  const lines: string[] = [];
  for (const para of normalized.split('\n')) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    lines.push(...(doc.splitTextToSize(para, maxWidth) as string[]));
  }
  return lines;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= FOOTER_Y - 4) return y;
  doc.addPage();
  return MARGIN;
}

function safeFilename(title: string): string {
  return (title || 'manuscript')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

export function buildWritingManuscriptPdf(
  draft: WritingDraftContent,
  bibliography?: string,
  opts?: { renderedSections?: Record<string, string> }
): jsPDF {
  const template = getWritingTemplate(draft.templateId);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const title = draft.title?.trim() || 'Untitled manuscript';
  let y = MARGIN;

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  const titleLines = wrapLines(doc, title, CONTENT_WIDTH);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 7 + 4;

  if (draft.subtitle?.trim()) {
    doc.setFont('times', 'italic');
    doc.setFontSize(12);
    const subLines = wrapLines(doc, draft.subtitle.trim(), CONTENT_WIDTH);
    doc.text(subLines, MARGIN, y);
    y += subLines.length * 6 + 2;
  }

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60);
  const meta = [
    DOC_TYPE_LABELS[draft.docType],
    template.name,
    draft.targetVenue ? `Target: ${draft.targetVenue}` : '',
    draft.citationStyle ? `Citations: ${draft.citationStyle}` : '',
    `${draftWordCount(draft)} words`,
  ]
    .filter(Boolean)
    .join(' · ');
  doc.text(meta, MARGIN, y);
  y += 8;

  if (draft.researchQuestion) {
    doc.setFont('times', 'italic');
    const rq = wrapLines(doc, `Research question: ${draft.researchQuestion}`, CONTENT_WIDTH);
    doc.text(rq, MARGIN, y);
    y += rq.length * 5 + 4;
  }

  if (draft.keywords?.length) {
    doc.setFont('times', 'normal');
    doc.setTextColor(80);
    doc.text(`Keywords: ${draft.keywords.join('; ')}`, MARGIN, y);
    y += 8;
  }

  doc.setDrawColor(200);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 8;
  doc.setTextColor(20);

  const bodyAlign =
    draft.textAlign === 'center' ||
    draft.textAlign === 'right' ||
    draft.textAlign === 'justify'
      ? draft.textAlign
      : 'left';
  const textX =
    bodyAlign === 'center'
      ? PAGE_WIDTH / 2
      : bodyAlign === 'right'
        ? PAGE_WIDTH - MARGIN
        : MARGIN;

  const sections = mergeCustomSections(template.sections, draft);
  const policy = getNumberingPolicy({ ...template, sections }, draft);
  const tree = buildSectionTree(sections, policy);
  const ordered: OutlineNode[] = [];
  const walkTree = (nodes: OutlineNode[]) => {
    for (const n of nodes) {
      if (n.section.id !== 'title') ordered.push(n);
      walkTree(n.children);
    }
  };
  walkTree(tree);

  for (const node of ordered) {
    const section = node.section;
    let body = (
      opts?.renderedSections?.[section.id] ?? getSectionContent(draft, section.id)
    ).trim();
    if (section.id === 'references' && !body && bibliography?.trim()) {
      body = bibliography.trim();
    }
    y = ensureSpace(doc, y, 16);
    const isSub = node.level === 2;
    doc.setFont('times', 'bold');
    doc.setFontSize(isSub ? 11 : 12);
    doc.text(node.displayTitle, MARGIN + (isSub ? 4 : 0), y);
    y += isSub ? 5.5 : 6;

    if (section.id === 'references') {
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      for (const line of wrapLines(doc, body || '[Section not started]', CONTENT_WIDTH)) {
        y = ensureSpace(doc, y, 5);
        doc.text(line || ' ', MARGIN, y);
        y += 4.8;
      }
    } else {
      for (const block of parseBodyBlocks(body || '[Section not started]')) {
        if (block.kind === 'heading') {
          y = ensureSpace(doc, y, 10);
          doc.setFont('times', 'bold');
          doc.setFontSize(block.level === 2 ? 11 : 10);
          doc.text(block.title, MARGIN + 2, y);
          y += 5.5;
        } else {
          doc.setFont('times', 'normal');
          doc.setFontSize(11);
          for (const line of wrapLines(doc, block.text, CONTENT_WIDTH - (isSub ? 4 : 0))) {
            y = ensureSpace(doc, y, 6);
            if (bodyAlign === 'justify' && line.trim()) {
              doc.text(line || ' ', MARGIN, y, {
                maxWidth: CONTENT_WIDTH,
                align: 'justify',
              });
            } else {
              doc.text(line || ' ', textX, y, {
                align: bodyAlign === 'justify' ? 'left' : bodyAlign,
              });
            }
            y += 5.2;
          }
        }
      }
    }
    y += 4;
  }

  const hasRefsSection = template.sections.some((s) => s.id === 'references');
  if (bibliography?.trim() && !hasRefsSection) {
    y = ensureSpace(doc, y, 20);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('References', MARGIN, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    for (const line of wrapLines(doc, bibliography, CONTENT_WIDTH)) {
      y = ensureSpace(doc, y, 5);
      doc.text(line || ' ', MARGIN, y);
      y += 4.8;
    }
  }

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(title.slice(0, 60), MARGIN, FOOTER_Y);
    doc.text(`${p} / ${total}`, PAGE_WIDTH - MARGIN, FOOTER_Y, { align: 'right' });
  }

  return doc;
}

export function downloadWritingPdf(
  draft: WritingDraftContent,
  bibliography?: string,
  opts?: { renderedSections?: Record<string, string> }
) {
  const doc = buildWritingManuscriptPdf(draft, bibliography, opts);
  doc.save(`${safeFilename(draft.title)}.pdf`);
}

/** Word-compatible HTML (.doc) — opens cleanly in Word / LibreOffice / Google Docs. */
export function buildWritingDocHtml(
  draft: WritingDraftContent,
  bibliography?: string,
  opts?: { renderedSections?: Record<string, string> }
): string {
  const template = getWritingTemplate(draft.templateId);
  const escape = (s: string) =>
    (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');

  const hasRefsSection = template.sections.some((s) => s.id === 'references');
  const sectionsMerged = mergeCustomSections(template.sections, draft);
  const policy = getNumberingPolicy({ ...template, sections: sectionsMerged }, draft);
  const tree = buildSectionTree(sectionsMerged, policy);
  const ordered: OutlineNode[] = [];
  const walk = (nodes: OutlineNode[]) => {
    for (const n of nodes) {
      if (n.section.id !== 'title') ordered.push(n);
      walk(n.children);
    }
  };
  walk(tree);

  const sectionsHtml = ordered
    .map((n) => {
      const s = n.section;
      let body = (
        opts?.renderedSections?.[s.id] ?? getSectionContent(draft, s.id)
      ).trim();
      if (s.id === 'references' && !body && bibliography?.trim()) {
        body = bibliography.trim();
      }
      const tag = n.level === 2 ? 'h3' : 'h2';
      if (s.id === 'references') {
        return `<${tag}>${escape(n.displayTitle)}</${tag}><p>${escape(
          body || '[Not started]'
        )}</p>`;
      }
      const inner = parseBodyBlocks(body || '[Not started]')
        .map((b) =>
          b.kind === 'heading'
            ? `<${b.level === 2 ? 'h3' : 'h4'}>${escape(b.title)}</${
                b.level === 2 ? 'h3' : 'h4'
              }>`
            : `<p>${escape(b.text)}</p>`
        )
        .join('\n');
      return `<${tag}>${escape(n.displayTitle)}</${tag}>\n${inner}`;
    })
    .join('\n');

  const refs =
    bibliography?.trim() && !hasRefsSection
      ? `<h2>References</h2><p>${escape(bibliography)}</p>`
      : '';

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8"/>
<title>${escape(draft.title || 'Manuscript')}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; max-width: 700px; margin: 2cm auto; }
  h1 { font-size: 16pt; text-align: center; }
  h2 { font-size: 12pt; margin-top: 18pt; text-align: left; }
  p { text-align: ${draft.textAlign === 'center' || draft.textAlign === 'right' || draft.textAlign === 'justify' ? draft.textAlign : 'left'}; }
  .meta { font-size: 10pt; color: #444; text-align: center; margin-bottom: 18pt; }
</style>
</head>
<body>
  <h1>${escape(draft.title || 'Untitled manuscript')}</h1>
  <p class="meta">${escape(
    [
      DOC_TYPE_LABELS[draft.docType],
      draft.targetVenue,
      draft.citationStyle,
      draft.keywords?.length ? `Keywords: ${draft.keywords.join('; ')}` : '',
    ]
      .filter(Boolean)
      .join(' · ')
  )}</p>
  ${draft.researchQuestion ? `<p><em>Research question: ${escape(draft.researchQuestion)}</em></p>` : ''}
  ${sectionsHtml}
  ${refs}
</body>
</html>`;
}

export function downloadWritingDoc(
  draft: WritingDraftContent,
  bibliography?: string,
  opts?: { renderedSections?: Record<string, string> }
) {
  const html = buildWritingDocHtml(draft, bibliography, opts);
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFilename(draft.title)}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadWritingMarkdown(
  draft: WritingDraftContent,
  markdown: string,
  bibliography?: string
) {
  const full =
    markdown + (bibliography?.trim() ? `\n\n## References\n\n${bibliography}\n` : '');
  const blob = new Blob([full], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFilename(draft.title)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download ordered bibliography as BibTeX for Overleaf / reference managers. */
export function downloadWritingBibtex(
  draft: WritingDraftContent,
  citations: Array<{
    id?: string;
    paperId?: string | null;
    title: string;
    authors: string[];
    year?: number | null;
    journal?: string | null;
    volume?: string | null;
    issue?: string | null;
    pages?: string | null;
    doi?: string | null;
    url?: string | null;
    rawBibtex?: string | null;
    citationKey?: string | null;
  }>,
  orderedIds: string[]
) {
  const byKey = new Map<string, (typeof citations)[0]>();
  for (const c of citations) {
    if (c.paperId) byKey.set(c.paperId, c);
    if (c.id) byKey.set(c.id, c);
  }
  const lines: string[] = [];
  const ids = orderedIds.length
    ? orderedIds
    : citations.map((c) => c.paperId || c.id).filter(Boolean) as string[];
  for (const id of ids) {
    const c = byKey.get(id);
    if (!c) continue;
    if (c.rawBibtex?.trim()) {
      lines.push(c.rawBibtex.trim());
      continue;
    }
    const key =
      c.citationKey ||
      `${(c.authors[0] || 'ref').split(/\s+/).pop() || 'ref'}${c.year || ''}`.replace(
        /[^a-zA-Z0-9]/g,
        ''
      );
    const author = (c.authors || []).join(' and ') || 'Unknown';
    const fields = [
      `  title = {${c.title}}`,
      `  author = {${author}}`,
      c.year ? `  year = {${c.year}}` : null,
      c.journal ? `  journal = {${c.journal}}` : null,
      c.volume ? `  volume = {${c.volume}}` : null,
      c.issue ? `  number = {${c.issue}}` : null,
      c.pages ? `  pages = {${c.pages}}` : null,
      c.doi ? `  doi = {${c.doi}}` : null,
      c.url ? `  url = {${c.url}}` : null,
    ].filter(Boolean);
    lines.push(`@article{${key},\n${fields.join(',\n')}\n}`);
  }
  const blob = new Blob([lines.join('\n\n') + '\n'], {
    type: 'application/x-bibtex;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFilename(draft.title || 'references')}.bib`;
  a.click();
  URL.revokeObjectURL(url);
}
