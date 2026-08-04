/**
 * Broadcast so dashboard / other listeners can refresh without a full reload.
 * Fire after notebook, workspace, notes, or calendar mutations.
 */
export const DASHBOARD_SYNC_EVENT = 'researchlab:dashboard-sync';

export type DashboardSyncDetail = {
  source?: string;
  at?: string;
};

export function notifyDashboardSync(source?: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent(DASHBOARD_SYNC_EVENT, {
        detail: { source, at: new Date().toISOString() } satisfies DashboardSyncDetail,
      })
    );
    localStorage.setItem('researchlab:dashboard-sync-at', String(Date.now()));
  } catch {
    // ignore
  }
}
