import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  UserPlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ChatBubbleLeftRightIcon
} from './icons';
import AssigneeAvatars from './AssigneeAvatars';

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
  permissions?: any;
}

interface TeamMembersViewProps {
  members: TeamMember[];
  onInvite: () => void;
  onEdit?: (member: TeamMember) => void;
  onDelete?: (member: TeamMember) => void;
  onMessage?: () => void;
  loading?: boolean;
}

const TeamMembersView: React.FC<TeamMembersViewProps> = ({ 
  members, 
  onInvite,
  onEdit,
  onDelete,
  onMessage,
  loading = false 
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Get unique values for filters
  const teams = Array.from(new Set(members.map(m => m.team).filter(Boolean)));
  const accountTypes = Array.from(new Set(members.map(m => m.account_type).filter(Boolean)));

  // Filter and sort members
  const filteredMembers = members
    .filter(member => {
      const matchesSearch = !searchQuery || 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      const matchesTeam = teamFilter === 'all' || member.team === teamFilter;
      const matchesAccountType = accountTypeFilter === 'all' || member.account_type === accountTypeFilter;
      
      return matchesSearch && matchesStatus && matchesTeam && matchesAccountType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'role':
          return (a.role || '').localeCompare(b.role || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'inactive':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-cyan-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">All People</h1>
          <div className="flex items-center gap-2">
            {onMessage && (
              <button
                onClick={onMessage}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                Messages
              </button>
            )}
            <button
              onClick={onInvite}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlusIcon className="w-5 h-5" />
              Invite
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
            K
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Status</option>
            <option value="active">Active</option>
            <option value="away">Away</option>
            <option value="inactive">Inactive</option>
          </select>

          {teams.length > 0 && (
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Team</option>
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          )}

          {accountTypes.length > 0 && (
            <select
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Account type</option>
              {accountTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name">Sort</option>
            <option value="name">Name</option>
            <option value="role">Role</option>
            <option value="status">Status</option>
          </select>

          {/* View Toggle */}
          <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              title="Grid view"
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              title="List view"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Members Display */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-gray-500 mb-2">No people found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow group relative"
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(member);
                        }}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit member"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(member);
                        }}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Remove member"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative mb-3">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="w-20 h-20 rounded-lg object-cover mx-auto"
                    />
                  ) : (
                    <div
                      className={`w-20 h-20 rounded-lg ${getAvatarColor(member.name)} flex items-center justify-center mx-auto`}
                    >
                      <span className="text-white text-2xl font-semibold">
                        {member.initials || getInitials(member.name)}
                      </span>
                    </div>
                  )}
                  {/* Status Indicator */}
                  <div
                    className={`absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2 w-4 h-4 ${getStatusColor(member.status)} rounded-full border-2 border-white`}
                  />
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-gray-900 mb-1">{member.name}</h3>
                  {member.role && (
                    <p className="text-xs text-gray-500 mb-1">{member.role}</p>
                  )}
                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow group flex items-center gap-4"
              >
                <div className="relative">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-lg ${getAvatarColor(member.name)} flex items-center justify-center`}
                    >
                      <span className="text-white text-lg font-semibold">
                        {member.initials || getInitials(member.name)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(member.status)} rounded-full border-2 border-white`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{member.email}</p>
                  {member.role && (
                    <p className="text-xs text-gray-400 mt-1">{member.role}</p>
                  )}
                </div>
                {member.team && (
                  <div className="text-sm text-gray-500">{member.team}</div>
                )}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(member);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit member"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(member);
                      }}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Remove member"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamMembersView;

