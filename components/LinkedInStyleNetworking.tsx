import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';
import Card from './ui/Card';
import {
  UserIcon,
  UsersIcon,
  BuildingOfficeIcon,
  UserPlusIcon,
  UserMinusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  AcademicCapIcon,
  HeartIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  GlobeAltIcon,
} from './icons';

interface Lab {
  id: string;
  name: string;
  institution: string;
  department: string;
  location: string;
  city: string;
  country: string;
  description: string;
  tagline?: string;
  fieldOfResearch: string;
  researchAreas: string[];
  lookingFor?: string[];
  lookingForLabels?: string[];
  memberCount: number;
  isMember: boolean;
  isFollowing: boolean;
  foundedYear: number | null;
  website: string;
  hasWebsite: boolean;
  postedByName?: string;
}

interface MyLabSummary {
  id: string;
  name: string;
  institution: string;
  isShowcased: boolean;
  membershipRole: string;
  tagline: string;
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  institution: string;
  location: string;
  city: string;
  country: string;
  fieldsOfResearch: string[];
  fieldOfResearch: string;
  researchInterests: string[];
  profilePicture?: string;
  isConnected: boolean;
  isFollowing: boolean;
  connectionStatus: 'none' | 'pending' | 'connected';
  connectionDirection?: 'out' | 'in' | null;
  connectionId?: string | null;
  careerStage: string;
  openToCollaborate: boolean;
  currentlyAvailable: boolean;
  profileCompleteness: number;
  recentlyActive: boolean;
  hasRemoteSignal: boolean;
  bio: string;
}

interface IncomingRequest {
  id: string;
  requesterId: string;
  name: string;
  avatarUrl?: string;
  position: string;
  institution: string;
  createdAt: string;
}

interface FilterOptions {
  countries: string[];
  cities: string[];
  fields: string[];
  institutions: string[];
  careerStages: string[];
  lookingFor?: { id: string; label: string }[];
}

interface DirectoryFilters {
  country: string;
  city: string;
  field: string;
  institution: string;
  careerStage: string;
  lookingFor: string;
  openToCollaborate: boolean;
  recentlyActive: boolean;
  profileReady: boolean;
  remoteFriendly: boolean;
  hasWebsite: boolean;
  sameInstitution: boolean;
}

const EMPTY_FILTERS: DirectoryFilters = {
  country: '',
  city: '',
  field: '',
  institution: '',
  careerStage: '',
  lookingFor: '',
  openToCollaborate: false,
  recentlyActive: false,
  profileReady: false,
  remoteFriendly: false,
  hasWebsite: false,
  sameInstitution: false,
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const authHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token') || ''}`,
});

const matchField = (haystack: string[], needle: string) => {
  if (!needle) return true;
  const q = needle.toLowerCase();
  return haystack.some((h) => h.toLowerCase().includes(q));
};

const LinkedInStyleNetworking: React.FC = () => {
  const { user } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [myLabs, setMyLabs] = useState<MyLabSummary[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    countries: [],
    cities: [],
    fields: [],
    institutions: [],
    careerStages: [],
    lookingFor: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'labs' | 'members'>('all');
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<DirectoryFilters>(EMPTY_FILTERS);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const myInstitution = (user as any)?.current_institution || (user as any)?.institution || '';

  useEffect(() => {
    void loadDirectory();
  }, []);

  const loadIncomingRequests = async () => {
    try {
      const response = await fetch(`${API_BASE}/networking/social/requests`, {
        headers: authHeaders(),
      });
      if (!response.ok) return;
      const data = await response.json();
      setIncomingRequests(data.requests || []);
    } catch (error) {
      console.error('Error loading connection requests:', error);
    }
  };

  const loadDirectory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/networking/directory`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to load directory');
      const data = await response.json();
      const mappedLabs: Lab[] = (data.labs || []).map((lab: any) => ({
        ...lab,
        isMember: false,
        isFollowing: false,
        foundedYear: lab.foundedYear ?? null,
      }));
      const mappedMembers: Member[] = (data.researchers || []).map((m: any) => ({
        ...m,
        isConnected: Boolean(m.isConnected),
        isFollowing: Boolean(m.isFollowing),
        connectionStatus: (m.connectionStatus || 'none') as Member['connectionStatus'],
        connectionDirection: m.connectionDirection || null,
        connectionId: m.connectionId || null,
        researchInterests: m.researchInterests || m.fieldsOfResearch || [],
        fieldsOfResearch: m.fieldsOfResearch || [],
      }));
      setLabs(mappedLabs);
      setMembers(mappedMembers);
      setMyLabs(data.myLabs || []);
      setFilterOptions(
        data.filterOptions || {
          countries: [],
          cities: [],
          fields: [],
          institutions: [],
          careerStages: [],
          lookingFor: [],
        }
      );
      await loadIncomingRequests();
    } catch (error) {
      console.error('Error loading networking directory:', error);
      setLabs([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const setFilter = <K extends keyof DirectoryFilters>(key: K, value: DirectoryFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const activeFilterCount = useMemo(
    () =>
      Object.entries(filters).filter(([key, value]) => {
        if (typeof value === 'boolean') return value;
        return Boolean(value);
      }).length,
    [filters]
  );

  const filteredLabs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return labs.filter((lab) => {
      if (filters.country && lab.country.toLowerCase() !== filters.country.toLowerCase()) return false;
      if (filters.city && lab.city.toLowerCase() !== filters.city.toLowerCase()) return false;
      if (filters.institution && lab.institution.toLowerCase() !== filters.institution.toLowerCase()) {
        return false;
      }
      if (filters.field && !matchField([lab.fieldOfResearch, lab.department, ...lab.researchAreas], filters.field)) {
        return false;
      }
      if (filters.lookingFor && !(lab.lookingFor || []).includes(filters.lookingFor)) return false;
      if (filters.hasWebsite && !lab.hasWebsite) return false;
      if (filters.sameInstitution && myInstitution && lab.institution.toLowerCase() !== myInstitution.toLowerCase()) {
        return false;
      }
      if (!q) return true;
      return (
        lab.name.toLowerCase().includes(q) ||
        lab.institution.toLowerCase().includes(q) ||
        lab.location.toLowerCase().includes(q) ||
        lab.department.toLowerCase().includes(q) ||
        lab.researchAreas.some((area) => area.toLowerCase().includes(q))
      );
    });
  }, [labs, filters, searchQuery, myInstitution]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return members.filter((member) => {
      if (filters.country && member.country.toLowerCase() !== filters.country.toLowerCase()) return false;
      if (filters.city && member.city.toLowerCase() !== filters.city.toLowerCase()) return false;
      if (
        filters.institution &&
        member.institution.toLowerCase() !== filters.institution.toLowerCase()
      ) {
        return false;
      }
      if (filters.field && !matchField(member.fieldsOfResearch, filters.field)) return false;
      if (filters.careerStage && member.careerStage !== filters.careerStage) return false;
      if (filters.openToCollaborate && !member.openToCollaborate) return false;
      if (filters.recentlyActive && !member.recentlyActive) return false;
      if (filters.profileReady && member.profileCompleteness < 50) return false;
      if (filters.remoteFriendly && !member.hasRemoteSignal) return false;
      if (
        filters.sameInstitution &&
        myInstitution &&
        member.institution.toLowerCase() !== myInstitution.toLowerCase()
      ) {
        return false;
      }
      if (!q) return true;
      return (
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(q) ||
        member.position.toLowerCase().includes(q) ||
        member.institution.toLowerCase().includes(q) ||
        member.location.toLowerCase().includes(q) ||
        member.researchInterests.some((interest) => interest.toLowerCase().includes(q)) ||
        (member.bio || '').toLowerCase().includes(q)
      );
    });
  }, [members, filters, searchQuery, myInstitution]);

  const handleLabAction = (labId: string, action: 'join' | 'leave' | 'follow' | 'unfollow') => {
    setLabs((prevLabs) =>
      prevLabs.map((lab) => {
        if (lab.id !== labId) return lab;
        switch (action) {
          case 'join':
            return { ...lab, isMember: true, memberCount: lab.memberCount + 1 };
          case 'leave':
            return { ...lab, isMember: false, memberCount: Math.max(0, lab.memberCount - 1) };
          case 'follow':
            return { ...lab, isFollowing: true };
          case 'unfollow':
            return { ...lab, isFollowing: false };
          default:
            return lab;
        }
      })
    );
  };

  const handleMemberAction = async (
    memberId: string,
    action: 'connect' | 'disconnect' | 'follow' | 'unfollow'
  ) => {
    setActionBusyId(memberId);
    const previous = members.find((m) => m.id === memberId);

    // Optimistic UI
    setMembers((prevMembers) =>
      prevMembers.map((member) => {
        if (member.id !== memberId) return member;
        switch (action) {
          case 'connect':
            return {
              ...member,
              connectionStatus: 'pending' as const,
              connectionDirection: 'out' as const,
            };
          case 'disconnect':
            return {
              ...member,
              connectionStatus: 'none' as const,
              isConnected: false,
              connectionDirection: null,
              connectionId: null,
            };
          case 'follow':
            return { ...member, isFollowing: true };
          case 'unfollow':
            return { ...member, isFollowing: false };
          default:
            return member;
        }
      })
    );

    try {
      let response: Response;
      if (action === 'follow') {
        response = await fetch(`${API_BASE}/networking/social/follow/${memberId}`, {
          method: 'POST',
          headers: authHeaders(),
        });
      } else if (action === 'unfollow') {
        response = await fetch(`${API_BASE}/networking/social/follow/${memberId}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
      } else if (action === 'connect') {
        response = await fetch(`${API_BASE}/networking/social/connect/${memberId}`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({}),
        });
      } else {
        response = await fetch(`${API_BASE}/networking/social/connect/${memberId}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
      }

      if (!response.ok) {
        throw new Error(`Action failed: ${action}`);
      }

      const data = await response.json();
      if (action === 'connect' || action === 'disconnect') {
        setMembers((prev) =>
          prev.map((member) =>
            member.id === memberId
              ? {
                  ...member,
                  connectionStatus: data.connectionStatus || (action === 'disconnect' ? 'none' : 'pending'),
                  isConnected: Boolean(data.isConnected),
                  connectionId: data.connectionId || member.connectionId,
                  connectionDirection:
                    data.connectionStatus === 'connected'
                      ? member.connectionDirection || 'out'
                      : data.connectionStatus === 'pending'
                        ? 'out'
                        : null,
                }
              : member
          )
        );
      }
      await loadIncomingRequests();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      // Roll back optimistic update
      if (previous) {
        setMembers((prev) => prev.map((m) => (m.id === memberId ? previous : m)));
      }
    } finally {
      setActionBusyId(null);
    }
  };

  const respondToRequest = async (request: IncomingRequest, status: 'accepted' | 'declined') => {
    setActionBusyId(request.id);
    try {
      const response = await fetch(
        `${API_BASE}/networking/social/connect/${request.id}/respond`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ status }),
        }
      );
      if (!response.ok) throw new Error('Failed to respond');

      setIncomingRequests((prev) => prev.filter((r) => r.id !== request.id));
      setMembers((prev) =>
        prev.map((member) =>
          member.id === request.requesterId
            ? {
                ...member,
                isConnected: status === 'accepted',
                connectionStatus: status === 'accepted' ? 'connected' : 'none',
                connectionDirection: status === 'accepted' ? 'in' : null,
              }
            : member
        )
      );
    } catch (error) {
      console.error('Error responding to connection request:', error);
    } finally {
      setActionBusyId(null);
    }
  };

  const selectClass =
    'block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400';

  const renderLabCard = (lab: Lab) => (
    <Card key={lab.id}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{lab.name}</h3>
                <p className="text-gray-600">
                  {lab.institution}
                  {lab.location ? ` · ${lab.location}` : ''}
                </p>
                {lab.postedByName && (
                  <p className="text-xs text-slate-500 mt-0.5">Led by {lab.postedByName}</p>
                )}
              </div>
            </div>
            {lab.tagline && (
              <p className="text-[14px] font-medium text-slate-800 mb-2">{lab.tagline}</p>
            )}
            <p className="text-gray-700 mb-3">{lab.description || 'No description yet.'}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {lab.researchAreas.slice(0, 4).map((area) => (
                <span key={area} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                  {area}
                </span>
              ))}
              {(lab.lookingForLabels || []).map((label) => (
                <span key={label} className="px-2 py-1 bg-amber-50 text-amber-900 rounded-md text-xs">
                  Looking: {label}
                </span>
              ))}
              {(lab.city || lab.country) && (
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs inline-flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3" />
                  {[lab.city, lab.country].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <UsersIcon className="w-4 h-4 mr-1" />
                {lab.memberCount} members
              </span>
              {lab.foundedYear && <span>Est. {lab.foundedYear}</span>}
              {lab.website && (
                <a
                  href={lab.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-slate-700 hover:underline"
                >
                  <GlobeAltIcon className="w-4 h-4 mr-1" />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {lab.isMember ? (
            <Button onClick={() => handleLabAction(lab.id, 'leave')} variant="outline">
              Leave lab
            </Button>
          ) : (
            <Button onClick={() => handleLabAction(lab.id, 'join')} variant="primary">
              Request to join
            </Button>
          )}
          {lab.isFollowing ? (
            <Button onClick={() => handleLabAction(lab.id, 'unfollow')} variant="ghost">
              <HeartIcon className="w-4 h-4 mr-2 text-red-500" />
              Following
            </Button>
          ) : (
            <Button onClick={() => handleLabAction(lab.id, 'follow')} variant="outline">
              <HeartIcon className="w-4 h-4 mr-2" />
              Follow
            </Button>
          )}
          <Link
            to={`/labs/${lab.id}`}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-4 py-2"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            View lab
          </Link>
        </div>
      </div>
    </Card>
  );

  const renderMemberCard = (member: Member) => (
    <Card key={member.id}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
            {member.profilePicture ? (
              <img src={member.profilePicture} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-7 h-7 text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {member.firstName} {member.lastName}
              </h3>
              {member.openToCollaborate && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800">
                  Open to collaborate
                </span>
              )}
              {member.recentlyActive && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-sky-50 text-sky-800">
                  Recently active
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">
              {member.position}
              {member.institution ? ` · ${member.institution}` : ''}
            </p>
            {(member.location || member.careerStage) && (
              <p className="text-sm text-gray-500 mb-2 flex flex-wrap items-center gap-3">
                {member.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5" />
                    {member.location}
                  </span>
                )}
                {member.careerStage && member.careerStage !== 'Unspecified' && (
                  <span className="inline-flex items-center gap-1">
                    <AcademicCapIcon className="w-3.5 h-3.5" />
                    {member.careerStage}
                  </span>
                )}
              </p>
            )}
            {member.bio && <p className="text-sm text-gray-700 mb-3 line-clamp-2">{member.bio}</p>}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {member.fieldsOfResearch.slice(0, 5).map((field) => (
                <span key={field} className="px-2 py-0.5 text-[11px] rounded-md bg-slate-100 text-slate-700">
                  {field}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {member.connectionStatus === 'pending' && member.connectionDirection === 'in' ? (
                <>
                  <Button
                    onClick={() =>
                      member.connectionId &&
                      respondToRequest(
                        {
                          id: member.connectionId,
                          requesterId: member.id,
                          name: `${member.firstName} ${member.lastName}`,
                          position: member.position,
                          institution: member.institution,
                          createdAt: '',
                        },
                        'accepted'
                      )
                    }
                    variant="primary"
                    className="flex items-center"
                    disabled={actionBusyId === member.id || actionBusyId === member.connectionId}
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    onClick={() =>
                      member.connectionId &&
                      respondToRequest(
                        {
                          id: member.connectionId,
                          requesterId: member.id,
                          name: `${member.firstName} ${member.lastName}`,
                          position: member.position,
                          institution: member.institution,
                          createdAt: '',
                        },
                        'declined'
                      )
                    }
                    variant="outline"
                    className="flex items-center"
                    disabled={actionBusyId === member.id || actionBusyId === member.connectionId}
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </>
              ) : member.connectionStatus === 'pending' ? (
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={() => handleMemberAction(member.id, 'disconnect')}
                  disabled={actionBusyId === member.id}
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Cancel request
                </Button>
              ) : member.isConnected || member.connectionStatus === 'connected' ? (
                <Button
                  onClick={() => handleMemberAction(member.id, 'disconnect')}
                  variant="outline"
                  className="flex items-center"
                  disabled={actionBusyId === member.id}
                >
                  <UserMinusIcon className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              ) : (
                <Button
                  onClick={() => handleMemberAction(member.id, 'connect')}
                  variant="primary"
                  className="flex items-center"
                  disabled={actionBusyId === member.id}
                >
                  <UserPlusIcon className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              )}
              {member.isFollowing ? (
                <Button
                  onClick={() => handleMemberAction(member.id, 'unfollow')}
                  variant="ghost"
                  className="flex items-center"
                  disabled={actionBusyId === member.id}
                >
                  <HeartIcon className="w-4 h-4 mr-2 text-red-500" />
                  Following
                </Button>
              ) : (
                <Button
                  onClick={() => handleMemberAction(member.id, 'follow')}
                  variant="outline"
                  className="flex items-center"
                  disabled={actionBusyId === member.id}
                >
                  <HeartIcon className="w-4 h-4 mr-2" />
                  Follow
                </Button>
              )}
              <Link
                to={`/profile/${member.id}`}
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-4 py-2"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                View profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">Networking</h1>
        <p className="mt-1.5 text-[14px] text-slate-600 max-w-2xl">
          Discover labs that chose to go live, and researchers by place, field, and collaboration intent.
          Private lab workspaces stay in{' '}
          <Link
            to="/lab-workspace"
            className="font-medium text-slate-800 hover:text-slate-950 underline-offset-2 hover:underline"
          >
            Lab workspace
          </Link>
          .
        </p>
      </div>

      {incomingRequests.length > 0 && (
        <Card>
          <div className="p-5">
            <h2 className="text-[15px] font-semibold text-slate-900 mb-3">
              Connection requests ({incomingRequests.length})
            </h2>
            <ul className="space-y-3">
              {incomingRequests.map((request) => (
                <li
                  key={request.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-slate-200 rounded-lg px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-slate-900">{request.name}</p>
                    <p className="text-[12px] text-slate-500 truncate">
                      {[request.position, request.institution].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="primary"
                      onClick={() => respondToRequest(request, 'accepted')}
                      disabled={actionBusyId === request.id}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => respondToRequest(request, 'declined')}
                      disabled={actionBusyId === request.id}
                    >
                      Decline
                    </Button>
                    <Link
                      to={`/profile/${request.requesterId}`}
                      className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {myLabs.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Your labs</p>
              <p className="text-[13px] text-slate-600 mt-0.5">
                {myLabs.filter((l) => l.isShowcased).length} live on Networking ·{' '}
                {myLabs.filter((l) => !l.isShowcased).length} still private
              </p>
            </div>
            <Link
              to="/lab-workspace"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
            >
              <GlobeAltIcon className="w-4 h-4" />
              Manage showcase
            </Link>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {myLabs.map((lab) => (
              <li key={lab.id}>
                <Link
                  to={`/labs/${lab.id}`}
                  className="text-[12px] px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-100 hover:bg-slate-100 inline-block"
                >
                  {lab.name}
                  <span className="text-slate-400"> · </span>
                  {lab.isShowcased ? 'Live' : 'Private'}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search labs and researchers…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setActiveFilter('all')}
              variant={activeFilter === 'all' ? 'primary' : 'outline'}
            >
              All
            </Button>
            <Button
              onClick={() => setActiveFilter('labs')}
              variant={activeFilter === 'labs' ? 'primary' : 'outline'}
              className="flex items-center"
            >
              <BuildingOfficeIcon className="w-4 h-4 mr-2" />
              Labs
            </Button>
            <Button
              onClick={() => setActiveFilter('members')}
              variant={activeFilter === 'members' ? 'primary' : 'outline'}
              className="flex items-center"
            >
              <UsersIcon className="w-4 h-4 mr-2" />
              Researchers
            </Button>
            <Button
              onClick={() => setShowFilters((v) => !v)}
              variant="outline"
              className="flex items-center"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="block text-xs font-medium text-slate-600">
                Country
                <select
                  className={`${selectClass} mt-1`}
                  value={filters.country}
                  onChange={(e) => setFilter('country', e.target.value)}
                >
                  <option value="">Any country</option>
                  {filterOptions.countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-600">
                City
                <select
                  className={`${selectClass} mt-1`}
                  value={filters.city}
                  onChange={(e) => setFilter('city', e.target.value)}
                >
                  <option value="">Any city</option>
                  {filterOptions.cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Field of research
                <select
                  className={`${selectClass} mt-1`}
                  value={filters.field}
                  onChange={(e) => setFilter('field', e.target.value)}
                >
                  <option value="">Any field</option>
                  {filterOptions.fields.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Institution
                <select
                  className={`${selectClass} mt-1`}
                  value={filters.institution}
                  onChange={(e) => setFilter('institution', e.target.value)}
                >
                  <option value="">Any institution</option>
                  {filterOptions.institutions.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Career stage
                <select
                  className={`${selectClass} mt-1`}
                  value={filters.careerStage}
                  onChange={(e) => setFilter('careerStage', e.target.value)}
                >
                  <option value="">Any stage</option>
                  {filterOptions.careerStages.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Lab looking for
                <select
                  className={`${selectClass} mt-1`}
                  value={filters.lookingFor}
                  onChange={(e) => setFilter('lookingFor', e.target.value)}
                >
                  <option value="">Any intent</option>
                  {(filterOptions.lookingFor || []).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.openToCollaborate}
                  onChange={(e) => setFilter('openToCollaborate', e.target.checked)}
                  className="rounded border-slate-300"
                />
                Open to collaborate
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.recentlyActive}
                  onChange={(e) => setFilter('recentlyActive', e.target.checked)}
                  className="rounded border-slate-300"
                />
                Recently active (30d)
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.profileReady}
                  onChange={(e) => setFilter('profileReady', e.target.checked)}
                  className="rounded border-slate-300"
                />
                Profile ≥50% complete
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.remoteFriendly}
                  onChange={(e) => setFilter('remoteFriendly', e.target.checked)}
                  className="rounded border-slate-300"
                />
                Remote-ready (timezone set)
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasWebsite}
                  onChange={(e) => setFilter('hasWebsite', e.target.checked)}
                  className="rounded border-slate-300"
                />
                Lab has website
              </label>
              {myInstitution && (
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.sameInstitution}
                    onChange={(e) => setFilter('sameInstitution', e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Same institution as me
                </label>
              )}
            </div>

            {activeFilterCount > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
                >
                  <XMarkIcon className="w-4 h-4" />
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {(activeFilter === 'all' || activeFilter === 'labs') && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BuildingOfficeIcon className="w-5 h-5 mr-2 text-blue-600" />
                Research labs ({filteredLabs.length})
              </h2>
            </div>
            <div className="space-y-4">
              {filteredLabs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center">
                  <BuildingOfficeIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {labs.length === 0 ? 'No labs to show yet' : 'No labs match your filters'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {labs.length === 0
                      ? 'Only labs that opt in appear here. Create a lab in Lab workspace, then use Showcase on Networking.'
                      : 'Try clearing a filter or broadening your search.'}
                  </p>
                </div>
              ) : (
                filteredLabs.map(renderLabCard)
              )}
            </div>
          </div>
        )}

        {(activeFilter === 'all' || activeFilter === 'members') && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <UsersIcon className="w-5 h-5 mr-2 text-green-600" />
                Researchers ({filteredMembers.length})
              </h2>
            </div>
            <div className="space-y-4">
              {filteredMembers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-white p-8 text-center">
                  <UsersIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {members.length === 0
                      ? 'No researchers in the directory yet'
                      : 'No researchers match your filters'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {members.length === 0
                      ? 'Profiles with public visibility show up here. Update location and field on Settings to be discoverable.'
                      : 'Try clearing a filter or broadening your search.'}
                  </p>
                </div>
              ) : (
                filteredMembers.map(renderMemberCard)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedInStyleNetworking;
