/**
 * Writing Studio left sidebar — outline + workspace panels; Exit / Save / Export.
 */

import React from 'react';
import type { OutlineNode } from '../../utils/writingStructure';
import type { WritingDraftContent } from '../../utils/writingTemplates';
import { getSectionContent } from '../../utils/writingTemplates';

export type StudioWorkspaceTab = 'cite' | 'preview' | 'review' | 'share';

const WORKSPACE_TABS: Array<{ id: Exclude<StudioWorkspaceTab, 'share'>; label: string }> = [
  { id: 'cite', label: 'Cite' },
  { id: 'preview', label: 'Preview' },
  { id: 'review', label: 'Readiness' },
];

function OutlineRow({
  node,
  activeId,
  draft,
  bibliography,
  sectionLocks,
  currentUserId,
  onSelect,
}: {
  node: OutlineNode;
  activeId: string;
  draft: WritingDraftContent;
  bibliography: string;
  sectionLocks: Array<{ sectionId: string; userId: string; displayName?: string }>;
  currentUserId?: string;
  onSelect: (id: string) => void;
}) {
  if (node.section.id === 'title') {
    return (
      <>
        {node.children.map((child) => (
          <OutlineRow
            key={child.section.id}
            node={child}
            activeId={activeId}
            draft={draft}
            bibliography={bibliography}
            sectionLocks={sectionLocks}
            currentUserId={currentUserId}
            onSelect={onSelect}
          />
        ))}
      </>
    );
  }

  const filled =
    node.section.id === 'references'
      ? Boolean(bibliography.trim())
      : getSectionContent(draft, node.section.id).trim().length > 0;
  const lock = sectionLocks.find(
    (l) => l.sectionId === node.section.id && l.userId !== currentUserId
  );
  const isChild = node.depth > 0 || Boolean(node.section.parentId);
  const active = activeId === node.section.id;

  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(node.section.id)}
        title={lock ? `${lock.displayName || 'Someone'} is editing` : node.displayTitle}
        className={`ws-sb-outline-item ${isChild ? 'is-child' : ''} ${
          active ? 'is-active' : filled ? 'is-filled' : ''
        }`}
      >
        {node.numberLabel ? <span className="ws-sb-outline-num">{node.numberLabel}</span> : null}
        <span className="min-w-0 flex-1 truncate">
          {node.section.title.replace(/^\d+(\.\d+)*\s+/, '')}
        </span>
        {lock ? <span className="ws-sb-lock" title={lock.displayName || 'Editing'} /> : null}
      </button>
      {node.children.map((child) => (
        <OutlineRow
          key={child.section.id}
          node={child}
          activeId={activeId}
          draft={draft}
          bibliography={bibliography}
          sectionLocks={sectionLocks}
          currentUserId={currentUserId}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

type Props = {
  title: string;
  statusLine: string;
  dirty: boolean;
  saving: boolean;
  canSave: boolean;
  previewMode: boolean;
  activeTab: StudioWorkspaceTab | null;
  outlineTree: OutlineNode[];
  activeSectionId: string;
  draft: WritingDraftContent;
  bibliography: string;
  sectionLocks: Array<{ sectionId: string; userId: string; displayName?: string }>;
  currentUserId?: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onExit: () => void;
  onSave: () => void;
  onSelectSection: (id: string) => void;
  onSetTab: (tab: StudioWorkspaceTab | null) => void;
  exportMenu: React.ReactNode;
  showExportMenu: boolean;
  onToggleExport: () => void;
  panelBody: React.ReactNode;
  analyzing?: boolean;
  onRunAnalyze?: () => void;
};

const StudioSidebar: React.FC<Props> = ({
  title,
  statusLine,
  dirty,
  saving,
  canSave,
  previewMode,
  activeTab,
  outlineTree,
  activeSectionId,
  draft,
  bibliography,
  sectionLocks,
  currentUserId,
  mobileOpen,
  onCloseMobile,
  onExit,
  onSave,
  onSelectSection,
  onSetTab,
  exportMenu,
  showExportMenu,
  onToggleExport,
  panelBody,
  analyzing,
  onRunAnalyze,
}) => {
  const selectedTab: StudioWorkspaceTab | null = previewMode ? 'preview' : activeTab;

  const body = (
    <aside className="ws-sidebar" aria-label="Writing Studio sidebar">
      <div className="ws-sb-header">
        <button type="button" className="ws-sb-exit" onClick={onExit}>
          ← Manuscripts
        </button>
        <p className="ws-sb-brand">Writing Studio</p>
      </div>

      <div className="ws-sb-doc">
        <p className="ws-sb-doc-title" title={title}>
          {title || 'Untitled manuscript'}
        </p>
        <p className="ws-sb-doc-meta">
          {statusLine}
          {saving ? ' · saving…' : dirty ? ' · unsaved' : ''}
        </p>
        <button
          type="button"
          className="ws-btn ws-btn-ink ws-sb-save"
          onClick={onSave}
          disabled={!canSave || saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {!previewMode ? (
        <div className="ws-sb-outline">
          <p className="ws-sb-section-label">Outline</p>
          <nav className="ws-sb-outline-list">
            {outlineTree.map((node) => (
              <OutlineRow
                key={node.section.id}
                node={node}
                activeId={activeSectionId}
                draft={draft}
                bibliography={bibliography}
                sectionLocks={sectionLocks}
                currentUserId={currentUserId}
                onSelect={(id) => {
                  onSelectSection(id);
                  onCloseMobile();
                }}
              />
            ))}
          </nav>
        </div>
      ) : null}

      <div className="ws-sb-workspace">
        <div className="ws-sb-tabs" role="tablist" aria-label="Workspace">
          {WORKSPACE_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selectedTab === t.id}
              className={`ws-sb-tab ${selectedTab === t.id ? 'is-active' : ''}`}
              disabled={analyzing && t.id === 'review'}
              onClick={() => {
                if (selectedTab === t.id) {
                  onSetTab(null);
                  return;
                }
                if (t.id === 'review') {
                  onSetTab('review');
                  onRunAnalyze?.();
                  return;
                }
                onSetTab(t.id);
              }}
            >
              {t.id === 'review' && analyzing ? '…' : t.label}
            </button>
          ))}
        </div>
        {selectedTab && selectedTab !== 'preview' ? (
          <div className="ws-sb-panel" role="tabpanel">
            {panelBody}
          </div>
        ) : selectedTab === 'preview' ? (
          <p className="ws-sb-panel-hint">
            Preview is open in the canvas. Select Cite or Readiness, or click Preview again to edit.
          </p>
        ) : (
          <p className="ws-sb-panel-hint">
            Pick Cite, Preview, or Readiness — or keep writing in the canvas.
          </p>
        )}
      </div>

      <div className="ws-sb-footer">
        <button
          type="button"
          className={`ws-btn ${activeTab === 'share' ? 'ws-btn-ink' : 'ws-btn-line'} flex-1`}
          onClick={() => onSetTab(activeTab === 'share' ? null : 'share')}
        >
          Invite Co-authors
        </button>
        <div className="relative flex-1">
          <button type="button" className="ws-btn ws-btn-line w-full" onClick={onToggleExport}>
            Export
          </button>
          {showExportMenu ? exportMenu : null}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="ws-sidebar-desktop hidden lg:flex">{body}</div>

      {mobileOpen ? (
        <div className="ws-sidebar-mobile lg:hidden">
          <button
            type="button"
            className="ws-sidebar-scrim"
            aria-label="Close sidebar"
            onClick={onCloseMobile}
          />
          <div className="ws-sidebar-drawer">{body}</div>
        </div>
      ) : null}
    </>
  );
};

export default StudioSidebar;
export { WORKSPACE_TABS };
