import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  BeakerIcon,
  DocumentTextIcon,
  FireIcon,
  ClockIcon,
  BookOpenIcon,
  ArrowRightIcon,
  PlusIcon,
  UserIcon,
  CalendarDaysIcon,
  QuestionMarkCircleIcon,
  NewspaperIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  BellAlertIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { DASHBOARD_SYNC_EVENT, notifyDashboardSync } from '../utils/dashboardSync';
import DashboardNoteForm, { type DashboardNoteFormValues } from '../components/DashboardNoteForm';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5002/api'
).replace(/\/$/, '');

const apiUrl = (path: string) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p.startsWith('/api/') ? p.slice(4) : p}`;
};

interface PulseEvent {
  id: string;
  title: string;
  type?: string;
  location?: string;
  startDate?: string;
  status?: string;
}

interface PulseForum {
  id: string;
  title: string;
  category?: string;
  urgency?: string;
  responses?: number;
  createdAt?: string;
}

interface PulseNews {
  id: string;
  title: string;
  postType?: string;
  authorName?: string;
  createdAt?: string;
}

interface ReminderItem {
  id: string;
  kind: 'task' | 'event';
  title: string;
  subtitle: string;
  dueAt?: string | null;
  urgency: 'overdue' | 'today' | 'soon' | 'open';
  link: string;
  source: string;
}

interface NoteItem {
  id: string;
  content: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ActivityItem {
  id: string;
  kind: 'notebook' | 'task' | 'experiment';
  title: string;
  subtitle: string;
  timestamp: string;
  link: string;
  source: string;
}

type HubTab = 'all' | 'reminders' | 'notes' | 'activity';

const POLL_MS = 25000;

const formatShortDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatRelative = (iso?: string) => {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatShortDate(iso);
};

const noteColorClass = (color?: string) => {
  switch (color) {
    case 'blue':
      return 'bg-sky-50 border-sky-200/80';
    case 'green':
      return 'bg-emerald-50 border-emerald-200/80';
    case 'pink':
      return 'bg-rose-50 border-rose-200/80';
    case 'purple':
      return 'bg-violet-50 border-violet-200/80';
    default:
      return 'bg-amber-50 border-amber-200/80';
  }
};

const urgencyBadge = (urgency: ReminderItem['urgency']) => {
  switch (urgency) {
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'today':
      return 'bg-amber-100 text-amber-900';
    case 'soon':
      return 'bg-sky-100 text-sky-800';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

const activityIcon = (kind: ActivityItem['kind']) => {
  if (kind === 'notebook') return BookOpenIcon;
  if (kind === 'experiment') return BeakerIcon;
  return ClipboardDocumentListIcon;
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<PulseEvent[]>([]);
  const [forumItems, setForumItems] = useState<PulseForum[]>([]);
  const [newsItems, setNewsItems] = useState<PulseNews[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [counts, setCounts] = useState({ reminders: 0, notes: 0, activities: 0, overdue: 0 });
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hubTab, setHubTab] = useState<HubTab>('all');
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [noteFormMode, setNoteFormMode] = useState<'create' | 'edit'>('create');
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [noteFormError, setNoteFormError] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const fetchPulse = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const headers = authHeaders();
      const res = await axios.get(apiUrl('/dashboard/pulse'), { headers });
      setReminders(res.data.reminders || []);
      setNotes(res.data.notes || []);
      setActivities(res.data.activities || []);
      setCounts(
        res.data.counts || { reminders: 0, notes: 0, activities: 0, overdue: 0 }
      );
      setUpdatedAt(res.data.updatedAt || new Date().toISOString());
    } catch (error) {
      console.error('Dashboard pulse error:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [authHeaders]);

  const fetchCommunity = useCallback(async () => {
    try {
      const headers = authHeaders();
      const [eventsRes, forumRes, newsRes] = await Promise.all([
        axios.get(apiUrl('/research-events'), { headers }).catch(() => null),
        axios.get(apiUrl('/help-forum/requests'), { headers }).catch(() => null),
        axios
          .get(apiUrl('/community-news'), { headers, params: { limit: 4 } })
          .catch(() => null),
      ]);

      const rawEvents: any[] = Array.isArray(eventsRes?.data?.events)
        ? eventsRes.data.events
        : Array.isArray(eventsRes?.data)
          ? eventsRes.data
          : [];
      const now = Date.now();
      setEvents(
        rawEvents
          .filter((e) => {
            if (!e.startDate) return e.status === 'upcoming' || e.status === 'ongoing';
            return new Date(e.startDate).getTime() >= now - 24 * 60 * 60 * 1000;
          })
          .sort(
            (a, b) =>
              new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime()
          )
          .slice(0, 3)
          .map((e) => ({
            id: String(e.id),
            title: e.title,
            type: e.type,
            location: e.location || e.country,
            startDate: e.startDate,
            status: e.status,
          }))
      );

      const rawForum: any[] = Array.isArray(forumRes?.data?.requests)
        ? forumRes.data.requests
        : Array.isArray(forumRes?.data)
          ? forumRes.data
          : [];
      setForumItems(
        [...rawForum]
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          )
          .slice(0, 3)
          .map((r) => ({
            id: String(r.id),
            title: r.title,
            category: r.category,
            urgency: r.urgency,
            responses: Array.isArray(r.responses) ? r.responses.length : Number(r.responses) || 0,
            createdAt: r.createdAt,
          }))
      );

      const rawNews: any[] = Array.isArray(newsRes?.data?.posts)
        ? newsRes.data.posts
        : Array.isArray(newsRes?.data)
          ? newsRes.data
          : [];
      setNewsItems(
        rawNews.slice(0, 3).map((p) => ({
          id: String(p.id),
          title: p.title,
          postType: p.postType,
          authorName: p.authorName,
          createdAt: p.createdAt,
        }))
      );
    } catch (error) {
      console.error('Community pulse error:', error);
    }
  }, [authHeaders]);

  useEffect(() => {
    void fetchPulse();
    void fetchCommunity();
  }, [fetchPulse, fetchCommunity]);

  // Live updates: poll while visible + sync events from other pages/tabs
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') {
        void fetchPulse(true);
      }
    };
    pollRef.current = setInterval(tick, POLL_MS);

    const onVis = () => {
      if (document.visibilityState === 'visible') void fetchPulse(true);
    };
    const onSync = () => void fetchPulse(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'researchlab:dashboard-sync-at') void fetchPulse(true);
    };

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener(DASHBOARD_SYNC_EVENT, onSync as EventListener);
    window.addEventListener('focus', onSync);
    window.addEventListener('storage', onStorage);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener(DASHBOARD_SYNC_EVENT, onSync as EventListener);
      window.removeEventListener('focus', onSync);
      window.removeEventListener('storage', onStorage);
    };
  }, [fetchPulse]);

  const openCreateNote = () => {
    setNoteFormMode('create');
    setEditingNote(null);
    setNoteFormError('');
    setNoteFormOpen(true);
  };

  const openEditNote = (note: NoteItem) => {
    setNoteFormMode('edit');
    setEditingNote(note);
    setNoteFormError('');
    setNoteFormOpen(true);
  };

  const handleNoteFormSubmit = async (values: DashboardNoteFormValues) => {
    setSavingNote(true);
    setNoteFormError('');
    try {
      const headers = authHeaders();
      if (noteFormMode === 'edit' && editingNote) {
        const res = await axios.put(apiUrl(`/quick-notes/${editingNote.id}`), values, {
          headers,
        });
        const updated = res.data;
        setNotes((prev) =>
          prev.map((n) =>
            n.id === editingNote.id
              ? {
                  id: updated.id,
                  content: updated.content,
                  color: updated.color || values.color,
                  createdAt: updated.created_at,
                  updatedAt: updated.updated_at,
                }
              : n
          )
        );
      } else {
        const res = await axios.post(apiUrl('/quick-notes'), values, { headers });
        const created = res.data;
        setNotes((prev) => [
          {
            id: created.id,
            content: created.content,
            color: created.color || values.color,
            createdAt: created.created_at,
            updatedAt: created.updated_at,
          },
          ...prev,
        ]);
        setCounts((c) => ({ ...c, notes: c.notes + 1 }));
      }
      setNoteFormOpen(false);
      setEditingNote(null);
      notifyDashboardSync('dashboard-note');
      await fetchPulse(true);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Could not save note. Check that you are signed in.';
      setNoteFormError(msg);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Delete this note? This cannot be undone.')) return;
    try {
      await axios.delete(apiUrl(`/quick-notes/${id}`), { headers: authHeaders() });
      notifyDashboardSync('dashboard-note-delete');
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setCounts((c) => ({ ...c, notes: Math.max(0, c.notes - 1) }));
      if (editingNote?.id === id) {
        setNoteFormOpen(false);
        setEditingNote(null);
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || 'Could not delete note');
    }
  };

  const quickActions = [
    {
      icon: PlusIcon,
      title: 'Start experiment',
      description: 'Track a new experiment',
      color: 'from-blue-500 to-blue-600',
      link: '/experiment-tracker',
    },
    {
      icon: DocumentTextIcon,
      title: 'Add protocol',
      description: 'Document a method',
      color: 'from-green-500 to-green-600',
      link: '/protocols',
    },
    {
      icon: BookOpenIcon,
      title: 'Open notebook',
      description: 'Write a lab note',
      color: 'from-slate-600 to-slate-800',
      link: '/lab-notebook',
    },
    {
      icon: FireIcon,
      title: 'Share failed experiment',
      description: 'Build transparency credit',
      color: 'from-orange-500 to-red-500',
      link: '/negative-results',
    },
  ];

  const showReminders = hubTab === 'all' || hubTab === 'reminders';
  const showNotes = hubTab === 'all' || hubTab === 'notes';
  const showActivity = hubTab === 'all' || hubTab === 'activity';

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Welcome back, {user?.first_name || 'Researcher'}
          </h1>
          <p className="mt-1.5 text-[14px] text-slate-600">
            Live activities, notes, and reminders from your notebook and lab workspace
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="inline-flex items-center gap-2 self-start px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
        >
          <UserIcon className="w-4 h-4" />
          Research profile
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-800 mx-auto" />
          <p className="mt-4 text-[13px] text-slate-500">Loading dashboard…</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Primary hub */}
          <section className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-amber-50/40">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-900 tracking-tight">
                    Activities, notes & reminders
                  </h2>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {counts.overdue > 0
                      ? `${counts.overdue} overdue · `
                      : ''}
                    {counts.reminders} reminders · {counts.notes} notes · {counts.activities}{' '}
                    recent
                    {updatedAt ? ` · updated ${formatRelative(updatedAt)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(
                    [
                      { id: 'all' as const, label: 'All' },
                      { id: 'reminders' as const, label: 'Reminders' },
                      { id: 'notes' as const, label: 'Notes' },
                      { id: 'activity' as const, label: 'Activity' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setHubTab(tab.id)}
                      className={`px-2.5 py-1 text-[12px] font-medium rounded-full transition-colors ${
                        hubTab === tab.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => void fetchPulse()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50"
                    title="Refresh now"
                  >
                    <ArrowPathIcon className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div
              className={`grid gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100 ${
                hubTab === 'all'
                  ? 'md:grid-cols-3'
                  : 'md:grid-cols-1'
              }`}
            >
              {showReminders ? (
                <div className="p-4 min-h-[280px] flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BellAlertIcon className="w-4 h-4 text-amber-700" />
                      <h3 className="text-[13px] font-semibold text-slate-900">Reminders</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/lab-workspace?section=tasks')}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-0.5"
                    >
                      Workspace
                      <ArrowRightIcon className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[360px]">
                    {reminders.length === 0 ? (
                      <div className="py-8 text-center px-2">
                        <p className="text-[13px] text-slate-600">Nothing due right now</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Assign tasks in Lab workspace to see them here
                        </p>
                      </div>
                    ) : (
                      reminders.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => navigate(item.link)}
                          className="w-full text-left px-2.5 py-2 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors group"
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${urgencyBadge(item.urgency)}`}
                            >
                              {item.urgency}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium text-slate-900 line-clamp-2 group-hover:text-slate-700">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {item.subtitle} · {item.source}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              {showNotes ? (
                <div className="p-4 min-h-[280px] flex flex-col bg-slate-50/40">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <PencilSquareIcon className="w-4 h-4 text-slate-700" />
                      <h3 className="text-[13px] font-semibold text-slate-900">Notes</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={openCreateNote}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/lab-notebook')}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-0.5"
                      >
                        Notebook
                        <ArrowRightIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[360px]">
                    {notes.length === 0 ? (
                      <div className="py-6 text-center px-2">
                        <p className="text-[13px] text-slate-600">No sticky notes yet</p>
                        <p className="text-[11px] text-slate-400 mt-1 mb-3">
                          Capture a thought — syncs with notebook quick notes
                        </p>
                        <button
                          type="button"
                          onClick={openCreateNote}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                          Create note
                        </button>
                      </div>
                    ) : (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          className={`relative group rounded-lg border px-3 py-2.5 ${noteColorClass(note.color)}`}
                        >
                          <p className="text-[13px] text-slate-800 whitespace-pre-wrap pr-14">
                            {note.content}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1.5">
                            {formatRelative(note.updatedAt || note.createdAt)}
                          </p>
                          <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => openEditNote(note)}
                              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-white/70"
                              aria-label="Edit note"
                            >
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteNote(note.id)}
                              className="p-1 rounded text-slate-500 hover:text-red-700 hover:bg-white/70"
                              aria-label="Delete note"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              {showActivity ? (
                <div className="p-4 min-h-[280px] flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-slate-700" />
                      <h3 className="text-[13px] font-semibold text-slate-900">Recent activity</h3>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[360px]">
                    {activities.length === 0 ? (
                      <div className="py-8 text-center px-2">
                        <p className="text-[13px] text-slate-600">No recent activity</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Notebook entries, tasks, and experiments appear here live
                        </p>
                      </div>
                    ) : (
                      activities.map((item) => {
                        const Icon = activityIcon(item.kind);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => navigate(item.link)}
                            className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                          >
                            <span className="mt-0.5 w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                              <Icon className="w-3.5 h-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium text-slate-900 truncate group-hover:text-slate-700">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {item.source} · {item.subtitle} · {formatRelative(item.timestamp)}
                              </p>
                            </div>
                            <ArrowRightIcon className="w-3.5 h-3.5 text-slate-300 mt-1 shrink-0 group-hover:text-slate-500" />
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* Quick actions */}
          <section className="bg-white border border-slate-200/80 rounded-xl p-4">
            <h2 className="text-[13px] font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <PlusIcon className="w-4 h-4 text-slate-500" />
              Quick actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() => navigate(action.link)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors text-left group"
                  >
                    <div className={`p-2 bg-gradient-to-br ${action.color} rounded-lg`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-900">{action.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">{action.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Stay connected */}
          <section>
            <div className="flex items-end justify-between gap-3 mb-3 px-0.5">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Stay connected</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Upcoming events, open questions, and what the community is sharing
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-gradient-to-br from-sky-50/80 to-white">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                      <CalendarDaysIcon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900">Events</p>
                      <p className="text-[11px] text-slate-500 truncate">Conferences & exchanges</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/events-opportunities')}
                    className="text-[11px] font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-0.5 shrink-0"
                  >
                    Browse
                    <ArrowRightIcon className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 p-3 space-y-1.5">
                  {events.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => navigate('/events-opportunities')}
                      className="w-full text-left px-2.5 py-6 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-[13px] text-slate-600">Nothing upcoming right now</p>
                      <p className="text-[11px] text-slate-400 mt-1">Explore events & opportunities →</p>
                    </button>
                  ) : (
                    events.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => navigate('/events-opportunities')}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                      >
                        <p className="text-[13px] font-medium text-slate-900 line-clamp-2 group-hover:text-slate-700">
                          {event.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                          {event.startDate ? <span>{formatShortDate(event.startDate)}</span> : null}
                          {event.location ? (
                            <span className="inline-flex items-center gap-0.5">
                              <MapPinIcon className="w-3 h-3" />
                              <span className="truncate max-w-[9rem]">{event.location}</span>
                            </span>
                          ) : null}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-gradient-to-br from-amber-50/80 to-white">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <QuestionMarkCircleIcon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900">Help forum</p>
                      <p className="text-[11px] text-slate-500 truncate">Ask & answer</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/help-forum')}
                    className="text-[11px] font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-0.5 shrink-0"
                  >
                    Browse
                    <ArrowRightIcon className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 p-3 space-y-1.5">
                  {forumItems.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => navigate('/help-forum')}
                      className="w-full text-left px-2.5 py-6 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-[13px] text-slate-600">No open questions yet</p>
                      <p className="text-[11px] text-slate-400 mt-1">Start a thread or help someone →</p>
                    </button>
                  ) : (
                    forumItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate('/help-forum')}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                      >
                        <p className="text-[13px] font-medium text-slate-900 line-clamp-2 group-hover:text-slate-700">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                          {item.category ? <span>{item.category}</span> : null}
                          <span className="inline-flex items-center gap-0.5 text-slate-400">
                            <ChatBubbleLeftRightIcon className="w-3 h-3" />
                            {item.responses ?? 0}
                          </span>
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-gradient-to-br from-emerald-50/80 to-white">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <NewspaperIcon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900">News & updates</p>
                      <p className="text-[11px] text-slate-500 truncate">Community feed</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/current-trends')}
                    className="text-[11px] font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-0.5 shrink-0"
                  >
                    Browse
                    <ArrowRightIcon className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 p-3 space-y-1.5">
                  {newsItems.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => navigate('/current-trends')}
                      className="w-full text-left px-2.5 py-6 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-[13px] text-slate-600">Feed is quiet</p>
                      <p className="text-[11px] text-slate-400 mt-1">Share news or an idea →</p>
                    </button>
                  ) : (
                    newsItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          navigate(`/current-trends?post=${encodeURIComponent(item.id)}`)
                        }
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
                      >
                        <p className="text-[13px] font-medium text-slate-900 line-clamp-2 group-hover:text-slate-700">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                          {item.postType ? (
                            <span className="capitalize">{item.postType}</span>
                          ) : null}
                          {item.authorName ? <span>{item.authorName}</span> : null}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      <DashboardNoteForm
        isOpen={noteFormOpen}
        mode={noteFormMode}
        initial={
          editingNote
            ? { content: editingNote.content, color: editingNote.color || 'yellow' }
            : null
        }
        submitting={savingNote}
        error={noteFormError}
        onClose={() => {
          if (!savingNote) {
            setNoteFormOpen(false);
            setEditingNote(null);
            setNoteFormError('');
          }
        }}
        onSubmit={handleNoteFormSubmit}
      />
    </div>
  );
};

export default DashboardPage;
