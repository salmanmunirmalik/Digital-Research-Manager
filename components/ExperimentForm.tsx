import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import {
  NotebookFormModal,
  FormSection,
  Field,
  TextArea,
} from './notebook/NotebookFormPrimitives';
import { BeakerIcon, ChartBarIcon, CheckCircleIcon, XMarkIcon } from './icons';
import { useEntityOptions } from '../hooks/useEntityOptions';
import EntityLinkSelect from './EntityLinkSelect';

interface ExperimentFormData {
  title: string;
  startDate: string;
  startTime: string;
  description: string;
  protocolId: string;
  experimentId: string;
  protocolModifications: string;
  problems: string;
  troubleshooting: string;
  resultsLink: string;
}

interface Protocol {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
}

interface ExperimentFormProps {
  initialData?: Partial<ExperimentFormData>;
  protocols?: Protocol[];
  onSubmit: (data: ExperimentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  /** notebook = personal documentation; tracker = experiment lifecycle */
  mode?: 'notebook' | 'tracker';
  banner?: React.ReactNode;
}

const ExperimentForm: React.FC<ExperimentFormProps> = ({
  initialData,
  protocols = [],
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'notebook',
  banner,
}) => {
  const isNotebook = mode === 'notebook';
  const { protocols: loadedProtocols, experiments: loadedExperiments } = useEntityOptions([
    'protocols',
    'experiments',
  ]);
  const protocolOptions =
    protocols.length > 0
      ? protocols.map((p) => ({ id: p.id, label: p.title, meta: p.category }))
      : loadedProtocols;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ExperimentFormData>({
    title: '',
    startDate: '',
    startTime: '',
    description: '',
    protocolId: '',
    experimentId: '',
    protocolModifications: '',
    problems: '',
    troubleshooting: '',
    resultsLink: '',
    ...initialData,
  });

  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);

  useEffect(() => {
    if (initialData?.protocolId && protocolOptions.length > 0) {
      const match = protocolOptions.find((p) => p.id === initialData.protocolId);
      const fromProp = protocols.find((p) => p.id === initialData.protocolId);
      if (fromProp) setSelectedProtocol(fromProp);
      else if (match) {
        setSelectedProtocol({
          id: match.id,
          title: match.label,
          description: '',
          content: '',
          category: match.meta || '',
        });
      }
    }
  }, [initialData?.protocolId, protocolOptions, protocols]);

  const steps = isNotebook
    ? [
        { id: 1, title: 'Basics' },
        { id: 2, title: 'Method' },
        { id: 3, title: 'Issues' },
        { id: 4, title: 'Findings' },
      ]
    : [
        { id: 1, title: 'Basics' },
        { id: 2, title: 'Protocol' },
        { id: 3, title: 'Risks' },
        { id: 4, title: 'Review' },
      ];

  const handleProtocolSelect = (protocolId: string) => {
    if (!protocolId) {
      setSelectedProtocol(null);
      setFormData((prev) => ({ ...prev, protocolId: '' }));
      return;
    }
    const fromProp = protocols.find((p) => p.id === protocolId);
    const match = protocolOptions.find((p) => p.id === protocolId);
    if (fromProp) {
      setSelectedProtocol(fromProp);
    } else if (match) {
      setSelectedProtocol({
        id: match.id,
        title: match.label,
        description: '',
        content: '',
        category: match.meta || '',
      });
    }
    setFormData((prev) => ({ ...prev, protocolId }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const title = isNotebook
    ? initialData?.title
      ? 'Edit experiment note'
      : 'Experiment note'
    : initialData?.title
      ? 'Edit experiment'
      : 'New experiment';

  const subtitle = isNotebook
    ? 'Document a procedure and what you observed - this stays in your notebook'
    : 'Plan and track a run in Experiments';

  // Notebook: single scrollable form (professional documentation UX)
  if (isNotebook) {
    return (
      <NotebookFormModal
        title={title}
        subtitle={subtitle}
        onCancel={onCancel}
        onSubmit={handleSubmit}
        submitLabel={isLoading ? 'Saving…' : 'Save note'}
        maxWidth="max-w-2xl"
      >
        {banner && (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-700">
            {banner}
          </div>
        )}

        <FormSection title="Note" description="What you did and when">
          <Field label="Title" required>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. PCR attempt #3 - gel observations"
              required
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date" required>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </Field>
            <Field label="Time" required>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </Field>
          </div>
          <Field label="Procedure & observations" hint="What you ran, conditions, and what you saw">
            <TextArea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={5}
              placeholder="Describe the procedure and your observations…"
            />
          </Field>
        </FormSection>

        <FormSection
          title="Linked method"
          description="Reference a protocol - full SOPs live in Protocol library"
        >
          <Field label="Protocol">
            <EntityLinkSelect
              value={formData.protocolId}
              options={protocolOptions}
              onChange={handleProtocolSelect}
              placeholder="None - choose a protocol"
            />
            {protocolOptions.length === 0 && (
              <p className="mt-1.5 text-[12px] text-slate-500">
                No protocols loaded.{' '}
                <a href="/protocols" className="text-slate-800 font-medium underline-offset-2 hover:underline">
                  Open Protocol library
                </a>
              </p>
            )}
          </Field>
          {isNotebook && (
            <Field label="Linked experiment" hint="Optional - tie this note to a tracked experiment">
              <EntityLinkSelect
                value={formData.experimentId}
                options={loadedExperiments}
                onChange={(id) => setFormData((prev) => ({ ...prev, experimentId: id }))}
                placeholder="None - choose an experiment"
              />
            </Field>
          )}
          {selectedProtocol && (
            <div className="rounded-md border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-[13px] font-medium text-slate-900">{selectedProtocol.title}</p>
              {selectedProtocol.description && (
                <p className="mt-1 text-[12px] text-slate-600 line-clamp-2">
                  {selectedProtocol.description}
                </p>
              )}
              <a
                href={`/protocols`}
                className="inline-block mt-2 text-[12px] font-medium text-slate-800 underline-offset-2 hover:underline"
              >
                Open Protocol library
              </a>
            </div>
          )}
          <Field label="Deviations from protocol">
            <TextArea
              value={formData.protocolModifications}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, protocolModifications: e.target.value }))
              }
              rows={3}
              placeholder="Any modifications or skipped steps…"
            />
          </Field>
        </FormSection>

        <FormSection title="Issues" description="Optional - detailed problem logs use Problem notes">
          <Field label="Problems encountered">
            <TextArea
              value={formData.problems}
              onChange={(e) => setFormData((prev) => ({ ...prev, problems: e.target.value }))}
              rows={3}
              placeholder="What went wrong…"
            />
          </Field>
          <Field label="How you resolved them">
            <TextArea
              value={formData.troubleshooting}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, troubleshooting: e.target.value }))
              }
              rows={3}
              placeholder="Troubleshooting steps…"
            />
          </Field>
        </FormSection>

        <FormSection title="Findings" description="Summary here; files belong in My data & results">
          <Field label="Results summary">
            <TextArea
              value={formData.resultsLink}
              onChange={(e) => setFormData((prev) => ({ ...prev, resultsLink: e.target.value }))}
              rows={3}
              placeholder="Key findings or a link to detailed results…"
            />
          </Field>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open('/data-results', '_blank')}
              className="border-slate-300 text-slate-700 text-[13px]"
            >
              <ChartBarIcon className="h-4 w-4 mr-1.5" />
              My data & results
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams();
                if (formData.title) params.set('title', formData.title);
                if (formData.protocolId) params.set('protocolId', formData.protocolId);
                window.open(`/experiment-tracker?${params.toString()}`, '_blank');
              }}
              className="border-slate-300 text-slate-700 text-[13px]"
            >
              <BeakerIcon className="h-4 w-4 mr-1.5" />
              Track in Experiments
            </Button>
          </div>
        </FormSection>
      </NotebookFormModal>
    );
  }

  // Tracker mode: stepped wizard
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[92vh] overflow-hidden border border-slate-200 my-6 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h2>
              <p className="mt-1 text-[13px] text-slate-600">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-5 flex items-center gap-1">
            {steps.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                      step >= s.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {s.id}
                  </span>
                  <span
                    className={`hidden sm:block text-[12px] font-medium truncate ${
                      step >= s.id ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`h-px flex-1 mx-2 ${
                      step > s.id ? 'bg-slate-900' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
            {banner && (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-700">
                {banner}
              </div>
            )}

            {step === 1 && (
              <>
                <Field label="Experiment title" required>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter experiment title"
                    required
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Start date" required>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Start time" required>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                      }
                      required
                    />
                  </Field>
                </div>
                <Field label="Description">
                  <TextArea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={4}
                    placeholder="Brief description of the experiment…"
                  />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-[13px] text-slate-600">
                  Link a method from Protocol library. Do not paste the full SOP here.
                </p>
                <Field label="Protocol">
                  <EntityLinkSelect
                    value={formData.protocolId}
                    options={protocolOptions}
                    onChange={handleProtocolSelect}
                    placeholder="Choose a protocol…"
                  />
                </Field>
                {selectedProtocol && (
                  <div className="rounded-md border border-slate-200 px-4 py-3">
                    <p className="text-[13px] font-medium text-slate-900">
                      {selectedProtocol.title}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-600">
                      {selectedProtocol.description}
                    </p>
                    <a
                      href="/protocols"
                      className="inline-block mt-2 text-[12px] font-medium text-slate-800 underline-offset-2 hover:underline"
                    >
                      Open Protocol library
                    </a>
                  </div>
                )}
                <Field label="Protocol modifications">
                  <TextArea
                    value={formData.protocolModifications}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        protocolModifications: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Planned deviations…"
                  />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <Field label="Known risks / problems">
                  <TextArea
                    value={formData.problems}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, problems: e.target.value }))
                    }
                    rows={4}
                    placeholder="Risks or expected issues…"
                  />
                </Field>
                <Field label="Mitigations">
                  <TextArea
                    value={formData.troubleshooting}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, troubleshooting: e.target.value }))
                    }
                    rows={4}
                    placeholder="How you will address them…"
                  />
                </Field>
              </>
            )}

            {step === 4 && (
              <>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-700">
                  <div className="flex gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
                    <p>
                      This creates an experiment in the tracker. Upload outputs later in My data
                      &amp; results.
                    </p>
                  </div>
                </div>
                <Field label="Results notes (optional)">
                  <TextArea
                    value={formData.resultsLink}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, resultsLink: e.target.value }))
                    }
                    rows={3}
                    placeholder="Expected outputs or notes…"
                  />
                </Field>
                <div className="rounded-md border border-slate-200 px-4 py-4 space-y-2 text-[13px] text-slate-700">
                  <p className="font-semibold text-slate-900">Summary</p>
                  <p>
                    <span className="text-slate-500">Title:</span> {formData.title || '-'}
                  </p>
                  <p>
                    <span className="text-slate-500">When:</span>{' '}
                    {formData.startDate || '-'}
                    {formData.startTime ? ` · ${formData.startTime}` : ''}
                  </p>
                  <p>
                    <span className="text-slate-500">Protocol:</span>{' '}
                    {selectedProtocol?.title || 'None'}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex justify-between gap-2.5 shrink-0">
            <div>
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="border-slate-300 text-slate-700"
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-slate-300 text-slate-700"
              >
                Cancel
              </Button>
              {step < steps.length ? (
                <Button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="bg-slate-900 hover:bg-slate-800 text-white shadow-none bg-none"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-slate-900 hover:bg-slate-800 text-white shadow-none bg-none"
                >
                  {isLoading ? 'Saving…' : 'Create experiment'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExperimentForm;
