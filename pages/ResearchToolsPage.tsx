import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FEATURED_TOOL_IDS,
  KIND_LABEL,
  LAB_TOOLS,
  TOOL_CATEGORIES,
  ToolCategoryId,
  ToolDef,
  ToolKind,
  WORKFLOW_KITS,
  getToolById,
} from '../utils/toolCatalog';
import { ToolResultsPanel } from '../components/tools/ToolVisuals';
import { MagnifyingGlassIcon } from '../components/icons';

const KIND_FILTER: { id: ToolKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All kinds' },
  { id: 'calculator', label: 'Calculators' },
  { id: 'designer', label: 'Designers' },
  { id: 'simulator', label: 'Simulators' },
  { id: 'visualizer', label: 'Visualizers' },
];

const CATEGORY_FROM_QUERY: Record<string, ToolCategoryId> = {
  solutions: 'solutions',
  molecular: 'molecular',
  bioinformatics: 'sequence',
  sequence: 'sequence',
  cells: 'cells',
  kinetics: 'kinetics',
  design: 'design',
};

const ResearchToolsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const toolParam = params.get('tool');
  const tabParam = (params.get('tab') || '').toLowerCase();
  const workflowParam = params.get('workflow');

  const initialCategory: ToolCategoryId | 'all' =
    CATEGORY_FROM_QUERY[tabParam] || 'all';

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ToolCategoryId | 'all'>(initialCategory);
  const [kind, setKind] = useState<ToolKind | 'all'>('all');
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(
    workflowParam && WORKFLOW_KITS.some((w) => w.id === workflowParam) ? workflowParam : null
  );
  const [activeId, setActiveId] = useState(() => {
    if (toolParam && getToolById(toolParam)) return toolParam;
    if (workflowParam) {
      const kit = WORKFLOW_KITS.find((w) => w.id === workflowParam);
      if (kit?.toolIds[0]) return kit.toolIds[0];
    }
    if (tabParam === 'bioinformatics' || tabParam === 'sequence') return 'sequence-browser';
    if (tabParam === 'molecular') return 'primer-designer';
    return 'primer-designer';
  });
  const [values, setValues] = useState<Record<string, string>>({});

  const active = getToolById(activeId) || LAB_TOOLS[0];
  const workflow = WORKFLOW_KITS.find((w) => w.id === activeWorkflow) || null;

  useEffect(() => {
    const defaults = active.defaults || {};
    setValues({ ...defaults });
  }, [activeId, active.defaults]);

  useEffect(() => {
    const currentTool = params.get('tool');
    const currentWorkflow = params.get('workflow');
    const nextWorkflow = activeWorkflow || '';
    if (currentTool === activeId && (currentWorkflow || '') === nextWorkflow && !params.get('tab')) {
      return;
    }
    const n = new URLSearchParams(params);
    n.set('tool', activeId);
    if (activeWorkflow) n.set('workflow', activeWorkflow);
    else n.delete('workflow');
    n.delete('tab');
    setParams(n, { replace: true });
  }, [activeId, activeWorkflow, params, setParams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = workflow
      ? (workflow.toolIds.map((id) => getToolById(id)).filter(Boolean) as ToolDef[])
      : LAB_TOOLS;
    return pool.filter((t) => {
      if (!workflow && category !== 'all' && t.category !== category) return false;
      if (!workflow && kind !== 'all' && t.kind !== kind) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.kind.includes(q) ||
        t.category.includes(q)
      );
    });
  }, [query, category, kind, workflow]);

  const result = useMemo(() => active.compute(values), [active, values]);

  const featured = FEATURED_TOOL_IDS.map((id) => getToolById(id)).filter(Boolean) as ToolDef[];

  const selectTool = (id: string, keepWorkflow = false) => {
    setActiveId(id);
    if (!keepWorkflow) setActiveWorkflow(null);
    setCategory('all');
    setKind('all');
  };

  const startWorkflow = (id: string) => {
    const kit = WORKFLOW_KITS.find((w) => w.id === id);
    if (!kit) return;
    setActiveWorkflow(id);
    setActiveId(kit.toolIds[0]);
    setCategory('all');
    setKind('all');
    setQuery('');
  };

  const loadSample = () => {
    if (!active.sample) return;
    setValues({ ...(active.defaults || {}), ...active.sample });
  };

  const workflowStepIndex = workflow ? workflow.toolIds.indexOf(activeId) : -1;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            Bench toolkit
          </p>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tools library</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Calculators, designers, and simulators with live charts - organized around how
                experiments actually get planned at the bench.
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools…"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Experiment kits
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {WORKFLOW_KITS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => startWorkflow(w.id)}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-left transition-colors ${
                    activeWorkflow === w.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-sm font-medium">{w.name}</div>
                  <div
                    className={`mt-0.5 max-w-[14rem] text-[11px] ${
                      activeWorkflow === w.id ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {w.summary}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Jump to tool
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {featured.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTool(t.id)}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-left transition-colors ${
                    activeId === t.id && !activeWorkflow
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-medium uppercase tracking-wide opacity-70">
                    {KIND_LABEL[t.kind]}
                  </div>
                  <div className="text-sm font-medium">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)_minmax(280px,340px)] sm:px-6 lg:px-8">
        <aside className="space-y-3">
          {workflow ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Kit in progress
                  </p>
                  <p className="text-sm font-semibold text-slate-900">{workflow.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveWorkflow(null)}
                  className="text-[10px] font-medium uppercase tracking-wide text-slate-400 hover:text-slate-700"
                >
                  Exit
                </button>
              </div>
              <ol className="mt-3 space-y-1">
                {workflow.toolIds.map((id, i) => {
                  const t = getToolById(id);
                  if (!t) return null;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => selectTool(id, true)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs ${
                          activeId === id
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                            activeId === id
                              ? 'bg-white text-slate-900'
                              : i < workflowStepIndex
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {i + 1}
                        </span>
                        {t.name}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-1">
                {TOOL_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      category === c.id
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {KIND_FILTER.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKind(k.id)}
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      kind === k.id
                        ? 'bg-slate-700 text-white'
                        : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <nav className="max-h-[70vh] space-y-0.5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1">
            {filtered.length === 0 && (
              <p className="px-3 py-8 text-center text-xs text-slate-500">No matching tools</p>
            )}
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTool(t.id, Boolean(workflow))}
                className={`w-full rounded-lg px-3 py-2.5 text-left ${
                  activeId === t.id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{t.name}</span>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">
                    {KIND_LABEL[t.kind]}
                  </span>
                </div>
                <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{t.summary}</div>
              </button>
            ))}
          </nav>
        </aside>

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  {KIND_LABEL[active.kind]}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">
                  {TOOL_CATEGORIES.find((c) => c.id === active.category)?.label}
                </span>
              </div>
              {active.sample && (
                <button
                  type="button"
                  onClick={loadSample}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Load example
                </button>
              )}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">{active.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{active.summary}</p>
            {active.formula && (
              <p className="mt-2 font-mono text-xs text-slate-600">{active.formula}</p>
            )}
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {active.fields.map((field) => (
              <label
                key={field.id}
                className={`block ${field.kind === 'text' ? 'sm:col-span-2' : ''}`}
              >
                <span className="text-sm text-slate-700">
                  {field.label}
                  {field.unit ? (
                    <span className="ml-1 text-xs text-slate-400">({field.unit})</span>
                  ) : null}
                </span>
                {field.kind === 'text' ? (
                  <textarea
                    value={values[field.id] || ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                    rows={5}
                    placeholder={field.placeholder}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-slate-400 focus:outline-none"
                  />
                ) : field.kind === 'select' ? (
                  <select
                    value={values[field.id] || field.options?.[0]?.value || ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  >
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    step="any"
                    value={values[field.id] || ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  />
                )}
                {field.hint && <span className="mt-1 block text-xs text-slate-400">{field.hint}</span>}
              </label>
            ))}
          </div>

          {workflow && workflowStepIndex >= 0 && workflowStepIndex < workflow.toolIds.length - 1 && (
            <div className="border-t border-slate-200 px-5 py-3">
              <button
                type="button"
                onClick={() => selectTool(workflow.toolIds[workflowStepIndex + 1], true)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Next in kit → {getToolById(workflow.toolIds[workflowStepIndex + 1])?.name}
              </button>
            </div>
          )}
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Live output
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Charts, scores, and copyable sequences update as you type
            </p>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-4">
            <ToolResultsPanel result={result} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ResearchToolsPage;
