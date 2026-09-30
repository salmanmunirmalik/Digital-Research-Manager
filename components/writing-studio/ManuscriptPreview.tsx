/**
 * Full-manuscript preview — Word-style view modes with resolved citations.
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { CitationRecord } from '../../utils/citationFormat';
import {
  citationsToMap,
  extractCiteIdsOrdered,
  renderTextWithCitations,
} from '../../utils/citeWhileWriting';
import {
  getSectionContent,
  type WritingDraftContent,
  type WritingTemplate,
} from '../../utils/writingTemplates';
import {
  buildSectionTree,
  buildToc,
  getNumberingPolicy,
  parseBodyBlocks,
  type OutlineNode,
} from '../../utils/writingStructure';

export type ManuscriptViewMode =
  | 'page'
  | 'read'
  | 'wide'
  | 'pages'
  | 'outline'
  | 'draft';

type Props = {
  draft: WritingDraftContent;
  template: WritingTemplate;
  citations: CitationRecord[];
  bibliography: string;
  onEditSection?: (sectionId: string) => void;
  onClose?: () => void;
};

type PreviewSection = {
  id: string;
  title: string;
  body: string;
  empty: boolean;
  wordCount: number;
  headingLevel: 2 | 3;
  displayTitle: string;
};

type SheetBlock =
  | { kind: 'masthead' }
  | { kind: 'section'; section: PreviewSection };

type PreviewSheet = {
  key: string;
  pageNum: number;
  blocks: SheetBlock[];
};

const VIEW_MODES: Array<{ id: ManuscriptViewMode; label: string; hint: string }> = [
  { id: 'page', label: 'Page', hint: 'Print layout — one sheet, as on paper' },
  { id: 'read', label: 'Read', hint: 'Immersive reading — larger type, book columns' },
  { id: 'wide', label: 'Wide', hint: 'Full-width continuous flow' },
  { id: 'pages', label: 'Pages', hint: 'Multiple pages side by side' },
  { id: 'outline', label: 'Outline', hint: 'Section map and structure' },
  { id: 'draft', label: 'Draft', hint: 'Plain continuous draft' },
];

const ZOOM_STEPS = [50, 75, 100, 125, 150] as const;
const CHARS_PER_SHEET = 2800;
const STORAGE_KEY = 'drm.writingStudio.viewPrefs';

type ViewPrefs = { mode: ManuscriptViewMode; zoom: number };

function loadViewPrefs(): ViewPrefs {
  if (typeof window === 'undefined') return { mode: 'page', zoom: 100 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { mode: 'page', zoom: 100 };
    const parsed = JSON.parse(raw) as Partial<ViewPrefs>;
    const mode = VIEW_MODES.some((m) => m.id === parsed.mode)
      ? (parsed.mode as ManuscriptViewMode)
      : 'page';
    const zoom = ZOOM_STEPS.includes(parsed.zoom as (typeof ZOOM_STEPS)[number])
      ? (parsed.zoom as number)
      : 100;
    return { mode, zoom };
  } catch {
    return { mode: 'page', zoom: 100 };
  }
}

function saveViewPrefs(prefs: ViewPrefs) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function buildSheets(
  sections: PreviewSection[],
  includeMasthead: boolean
): PreviewSheet[] {
  const sheets: PreviewSheet[] = [];
  let blocks: SheetBlock[] = includeMasthead ? [{ kind: 'masthead' }] : [];
  let used = includeMasthead ? 400 : 0;

  const flush = () => {
    if (!blocks.length) return;
    sheets.push({
      key: `sheet-${sheets.length + 1}`,
      pageNum: sheets.length + 1,
      blocks,
    });
    blocks = [];
    used = 0;
  };

  for (const section of sections) {
    const weight = section.empty
      ? 80
      : Math.max(120, section.body.length + section.title.length);
    if (blocks.length && used + weight > CHARS_PER_SHEET) flush();
    blocks.push({ kind: 'section', section });
    used += weight;
  }
  flush();
  return sheets.length ? sheets : [{ key: 'sheet-1', pageNum: 1, blocks: [] }];
}

const ManuscriptPreview: React.FC<Props> = ({
  draft,
  template,
  citations,
  bibliography,
  onEditSection,
  onClose,
}) => {
  const [prefs, setPrefs] = useState<ViewPrefs>(() => loadViewPrefs());
  const { mode, zoom } = prefs;

  useEffect(() => {
    saveViewPrefs(prefs);
  }, [prefs]);

  const byId = useMemo(() => citationsToMap(citations), [citations]);

  const orderedIds = useMemo(() => {
    const fullText = draft.sections
      .filter((s) => s.sectionId !== 'references')
      .map((s) => s.content || '')
      .join('\n');
    return extractCiteIdsOrdered(fullText);
  }, [draft.sections]);

  const sections = useMemo((): PreviewSection[] => {
    const policy = getNumberingPolicy(template, draft);
    const tree = buildSectionTree(template.sections, policy);
    const flat: OutlineNode[] = [];
    const walk = (nodes: OutlineNode[]) => {
      for (const n of nodes) {
        if (n.section.id !== 'title') flat.push(n);
        walk(n.children);
      }
    };
    walk(tree);

    return flat.map((n) => {
      const s = n.section;
      if (s.id === 'references') {
        const body = bibliography.trim();
        return {
          id: s.id,
          title: s.title,
          displayTitle: n.displayTitle,
          headingLevel: (n.level === 2 ? 3 : 2) as 2 | 3,
          body,
          empty: !body,
          wordCount: countWords(body),
        };
      }
      const raw = getSectionContent(draft, s.id);
      const rendered = renderTextWithCitations(
        raw,
        byId,
        draft.citationStyle,
        orderedIds
      ).rendered;
      return {
        id: s.id,
        title: s.title,
        displayTitle: n.displayTitle,
        headingLevel: (n.level === 2 ? 3 : 2) as 2 | 3,
        body: rendered.trim(),
        empty: !raw.trim(),
        wordCount: countWords(raw),
      };
    });
  }, [template, draft, byId, orderedIds, bibliography]);

  const toc = useMemo(() => buildToc(template, draft), [template, draft]);

  const filledCount = sections.filter((s) => !s.empty).length;
  const totalWords = sections.reduce((n, s) => n + s.wordCount, 0);
  const sheets = useMemo(
    () => buildSheets(sections, true),
    [sections]
  );

  const setMode = (next: ManuscriptViewMode) =>
    setPrefs((p) => ({ ...p, mode: next }));

  const bumpZoom = (dir: -1 | 1) => {
    const idx = ZOOM_STEPS.indexOf(zoom as (typeof ZOOM_STEPS)[number]);
    const at = idx < 0 ? 2 : idx;
    const next = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, at + dir))];
    setPrefs((p) => ({ ...p, zoom: next }));
  };

  const showZoom = mode === 'page' || mode === 'pages' || mode === 'wide';
  const scale = zoom / 100;

  const renderMasthead = (compact = false) => (
    <header className={`ws-preview-masthead${compact ? ' ws-preview-masthead-compact' : ''}`}>
      <h1 className="ws-preview-title">
        {draft.title?.trim() || 'Untitled manuscript'}
      </h1>
      {draft.subtitle?.trim() ? (
        <p className="ws-preview-subtitle">{draft.subtitle.trim()}</p>
      ) : null}
      <div className="ws-preview-meta">
        {draft.targetVenue?.trim() ? (
          <span>For {draft.targetVenue.trim()}</span>
        ) : null}
        {draft.keywords?.length ? (
          <span>{draft.keywords.join(' · ')}</span>
        ) : null}
      </div>
      {draft.researchQuestion?.trim() ? (
        <p className="ws-preview-rq">
          <span className="ws-kicker">Research question</span>
          <span className="mt-1 block text-[15px] text-[var(--ws-ink)]">
            {draft.researchQuestion.trim()}
          </span>
        </p>
      ) : null}
    </header>
  );

  const renderSection = (s: PreviewSection, opts?: { draftStyle?: boolean }) => {
    const HeadingTag = s.headingLevel === 3 ? 'h3' : 'h2';
    return (
      <section
        key={s.id}
        className={`ws-preview-section${opts?.draftStyle ? ' ws-preview-section-draft' : ''}${
          s.headingLevel === 3 ? ' is-sub' : ''
        }`}
        id={`preview-${s.id}`}
      >
        <div className="ws-preview-section-head">
          <HeadingTag className={s.headingLevel === 3 ? 'ws-preview-h3' : 'ws-preview-h2'}>
            {opts?.draftStyle ? (
              <span className="ws-preview-draft-mark">{s.displayTitle}</span>
            ) : (
              s.displayTitle
            )}
          </HeadingTag>
          {onEditSection ? (
            <button
              type="button"
              className="ws-preview-edit"
              onClick={() => onEditSection(s.id)}
            >
              Edit
            </button>
          ) : null}
        </div>
        {s.empty ? (
          <p className="ws-preview-empty">Not written yet.</p>
        ) : s.id === 'references' ? (
          <pre className="ws-preview-biblio">{s.body}</pre>
        ) : (
          <div className="ws-preview-body">
            {parseBodyBlocks(s.body).map((block, i) =>
              block.kind === 'heading' ? (
                block.level === 2 ? (
                  <h3 key={`${s.id}-h-${i}`} className="ws-preview-h3">
                    {block.title}
                  </h3>
                ) : (
                  <h4 key={`${s.id}-h-${i}`} className="ws-preview-h4">
                    {block.title}
                  </h4>
                )
              ) : (
                <p key={`${s.id}-${i}`}>{block.text}</p>
              )
            )}
          </div>
        )}
      </section>
    );
  };

  const renderSheetBlocks = (blocks: SheetBlock[]) =>
    blocks.map((b, i) => {
      if (b.kind === 'masthead') {
        return <React.Fragment key={`mh-${i}`}>{renderMasthead(true)}</React.Fragment>;
      }
      return (
        <React.Fragment key={b.section.id}>{renderSection(b.section)}</React.Fragment>
      );
    });

  return (
    <div
      className={`ws-preview ws-preview-mode-${mode}`}
      data-view-mode={mode}
      data-text-align={draft.textAlign || 'left'}
      style={
        {
          '--ws-preview-align': draft.textAlign || 'left',
        } as React.CSSProperties
      }
    >
      <div className="ws-preview-bar">
        <div className="min-w-0">
          <p className="ws-kicker">Preview</p>
          <p className="mt-0.5 text-[12px] text-[var(--ws-ink-soft)]">
            {filledCount}/{sections.length} sections · {totalWords} words ·{' '}
            {draft.citationStyle} · read-only
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onClose ? (
            <button type="button" className="ws-btn ws-btn-ink" onClick={onClose}>
              Back to editing
            </button>
          ) : null}
        </div>
      </div>

      <div className="ws-preview-toolbar" role="toolbar" aria-label="View modes">
        <div className="ws-preview-modes" role="radiogroup" aria-label="Layout">
          {VIEW_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              title={m.hint}
              className={`ws-preview-mode-btn${mode === m.id ? ' is-active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              <span className={`ws-preview-mode-ico ws-preview-mode-ico-${m.id}`} aria-hidden />
              {m.label}
            </button>
          ))}
        </div>
        {showZoom ? (
          <div className="ws-preview-zoom" aria-label="Zoom">
            <button
              type="button"
              className="ws-preview-zoom-btn"
              disabled={zoom <= ZOOM_STEPS[0]}
              onClick={() => bumpZoom(-1)}
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="ws-preview-zoom-label">{zoom}%</span>
            <button
              type="button"
              className="ws-preview-zoom-btn"
              disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
              onClick={() => bumpZoom(1)}
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        ) : null}
      </div>

      {mode === 'outline' ? (
        <div className="ws-preview-outline">
          <div className="ws-preview-outline-head">
            {renderMasthead(true)}
          </div>
          <p className="mb-3 text-[12px] text-[var(--ws-ink-soft)]">
            Table of contents — sections, subsections, and in-body headings
          </p>
          <ol className="ws-preview-outline-list">
            {toc.map((entry, idx) => {
              const sec = sections.find((s) => s.id === entry.sectionId);
              return (
                <li
                  key={entry.id}
                  className={`${sec?.empty && entry.kind === 'section' ? 'is-empty' : ''} ${
                    entry.kind === 'heading' ? 'is-heading' : ''
                  }`}
                  style={{ paddingLeft: `${entry.depth * 0.85}rem` }}
                >
                  <div className="ws-preview-outline-row">
                    <span className="ws-preview-outline-num">
                      {entry.numberLabel || String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <button
                          type="button"
                          className="ws-preview-outline-title text-left"
                          onClick={() => {
                            if (entry.sectionId && onEditSection) {
                              onEditSection(entry.sectionId);
                            }
                          }}
                        >
                          {entry.title}
                          {entry.kind === 'heading' ? (
                            <span className="ml-1 text-[10px] font-normal opacity-60">
                              in-text
                            </span>
                          ) : null}
                        </button>
                        {entry.kind === 'section' && sec ? (
                          <span className="text-[11px] font-medium tabular-nums text-[var(--ws-ink-soft)]">
                            {sec.empty ? 'Empty' : `${sec.wordCount}w`}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : mode === 'pages' ? (
        <div className="ws-preview-spread-wrap">
          <div
            className="ws-preview-spread"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
          >
            {sheets.map((sheet) => (
              <article key={sheet.key} className="ws-preview-sheet" aria-label={`Page ${sheet.pageNum}`}>
                <div className="ws-preview-sheet-chrome">
                  <span>{draft.title?.trim() || 'Untitled'}</span>
                  <span>
                    {sheet.pageNum} / {sheets.length}
                  </span>
                </div>
                <div className="ws-preview-sheet-body">{renderSheetBlocks(sheet.blocks)}</div>
              </article>
            ))}
          </div>
        </div>
      ) : mode === 'draft' ? (
        <article className="ws-preview-draft">
          {renderMasthead(true)}
          {sections.map((s) => renderSection(s, { draftStyle: true }))}
        </article>
      ) : (
        <div
          className="ws-preview-stage"
          style={
            showZoom && mode !== 'read'
              ? { transform: `scale(${scale})`, transformOrigin: 'top center' }
              : undefined
          }
        >
          <article className="ws-preview-page">
            {renderMasthead()}
            {sections.map((s) => renderSection(s))}
          </article>
        </div>
      )}
    </div>
  );
};

export default ManuscriptPreview;
