import React, { useMemo, useState } from 'react';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
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

const TeamMembersView: React.FC<TeamMembersViewProps> = ({
  members,
  onInvite,
  onEdit,
  onDelete,
  onMessage,
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
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-slate-700" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-white">
      <div className="px-6 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search members"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-slate-200 rounded-md bg-slate-50/80 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          {onMessage && (
            <button
              type="button"
              onClick={onMessage}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Messages
            </button>
          )}
          <button
            type="button"
            onClick={onInvite}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
          >
            Invite
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-center px-6">
            <p className="text-[14px] font-medium text-slate-800 mb-1">No members found</p>
            <p className="text-[13px] text-slate-500">
              {searchQuery ? 'Try a different search.' : 'Invite someone to get started.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredMembers.map((member) => (
              <li
                key={member.id}
                className="px-6 py-3.5 flex items-center gap-3 hover:bg-slate-50/80 group"
              >
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt=""
                    className="w-9 h-9 rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-md bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center justify-center shrink-0">
                    {member.initials || getInitials(member.name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-medium text-slate-900 truncate">{member.name}</p>
                    {member.role ? (
                      <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {member.role}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[12px] text-slate-500 truncate">{member.email}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(member)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(member)}
                      className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                      title="Remove"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TeamMembersView;
