import express, { type Router } from 'express';
import pool from '../../database/config.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';

const router: Router = express.Router();

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

router.get('/pulse', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const dueHorizon = isoDaysFromNow(14);
    const pastHorizon = isoDaysFromNow(-30);
    const nowSql = now.toISOString().slice(0, 19).replace('T', ' ');

    const safe = async <T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        console.warn(`[dashboard/pulse] ${label}:`, (err as Error)?.message || err);
        return fallback;
      }
    };

    const [remindersTasks, remindersEvents, notes, notebookEntries, recentTasks, experiments] =
      await Promise.all([
        safe(
          'tasks',
          async () => {
            const result = await pool.query(
              `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.updated_at, t.created_at,
                      t.assignee_id, t.workspace_id
               FROM workspace_tasks t
               WHERE t.is_archived = 0
                 AND t.status != 'done'
                 AND t.status != 'cancelled'
                 AND t.assignee_id = $1
                 AND (
                   t.due_date IS NULL
                   OR (t.due_date >= $2 AND t.due_date <= $3)
                   OR t.due_date < $4
                 )
               ORDER BY
                 CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
                 t.due_date ASC,
                 CASE t.priority
                   WHEN 'urgent' THEN 0
                   WHEN 'high' THEN 1
                   WHEN 'normal' THEN 2
                   ELSE 3
                 END
               LIMIT 20`,
              [userId, pastHorizon, dueHorizon, nowSql]
            );
            return result.rows;
          },
          [] as any[]
        ),
        safe(
          'calendar',
          async () => {
            const result = await pool.query(
              `SELECT id, title, description, start_time, end_time, event_type
               FROM calendar_events
               WHERE user_id = $1
                 AND start_time >= $2
                 AND start_time <= $3
               ORDER BY start_time ASC
               LIMIT 12`,
              [userId, pastHorizon, dueHorizon]
            );
            return result.rows;
          },
          [] as any[]
        ),
        safe(
          'notes',
          async () => {
            const result = await pool.query(
              `SELECT id, content, color, created_at, updated_at
               FROM quick_notes
               WHERE user_id = $1
               ORDER BY COALESCE(updated_at, created_at) DESC
               LIMIT 20`,
              [userId]
            );
            return result.rows;
          },
          [] as any[]
        ),
        safe(
          'notebook',
          async () => {
            const result = await pool.query(
              `SELECT id, title, entry_type, status, updated_at, created_at
               FROM lab_notebook_entries
               WHERE user_id = $1
               ORDER BY COALESCE(updated_at, created_at) DESC
               LIMIT 12`,
              [userId]
            );
            return result.rows;
          },
          [] as any[]
        ),
        safe(
          'recentTasks',
          async () => {
            const result = await pool.query(
              `SELECT id, title, status, priority, due_date, updated_at, created_at, assignee_id
               FROM workspace_tasks
               WHERE is_archived = 0
                 AND (assignee_id = $1 OR created_by = $1)
               ORDER BY updated_at DESC
               LIMIT 12`,
              [userId]
            );
            return result.rows;
          },
          [] as any[]
        ),
        safe(
          'experiments',
          async () => {
            const result = await pool.query(
              `SELECT id, title, status, updated_at, created_at
               FROM experiments
               WHERE researcher_id = $1 OR created_by = $1
               ORDER BY COALESCE(updated_at, created_at) DESC
               LIMIT 8`,
              [userId]
            );
            return result.rows;
          },
          [] as any[]
        ),
      ]);

    const nowMs = Date.now();

    const reminders = [
      ...remindersTasks.map((t: any) => {
        const due = t.due_date ? new Date(t.due_date).getTime() : null;
        let urgency: 'overdue' | 'today' | 'soon' | 'open' = 'open';
        if (due != null && !Number.isNaN(due)) {
          const dayMs = 24 * 60 * 60 * 1000;
          if (due < nowMs - dayMs * 0.05) urgency = 'overdue';
          else if (due < nowMs + dayMs) urgency = 'today';
          else urgency = 'soon';
        }
        return {
          id: `task-${t.id}`,
          kind: 'task' as const,
          title: t.title,
          subtitle:
            urgency === 'overdue'
              ? 'Overdue task'
              : urgency === 'today'
                ? 'Due today'
                : t.due_date
                  ? `Due ${new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : `${String(t.status || '').replace(/_/g, ' ')} · ${t.priority || 'normal'} priority`,
          dueAt: t.due_date || null,
          urgency,
          priority: t.priority || 'normal',
          status: t.status,
          link: '/lab-workspace?section=tasks',
          source: 'Lab workspace',
        };
      }),
      ...remindersEvents.map((e: any) => ({
        id: `event-${e.id}`,
        kind: 'event' as const,
        title: e.title,
        subtitle: e.start_time
          ? new Date(e.start_time).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
          : e.event_type || 'Calendar',
        dueAt: e.start_time || null,
        urgency: 'soon' as const,
        priority: 'normal',
        status: e.event_type || 'event',
        link: '/lab-workspace',
        source: 'Calendar',
      })),
    ]
      .sort((a, b) => {
        const rank = { overdue: 0, today: 1, soon: 2, open: 3 } as const;
        const ra = rank[a.urgency as keyof typeof rank] ?? 3;
        const rb = rank[b.urgency as keyof typeof rank] ?? 3;
        if (ra !== rb) return ra - rb;
        const da = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        const db = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        return da - db;
      })
      .slice(0, 16);

    const activities = [
      ...notebookEntries.map((e: any) => ({
        id: `nb-${e.id}`,
        kind: 'notebook' as const,
        title: e.title || 'Untitled note',
        subtitle: `${e.entry_type || 'entry'}${e.status ? ` · ${String(e.status).replace(/_/g, ' ')}` : ''}`,
        timestamp: e.updated_at || e.created_at,
        link: `/lab-notebook?highlight=${encodeURIComponent(e.id)}`,
        source: 'Lab notebook',
      })),
      ...recentTasks.map((t: any) => ({
        id: `wt-${t.id}`,
        kind: 'task' as const,
        title: t.title,
        subtitle: `${String(t.status || '').replace(/_/g, ' ')}${t.due_date ? ` · due ${new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`,
        timestamp: t.updated_at || t.created_at,
        link: '/lab-workspace?section=tasks',
        source: 'Lab workspace',
      })),
      ...experiments.map((e: any) => ({
        id: `ex-${e.id}`,
        kind: 'experiment' as const,
        title: e.title || 'Experiment',
        subtitle: e.status ? String(e.status).replace(/_/g, ' ') : 'Experiment',
        timestamp: e.updated_at || e.created_at,
        link: `/experiment-tracker?highlight=${encodeURIComponent(e.id)}`,
        source: 'Experiments',
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
      )
      .slice(0, 18);

    res.json({
      updatedAt: new Date().toISOString(),
      reminders,
      notes: notes.map((n: any) => ({
        id: n.id,
        content: n.content,
        color: n.color || 'yellow',
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      })),
      activities,
      counts: {
        reminders: reminders.length,
        notes: notes.length,
        activities: activities.length,
        overdue: reminders.filter((r) => r.urgency === 'overdue').length,
      },
    });
  } catch (error: any) {
    console.error('Dashboard pulse error:', error);
    res.status(500).json({ error: 'Failed to load dashboard pulse', details: error.message });
  }
});

export default router;
