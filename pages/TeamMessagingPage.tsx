import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';

type Conversation = {
  id: string;
  name: string;
  preview: string;
  kind: 'channel' | 'direct';
  unread?: number;
};

type ChatMessage = {
  id: string;
  author: string;
  body: string;
  at: Date;
  mine?: boolean;
};

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'general',
    name: 'general',
    preview: 'Lab-wide updates and questions',
    kind: 'channel',
    unread: 2,
  },
  {
    id: 'announcements',
    name: 'announcements',
    preview: 'Important notices only',
    kind: 'channel',
  },
  {
    id: 'dm-fatima',
    name: 'Dr. Fatima Johnson',
    preview: 'Can you review the PCR draft?',
    kind: 'direct',
    unread: 1,
  },
  {
    id: 'dm-john',
    name: 'John Doe',
    preview: 'Equipment booking confirmed',
    kind: 'direct',
  },
];

const SEED_MESSAGES: Record<string, ChatMessage[]> = {
  general: [
    {
      id: '1',
      author: 'Dr. Fatima Johnson',
      body: 'Welcome. Use this channel for day-to-day lab coordination.',
      at: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      author: 'John Doe',
      body: 'Where should I put the updated Western blot protocol?',
      at: new Date(Date.now() - 1800000),
    },
    {
      id: '3',
      author: 'Dr. Fatima Johnson',
      body: 'Add it in Protocol library, then link it from your experiment.',
      at: new Date(Date.now() - 900000),
    },
  ],
  announcements: [
    {
      id: 'a1',
      author: 'Lab manager',
      body: 'Safety walkthrough Friday at 10:00. Attendance required.',
      at: new Date(Date.now() - 7200000),
    },
  ],
  'dm-fatima': [
    {
      id: 'd1',
      author: 'Dr. Fatima Johnson',
      body: 'Can you review the PCR draft before tomorrow’s meeting?',
      at: new Date(Date.now() - 2400000),
    },
  ],
  'dm-john': [
    {
      id: 'j1',
      author: 'John Doe',
      body: 'Equipment booking for the centrifuge is confirmed for Thursday.',
      at: new Date(Date.now() - 5400000),
    },
  ],
};

type Props = {
  embedded?: boolean;
};

const formatTime = (date: Date) => {
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 60) return `${Math.max(diffMin, 1)}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

const TeamMessagingPage: React.FC<Props> = ({ embedded = false }) => {
  const [conversations] = useState(SEED_CONVERSATIONS);
  const [activeId, setActiveId] = useState(SEED_CONVERSATIONS[0].id);
  const [threads, setThreads] = useState(SEED_MESSAGES);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId) || conversations[0];
  const messages = threads[activeId] || [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) => c.name.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q)
    );
  }, [conversations, query]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeId]);

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    const next: ChatMessage = {
      id: `${Date.now()}`,
      author: 'You',
      body,
      at: new Date(),
      mine: true,
    };
    setThreads((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), next],
    }));
    setDraft('');
  };

  return (
    <div className={`${embedded ? 'h-full' : 'h-[calc(100vh-4rem)]'} flex flex-col bg-white`}>
      {!embedded && (
        <div className="px-6 py-3 border-b border-slate-200/80 bg-[#FAFBFC] text-[13px] text-slate-600">
          Team messages · also available under{' '}
          <Link
            to="/lab-workspace?section=teams&tab=messages"
            className="font-medium text-slate-900 underline-offset-2 hover:underline"
          >
            Lab workspace → Team
          </Link>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Conversation list */}
        <aside className="w-72 shrink-0 border-r border-slate-200/80 flex flex-col bg-white">
          <div className="px-4 py-3 border-b border-slate-200/80">
            <p className="text-[13px] font-semibold text-slate-900 mb-2">Messages</p>
            <div className="relative">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full pl-8 pr-3 py-1.5 text-[13px] rounded-md border border-slate-200 bg-slate-50/80 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-[13px] text-slate-500">No conversations match.</p>
            ) : (
              filtered.map((item) => {
                const selected = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className={`w-full text-left px-4 py-2.5 flex gap-3 transition-colors ${
                      selected ? 'bg-slate-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-[11px] font-semibold ${
                        item.kind === 'channel'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      {item.kind === 'channel' ? (
                        <HashtagIcon className="w-3.5 h-3.5" />
                      ) : (
                        initials(item.name)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[13px] truncate ${
                            selected || item.unread
                              ? 'font-semibold text-slate-900'
                              : 'font-medium text-slate-700'
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.unread ? (
                          <span className="text-[10px] font-semibold text-white bg-slate-900 rounded-full min-w-[1.15rem] h-[1.15rem] px-1 flex items-center justify-center">
                            {item.unread}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[12px] text-slate-500 truncate mt-0.5">{item.preview}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className="flex-1 flex flex-col min-w-0">
          <header className="h-12 px-5 border-b border-slate-200/80 flex items-center gap-2 shrink-0">
            {active.kind === 'channel' ? (
              <HashtagIcon className="w-4 h-4 text-slate-500" />
            ) : (
              <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-[10px] font-semibold inline-flex items-center justify-center">
                {initials(active.name)}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold text-slate-900 truncate">{active.name}</h2>
              <p className="text-[12px] text-slate-500 truncate">{active.preview}</p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-[#FAFBFC]">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-[13px] text-slate-500">No messages yet. Start the conversation.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.mine ? 'justify-end' : ''}`}>
                  {!msg.mine && (
                    <div className="w-8 h-8 rounded-md bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center justify-center shrink-0">
                      {initials(msg.author)}
                    </div>
                  )}
                  <div className={`max-w-[min(36rem,85%)] ${msg.mine ? 'text-right' : ''}`}>
                    <div className="flex items-baseline gap-2 mb-1" style={msg.mine ? { justifyContent: 'flex-end' } : undefined}>
                      <span className="text-[12px] font-medium text-slate-800">{msg.author}</span>
                      <span className="text-[11px] text-slate-400">{formatTime(msg.at)}</span>
                    </div>
                    <div
                      className={`inline-block text-left text-[13px] leading-relaxed px-3.5 py-2 rounded-lg ${
                        msg.mine
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-800 border border-slate-200/80'
                      }`}
                    >
                      {msg.body}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <footer className="px-5 py-3 border-t border-slate-200/80 bg-white shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder={
                  active.kind === 'channel'
                    ? `Message #${active.name}`
                    : `Message ${active.name}`
                }
                className="flex-1 resize-none rounded-md border border-slate-200 px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
              />
              <button
                type="button"
                onClick={send}
                disabled={!draft.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                Send
              </button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default TeamMessagingPage;
