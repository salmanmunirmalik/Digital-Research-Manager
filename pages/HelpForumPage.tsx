import React, { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders, getAuthToken, resolveApiBaseUrl, formatApiNetworkError } from '../utils/apiBase';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import PostedBy from '../components/PostedBy';
import { canManageResource } from '../utils/ownership';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon,
} from '../components/icons';
import { PageHeader, PagePanel } from '../components/PageHeader';

const API_BASE = resolveApiBaseUrl();

const authHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getAuthToken() || ''}`,
});

type ForumResponse = {
  id: string;
  requestId: string;
  authorId: string;
  authorName: string;
  content: string;
  isSolution: boolean;
  upvotes: number;
  createdAt?: string;
};

type ForumRequest = {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  visibility: string;
  status: string;
  tags: string[];
  authorId: string;
  authorName: string;
  upvotes: number;
  views: number;
  createdAt?: string;
  responses: ForumResponse[];
};

const CATEGORIES = [
  'General',
  'Protocol',
  'Equipment',
  'Data Analysis',
  'Safety',
  'Collaboration',
  'Other',
];

const emptyForm = {
  title: '',
  description: '',
  category: 'General',
  urgency: 'Medium',
  visibility: 'public',
  tags: '',
};

const HelpForumPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ForumRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ForumRequest | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<ForumRequest | null>(null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/help-forum/requests`, { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load help forum');
      setRequests(data.requests || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return requests.filter((r) => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [requests, search, statusFilter, categoryFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (req: ForumRequest) => {
    setEditing(req);
    setForm({
      title: req.title,
      description: req.description,
      category: req.category,
      urgency: req.urgency,
      visibility: req.visibility,
      tags: (req.tags || []).join(', '),
    });
    setShowForm(true);
  };

  const saveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        urgency: form.urgency,
        visibility: form.visibility,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      const url = editing
        ? `${API_BASE}/help-forum/requests/${editing.id}`
        : `${API_BASE}/help-forum/requests`;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setShowForm(false);
      setEditing(null);
      await load();
      if (data.request) setSelected(data.request);
    } catch (err: any) {
      alert(err.message || 'Could not save request');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRequest = async (req: ForumRequest) => {
    if (!confirm(`Delete “${req.title}”?`)) return;
    try {
      const res = await fetch(`${API_BASE}/help-forum/requests/${req.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      if (selected?.id === req.id) setSelected(null);
      await load();
    } catch (err: any) {
      alert(err.message || 'Could not delete request');
    }
  };

  const openDetail = async (req: ForumRequest) => {
    try {
      const res = await fetch(`${API_BASE}/help-forum/requests/${req.id}`, {
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setSelected(data.request);
      setReply('');
      await load();
    } catch (err: any) {
      alert(err.message || 'Could not open request');
    }
  };

  const postReply = async () => {
    if (!selected || !reply.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/help-forum/requests/${selected.id}/responses`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ content: reply.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Reply failed');
      setReply('');
      await openDetail(selected);
    } catch (err: any) {
      alert(err.message || 'Could not post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteResponse = async (response: ForumResponse) => {
    if (!confirm('Delete this reply?')) return;
    try {
      const res = await fetch(`${API_BASE}/help-forum/responses/${response.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      if (selected) await openDetail(selected);
    } catch (err: any) {
      alert(err.message || 'Could not delete reply');
    }
  };

  const acceptSolution = async (response: ForumResponse) => {
    try {
      const res = await fetch(`${API_BASE}/help-forum/responses/${response.id}/accept`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Accept failed');
      if (selected) await openDetail(selected);
    } catch (err: any) {
      alert(err.message || 'Could not accept solution');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-4">
        <PageHeader
          title="Help forum"
          accent="amber"
          icon={<ChatBubbleLeftRightIcon />}
          subtitle="Ask peers for protocol help, troubleshooting, and lab advice. You can edit or delete your own posts."
          actions={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Ask a question
            </button>
          }
        />

        <PagePanel accent="amber">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-200 text-sm"
                placeholder="Search questions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </PagePanel>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 py-10 text-center">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600 py-10 text-center">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-900 mb-1">No questions yet</p>
          <p className="text-sm text-slate-500 mb-4">Be the first to ask the network.</p>
          <Button onClick={openCreate}>Ask a question</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const mine = canManageResource(req.authorId, user);
            return (
              <div
                key={req.id}
                className="rounded-xl border border-slate-200/80 bg-white p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    className="text-left min-w-0 flex-1"
                    onClick={() => void openDetail(req)}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-[15px] font-semibold text-slate-900">{req.title}</h2>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {req.status}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-900">
                        {req.urgency}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600 line-clamp-2">{req.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-slate-500">
                      <PostedBy name={req.authorName} />
                      <span>{req.category}</span>
                      <span>{req.responses?.length || 0} replies</span>
                      <span>{req.views || 0} views</span>
                    </div>
                  </button>
                  {mine && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(req)}
                        className="p-2 text-slate-500 hover:text-slate-800"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteRequest(req)}
                        className="p-2 text-slate-500 hover:text-red-600"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <form
            onSubmit={saveRequest}
            className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                {editing ? 'Edit question' : 'Ask a question'}
              </h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400">
                <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
            <div className="px-5 py-4 space-y-3">
              <label className="block text-xs font-medium text-slate-600">
                Title *
                    <input
                  required
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Details *
                <textarea
                  required
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm min-h-[120px]"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium text-slate-600">
                  Category
                  <select
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Urgency
                  <select
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={form.urgency}
                    onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value }))}
                  >
                    {['Low', 'Medium', 'High', 'Critical'].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-xs font-medium text-slate-600">
                Tags (comma-separated)
                <input
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                />
              </label>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : editing ? 'Save changes' : 'Post question'}
            </Button>
          </div>
        </form>
      </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{selected.title}</h2>
                <div className="mt-1 flex flex-wrap gap-2 text-[12px] text-slate-500">
                  <PostedBy name={selected.authorName} />
                  <span>{selected.status}</span>
                  <span>{selected.category}</span>
    </div>
        </div>
              <button type="button" onClick={() => setSelected(null)} className="text-slate-400">
                <XMarkIcon className="w-5 h-5" />
              </button>
          </div>
            <div className="px-5 py-4 space-y-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.description}</p>
              {(selected.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 text-slate-700">
                      {t}
              </span>
            ))}
          </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Replies ({selected.responses?.length || 0})
                </h3>
                <div className="space-y-3">
                  {(selected.responses || []).length === 0 ? (
                    <p className="text-sm text-slate-400">No replies yet.</p>
                  ) : (
                    selected.responses.map((r) => (
                      <div
                        key={r.id}
                        className={`rounded-lg border p-3 ${
                          r.isSolution ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <PostedBy name={r.authorName} />
                          <div className="flex items-center gap-1">
                            {r.isSolution && (
                              <span className="text-[11px] font-medium text-emerald-800 px-2 py-0.5 rounded-md bg-emerald-100">
                                Solution
                      </span>
                    )}
                            {canManageResource(selected.authorId, user) && !r.isSolution && (
                              <button
                                type="button"
                                onClick={() => void acceptSolution(r)}
                                className="text-[11px] text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1"
                              >
                                <CheckIcon className="w-3.5 h-3.5" />
                                Accept
                              </button>
                            )}
                            {canManageResource(r.authorId, user) && (
                              <button
                                type="button"
                                onClick={() => void deleteResponse(r)}
                                className="p-1 text-slate-400 hover:text-red-600"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                  </div>
                </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.content}</p>
            </div>
                    ))
          )}
                </div>
        </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Your reply</label>
              <textarea
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm min-h-[80px]"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Share a suggestion or troubleshooting step…"
                />
                <div className="mt-2 flex justify-end">
                  <Button type="button" disabled={submitting || !reply.trim()} onClick={() => void postReply()}>
                    {submitting ? 'Posting…' : 'Post reply'}
                </Button>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}
    </div>
  );
};

export default HelpForumPage;
