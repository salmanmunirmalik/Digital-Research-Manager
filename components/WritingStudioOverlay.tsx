/**
 * In-studio tools — Ink Folio overlays.
 */

import React from 'react';
import { XMarkIcon } from './icons';
import LiteraturePicker, { type PickerPaper } from './LiteraturePicker';
import ResearchJourneyPage from '../pages/ResearchJourneyPage';
import StudioShell from './writing-studio/StudioShell';

export type StudioOverlayKind = 'library' | 'generate';

const TITLES: Record<StudioOverlayKind, { title: string; blurb: string }> = {
  generate: {
    title: 'Start from research',
    blurb:
      'Seed a real manuscript from an idea or linked lab evidence. You keep editing the draft afterward.',
  },
  library: {
    title: 'Find sources',
    blurb: 'Search literature, check a claim, and attach papers to cite in your draft.',
  },
};

type Props = {
  kind: StudioOverlayKind;
  onClose: () => void;
  claimSeed?: string;
  onPaperAttached?: (paper: PickerPaper) => void;
};

const WritingStudioOverlay: React.FC<Props> = ({
  kind,
  onClose,
  claimSeed,
  onPaperAttached,
}) => {
  const meta = TITLES[kind];

  return (
    <div className="ws-overlay-scrim fixed inset-0 z-40 flex flex-col">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close overlay"
        onClick={onClose}
      />
      <div className="ws-overlay-panel relative z-10 mx-auto mt-4 mb-0 flex h-[min(92vh,920px)] w-[min(1100px,96vw)] flex-col">
        <header className="ws-overlay-header flex shrink-0 items-start justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <p className="ws-kicker">Writing studio</p>
            <h2 className="ws-display mt-1 text-2xl font-semibold text-[var(--ws-ink)]">
              {meta.title}
            </h2>
            <p className="mt-0.5 text-[13px] text-[var(--ws-ink-soft)]">{meta.blurb}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ws-btn ws-btn-ghost"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--ws-folio)]">
          <StudioShell nested>
            {kind === 'library' && (
              <LiteraturePicker
                initialClaim={claimSeed}
                onClose={onClose}
                onAttached={(paper) => {
                  onPaperAttached?.(paper);
                  onClose();
                }}
              />
            )}
            {kind === 'generate' && <ResearchJourneyPage embedded paperOnly />}
          </StudioShell>
        </div>
      </div>
    </div>
  );
};

export default WritingStudioOverlay;
