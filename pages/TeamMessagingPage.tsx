import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  HashtagIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

export type MessagingTeamMember = {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  role?: string;
  avatar_url?: string;
};

type ConversationRow = {
  id: string;
  type: 'direct' | 'group' | string;
  name?: string | null;
  participants?: number;
  last_message?: string | null;
  last_message_at?: string | null;
  updated_at?: string;
  other_participant?: MessagingTeamMember | null;
};

type ChatMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_avatar?: string | null;
};

type Props = {
  embedded?: boolean;
  teamMembers?: MessagingTeamMember[];
};

const displayName = (m: {
  name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
}) => {
  if (m.name?.trim()) return m.name.trim();
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (m.username?.trim()) return m.username.trim();
  if (m.email?.trim()) return m.email.trim();
  return 'Unknown';
};

const messageAuthor = (msg: ChatMessage) => {
  const full = [msg.sender_first_name, msg.sender_last_name].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (msg.sender_name?.trim()) return msg.sender_name.trim();
  return 'Unknown';
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';

const formatRelative = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatClock = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const formatDayLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

const conversationTitle = (conv: ConversationRow | null) => {
  if (!conv) return 'Messages';
  if (conv.type === 'group' || conv.type === 'channel') {
    return conv.name ? `#${conv.name}` : 'Group chat';
  }
  return conv.other_participant?.name || conv.name || 'Direct message';
};

const TeamMessagingPage: React.FC<Props> = ({ embedded = false, teamMembers = [] }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'inbox' | 'team'>('inbox');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const peers = useMemo(() => {
    return teamMembers
      .filter((m) => {
        const uid = m.user_id || m.id;
        return uid && uid !== user?.id;
      })
      .map((m) => ({
        ...m,
        user_id: m.user_id || m.id,
        name: displayName(m),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teamMembers, user?.id]);

  const enrichConversation = useCallback(
    async (conv: ConversationRow): Promise<ConversationRow> => {
      if (conv.type !== 'direct') return conv;
      try {
        const { data: participants } = await axios.get(
          `/api/conversations/${conv.id}/participants`
        );
        const other = (participants || []).find((p: any) => p.user_id !== user?.id);
        if (!other) return conv;
        const fromTeam = peers.find((p) => p.user_id === other.user_id);
        return {
          ...conv,
          other_participant: fromTeam || {
            id: other.user_id,
            user_id: other.user_id,
            name: displayName(other),
            email: other.email,
            avatar_url: other.avatar_url,
          },
        };
      } catch {
        return conv;
      }
    },
    [peers, user?.id]
  );

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const { data } = await axios.get('/api/conversations');
      const rows: ConversationRow[] = Array.isArray(data) ? data : [];
      const enriched = await Promise.all(rows.map((row) => enrichConversation(row)));
      setConversations(enriched);
      setActiveId((prev) => {
        if (prev && enriched.some((c) => c.id === prev)) return prev;
        return enriched[0]?.id || null;
      });
      if (enriched.length === 0) setSidebarTab('team');
    } catch (err) {
      console.error('Failed to load conversations', err);
      setError('Could not load conversations. Try refreshing.');
      setConversations([]);
    } finally {
      setLoadingList(false);
    }
  }, [enrichConversation]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingThread(true);
      try {
        const { data } = await axios.get(`/api/conversations/${activeId}/messages`, {
          params: { limit: 100 },
        });
        if (!cancelled) setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load messages', err);
        if (!cancelled) {
          setMessages([]);
          setError('Could not load this conversation.');
        }
      } finally {
        if (!cancelled) setLoadingThread(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeId]);

  const active = conversations.find((c) => c.id === activeId) || null;

  const filteredInbox = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const title = conversationTitle(c).toLowerCase();
      const preview = (c.last_message || '').toLowerCase();
      return title.includes(q) || preview.includes(q);
    });
  }, [conversations, query]);

  const filteredPeers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return peers;
    return peers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.role || '').toLowerCase().includes(q)
    );
  }, [peers, query]);

  const groupedMessages = useMemo(() => {
    const groups: { day: string; items: ChatMessage[] }[] = [];
    for (const msg of messages) {
      const day = new Date(msg.created_at).toDateString();
      const last = groups[groups.length - 1];
      if (last && last.day === day) last.items.push(msg);
      else groups.push({ day, items: [msg] });
    }
    return groups;
  }, [messages]);

  const openOrCreateDm = async (member: MessagingTeamMember) => {
    const memberUserId = member.user_id || member.id;
    if (!memberUserId || !user?.id) return;
    setError(null);
    try {
      const existing = conversations.find(
        (c) => c.type === 'direct' && (c.other_participant?.user_id || c.other_participant?.id) === memberUserId
      );
      if (existing) {
        setActiveId(existing.id);
        setSidebarTab('inbox');
        return;
      }

      const { data } = await axios.post('/api/conversations', {
        type: 'direct',
        participant_ids: [memberUserId],
      });

      const enriched = await enrichConversation({
        ...data,
        other_participant: member,
      });
      setConversations((prev) => {
        if (prev.some((c) => c.id === enriched.id)) {
          return prev.map((c) => (c.id === enriched.id ? { ...c, ...enriched } : c));
        }
        return [enriched, ...prev];
      });
      setActiveId(enriched.id);
      setSidebarTab('inbox');
      setTimeout(() => composerRef.current?.focus(), 50);
    } catch (err) {
      console.error('Failed to start conversation', err);
      setError('Could not start that conversation.');
    }
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    setError(null);
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      sender_id: user?.id || '',
      content: body,
      created_at: new Date().toISOString(),
      sender_name: user?.username,
      sender_first_name: user?.first_name,
      sender_last_name: user?.last_name,
      sender_avatar: user?.avatar_url,
    };
    setDraft('');
    setMessages((prev) => [...prev, optimistic]);
    try {
      const { data } = await axios.post(`/api/conversations/${activeId}/messages`, {
        content: body,
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id
            ? {
                ...optimistic,
                ...data,
                sender_first_name: user?.first_name,
                sender_last_name: user?.last_name,
                sender_name: user?.username,
              }
            : m
        )
      );
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === activeId
            ? { ...c, last_message: body, last_message_at: data.created_at || new Date().toISOString() }
            : c
        );
        return next.sort((a, b) => {
          const ta = new Date(a.last_message_at || a.updated_at || 0).getTime();
          const tb = new Date(b.last_message_at || b.updated_at || 0).getTime();
          return tb - ta;
        });
      });
    } catch (err) {
      console.error('Failed to send message', err);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(body);
      setError('Message failed to send. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={`${
        embedded ? 'h-full' : 'h-[calc(100vh-4rem)]'
      } flex flex-col bg-gradient-to-br from-slate-50 via-white to-sky-50/20`}
    >
      {!embedded && (
        <div className="px-6 py-3 border-b border-sky-100/80 bg-white/80 text-[13px] text-slate-600">
          Team messages · also under{' '}
          <Link
            to="/lab-workspace?section=messages"
            className="font-medium text-sky-800 underline-offset-2 hover:underline"
          >
            Lab workspace → Messages
          </Link>
        </div>
      )}

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-md border border-amber-200 bg-amber-50 text-[13px] text-amber-900 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            className="text-[12px] font-medium text-amber-950 underline-offset-2 hover:underline shrink-0"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <aside className="w-full max-w-[20rem] sm:w-80 shrink-0 border-r border-slate-200/80 flex flex-col bg-white/90">
          <div className="px-4 pt-3 pb-3 border-b border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-slate-900">Messages</p>
              <span className="text-[11px] tabular-nums text-slate-500">
                {conversations.length} thread{conversations.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="grid grid-cols-2 p-0.5 rounded-lg bg-slate-100/90">
              <button
                type="button"
                onClick={() => setSidebarTab('inbox')}
                className={`py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  sidebarTab === 'inbox'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Inbox
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('team')}
                className={`py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  sidebarTab === 'team'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Team
              </button>
            </div>
            <div className="relative">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={sidebarTab === 'inbox' ? 'Search conversations…' : 'Search teammates…'}
                className="w-full pl-8 pr-3 py-1.5 text-[13px] rounded-md border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {sidebarTab === 'inbox' ? (
              loadingList ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-sky-600" />
                </div>
              ) : filteredInbox.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="w-11 h-11 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md shadow-sky-200/50 flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  </div>
                  <p className="text-[13px] font-medium text-slate-900 mb-1">
                    {query ? 'No matches' : 'No conversations yet'}
                  </p>
                  <p className="text-[12px] text-slate-500 mb-4">
                    {query
                      ? 'Try a different name or keyword.'
                      : 'Start a direct message with someone on your lab team.'}
                  </p>
                  {!query && (
                    <button
                      type="button"
                      onClick={() => setSidebarTab('team')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-sky-700 rounded-md hover:bg-sky-800"
                    >
                      <UsersIcon className="w-3.5 h-3.5" />
                      Browse team
                    </button>
                  )}
                </div>
              ) : (
                filteredInbox.map((item) => {
                  const selected = item.id === activeId;
                  const title = conversationTitle(item);
                  const isChannel = item.type === 'group' || item.type === 'channel';
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveId(item.id)}
                      className={`w-full text-left px-4 py-2.5 flex gap-3 transition-colors border-l-2 ${
                        selected
                          ? 'bg-sky-50/80 border-sky-600'
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-semibold ${
                          isChannel
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-sm shadow-sky-200/40'
                        }`}
                      >
                        {isChannel ? (
                          <HashtagIcon className="w-4 h-4" />
                        ) : item.other_participant?.avatar_url ? (
                          <img
                            src={item.other_participant.avatar_url}
                            alt=""
                            className="w-9 h-9 rounded-xl object-cover"
                          />
                        ) : (
                          initials(title)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[13px] truncate ${
                              selected ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'
                            }`}
                          >
                            {title}
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {formatRelative(item.last_message_at || item.updated_at)}
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-500 truncate mt-0.5">
                          {item.last_message || (isChannel ? 'Group conversation' : 'No messages yet')}
                        </p>
                      </div>
                    </button>
                  );
                })
              )
            ) : filteredPeers.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="w-11 h-11 mx-auto mb-3 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
                  <UsersIcon className="w-5 h-5" />
                </div>
                <p className="text-[13px] font-medium text-slate-900 mb-1">
                  {query ? 'No teammates match' : 'No teammates yet'}
                </p>
                <p className="text-[12px] text-slate-500">
                  {query
                    ? 'Try another name or email.'
                    : 'Invite people from the Team tab to message them here.'}
                </p>
              </div>
            ) : (
              filteredPeers.map((member) => (
                <button
                  key={member.user_id || member.id}
                  type="button"
                  onClick={() => openOrCreateDm(member)}
                  className="w-full text-left px-4 py-2.5 flex gap-3 transition-colors hover:bg-slate-50 border-l-2 border-transparent"
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt=""
                      className="w-9 h-9 rounded-xl object-cover shrink-0 ring-1 ring-slate-200/80"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 text-[11px] font-semibold flex items-center justify-center shrink-0">
                      {initials(member.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-slate-900 truncate">{member.name}</p>
                    <p className="text-[12px] text-slate-500 truncate mt-0.5">
                      {member.role?.replace(/_/g, ' ') || member.email || 'Start a conversation'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex-1 flex flex-col min-w-0 bg-white/70">
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center max-w-sm">
                <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md shadow-sky-200/50 flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-6 h-6" />
                </div>
                <h2 className="text-[15px] font-semibold text-slate-900 mb-1">Lab messages</h2>
                <p className="text-[13px] text-slate-500 mb-5">
                  Coordinate with your team in one place—pick a teammate to start a thread.
                </p>
                <button
                  type="button"
                  onClick={() => setSidebarTab('team')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-sky-700 rounded-md hover:bg-sky-800"
                >
                  <UsersIcon className="w-4 h-4" />
                  Message a teammate
                </button>
              </div>
            </div>
          ) : (
            <>
              <header className="h-14 px-5 border-b border-slate-200/80 flex items-center gap-3 shrink-0 bg-white/95">
                {active?.type === 'group' || active?.type === 'channel' ? (
                  <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 inline-flex items-center justify-center">
                    <HashtagIcon className="w-4 h-4" />
                  </span>
                ) : active?.other_participant?.avatar_url ? (
                  <img
                    src={active.other_participant.avatar_url}
                    alt=""
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200/80"
                  />
                ) : (
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white text-[11px] font-semibold inline-flex items-center justify-center shadow-sm shadow-sky-200/40">
                    {initials(conversationTitle(active))}
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="text-[14px] font-semibold text-slate-900 truncate">
                    {conversationTitle(active)}
                  </h2>
                  <p className="text-[12px] text-slate-500 truncate">
                    {active?.type === 'direct'
                      ? active?.other_participant?.email || active?.other_participant?.role?.replace(/_/g, ' ') || 'Direct message'
                      : `${active?.participants || 0} participants`}
                  </p>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                {loadingThread ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-sky-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full min-h-[14rem] flex items-center justify-center">
                    <div className="text-center max-w-xs">
                      <p className="text-[14px] font-medium text-slate-900 mb-1">Start the conversation</p>
                      <p className="text-[13px] text-slate-500">
                        Messages here stay with your lab team. Keep coordination, questions, and updates in one thread.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 max-w-3xl mx-auto">
                    {groupedMessages.map(({ day, items }) => (
                      <div key={day}>
                        <div className="flex items-center gap-3 my-3">
                          <div className="h-px flex-1 bg-slate-200/80" />
                          <span className="text-[11px] font-medium text-slate-500 px-1">
                            {formatDayLabel(items[0].created_at)}
                          </span>
                          <div className="h-px flex-1 bg-slate-200/80" />
                        </div>
                        <div className="space-y-3">
                          {items.map((msg) => {
                            const mine = msg.sender_id === user?.id;
                            const author = mine ? 'You' : messageAuthor(msg);
                            return (
                              <div
                                key={msg.id}
                                className={`flex gap-2.5 ${mine ? 'justify-end' : 'justify-start'}`}
                              >
                                {!mine && (
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                                    {initials(author)}
                                  </div>
                                )}
                                <div className={`max-w-[min(36rem,85%)] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                                  <div
                                    className={`flex items-baseline gap-2 mb-1 ${
                                      mine ? 'flex-row-reverse' : ''
                                    }`}
                                  >
                                    <span className="text-[12px] font-medium text-slate-800">{author}</span>
                                    <span className="text-[11px] text-slate-400">
                                      {formatClock(msg.created_at)}
                                    </span>
                                  </div>
                                  <div
                                    className={`text-left text-[13px] leading-relaxed px-3.5 py-2 rounded-2xl whitespace-pre-wrap break-words ${
                                      mine
                                        ? 'bg-sky-700 text-white rounded-br-md shadow-sm shadow-sky-200/30'
                                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-md'
                                    }`}
                                  >
                                    {msg.content}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <div ref={endRef} />
                  </div>
                )}
              </div>

              <footer className="px-5 py-3 border-t border-slate-200/80 bg-white/95 shrink-0">
                <div className="max-w-3xl mx-auto flex items-end gap-2">
                  <textarea
                    ref={composerRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    rows={2}
                    placeholder={`Message ${conversationTitle(active)}…`}
                    className="flex-1 resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                  />
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={!draft.trim() || sending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium text-white bg-sky-700 rounded-md hover:bg-sky-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                    Send
                  </button>
                </div>
                <p className="max-w-3xl mx-auto mt-1.5 text-[11px] text-slate-400">
                  Enter to send · Shift+Enter for a new line
                </p>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default TeamMessagingPage;
