/**
 * Research Journey — guided idea/evidence → paper, slides, or experiment design.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { PageHeader } from '../components/PageHeader';
import {
  SparklesIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  BeakerIcon,
  ChartBarIcon,
  CheckIcon,
  ArrowRightIcon,
} from '../components/icons';
import { getAuthHeaders, formatApiNetworkError, resolveApiBaseUrl } from '../utils/apiBase';
import { paperArtifactToWritingDraft } from '../utils/journeyToWritingDraft';

type JourneyType =
  | 'idea_to_paper'
  | 'idea_to_presentation'
  | 'evidence_to_paper'
  | 'evidence_to_presentation'
  | 'idea_to_experiment';

type Depth = 'quick' | 'full';

type JourneyMeta = {
  id: JourneyType;
  name: string;
  description: string;
  needsSource: boolean;
  estimatedMinutes: { quick: number; full: number };
};

type SourceOption = {
  id: string;
  label: string;
  kind: 'lab_notebook' | 'experiment' | 'research_data';
};

type StepResult = {
  id: string;
  name: string;
  status: 'completed' | 'failed' | 'skipped';
  durationMs: number;
  summary?: string;
  error?: string;
};

type JourneyRunResult = {
  success: boolean;
  journeyType: JourneyType;
  researchQuestion: string;
  steps: StepResult[];
  artifacts: {
    hypothesis?: any;
    literature?: any;
    experimentDesign?: any;
    paper?: any;
    presentation?: any;
  };
  totalDurationMs: number;
  error?: string;
};

const FALLBACK_JOURNEYS: JourneyMeta[] = [
  {
    id: 'idea_to_paper',
    name: 'Idea → Paper draft',
    description: 'Refine a research idea, optionally scan literature, then draft manuscript sections.',
    needsSource: false,
    estimatedMinutes: { quick: 3, full: 8 },
  },
  {
    id: 'idea_to_presentation',
    name: 'Idea → Slides',
    description: 'Turn a research idea into a conference or seminar slide outline.',
    needsSource: false,
    estimatedMinutes: { quick: 2, full: 5 },
  },
  {
    id: 'evidence_to_paper',
    name: 'Evidence → Paper draft',
    description: 'Ground a manuscript in a notebook entry, experiment, or evidence pack.',
    needsSource: true,
    estimatedMinutes: { quick: 4, full: 10 },
  },
  {
    id: 'evidence_to_presentation',
    name: 'Evidence → Slides',
    description: 'Build a presentation from your evidence pack or experimental results.',
    needsSource: true,
    estimatedMinutes: { quick: 3, full: 7 },
  },
  {
    id: 'idea_to_experiment',
    name: 'Idea → Experiment design',
    description: 'Design objectives, variables, controls, and a stepwise methodology from a question.',
    needsSource: false,
    estimatedMinutes: { quick: 2, full: 4 },
  },
];

const journeyIcon = (id: JourneyType) => {
  if (id.includes('presentation')) return PresentationChartLineIcon;
  if (id.includes('experiment')) return BeakerIcon;
  if (id.includes('evidence')) return ChartBarIcon;
  return DocumentTextIcon;
};

const ResearchJourneyPage: React.FC<{ embedded?: boolean; paperOnly?: boolean }> = ({
  embedded = false,
  paperOnly = false,
}) => {
  const navigate = useNavigate();
  const apiBase = resolveApiBaseUrl();
  const [searchParams] = useSearchParams();
  const [journeys, setJourneys] = useState<JourneyMeta[]>(FALLBACK_JOURNEYS);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const defaultType = (searchParams.get('type') as JourneyType) || 'idea_to_paper';
  const [journeyType, setJourneyType] = useState<JourneyType>(
    paperOnly && defaultType.includes('presentation')
      ? 'idea_to_paper'
      : defaultType
  );
  const [depth, setDepth] = useState<Depth>('quick');
  const [includeLiterature, setIncludeLiterature] = useState(false);
  const [researchQuestion, setResearchQuestion] = useState(
    searchParams.get('q') || ''
  );
  const [background, setBackground] = useState('');
  const [sourceKind, setSourceKind] = useState<'lab_notebook' | 'experiment' | 'research_data'>(
    (searchParams.get('sourceType') as any) || 'research_data'
  );
  const [sourceId, setSourceId] = useState(searchParams.get('sourceId') || '');
  const [sourceOptions, setSourceOptions] = useState<SourceOption[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [running, setRunning] = useState(false);
  const [savingDoc, setSavingDoc] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JourneyRunResult | null>(null);

  const visibleJourneys = useMemo(() => {
    if (!paperOnly) return journeys;
    return journeys.filter(
      (j) => j.id === 'idea_to_paper' || j.id === 'evidence_to_paper'
    );
  }, [journeys, paperOnly]);

  const selectedMeta = useMemo(
    () => visibleJourneys.find((j) => j.id === journeyType) || visibleJourneys[0] || FALLBACK_JOURNEYS[0],
    [visibleJourneys, journeyType]
  );

  useEffect(() => {
    void (async () => {
      try {
        const res = await axios.get('/api/orchestrator/journeys', {
          headers: getAuthHeaders(),
        });
        if (res.data?.journeys?.length) setJourneys(res.data.journeys);
      } catch {
        /* use fallback */
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedMeta.needsSource) return;
    void loadSources(sourceKind);
  }, [selectedMeta.needsSource, sourceKind]);

  const loadSources = async (kind: typeof sourceKind) => {
    setLoadingSources(true);
    try {
      if (kind === 'research_data') {
        const res = await axios.get('/api/data/results', { headers: getAuthHeaders() });
        const rows = res.data?.results || [];
        setSourceOptions(
          rows.slice(0, 40).map((r: any) => ({
            id: String(r.id),
            label: r.title || 'Untitled pack',
            kind: 'research_data' as const,
          }))
        );
      } else if (kind === 'lab_notebook') {
        const res = await axios.get('/api/lab-notebooks', { headers: getAuthHeaders() });
        const rows = res.data?.entries || res.data?.notebooks || res.data || [];
        const list = Array.isArray(rows) ? rows : [];
        setSourceOptions(
          list.slice(0, 40).map((r: any) => ({
            id: String(r.id),
            label: r.title || 'Untitled note',
            kind: 'lab_notebook' as const,
          }))
        );
      } else {
        const res = await axios.get('/api/experiments', { headers: getAuthHeaders() });
        const rows = res.data?.experiments || res.data || [];
        const list = Array.isArray(rows) ? rows : [];
        setSourceOptions(
          list.slice(0, 40).map((r: any) => ({
            id: String(r.id),
            label: r.title || 'Untitled experiment',
            kind: 'experiment' as const,
          }))
        );
      }
    } catch (e) {
      console.error(e);
      setSourceOptions([]);
    } finally {
      setLoadingSources(false);
    }
  };

  const runJourney = async () => {
    if (!researchQuestion.trim()) {
      setError('Enter a research question or idea to continue.');
      return;
    }
    if (selectedMeta.needsSource && !sourceId) {
      setError('Select a notebook entry, experiment, or evidence pack.');
      return;
    }

    setRunning(true);
    setError(null);
    setResult(null);
    setStep(3);

    try {
      const payload: Record<string, unknown> = {
        journeyType,
        researchQuestion: researchQuestion.trim(),
        idea: researchQuestion.trim(),
        background: background.trim() || undefined,
        depth,
        includeLiterature,
        presentationType: 'seminar',
        target: { style: 'APA' },
      };
      if (selectedMeta.needsSource && sourceId) {
        payload.dataSource = {
          type: sourceKind,
          sourceId,
        };
      }

      const res = await axios.post('/api/orchestrator/journey', payload, {
        headers: getAuthHeaders(),
        timeout: 600_000,
      });

      if (!res.data?.success && !res.data?.result) {
        throw new Error(res.data?.error || 'Journey failed');
      }
      setResult(res.data.result as JourneyRunResult);
      if (!res.data.success && res.data.result?.error) {
        setError(res.data.result.error);
      }
    } catch (e: unknown) {
      setError(formatApiNetworkError(e, 'Journey failed'));
    } finally {
      setRunning(false);
    }
  };

  const paper = result?.artifacts?.paper?.paper;
  const slides = result?.artifacts?.presentation?.presentation?.slides;
  const design = result?.artifacts?.experimentDesign?.design;

  const openPaperInCompose = async () => {
    if (!paper) return;
    setSavingDoc(true);
    setError(null);
    try {
      const content = paperArtifactToWritingDraft(paper as Record<string, unknown>);
      const res = await axios.post(
        `${apiBase}/writing/documents`,
        {
          templateId: 'paper_imrad_journal',
          title: content.title || researchQuestion.slice(0, 120) || 'Journey paper draft',
          content,
          metadata: {
            source: 'research_journey',
            journeyType: result?.journeyType,
            researchQuestion: result?.researchQuestion,
          },
        },
        { headers: getAuthHeaders() }
      );
      const docId = res.data?.document?.id;
      if (!docId) throw new Error('Document was created but no id was returned');
      navigate(`/writing-studio/m/${encodeURIComponent(docId)}`);
    } catch (e: any) {
      setError(formatApiNetworkError(e) || e?.message || 'Could not open draft in Compose');
    } finally {
      setSavingDoc(false);
    }
  };

  return (
    <div className={`max-w-5xl mx-auto space-y-6 ${embedded ? 'px-4 py-5 sm:px-6' : ''}`}>
      {!embedded && (
        <PageHeader
          title="Research journey"
          accent="teal"
          icon={<SparklesIcon />}
          subtitle="Guided paths from idea or evidence to a paper draft, slides, or experiment design"
        />
      )}
      {embedded ? (
        <div className="ws-rise">
          <p className="ws-kicker">Seed a manuscript</p>
          <p className="mt-1 text-[13px] text-[var(--ws-ink-soft)]">
            Choose a path — the result becomes an editable draft on your desk.
          </p>
        </div>
      ) : null}

      {/* Progress */}
      <div className="flex items-center gap-2 text-[12px] text-slate-600">
        {[
          { n: 1 as const, label: 'Choose path' },
          { n: 2 as const, label: 'Add context' },
          { n: 3 as const, label: 'Results' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            {i > 0 && <ArrowRightIcon className="w-3.5 h-3.5 text-slate-300" />}
            <button
              type="button"
              onClick={() => !running && setStep(s.n)}
              className={`px-2.5 py-1 rounded-md border ${
                step === s.n
                  ? 'bg-teal-800 text-white border-teal-800'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s.n}. {s.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleJourneys.map((j) => {
              const Icon = journeyIcon(j.id);
              const active = journeyType === j.id;
              return (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => setJourneyType(j.id)}
                  className={`text-left rounded-2xl border px-4 py-4 transition-colors ${
                    active
                      ? 'border-teal-400 bg-teal-50/70 ring-1 ring-teal-200'
                      : 'border-slate-200 bg-white hover:border-teal-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-800 text-white">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-slate-900">{j.name}</p>
                      <p className="mt-1 text-[12px] text-slate-600 leading-relaxed">
                        {j.description}
                      </p>
                      <p className="mt-2 text-[11px] text-slate-500">
                        ~{j.estimatedMinutes.quick}–{j.estimatedMinutes.full} min
                        {j.needsSource ? ' · needs source data' : ''}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 px-4 py-2 text-[13px] font-medium text-white hover:bg-teal-900"
            >
              Continue
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <label className="text-[12px] font-semibold text-slate-700">
              Research question / idea
            </label>
            <textarea
              value={researchQuestion}
              onChange={(e) => setResearchQuestion(e.target.value)}
              rows={3}
              placeholder="What question are you answering?"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-slate-700">
              Background (optional)
            </label>
            <textarea
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              rows={2}
              placeholder="Prior findings, constraints, or why this matters"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {selectedMeta.needsSource && (
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <p className="text-[12px] font-semibold text-slate-700">Source data</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['research_data', 'Evidence pack'],
                    ['lab_notebook', 'Notebook'],
                    ['experiment', 'Experiment'],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setSourceKind(k);
                      setSourceId('');
                    }}
                    className={`rounded-md px-2.5 py-1 text-[12px] border ${
                      sourceKind === k
                        ? 'bg-teal-800 text-white border-teal-800'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {loadingSources ? (
                <p className="text-[12px] text-slate-500">Loading sources…</p>
              ) : (
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px]"
                >
                  <option value="">Select…</option>
                  {sourceOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
              {sourceOptions.length === 0 && !loadingSources && (
                <p className="text-[12px] text-amber-800">
                  No sources found.{' '}
                  <Link to="/data-results" className="underline">
                    Create an evidence pack
                  </Link>{' '}
                  or open your notebook first.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-[12px] font-semibold text-slate-700 mb-1">Depth</p>
              <div className="flex gap-2">
                {(['quick', 'full'] as Depth[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepth(d)}
                    className={`rounded-md px-3 py-1.5 text-[12px] border capitalize ${
                      depth === d
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {d} (~{selectedMeta.estimatedMinutes[d]} min)
                  </button>
                ))}
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-[13px] text-slate-700 mt-5">
              <input
                type="checkbox"
                checked={includeLiterature}
                onChange={(e) => setIncludeLiterature(e.target.checked)}
                className="rounded border-slate-300"
              />
              Include literature scan
            </label>
          </div>

          {error && step === 2 && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800">
              {error}
            </p>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-700"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => void runJourney()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 px-4 py-2 text-[13px] font-medium text-white hover:bg-teal-900"
            >
              <SparklesIcon className="w-4 h-4" />
              Run journey
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          {running && (
            <div className="rounded-2xl border border-teal-200 bg-teal-50/50 px-5 py-8 text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
              <p className="text-[14px] font-medium text-teal-950">
                Running {selectedMeta.name}…
              </p>
              <p className="mt-1 text-[12px] text-teal-800/80">
                Agents are refining hypotheses, reading your data, and drafting outputs. This can
                take a few minutes.
              </p>
            </div>
          )}

          {error && !running && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-800">
              {error}
            </p>
          )}

          {result && !running && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="text-[14px] font-semibold text-slate-900">
                      {result.success ? 'Journey complete' : 'Journey finished with issues'}
                    </p>
                    <p className="text-[12px] text-slate-500">
                      {(result.totalDurationMs / 1000).toFixed(1)}s · {result.researchQuestion}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setStep(1);
                    }}
                    className="text-[12px] font-medium text-teal-800 hover:underline"
                  >
                    Start another
                  </button>
                </div>

                <ol className="space-y-2">
                  {(result.steps || []).map((s) => (
                    <li
                      key={s.id}
                      className="flex items-start gap-2 rounded-lg border border-slate-100 px-3 py-2 text-[12px]"
                    >
                      <span
                        className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                          s.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : s.status === 'skipped'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {s.status === 'completed' ? (
                          <CheckIcon className="w-3 h-3" />
                        ) : (
                          <span className="text-[10px]">{s.status === 'skipped' ? '–' : '!'}</span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800">{s.name}</p>
                        <p className="text-slate-500">
                          {s.error || s.summary || s.status}
                          {s.durationMs > 0 ? ` · ${(s.durationMs / 1000).toFixed(1)}s` : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {paper && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[15px] font-semibold text-slate-900">
                      {paper.title || 'Paper draft'}
                    </h3>
                    <button
                      type="button"
                      disabled={savingDoc}
                      onClick={() => void openPaperInCompose()}
                      className="rounded-lg bg-teal-800 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-teal-900 disabled:opacity-60"
                    >
                      {savingDoc ? 'Saving…' : 'Continue in Compose'}
                    </button>
                  </div>
                  {(['abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion'] as const).map(
                    (sec) =>
                      paper[sec] ? (
                        <div key={sec}>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {sec}
                          </p>
                          <div className="mt-1 whitespace-pre-wrap text-[13px] text-slate-800 leading-relaxed">
                            {String(paper[sec])}
                          </div>
                        </div>
                      ) : null
                  )}
                </div>
              )}

              {slides && Array.isArray(slides) && !paperOnly && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[15px] font-semibold text-slate-900">
                      {result.artifacts.presentation?.presentation?.title || 'Slides'}
                    </h3>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {slides.map((slide: any) => (
                      <div
                        key={slide.number || slide.title}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3"
                      >
                        <p className="text-[11px] font-semibold text-teal-800">
                          Slide {slide.number}
                        </p>
                        <p className="text-[13px] font-medium text-slate-900 mt-0.5">
                          {slide.title}
                        </p>
                        <p className="mt-1 text-[12px] text-slate-600 whitespace-pre-wrap">
                          {slide.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {design && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                  <h3 className="text-[15px] font-semibold text-slate-900">
                    {design.title || 'Experiment design'}
                  </h3>
                  {design.hypothesis && (
                    <p className="text-[13px] text-slate-700">
                      <span className="font-semibold">Hypothesis: </span>
                      {design.hypothesis}
                    </p>
                  )}
                  {design.methodology?.overview && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase text-slate-500">
                        Methodology
                      </p>
                      <p className="text-[13px] text-slate-800 whitespace-pre-wrap mt-1">
                        {design.methodology.overview}
                      </p>
                    </div>
                  )}
                  {Array.isArray(design.methodology?.procedures) && (
                    <ol className="list-decimal pl-4 space-y-1 text-[13px] text-slate-800">
                      {design.methodology.procedures.map((p: any) => (
                        <li key={p.step}>{p.description}</li>
                      ))}
                    </ol>
                  )}
                </div>
              )}

              {result.artifacts.hypothesis?.hypotheses && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase text-slate-500 mb-2">
                    Hypotheses
                  </p>
                  <ul className="space-y-2">
                    {result.artifacts.hypothesis.hypotheses.map((h: any) => (
                      <li
                        key={h.id || h.hypothesis}
                        className="rounded-lg border border-slate-100 px-3 py-2 text-[13px] text-slate-800"
                      >
                        {h.hypothesis}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ResearchJourneyPage;
