import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getAuthHeaders, getAuthToken, resolveApiBaseUrl, formatApiNetworkError } from '../utils/apiBase';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BellIcon } from './icons';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  is_read: number | boolean;
  created_at: string;
}

const formatRelative = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get('/api/notifications', {
        params: { limit: 8 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data.notifications || []);
      setUnread(Number(response.data.unreadCount || 0));
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnread = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const response = await axios.get('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnread(Number(response.data.unreadCount || 0));
    } catch {
      // Silent - bell is non-blocking
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const timer = window.setInterval(fetchUnread, 30000);
    return () => window.clearInterval(timer);
  }, [fetchUnread]);

  useEffect(() => {
    if (!open) return;
    fetchNotifications();
  }, [open, fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const markRead = async (notification: AppNotification) => {
    const token = getAuthToken();
    if (!token || notification.is_read) return;
    try {
      const response = await axios.patch(
        `/api/notifications/${notification.id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnread(Number(response.data.unreadCount ?? Math.max(unread - 1, 0)));
      setItems((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: 1 } : item
        )
      );
    } catch (error) {
      console.error('Failed to mark notification read', error);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <BellIcon className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-slate-900 text-white text-[10px] font-semibold leading-4 text-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-[12px] font-medium text-slate-600 hover:text-slate-900"
            >
              View all
            </Link>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-sm text-slate-500 text-center">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-sm text-slate-500 text-center">
                You are all caught up.
              </p>
            ) : (
              <ul>
                {items.map((item) => {
                  const unreadItem = !item.is_read || item.is_read === 0;
                  const content = (
                    <>
                      <p className={`text-[13px] ${unreadItem ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {item.title}
                      </p>
                      {item.body && (
                        <p className="mt-0.5 text-[12px] text-slate-500 line-clamp-2">{item.body}</p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-400">{formatRelative(item.created_at)}</p>
                    </>
                  );

                  return (
                    <li key={item.id} className="border-b border-slate-50 last:border-0">
                      {item.link ? (
                        <Link
                          to={item.link}
                          onClick={() => {
                            markRead(item);
                            setOpen(false);
                          }}
                          className={`block px-4 py-3 hover:bg-slate-50 transition-colors ${unreadItem ? 'bg-slate-50/70' : ''}`}
                        >
                          {content}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markRead(item)}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${unreadItem ? 'bg-slate-50/70' : ''}`}
                        >
                          {content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
