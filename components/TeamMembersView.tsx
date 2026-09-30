import React, { useMemo, useState } from 'react';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  PlusIcon,
} from './icons';

interface TeamMember {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  role?: string;
  status?: 'active' | 'inactive' | 'away';
  avatar_url?: string;
  initials?: string;
  team?: string;
  manager?: string;
  account_type?: string;
  first_name?: string;
  last_name?: string;
  permissions?: unknown;
}

interface TeamMembersViewProps {
  members: TeamMember[];
  onInvite: () => void;
  onEdit?: (member: TeamMember) => void;
  onDelete?: (member: TeamMember) => void;
  onMessage?: () => void;
  loading?: boolean;
}

const getInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('');

const roleLabel = (role?: string) => {
  if (!role) return null;
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const TeamMembersView: React.FC<TeamMembersViewProps> = ({
  members,
  onInvite,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = !q
      ? members
      : members.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            (m.role || '').toLowerCase().includes(q)
        );
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [members, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-sky-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      <div className="px-4 sm:px-6 py-3 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm flex flex-wrap items-center gap-2.5 shrink-0">
        <div className="relative flex-1 min-w-[12rem] max-w-md">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search by name, email, or role…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
          />
        </div>
        <span className="text-[12px] text-slate-500 tabular-nums">
          {filteredMembers.length} member{filteredMembers.length === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={onInvite}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-white bg-sky-700 rounded-md hover:bg-sky-800"
        >
          <PlusIcon className="w-4 h-4" />
          Invite member
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[18rem] text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md shadow-sky-200/60 flex items-center justify-center mb-4">
              <UsersIcon className="w-6 h-6" />
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">
              {searchQuery ? 'No members match' : 'No team members yet'}
            </h3>
            <p className="text-[13px] text-slate-500 max-w-sm mb-5">
              {searchQuery
                ? 'Try a different name, email, or role.'
                : 'Invite colleagues so they can share tasks, projects, and lab resources.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={onInvite}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-sky-700 rounded-md hover:bg-sky-800"
              >
                <PlusIcon className="w-4 h-4" />
                Invite member
              </button>
            )}
          </div>
        ) : (
          <ul className="max-w-3xl mx-auto bg-white border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100">
            {filteredMembers.map((member) => {
              const label = roleLabel(member.role);
              const status = member.status || 'active';
              return (
                <li
                  key={member.id}
                  className="px-4 py-3.5 flex items-center gap-3 hover:bg-sky-50/40 group transition-colors"
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover shrink-0 ring-1 ring-slate-200/80"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 text-[12px] font-semibold flex items-center justify-center shrink-0 ring-1 ring-slate-200/60">
                      {member.initials || getInitials(member.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-medium text-slate-900 truncate">{member.name}</p>
                      {label && (
                        <span className="text-[11px] font-medium text-sky-900 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded">
                          {label}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] ${
                          status === 'active'
                            ? 'text-emerald-700'
                            : status === 'away'
                              ? 'text-amber-700'
                              : 'text-slate-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            status === 'active'
                              ? 'bg-emerald-500'
                              : status === 'away'
                                ? 'bg-amber-500'
                                : 'bg-slate-300'
                          }`}
                        />
                        {status}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 truncate mt-0.5">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(member)}
                        className="p-1.5 text-slate-400 hover:text-sky-800 hover:bg-sky-50 rounded-md"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(member)}
                        className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-md"
                        title="Remove"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TeamMembersView;
