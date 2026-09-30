/**
 * Client-side PDF export for grant writing drafts (jsPDF).
 */
import { jsPDF } from 'jspdf';
import {
  GrantDraftContent,
  draftToMarkdown,
  draftWordCount,
  getGrantTemplate,
  getSectionContent,
} from './grantWritingTemplates';

const MARGIN = 18;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = PAGE_HEIGHT - 12;

const wrapLines = (doc: jsPDF, text: string, maxWidth: number): string[] => {
  const normalized = (text || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return ['— Not started —'];
  const paragraphs = normalized.split('\n');
  const lines: string[] = [];
  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    const wrapped = doc.splitTextToSize(para, maxWidth) as string[];
    lines.push(...wrapped);
  }
  return lines;
};

const ensureSpace = (doc: jsPDF, y: number, needed: number): number => {
  if (y + needed <= FOOTER_Y - 4) return y;
  doc.addPage();
  return MARGIN + 8;
};

const drawFooter = (doc: jsPDF, title: string, page: number, total: number) => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(title.slice(0, 70), MARGIN, FOOTER_Y);
  doc.text(`${page} / ${total}`, PAGE_WIDTH - MARGIN, FOOTER_Y, { align: 'right' });
  doc.setDrawColor(220);
  doc.line(MARGIN, FOOTER_Y - 4, PAGE_WIDTH - MARGIN, FOOTER_Y - 4);
};

export const buildGrantDraftPdf = (draft: GrantDraftContent): jsPDF => {
  const template = getGrantTemplate(draft.templateId);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const title = draft.title?.trim() || 'Untitled grant draft';
  let y = MARGIN;

  // Cover header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, PAGE_WIDTH, 42, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(title, CONTENT_WIDTH) as string[];
  doc.text(titleLines, MARGIN, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(template.name, MARGIN, 18 + titleLines.length * 6 + 2);
  doc.setFontSize(8);
  doc.text('Working draft — not an official submission file', MARGIN, 38);

  y = 52;
  doc.setTextColor(30);

  const meta: Array<[string, string]> = [
    ['Funder', draft.fundingAgency || template.agency],
    ['Call / programme', draft.callOrProgram || '—'],
    ['Research question', draft.researchQuestion || '—'],
    ['Duration', draft.durationMonths ? `${draft.durationMonths} months` : '—'],
    [
      'Budget',
      draft.totalBudget ? `${draft.totalBudget} ${draft.currency || ''}`.trim() : '—',
    ],
    ['Word count', String(draftWordCount(draft))],
    ['Generated', new Date().toLocaleString()],
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Proposal overview', MARGIN, y);
  y += 7;

  for (const [label, value] of meta) {
    const valueLines = wrapLines(doc, value, CONTENT_WIDTH - 38);
    y = ensureSpace(doc, y, 5 + valueLines.length * 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(label, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30);
    doc.text(valueLines, MARGIN + 38, y);
    y += Math.max(5, valueLines.length * 4.5) + 1.5;
  }

  y += 4;
  doc.setDrawColor(226);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 8;

  let currentGroup = '';
  for (const section of template.sections) {
    if (section.group !== currentGroup) {
      currentGroup = section.group;
      y = ensureSpace(doc, y, 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(currentGroup, MARGIN, y);
      y += 7;
    }

    const body = getSectionContent(draft, section.id);
    const bodyLines = wrapLines(doc, body, CONTENT_WIDTH);
    y = ensureSpace(doc, y, 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30);
    const heading = doc.splitTextToSize(section.title, CONTENT_WIDTH) as string[];
    doc.text(heading, MARGIN, y);
    y += heading.length * 5 + 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(40);
    for (const line of bodyLines) {
      y = ensureSpace(doc, y, 5);
      if (line === '') {
        y += 3;
        continue;
      }
      doc.text(line, MARGIN, y);
      y += 4.6;
    }
    y += 5;
  }

  // Disclaimer
  y = ensureSpace(doc, y, 20);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100);
  const note = doc.splitTextToSize(
    'This PDF is a working draft generated in ResearchLab. Remap content into the official call template (Funding & Tenders Portal, Grants.gov, or agency forms) before submission.',
    CONTENT_WIDTH
  ) as string[];
  doc.text(note, MARGIN, y);

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    drawFooter(doc, title, p, total);
  }

  return doc;
};

export const downloadGrantDraftPdf = (draft: GrantDraftContent, filename?: string) => {
  const doc = buildGrantDraftPdf(draft);
  const safe =
    (filename || draft.title || 'grant-draft')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80) || 'grant-draft';
  doc.save(`${safe}.pdf`);
};

export const grantDraftPdfBlobUrl = (draft: GrantDraftContent): string => {
  const doc = buildGrantDraftPdf(draft);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};

export const downloadGrantDraftMarkdown = (draft: GrantDraftContent) => {
  const md = draftToMarkdown(draft);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safe =
    (draft.title || 'grant-draft')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80) || 'grant-draft';
  a.href = url;
  a.download = `${safe}.md`;
  a.click();
  URL.revokeObjectURL(url);
};
