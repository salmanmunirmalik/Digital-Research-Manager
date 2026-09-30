import React from 'react';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { Field, TextArea } from '../../notebook/NotebookFormPrimitives';
import type { ResultPolarity, TextResultArtifact } from '../../../utils/evidencePack';

type Props = {
  artifact: TextResultArtifact;
  onChange: (next: TextResultArtifact) => void;
};

/**
 * Text result editor — claim structure first (finding → evidence → caveats).
 * Free-form body is secondary so notes don't bury the scientific claim.
 */
const TextResultEditor: React.FC<Props> = ({ artifact, onChange }) => {
  const patch = (partial: Partial<TextResultArtifact>) =>
    onChange({ ...artifact, ...partial });

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-slate-500 leading-relaxed">
        Write the result as a claim a colleague could reuse: one finding, what supports it, and what
        limits confidence. Raw numbers belong in a sheet; this is the interpretation layer.
      </p>

      <Field label="Polarity">
        <Select
          value={artifact.polarity}
          onChange={(e) => patch({ polarity: e.target.value as ResultPolarity })}
          options={[
            { value: 'positive', label: 'Positive / confirms hypothesis' },
            { value: 'negative', label: 'Negative / rejects hypothesis' },
            { value: 'mixed', label: 'Mixed' },
            { value: 'inconclusive', label: 'Inconclusive' },
            { value: 'not_applicable', label: 'Not applicable' },
          ]}
        />
      </Field>

      <Field label="Finding (one clear claim)">
        <Input
          value={artifact.finding}
          onChange={(e) => patch({ finding: e.target.value })}
          placeholder="e.g. Treatment X reduced viability by ~40% vs vehicle at 48 h"
          autoFocus
        />
      </Field>

      <Field label="Evidence (what supports the claim)">
        <TextArea
          value={artifact.evidence}
          onChange={(e) => patch({ evidence: e.target.value })}
          rows={4}
          placeholder="Point to sheet columns, table rows, or figure panels. Include n, controls, and key stats."
        />
      </Field>

      <Field label="Caveats / limitations">
        <TextArea
          value={artifact.caveats}
          onChange={(e) => patch({ caveats: e.target.value })}
          rows={3}
          placeholder="Sample size, batch effects, missing controls, assay range, outliers excluded…"
        />
      </Field>

      <Field label="Additional notes (optional)">
        <TextArea
          value={artifact.body}
          onChange={(e) => patch({ body: e.target.value })}
          rows={4}
          placeholder="Methods detail, anecdotal observations, next experiments…"
        />
      </Field>
    </div>
  );
};

export default TextResultEditor;
