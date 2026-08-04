/**
 * Consistent public-post attribution: resolve a display name from a users join row.
 */
export function userDisplayName(row: {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  posted_by_name?: string | null;
  owner_name?: string | null;
} | null | undefined): string {
  if (!row) return 'Unknown';
  if (row.posted_by_name && String(row.posted_by_name).trim()) {
    return String(row.posted_by_name).trim();
  }
  if (row.owner_name && String(row.owner_name).trim()) {
    return String(row.owner_name).trim();
  }
  const full = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (row.username) return String(row.username);
  return 'Unknown';
}

/** Build display name from authenticated request user */
export function nameFromAuthUser(user: {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
} | null | undefined): string {
  return userDisplayName(user);
}

/** SQL fragment: display name from users alias `u` */
export const POSTED_BY_SQL = `TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')))`;

export function mapPostedBy(row: any, idField: string = 'created_by') {
  const id = row[idField] ?? row.user_id ?? null;
  const name = userDisplayName(row);
  return {
    createdBy: id,
    postedByName: name === 'Unknown' && !id ? null : name,
  };
}
