import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SparklesIcon,
  DocumentTextIcon,
} from '../components/icons';
import { getAuthToken, resolveApiBaseUrl, formatApiNetworkError } from '../utils/apiBase';

type Tab =
  | 'discover'
  | 'library'
  | 'collections'
  | 'evidence'
  | 'checker'
  | 'ask'
  | 'detail';

type Paper = {
  id?: string;
  title: string;
  abstract?: string | null;
  publicationYear?: number | null;
  doi?: string | null;
  pmid?: string | null;
  journalName?: string | null;
  authors?: Array<{ name: string }>;
  citationCount?: number | null;
  isOpenAccess?: boolean;
  pdfUrl?: string | null;
  sourceUrl?: string | null;
  openalexId?: string | null;
};

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'discover', label: 'Discover' },
  { id: 'library', label: 'My Library' },
  { id: 'collections', label: 'Collections' },
  { id: 'evidence', label: 'Evidence Finder' },
  { id: 'checker', label: 'Citation Checker' },
  { id: 'ask', label: 'Ask Paper' },
];

const EvidenceReferencesPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const apiBase = resolveApiBaseUrl();
  const token = typeof localStorage !== 'undefined' ? getAuthToken() : null;
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'discover');

  const [q, setQ] = useState('');
  const [sort, setSort] = useState('relevance');
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [biomedical, setBiomedical] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [results, setResults] = useState<Paper[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [library, setLibrary] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [newCollection, setNewCollection] = useState('');
  const [detail, setDetail] = useState<Paper | null>(null);
  const [related, setRelated] = useState<{ related: Paper[]; citedBy: Paper[]; references: Paper[] }>({
    related: [],
    citedBy: [],
    references: [],
  });
  const [claim, setClaim] = useState('');
  const [evidenceResults, setEvidenceResults] = useState<any[]>([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [checkPaperIds, setCheckPaperIds] = useState<string[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [askQuestion, setAskQuestion] = useState('What were the main findings?');
  const [askAnswer, setAskAnswer] = useState('');
  const [askPassages, setAskPassages] = useState<any[]>([]);
  const [importText, setImportText] = useState('');

  const authHeaders = useCallback(
    (): HeadersInit => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const switchTab = (t: Tab) => {
    setTab(t);
    if (embedded) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next, { replace: true });
  };

  const loadLibrary = async () => {
    const res = await fetch(`${apiBase}/research/library`, { headers: authHeaders() });
    const data = await res.json();
    if (res.ok) setLibrary(data.items || []);
  };

  const loadCollections = async () => {
    const res = await fetch(`${apiBase}/research/collections`, { headers: authHeaders() });
    const data = await res.json();
    if (res.ok) setCollections(data.collections || []);
  };

  useEffect(() => {
    if (!token) return;
    void loadLibrary();
    void loadCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const paperKey = (p: Paper, i: number) => p.id || p.doi || p.pmid || `tmp-${i}`;

  const runSearch = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: q.trim(),
        sort,
        limit: '20',
      });
      if (openAccessOnly) params.set('openAccess', '1');
      if (biomedical) params.set('biomedical', '1');
      const res = await fetch(`${apiBase}/research/search?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setResults(data.papers || []);
      setSelected(new Set());
    } catch (e: unknown) {
      setError(formatApiNetworkError(e) || (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const savePapers = async (papers: Paper[]) => {
    setError(null);
    try {
      const res = await fetch(`${apiBase}/research/library`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ papers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMessage(`Saved ${data.saved?.length || papers.length} to library`);
      void loadLibrary();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const openDetail = async (paper: Paper) => {
    setDetail(paper);
    setTab('detail');
    if (paper.id) {
      try {
        const res = await fetch(`${apiBase}/research/papers/${paper.id}/related`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (res.ok) {
          setRelated({
            related: data.related || [],
            citedBy: data.citedBy || [],
            references: data.references || [],
          });
          if (data.paper) setDetail(data.paper);
        }
      } catch {
        /* optional */
      }
    }
  };

  const ensureStored = async (paper: Paper): Promise<Paper> => {
    if (paper.id) return paper;
    const res = await fetch(`${apiBase}/research/library`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ papers: [paper] }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not store paper');
    return data.saved?.[0]?.paper || paper;
  };

  const runEvidence = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/research/evidence/find`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ claim }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Evidence search failed');
      setEvidenceResults(data.results || []);
      setDisclaimer(data.disclaimer || '');
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const runChecker = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/research/evidence/check`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ claim, paperIds: checkPaperIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      setAssessments(data.assessments || []);
      setDisclaimer(data.disclaimer || '');
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const runAsk = async () => {
    setLoading(true);
    setError(null);
    try {
      const ids =
        checkPaperIds.length > 0
          ? checkPaperIds
          : library.slice(0, 1).map((i) => i.paperId).filter(Boolean);
      const res = await fetch(`${apiBase}/research/papers/ask`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ paperIds: ids, question: askQuestion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ask failed');
      setAskAnswer(data.answer || '');
      setAskPassages(data.passages || []);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async () => {
    if (!newCollection.trim()) return;
    const res = await fetch(`${apiBase}/research/collections`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: newCollection.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed');
      return;
    }
    setNewCollection('');
    void loadCollections();
  };

  const importRefs = async (format: 'bibtex' | 'ris') => {
    const res = await fetch(`${apiBase}/research/import`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ format, text: importText }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Import failed');
      return;
    }
    setMessage(`Imported ${data.count} references`);
    setImportText('');
    void loadLibrary();
  };

  const exportLib = async (format: string) => {
    const res = await fetch(`${apiBase}/research/export`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        format,
        style: 'apa',
        paperIds: library.map((i) => i.paperId),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Export failed');
      return;
    }
    await navigator.clipboard.writeText(data.content || '');
    setMessage(`Copied ${format} export to clipboard`);
  };

  const uploadPdf = async (paperId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${apiBase}/research/library/${paperId}/pdf`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Upload failed');
      return;
    }
    setMessage(`PDF indexed (${data.chunks} chunks)`);
    void loadLibrary();
  };

  const authorLine = (p: Paper) =>
    (p.authors || [])
      .slice(0, 4)
      .map((a) => a.name)
      .join(', ') + ((p.authors?.length || 0) > 4 ? ' et al.' : '');

  const PaperCard = ({ paper, i }: { paper: Paper; i: number }) => {
    const key = paperKey(paper, i);
    const checked = selected.has(key);
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => {
              setSelected((prev) => {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                return next;
              });
            }}
          />
          <div className="min-w-0 flex-1">
            <button
              type="button"
              className="text-left text-[14px] font-semibold text-slate-900 hover:text-teal-800"
              onClick={() => void openDetail(paper)}
            >
              {paper.title}
            </button>
            <p className="mt-1 text-[12px] text-slate-500">
              {authorLine(paper)}
              {paper.publicationYear ? ` · ${paper.publicationYear}` : ''}
              {paper.journalName ? ` · ${paper.journalName}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {paper.isOpenAccess ? (
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                  Open Access
                </span>
              ) : null}
              {paper.pdfUrl ? (
                <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-800">
                  PDF
                </span>
              ) : null}
              {paper.pmid ? (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                  PMID {paper.pmid}
                </span>
              ) : null}
              {paper.citationCount != null ? (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-900">
                  Cited {paper.citationCount}
                </span>
              ) : null}
            </div>
            {paper.abstract ? (
              <p className="mt-2 line-clamp-3 text-[12px] text-slate-600">{paper.abstract}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => void savePapers([paper])}
              >
                Save to Library
              </Button>
              <Button variant="ghost" onClick={() => void openDetail(paper)}>
                Details
              </Button>
              {paper.sourceUrl || paper.doi ? (
                <a
                  className="inline-flex items-center rounded-lg px-3 py-2 text-[12px] text-teal-800 hover:underline"
                  href={paper.sourceUrl || `https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              ) : null}
              <Link
                to={`/writing-studio/new/research_paper?cite=${encodeURIComponent(paper.id || paper.doi || '')}`}
                className="inline-flex items-center rounded-lg px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50"
              >
                Cite in Writing Studio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const bulkSelectedPapers = useMemo(() => {
    return results.filter((p, i) => selected.has(paperKey(p, i)));
  }, [results, selected]);

  return (
    <div className={`mx-auto max-w-6xl space-y-5 px-4 ${embedded ? 'py-4' : 'py-6'} sm:px-6`}>
      {!embedded && (
        <PageHeader
          title="Evidence & References"
          accent="teal"
          icon={<BookOpenIcon className="h-6 w-6" />}
          subtitle="Discover literature via OpenAlex and biomedical sources, build your library, and ground claims in real papers — not invented citations."
        />
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchTab(t.id)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${
              tab === t.id || (tab === 'detail' && t.id === 'discover' && detail)
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
        {!embedded && (
          <Link
            to="/writing-studio"
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white"
          >
            <DocumentTextIcon className="h-3.5 w-3.5" />
            Back to drafts
          </Link>
        )}
      </div>

      {(error || message) && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            error
              ? 'border border-rose-200 bg-rose-50 text-rose-800'
              : 'border border-teal-200 bg-teal-50 text-teal-900'
          }`}
        >
          {error || message}
        </p>
      )}

      {tab === 'discover' && (
        <div className="space-y-4">
          <Card>
            <div className="space-y-3 p-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void runSearch()}
                  placeholder="Search papers by topic, title, author, DOI or PMID…"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[14px]"
                />
                <Button variant="primary" disabled={loading} onClick={() => void runSearch()}>
                  <span className="inline-flex items-center gap-1">
                    <MagnifyingGlassIcon className="h-4 w-4" />
                    {loading ? 'Searching…' : 'Search'}
                  </span>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-600">
                <label className="inline-flex items-center gap-1">
                  Sort
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="rounded border border-slate-200 px-2 py-1"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="cited">Most cited</option>
                  </select>
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={openAccessOnly}
                    onChange={(e) => setOpenAccessOnly(e.target.checked)}
                  />
                  Open access only
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={biomedical}
                    onChange={(e) => setBiomedical(e.target.checked)}
                  />
                  Enrich biomedical (PubMed / Europe PMC)
                </label>
              </div>
              {selected.size > 0 ? (
                <Button variant="secondary" onClick={() => void savePapers(bulkSelectedPapers)}>
                  Save selected ({selected.size})
                </Button>
              ) : null}
            </div>
          </Card>
          <div className="space-y-3">
            {results.map((p, i) => (
              <PaperCard key={paperKey(p, i)} paper={p} i={i} />
            ))}
            {!loading && results.length === 0 ? (
              <p className="text-sm text-slate-500">
                Search academic literature to get started. Results come from OpenAlex (and PubMed /
                Europe PMC when biomedical enrichment is on).
              </p>
            ) : null}
          </div>
        </div>
      )}

      {tab === 'library' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void exportLib('bibliography')}>
              Copy bibliography
            </Button>
            <Button variant="ghost" onClick={() => void exportLib('bibtex')}>
              Copy BibTeX
            </Button>
            <Button variant="ghost" onClick={() => void exportLib('ris')}>
              Copy RIS
            </Button>
            <Button variant="ghost" onClick={() => void exportLib('csv')}>
              Copy CSV
            </Button>
          </div>
          <Card>
            <div className="space-y-2 p-4">
              <p className="text-[12px] font-medium text-slate-700">Import BibTeX or RIS</p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-[11px]"
                placeholder="Paste BibTeX or RIS…"
              />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => void importRefs('bibtex')}>
                  Import BibTeX
                </Button>
                <Button variant="ghost" onClick={() => void importRefs('ris')}>
                  Import RIS
                </Button>
              </div>
            </div>
          </Card>
          {library.length === 0 ? (
            <p className="text-sm text-slate-500">
              Your research library is empty. Search academic literature or upload a paper to get
              started.
            </p>
          ) : (
            <ul className="space-y-3">
              {library.map((item) => (
                <li key={item.libraryItemId} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-semibold text-slate-900">
                        {item.paper?.title}
                      </p>
                      <p className="text-[12px] text-slate-500">
                        {item.paper?.publicationYear}
                        {item.paper?.doi ? ` · ${item.paper.doi}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          await fetch(`${apiBase}/research/library/${item.paperId}`, {
                            method: 'PATCH',
                            headers: authHeaders(),
                            body: JSON.stringify({ isFavorite: !item.isFavorite }),
                          });
                          void loadLibrary();
                        }}
                      >
                        {item.isFavorite ? 'Unstar' : 'Star'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          const title = item.paper?.title || 'this reference';
                          if (!window.confirm(`Remove “${String(title).slice(0, 80)}” from your library?`)) {
                            return;
                          }
                          const res = await fetch(
                            `${apiBase}/research/library/${encodeURIComponent(item.paperId)}`,
                            { method: 'DELETE', headers: authHeaders() }
                          );
                          if (!res.ok) {
                            const data = await res.json().catch(() => ({}));
                            setError(data.error || 'Could not remove from library');
                            return;
                          }
                          // Also clear linked writing citation if present
                          try {
                            await fetch(
                              `${apiBase}/writing/citations/${encodeURIComponent(item.paperId)}?fromLibrary=true`,
                              { method: 'DELETE', headers: authHeaders() }
                            );
                          } catch {
                            /* optional */
                          }
                          void loadLibrary();
                        }}
                      >
                        Remove
                      </Button>
                      <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-[12px] hover:bg-slate-50">
                        Upload PDF
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void uploadPdf(item.paperId, f);
                          }}
                        />
                      </label>
                      <label className="inline-flex items-center gap-1 text-[12px]">
                        <input
                          type="checkbox"
                          checked={checkPaperIds.includes(item.paperId)}
                          onChange={(e) => {
                            setCheckPaperIds((prev) =>
                              e.target.checked
                                ? [...prev, item.paperId]
                                : prev.filter((id) => id !== item.paperId)
                            );
                          }}
                        />
                        Select
                      </label>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'collections' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={newCollection}
              onChange={(e) => setNewCollection(e.target.value)}
              placeholder="New collection name…"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
            />
            <Button variant="primary" onClick={() => void createCollection()}>
              <span className="inline-flex items-center gap-1">
                <PlusIcon className="h-4 w-4" />
                Create
              </span>
            </Button>
          </div>
          <ul className="space-y-2">
            {collections.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-[14px] font-medium text-slate-900">{c.name}</p>
                  <p className="text-[12px] text-slate-500">{c.paper_count || 0} papers</p>
                </div>
                <Button
                  variant="secondary"
                  disabled={checkPaperIds.length === 0}
                  onClick={async () => {
                    await fetch(`${apiBase}/research/collections/${c.id}/items`, {
                      method: 'POST',
                      headers: authHeaders(),
                      body: JSON.stringify({ paperIds: checkPaperIds }),
                    });
                    setMessage('Added selected papers to collection');
                    void loadCollections();
                  }}
                >
                  Add selected
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'evidence' && (
        <div className="space-y-4">
          <Card>
            <div className="space-y-3 p-4">
              <p className="text-[13px] text-slate-600">
                Paste a manuscript claim. We search scholarly sources and label candidates —
                never treat title similarity alone as proof of support.
              </p>
              <textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[14px]"
                placeholder="e.g. Artificial intelligence can improve early detection of infectious disease outbreaks."
              />
              <Button variant="primary" disabled={loading} onClick={() => void runEvidence()}>
                <span className="inline-flex items-center gap-1">
                  <SparklesIcon className="h-4 w-4" />
                  Find Evidence
                </span>
              </Button>
              {disclaimer ? (
                <p className="text-[11px] text-slate-500">{disclaimer}</p>
              ) : null}
            </div>
          </Card>
          <div className="space-y-3">
            {evidenceResults.map((r, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800">
                  {String(r.label).replace(/_/g, ' ')} · score {r.relevanceScore}
                </p>
                <p className="mt-1 text-[14px] font-semibold text-slate-900">{r.paper?.title}</p>
                <p className="mt-1 text-[12px] text-slate-500">{r.note}</p>
                {r.evidencePreview ? (
                  <p className="mt-2 text-[12px] text-slate-600">{r.evidencePreview}</p>
                ) : null}
                <div className="mt-2 flex gap-2">
                  <Button variant="secondary" onClick={() => void savePapers([r.paper])}>
                    Save
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'checker' && (
        <div className="space-y-4">
          <Card>
            <div className="space-y-3 p-4">
              <p className="text-[13px] text-slate-600">
                Check whether selected library papers (abstract or uploaded PDF) appear to support
                a claim.
              </p>
              <textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[14px]"
                placeholder="Claim sentence…"
              />
              <p className="text-[12px] text-slate-500">
                Selected papers: {checkPaperIds.length || 'none — select in My Library'}
              </p>
              <Button variant="primary" disabled={loading} onClick={() => void runChecker()}>
                Run Citation Checker
              </Button>
              {disclaimer ? (
                <p className="text-[11px] text-slate-500">{disclaimer}</p>
              ) : null}
            </div>
          </Card>
          <ul className="space-y-2">
            {assessments.map((a) => (
              <li key={a.paperId} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[12px] font-semibold uppercase text-slate-700">
                  {String(a.status).replace(/_/g, ' ')}
                </p>
                <p className="mt-1 text-[13px] text-slate-800">{a.explanation}</p>
                {a.excerpt ? (
                  <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-[11px] text-slate-600">
                    {a.excerpt}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'ask' && (
        <div className="space-y-4">
          <Card>
            <div className="space-y-3 p-4">
              <p className="text-[13px] text-slate-600">
                Ask questions over uploaded PDFs or indexed OA full text. Answers are restricted to
                retrieved passages.
              </p>
              <input
                value={askQuestion}
                onChange={(e) => setAskQuestion(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[14px]"
              />
              <p className="text-[12px] text-slate-500">
                Using {checkPaperIds.length || 1} selected / first library paper(s)
              </p>
              <Button variant="primary" disabled={loading} onClick={() => void runAsk()}>
                Ask
              </Button>
              {askAnswer ? (
                <div className="rounded-lg bg-slate-50 p-3 text-[13px] text-slate-800 whitespace-pre-wrap">
                  {askAnswer}
                </div>
              ) : null}
              {askPassages.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-slate-700">Passages</p>
                  {askPassages.map((p, i) => (
                    <pre
                      key={i}
                      className="max-h-28 overflow-y-auto whitespace-pre-wrap rounded border border-slate-100 p-2 text-[11px] text-slate-600"
                    >
                      {p.text}
                    </pre>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      )}

      {tab === 'detail' && detail && (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => switchTab('discover')}>
            ← Back
          </Button>
          <Card>
            <div className="space-y-3 p-5">
              <h2 className="text-xl font-semibold text-slate-900">{detail.title}</h2>
              <p className="text-[13px] text-slate-600">{authorLine(detail)}</p>
              <p className="text-[12px] text-slate-500">
                {[detail.journalName, detail.publicationYear, detail.doi, detail.pmid]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {detail.abstract ? (
                <p className="text-[14px] leading-relaxed text-slate-800">{detail.abstract}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={() =>
                    void ensureStored(detail).then((p) => savePapers([p]))
                  }
                >
                  Save
                </Button>
                {detail.sourceUrl || detail.doi ? (
                  <a
                    className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-[13px]"
                    href={detail.sourceUrl || `https://doi.org/${detail.doi}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open source
                  </a>
                ) : null}
              </div>
            </div>
          </Card>
          {(related.related.length > 0 || related.citedBy.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-slate-800">Related</h3>
                <div className="space-y-2">
                  {related.related.slice(0, 5).map((p, i) => (
                    <PaperCard key={paperKey(p, i)} paper={p} i={i} />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-slate-800">Cited by</h3>
                <div className="space-y-2">
                  {related.citedBy.slice(0, 5).map((p, i) => (
                    <PaperCard key={paperKey(p, i)} paper={p} i={i} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EvidenceReferencesPage;
