import React, { useCallback, useEffect, useState } from 'react';
import { getAuthHeaders, getAuthToken, resolveApiBaseUrl, formatApiNetworkError } from '../utils/apiBase';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BellIcon } from '../components/icons';
import type { AppNotification } from '../components/NotificationBell';

const formatWhen = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
};

const NotificationsPage: React.FC = () => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError('Sign in to view notifications');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/notifications', {
        params: {
          limit: 100,
          ...(filter === 'unread' ? { unread: 'true' } : {}),
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data.notifications || []);
      setUnreadCount(Number(response.data.unreadCount || 0));
    } catch (err) {
      console.error(err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (notification: AppNotification) => {
    const token = getAuthToken();
    if (!token || notification.is_read) return;
    try {
      const response = await axios.patch(
        `/api/notifications/${notification.id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCount(Number(response.data.unreadCount ?? Math.max(unreadCount - 1, 0)));
      if (filter === 'unread') {
        setItems((prev) => prev.filter((item) => item.id !== notification.id));
      } else {
        setItems((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, is_read: 1 } : item
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      await axios.post(
        '/api/notifications/mark-all-read',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCount(0);
      if (filter === 'unread') {
        setItems([]);
      } else {
        setItems((prev) => prev.map((item) => ({ ...item, is_read: 1 })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <BellIcon className="w-7 h-7 text-slate-700" />
            Notifications
          </h1>
          <p className="mt-1.5 text-[14px] text-slate-600">
            Grants, lab updates, and system alerts in one place.
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center px-3.5 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Mark all read
        </button>
      </div>

      <div className="flex gap-1 mb-4 border-b border-slate-200/80">
        {([
          { id: 'all', label: 'All' },
          { id: 'unread', label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors ${
              filter === tab.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
            {filter === tab.id && (
              <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-slate-900 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
        {loading ? (
          <p className="px-6 py-12 text-sm text-slate-500 text-center">Loading notifications…</p>
        ) : error ? (
          <p className="px-6 py-12 text-sm text-red-600 text-center">{error}</p>
        ) : items.length === 0 ? (
          <p className="px-6 py-12 text-sm text-slate-500 text-center">
            {filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
          </p>
        ) : (
          <ul>
            {items.map((item) => {
              const unreadItem = !item.is_read || item.is_read === 0;
              const inner = (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className={`text-[14px] ${unreadItem ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>
                      {item.title}
                    </p>
                    {item.body && (
                      <p className="mt-1 text-[13px] text-slate-600">{item.body}</p>
                    )}
                    <p className="mt-2 text-[12px] text-slate-400">
                      <span className="uppercase tracking-wide text-[10px] font-medium text-slate-500 mr-2">
                        {item.type.replace(/_/g, ' ')}
                      </span>
                      {formatWhen(item.created_at)}
                    </p>
                  </div>
                  {unreadItem && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-slate-900 shrink-0" aria-label="Unread" />
                  )}
                </div>
              );

              return (
                <li key={item.id} className="border-b border-slate-100 last:border-0">
                  {item.link ? (
                    <Link
                      to={item.link}
                      onClick={() => markRead(item)}
                      className={`block px-5 py-4 hover:bg-slate-50/80 transition-colors ${unreadItem ? 'bg-slate-50/50' : ''}`}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => markRead(item)}
                      className={`w-full text-left px-5 py-4 hover:bg-slate-50/80 transition-colors ${unreadItem ? 'bg-slate-50/50' : ''}`}
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
