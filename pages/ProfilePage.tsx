import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { getRoleDisplayName } from '../utils/roleAccess';
import {
  FireIcon,
  LinkIcon,
  PencilIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlusIcon,
  TrashIcon,
  HeartIcon,
  UserPlusIcon,
  UserMinusIcon,
  UserIcon,
  MapPinIcon,
  AcademicCapIcon,
  UsersIcon,
} from '../components/icons';
import { PageHeader, PagePanel, PageStat } from '../components/PageHeader';

type ProfileTab = 'about' | 'openness' | 'transparency';

interface ResearcherProfile {
  institution?: string;
  department?: string;
  position?: string;
  research_interests?: string[];
  research_philosophy?: string;
  years_of_experience?: number;
  orcid_id?: string;
  google_scholar_id?: string;
  researchgate_id?: string;
  linkedin_url?: string;
  lab_website?: string;
}

interface Availability {
  open_for_collaboration?: boolean;
  currently_available?: boolean;
  available_as_consultant?: boolean;
  available_as_service_provider?: boolean;
  available_for_workshops?: boolean;
  available_as_keynote_speaker?: boolean;
  availability_notes?: string;
}

interface TransparencyStats {
  shared: number;
  helpfulVotes: number;
  savedVotes: number;
  estimatedHoursSaved: number;
  estimatedMoneySaved: number;
}

const authHeaders = () => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const asArray = (payload: unknown): any[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of ['data', 'submissions', 'items']) {
      if (Array.isArray(obj[key])) return obj[key] as any[];
    }
  }
  return [];
};

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const viewingUserId = routeUserId || user?.id;
  const isOwnProfile = !routeUserId || routeUserId === user?.id;

  const [activeTab, setActiveTab] = useState<ProfileTab>('about');
  const [loading, setLoading] = useState(true);
  const [editingAbout, setEditingAbout] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const [viewedUser, setViewedUser] = useState<{
    id: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    bio?: string;
    position?: string;
    institution?: string;
    department?: string;
    specialization?: string;
    location?: string;
    followersCount?: number;
    followingCount?: number;
    connectionsCount?: number;
  } | null>(null);
  const [relationship, setRelationship] = useState({
    isFollowing: false,
    isConnected: false,
    connectionStatus: 'none' as 'none' | 'pending' | 'connected',
  });

  const [profile, setProfile] = useState<ResearcherProfile>({});
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [availability, setAvailability] = useState<Availability>({
    open_for_collaboration: true,
    currently_available: true,
  });
  const [transparency, setTransparency] = useState<TransparencyStats>({
    shared: 0,
    helpfulVotes: 0,
    savedVotes: 0,
    estimatedHoursSaved: 0,
    estimatedMoneySaved: 0,
  });
  const [links, setLinks] = useState({
    orcid_id: '',
    google_scholar_id: '',
    researchgate_id: '',
    linkedin_url: '',
    lab_website: '',
  });

  useEffect(() => {
    void loadProfile();
  }, [user?.id, viewingUserId, isOwnProfile]);

  const loadProfile = async () => {
    setLoading(true);
    const headers = authHeaders();

    if (!isOwnProfile && viewingUserId) {
      try {
        const publicRes = await axios.get(`/api/networking/social/profile/${viewingUserId}`, {
          headers,
        });
        const p = publicRes.data.profile;
        setViewedUser(p);
        setRelationship({
          isFollowing: Boolean(publicRes.data.relationship?.isFollowing),
          isConnected: Boolean(publicRes.data.relationship?.isConnected),
          connectionStatus: publicRes.data.relationship?.connectionStatus || 'none',
        });
        setProfile({
          institution: p.institution,
          department: p.department,
          position: p.position,
          research_philosophy: p.bio,
        });
        setInterests(
          String(p.expertise || '')
            .split(/[,;|]/)
            .map((s: string) => s.trim())
            .filter(Boolean)
        );
        setAvailability({
          open_for_collaboration: true,
          currently_available: true,
        });
        setTransparency({
          shared: 0,
          helpfulVotes: 0,
          savedVotes: 0,
          estimatedHoursSaved: 0,
          estimatedMoneySaved: 0,
        });
      } catch (error) {
        console.error('Error loading public profile:', error);
        setViewedUser(null);
      } finally {
        setLoading(false);
      }
      return;
    }

    const [profileRes, availabilityRes, negativeRes, contributorRes] = await Promise.all([
      axios.get('/api/scientist-passport/research-profile', { headers }).catch(() => null),
      axios.get('/api/scientist-passport/availability', { headers }).catch(() => null),
      axios.get('/api/negative-results/my/submissions', { headers }).catch(() => null),
      user?.id
        ? axios
            .get(`/api/negative-results/contributors/${user.id}/stats`, { headers })
            .catch(() => null)
        : Promise.resolve(null),
    ]);

    if (profileRes?.data?.profile) {
      const p = profileRes.data.profile as ResearcherProfile;
      setProfile(p);
      setInterests(p.research_interests || []);
      setLinks({
        orcid_id: p.orcid_id || '',
        google_scholar_id: p.google_scholar_id || '',
        researchgate_id: p.researchgate_id || '',
        linkedin_url: p.linkedin_url || '',
        lab_website: p.lab_website || '',
      });
    }

    if (availabilityRes?.data) {
      setAvailability(availabilityRes.data);
    }

    const negatives = asArray(negativeRes?.data);
    const contributor = contributorRes?.data;
    const helpful =
      contributor?.total_helpful_votes ??
      negatives.reduce((sum, n) => sum + (n.helpful_votes || 0), 0);
    const saved =
      contributor?.total_saved_someone_votes ??
      negatives.reduce((sum, n) => sum + (n.saved_someone_votes || 0), 0);
    const hours = negatives.reduce((sum, n) => sum + (Number(n.time_spent_hours) || 0), 0);
    const money = negatives.reduce((sum, n) => sum + (Number(n.estimated_cost_usd) || 0), 0);

    setTransparency({
      shared: contributor?.total_negative_results_shared ?? negatives.length,
      helpfulVotes: helpful,
      savedVotes: saved,
      estimatedHoursSaved: hours,
      estimatedMoneySaved: money,
    });

    if (user?.id) {
      try {
        const rel = await axios.get('/api/networking/social/relationships', { headers });
        setViewedUser({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          followersCount: rel.data.followersCount,
          followingCount: rel.data.followingCount,
          connectionsCount: rel.data.connectionsCount,
        });
      } catch {
        setViewedUser({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        });
      }
    }

    setLoading(false);
  };

  const runSocialAction = async (action: 'follow' | 'unfollow' | 'connect' | 'disconnect') => {
    if (!viewingUserId || isOwnProfile) return;
    setActionBusy(true);
    try {
      if (action === 'follow') {
        await axios.post(`/api/networking/social/follow/${viewingUserId}`, {}, { headers: authHeaders() });
        setRelationship((r) => ({ ...r, isFollowing: true }));
        setViewedUser((v) =>
          v ? { ...v, followersCount: (v.followersCount || 0) + 1 } : v
        );
      } else if (action === 'unfollow') {
        await axios.delete(`/api/networking/social/follow/${viewingUserId}`, {
          headers: authHeaders(),
        });
        setRelationship((r) => ({ ...r, isFollowing: false }));
        setViewedUser((v) =>
          v ? { ...v, followersCount: Math.max(0, (v.followersCount || 0) - 1) } : v
        );
      } else if (action === 'connect') {
        const res = await axios.post(
          `/api/networking/social/connect/${viewingUserId}`,
          {},
          { headers: authHeaders() }
        );
        setRelationship((r) => ({
          ...r,
          connectionStatus: res.data.connectionStatus || 'pending',
          isConnected: Boolean(res.data.isConnected),
        }));
      } else {
        await axios.delete(`/api/networking/social/connect/${viewingUserId}`, {
          headers: authHeaders(),
        });
        setRelationship({
          isFollowing: relationship.isFollowing,
          isConnected: false,
          connectionStatus: 'none',
        });
      }
    } catch (error) {
      console.error(`Social action ${action} failed:`, error);
    } finally {
      setActionBusy(false);
    }
  };

  const saveAbout = async () => {
    if (!isOwnProfile) return;
    try {
      setSaving(true);
      await axios.put(
        '/api/scientist-passport/research-profile',
        {
          ...profile,
          research_interests: interests,
          orcid_id: links.orcid_id,
          google_scholar_id: links.google_scholar_id,
          linkedin_url: links.linkedin_url,
        },
        { headers: authHeaders() }
      );
      setEditingAbout(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveAvailability = async (next: Availability) => {
    if (!isOwnProfile) return;
    setAvailability(next);
    try {
      await axios.put('/api/scientist-passport/availability', next, {
        headers: authHeaders(),
      });
    } catch (error) {
      console.error('Error saving availability:', error);
    }
  };

  const addInterest = () => {
    if (!isOwnProfile || !newInterest.trim()) return;
    setInterests((prev) => [...prev, newInterest.trim()]);
    setNewInterest('');
  };

  const initials =
    `${(isOwnProfile ? user?.first_name : viewedUser?.firstName)?.[0] || ''}${(isOwnProfile ? user?.last_name : viewedUser?.lastName)?.[0] || ''}`.toUpperCase() ||
    'DR';
  const displayName =
    [
      isOwnProfile ? user?.first_name : viewedUser?.firstName,
      isOwnProfile ? user?.last_name : viewedUser?.lastName,
    ]
      .filter(Boolean)
      .join(' ') || 'Researcher';
  const roleLabel = getRoleDisplayName((isOwnProfile ? user?.role : viewedUser?.role) || 'researcher');
  const institutionLine = [
    profile.institution ||
      (isOwnProfile ? user?.current_institution : viewedUser?.institution),
    profile.department || viewedUser?.department,
  ]
    .filter(Boolean)
    .join(' · ');
  const focusLine =
    interests.slice(0, 3).join(' · ') ||
    profile.position ||
    viewedUser?.specialization ||
    (isOwnProfile ? 'Add research interests in About' : 'Researcher');
  const locationLine = viewedUser?.location || '';

  const opennessFlags = useMemo(
    () => [
      {
        key: 'open_for_collaboration',
        label: 'Open to collaborate',
        description: 'Join projects, share methods, co-author',
        value: Boolean(availability.open_for_collaboration),
      },
      {
        key: 'available_as_consultant',
        label: 'Available to consult',
        description: 'Advise labs on methods and experimental design',
        value: Boolean(availability.available_as_consultant),
      },
      {
        key: 'available_as_service_provider',
        label: 'Offer lab services',
        description: 'Intent to offer services — list them on Marketplace when ready',
        value: Boolean(availability.available_as_service_provider),
      },
      {
        key: 'available_for_workshops',
        label: 'Workshops / teaching',
        description: 'Teach techniques or host sessions',
        value: Boolean(availability.available_for_workshops),
      },
    ],
    [availability]
  );

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'about', label: 'About & links' },
    { id: 'openness', label: 'Open to' },
    { id: 'transparency', label: 'Transparency' },
  ];

  const fieldClass = (editing: boolean) =>
    `w-full px-3.5 py-2.5 rounded-lg text-[13px] transition-colors ${
      editing
        ? 'border border-sky-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400/40'
        : 'border border-transparent bg-slate-50/80 text-slate-700'
    }`;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-700" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={displayName}
        accent="sky"
        icon={<UserIcon />}
        subtitle={
          <span className="flex flex-col gap-1">
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-sky-100 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-800">
                {roleLabel}
              </span>
              {relationship.isConnected ? (
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                  Connected
                </span>
              ) : null}
              {availability.open_for_collaboration ? (
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                  Open to collaborate
                </span>
              ) : null}
            </span>
            <span className="text-[13px] text-slate-600">{focusLine}</span>
            {(institutionLine || locationLine) && (
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
                {institutionLine ? (
                  <span className="inline-flex items-center gap-1">
                    <AcademicCapIcon className="h-3.5 w-3.5 text-sky-600" />
                    {institutionLine}
                  </span>
                ) : null}
                {locationLine ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon className="h-3.5 w-3.5 text-sky-600" />
                    {locationLine}
                  </span>
                ) : null}
              </span>
            )}
          </span>
        }
        actions={
          isOwnProfile ? (
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3.5 py-2 text-[13px] font-medium text-sky-900 shadow-sm hover:bg-sky-50"
            >
              Account settings
            </Link>
          ) : (
            <div className="flex flex-wrap gap-2">
              {relationship.connectionStatus === 'pending' ? (
                <button
                  type="button"
                  onClick={() => runSocialAction('disconnect')}
                  disabled={actionBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel request
                </button>
              ) : relationship.isConnected ? (
                <button
                  type="button"
                  onClick={() => runSocialAction('disconnect')}
                  disabled={actionBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <UserMinusIcon className="h-4 w-4" />
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => runSocialAction('connect')}
                  disabled={actionBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3.5 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-sky-800 disabled:opacity-50"
                >
                  <UserPlusIcon className="h-4 w-4" />
                  Connect
                </button>
              )}
              <button
                type="button"
                onClick={() => runSocialAction(relationship.isFollowing ? 'unfollow' : 'follow')}
                disabled={actionBusy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <HeartIcon
                  className={`h-4 w-4 ${relationship.isFollowing ? 'text-red-500' : ''}`}
                />
                {relationship.isFollowing ? 'Following' : 'Follow'}
              </button>
              <Link
                to="/collaboration-networking"
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2 text-[13px] font-medium text-sky-900 hover:bg-sky-100"
              >
                Networking
              </Link>
            </div>
          )
        }
      >
        <div className="mt-5 flex items-center gap-4 border-t border-sky-100/80 pt-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-800 text-xl font-semibold tracking-wide text-white shadow-md shadow-sky-200/60">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-slate-500">
              {isOwnProfile
                ? 'Your researcher identity across Networking, grants, and collaboration.'
                : 'Public researcher profile from Networking.'}
            </p>
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PageStat
          accent="sky"
          label="Connections"
          value={viewedUser?.connectionsCount ?? 0}
        />
        <PageStat accent="sky" label="Followers" value={viewedUser?.followersCount ?? 0} />
        <PageStat accent="sky" label="Following" value={viewedUser?.followingCount ?? 0} />
        {isOwnProfile ? (
          <PageStat accent="amber" label="Failures shared" value={transparency.shared} />
        ) : (
          <PageStat
            accent="emerald"
            label="Network"
            value={
              <span className="inline-flex items-center gap-1 text-[15px]">
                <UsersIcon className="h-4 w-4" />
                Active
              </span>
            }
          />
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white/80 p-1 shadow-sm">
        <nav className="flex gap-1" aria-label="Profile sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 rounded-lg px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-sky-50 text-sky-900 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'about' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <PagePanel
              accent="sky"
              title="About"
              action={
                isOwnProfile ? (
                  !editingAbout ? (
                    <button
                      type="button"
                      onClick={() => setEditingAbout(true)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-sky-800 hover:text-sky-950"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingAbout(false)}
                        className="text-[12px] text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveAbout}
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded-md bg-sky-700 px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-sky-800 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        Save
                      </button>
                    </div>
                  )
                ) : null
              }
            >
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(
                  [
                    ['institution', 'Institution'],
                    ['department', 'Department'],
                    ['position', 'Position'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-[12px] font-medium text-slate-500">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={(profile as any)[key] || ''}
                      disabled={!editingAbout || !isOwnProfile}
                      onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                      className={fieldClass(editingAbout && isOwnProfile)}
                    />
                  </div>
                ))}
              </div>

              <label className="mb-1.5 block text-[12px] font-medium text-slate-500">
                Research focus
              </label>
              <textarea
                value={profile.research_philosophy || ''}
                disabled={!editingAbout || !isOwnProfile}
                onChange={(e) => setProfile({ ...profile, research_philosophy: e.target.value })}
                rows={4}
                className={`${fieldClass(editingAbout && isOwnProfile)} resize-y`}
                placeholder="One or two paragraphs on what you work on and how you approach problems."
              />
            </PagePanel>

            <PagePanel
              accent="sky"
              title="Research interests"
              action={
                isOwnProfile && interests.length > 0 ? (
                  <button
                    type="button"
                    onClick={saveAbout}
                    disabled={saving}
                    className="text-[12px] font-medium text-sky-800 underline-offset-2 hover:underline"
                  >
                    Save interests
                  </button>
                ) : null
              }
            >
              <p className="mb-4 text-[12px] text-slate-500">
                Used for matching grants, collaborators, and marketplace services
              </p>

              {isOwnProfile ? (
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                    className="flex-1 rounded-lg border border-sky-200 px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                    placeholder="e.g. single-cell transcriptomics"
                  />
                  <button
                    type="button"
                    onClick={addInterest}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-700 px-3.5 py-2.5 text-[13px] font-medium text-white hover:bg-sky-800"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add
                  </button>
                </div>
              ) : null}

              {interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, index) => (
                    <span
                      key={`${interest}-${index}`}
                      className="inline-flex items-center gap-1 rounded-md border border-sky-100 bg-sky-50/80 py-1.5 pl-3 pr-1.5 text-[12px] text-sky-900"
                    >
                      {interest}
                      {isOwnProfile ? (
                        <button
                          type="button"
                          onClick={() => setInterests((prev) => prev.filter((_, i) => i !== index))}
                          className="rounded p-1 text-sky-600 hover:bg-sky-100"
                          aria-label={`Remove ${interest}`}
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-sky-200 bg-gradient-to-br from-sky-50/50 via-white to-cyan-50/30 px-4 py-8 text-center">
                  <p className="text-[13px] text-slate-600">No interests yet.</p>
                </div>
              )}
            </PagePanel>
          </div>

          <aside className="space-y-5">
            <PagePanel
              accent="sky"
              title={
                <span className="inline-flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-sky-600" />
                  External profiles
                </span>
              }
            >
              <p className="mb-4 text-[12px] text-slate-500">
                Optional links to ORCID / Scholar — secondary to your identity here
              </p>
              <div className="space-y-3">
                {(
                  [
                    ['orcid_id', 'ORCID'],
                    ['google_scholar_id', 'Google Scholar'],
                    ['researchgate_id', 'ResearchGate'],
                    ['linkedin_url', 'LinkedIn'],
                    ['lab_website', 'Lab website'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1 block text-[11px] font-medium text-slate-500">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={links[key]}
                      disabled={!isOwnProfile}
                      onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
                      onBlur={() => {
                        if (isOwnProfile) void saveAbout();
                      }}
                      className={fieldClass(isOwnProfile)}
                      placeholder={label}
                    />
                  </div>
                ))}
              </div>
            </PagePanel>
          </aside>
        </div>
      )}

      {activeTab === 'openness' && (
        <div className="mx-auto max-w-3xl space-y-5">
          <PagePanel accent="emerald" title="What you’re open to">
            <p className="mb-5 text-[12px] text-slate-500">
              How others should approach you — collaboration, consulting, services, teaching
            </p>

            <ul className="space-y-3">
              {opennessFlags.map((flag) => (
                <li
                  key={flag.key}
                  className={`flex items-start justify-between gap-4 rounded-xl border p-3.5 ${
                    flag.value
                      ? 'border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white'
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">{flag.label}</p>
                    <p className="mt-0.5 text-[12px] text-slate-500">{flag.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={flag.value}
                    disabled={!isOwnProfile}
                    onClick={() =>
                      saveAvailability({
                        ...availability,
                        [flag.key]: !flag.value,
                      })
                    }
                    className={`relative h-6 w-10 flex-shrink-0 rounded-full transition-colors disabled:opacity-60 ${
                      flag.value ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        flag.value ? 'translate-x-4' : ''
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </PagePanel>

          <PagePanel accent="emerald" title="Availability notes">
            <textarea
              value={availability.availability_notes || ''}
              disabled={!isOwnProfile}
              onChange={(e) =>
                setAvailability((prev) => ({ ...prev, availability_notes: e.target.value }))
              }
              onBlur={() => {
                if (isOwnProfile) void saveAvailability(availability);
              }}
              rows={3}
              className={`${fieldClass(isOwnProfile)} resize-y`}
              placeholder="e.g. Available for method consulting in Q3; seeking CRISPR collaborators"
            />
          </PagePanel>
        </div>
      )}

      {activeTab === 'transparency' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <PagePanel accent="amber" title="Transparency impact">
              <p className="mb-5 text-[12px] text-slate-500">
                Credit for documenting what did not work — community standing, not a work queue
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Failures shared', value: transparency.shared },
                  { label: 'Marked helpful', value: transparency.helpfulVotes },
                  { label: '“Saved me” votes', value: transparency.savedVotes },
                  { label: 'Hours documented', value: transparency.estimatedHoursSaved },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white px-3 py-3"
                  >
                    <p className="text-xl font-semibold tabular-nums text-slate-900">{stat.value}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {transparency.estimatedMoneySaved > 0 ? (
                <p className="mt-4 text-[13px] text-slate-600">
                  Documented experimental cost:{' '}
                  <span className="font-semibold text-slate-900">
                    ${transparency.estimatedMoneySaved.toLocaleString()}
                  </span>
                </p>
              ) : null}
            </PagePanel>

            <PagePanel
              accent="amber"
              title="Negative results"
              action={
                <Link
                  to="/negative-results"
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-900 hover:text-amber-950"
                >
                  Open database
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {transparency.shared === 0 ? (
                <div className="rounded-xl border border-dashed border-amber-200 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 px-4 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <FireIcon className="h-5 w-5" />
                  </div>
                  <p className="text-[13px] font-medium text-slate-800">No failures shared yet</p>
                  <p className="mx-auto mt-1 mb-4 max-w-sm text-[12px] text-slate-500">
                    Sharing a negative result builds trust and helps other labs avoid wasted work.
                  </p>
                  {isOwnProfile ? (
                    <Link
                      to="/negative-results"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-amber-800"
                    >
                      Share a negative result
                    </Link>
                  ) : null}
                </div>
              ) : (
                <p className="text-[13px] leading-relaxed text-slate-600">
                  {isOwnProfile ? 'You have' : 'This researcher has'} contributed{' '}
                  {transparency.shared} negative result
                  {transparency.shared === 1 ? '' : 's'} to the community database
                  {transparency.savedVotes > 0
                    ? `, helping peers ${transparency.savedVotes} time${
                        transparency.savedVotes === 1 ? '' : 's'
                      }.`
                    : '.'}
                </p>
              )}
            </PagePanel>
          </div>

          <aside>
            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 p-5 shadow-sm">
              <p className="text-[13px] font-medium text-slate-800">Transparency as reputation</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
                Documenting failed experiments is a first-class scientific contribution — not a career
                risk buried in a lab drawer.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
