/** Ownership helpers for public-network CRUD surfaces. */

export function sameUserId(a: unknown, b: unknown): boolean {
  if (typeof a !== 'string' && typeof a !== 'number') return false;
  if (typeof b !== 'string' && typeof b !== 'number') return false;
  return String(a) === String(b);
}

export function isAdminRole(role: unknown): boolean {
  if (typeof role !== 'string') return false;
  const r = role.toLowerCase();
  return r === 'admin' || r === 'administrator' || r === 'superadmin';
}

/** Owner or admin may manage the resource. Null owner → admin only. */
export function canManageResource(
  ownerId: unknown,
  user: Readonly<{ id?: string; role?: string }> | null | undefined
): boolean {
  if (!user || typeof user.id !== 'string' || user.id.length === 0) return false;
  if (isAdminRole(user.role)) return true;
  if (ownerId == null || ownerId === '') return false;
  return sameUserId(ownerId, user.id);
}
