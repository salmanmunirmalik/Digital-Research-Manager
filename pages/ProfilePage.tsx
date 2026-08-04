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
} from '../components/icons';

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
      axios.get('/api/researcher-portfolio/profiles', { headers }).catch(() => null),
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

    // Own social counts
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
        setRelationship({ isFollowing: relationship.isFollowing, isConnected: false, connectionStatus: 'none' });
      }
    } catch (error) {
      console.error(`Social action ${action} failed:`, error);
    } finally {
      setActionBusy(false);
    }
  };

  const saveAbout = async () => {
    try {
      setSaving(true);
      await axios.post(
        '/api/researcher-portfolio/profiles',
        {
          ...profile,
          research_interests: interests,
          ...links,
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
    if (!newInterest.trim()) return;
    setInterests((prev) => [...prev, newInterest.trim()]);
    setNewInterest('');
  };

  const initials =
    `${(isOwnProfile ? user?.first_name : viewedUser?.firstName)?.[0] || ''}${(isOwnProfile ? user?.last_name : viewedUser?.lastName)?.[0] || ''}`.toUpperCase() || 'DR';
  const displayName =
    [isOwnProfile ? user?.first_name : viewedUser?.firstName, isOwnProfile ? user?.last_name : viewedUser?.lastName]
      .filter(Boolean)
      .join(' ') || 'Researcher';
  const roleLabel = getRoleDisplayName((isOwnProfile ? user?.role : viewedUser?.role) || 'researcher');
  const focusLine =
    interests.slice(0, 3).join(' · ') ||
    profile.position ||
    viewedUser?.specialization ||
    (isOwnProfile ? 'Add research interests in About' : 'Researcher');

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
        description: 'Intent to offer services - list them on Marketplace when ready',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <section className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
        <div className="px-6 sm:px-8 py-7">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-semibold tracking-wide flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 tracking-tight">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-600">
                    {roleLabel}
                  </span>
                </div>
                <p className="text-[14px] text-slate-600 mt-1.5 leading-snug">{focusLine}</p>
                <p className="text-[13px] text-slate-500 mt-2">
                  {[
                    profile.institution ||
                      (isOwnProfile ? user?.current_institution : viewedUser?.institution),
                    profile.department || viewedUser?.department,
                  ]
                    .filter(Boolean)
                    .join(' · ') ||
                    (isOwnProfile ? 'Add your institution in About' : 'Institution not listed')}
                </p>
              </div>
            </div>

            {isOwnProfile ? (
              <Link
                to="/settings"
                className="inline-flex items-center gap-1.5 self-start px-3.5 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
              >
                Account settings
              </Link>
            ) : (
              <div className="flex flex-wrap gap-2 self-start">
                {relationship.connectionStatus === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => runSocialAction('disconnect')}
                    disabled={actionBusy}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel request
                  </button>
                ) : relationship.isConnected ? (
                  <button
                    type="button"
                    onClick={() => runSocialAction('disconnect')}
                    disabled={actionBusy}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
                  >
                    <UserMinusIcon className="w-4 h-4" />
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => runSocialAction('connect')}
                    disabled={actionBusy}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    Connect
                  </button>
                )}
                {relationship.isFollowing ? (
                  <button
                    type="button"
                    onClick={() => runSocialAction('unfollow')}
                    disabled={actionBusy}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
                  >
                    <HeartIcon className="w-4 h-4 text-red-500" />
                    Following
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => runSocialAction('follow')}
                    disabled={actionBusy}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
                  >
                    <HeartIcon className="w-4 h-4" />
                    Follow
                  </button>
                )}
                <Link
                  to="/collaboration-networking"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  Back to networking
                </Link>
              </div>
            )}
          </div>

          {/* Identity-only reputation strip - not a sitemap */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7 pt-6 border-t border-slate-100">
            <div className="rounded-lg px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Connections</p>
              <p className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5">
                {viewedUser?.connectionsCount ?? 0}
              </p>
            </div>
            <div className="rounded-lg px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Followers</p>
              <p className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5">
                {viewedUser?.followersCount ?? 0}
              </p>
            </div>
            <div className="rounded-lg px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Following</p>
              <p className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5">
                {viewedUser?.followingCount ?? 0}
              </p>
            </div>
            {isOwnProfile && (
              <div className="rounded-lg px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Failures shared</p>
                <p className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5">
                  {transparency.shared}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <nav className="flex gap-1 border-b border-slate-200 overflow-x-auto" aria-label="Profile sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-slate-900 rounded-full" />
            )}
          </button>
        ))}
      </nav>

      {activeTab === 'about' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <section className="bg-white border border-slate-200/80 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-slate-900">About</h2>
                {!editingAbout && isOwnProfile ? (
                  <button
                    type="button"
                    onClick={() => setEditingAbout(true)}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-600 hover:text-slate-900"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
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
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {(
                  [
                    ['institution', 'Institution'],
                    ['department', 'Department'],
                    ['position', 'Position'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-[12px] font-medium text-slate-500 mb-1.5">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={(profile as any)[key] || ''}
                      disabled={!editingAbout}
                      onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-md text-[13px] ${
                        editingAbout
                          ? 'border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10'
                          : 'border border-transparent bg-slate-50 text-slate-700'
                      }`}
                    />
                  </div>
                ))}
              </div>

              <label className="block text-[12px] font-medium text-slate-500 mb-1.5">
                Research focus
              </label>
              <textarea
                value={profile.research_philosophy || ''}
                disabled={!editingAbout}
                onChange={(e) => setProfile({ ...profile, research_philosophy: e.target.value })}
                rows={4}
                className={`w-full px-3.5 py-2.5 rounded-md text-[13px] resize-y ${
                  editingAbout
                    ? 'border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10'
                    : 'border border-transparent bg-slate-50 text-slate-700'
                }`}
                placeholder="One or two paragraphs on what you work on and how you approach problems."
              />
            </section>

            <section className="bg-white border border-slate-200/80 rounded-xl p-6">
              <h2 className="text-[15px] font-semibold text-slate-900 mb-1">Research interests</h2>
              <p className="text-[12px] text-slate-500 mb-4">
                Used for matching grants, collaborators, and methods
              </p>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                  className="flex-1 px-3.5 py-2.5 rounded-md text-[13px] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="e.g. single-cell transcriptomics"
                />
                <button
                  type="button"
                  onClick={addInterest}
                  className="inline-flex items-center gap-1 px-3.5 py-2.5 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add
                </button>
              </div>

              {interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, index) => (
                    <span
                      key={`${interest}-${index}`}
                      className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-md bg-slate-100 text-[12px] text-slate-800"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => setInterests((prev) => prev.filter((_, i) => i !== index))}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500"
                        aria-label={`Remove ${interest}`}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-slate-500">No interests yet.</p>
              )}

              {interests.length > 0 && (
                <button
                  type="button"
                  onClick={saveAbout}
                  disabled={saving}
                  className="mt-4 text-[12px] font-medium text-slate-700 hover:text-slate-900 underline-offset-2 hover:underline"
                >
                  Save interests
                </button>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="bg-white border border-slate-200/80 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <LinkIcon className="w-4 h-4 text-slate-400" />
                <h2 className="text-[13px] font-semibold text-slate-900">External profiles</h2>
              </div>
              <p className="text-[12px] text-slate-500 mb-4">
                Optional links to ORCID / Scholar - secondary to your identity here
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
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={links[key]}
                      onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
                      onBlur={saveAbout}
                      className="w-full px-3 py-2 rounded-md text-[12px] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      placeholder={label}
                    />
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      )}

      {activeTab === 'openness' && (
        <div className="max-w-3xl space-y-5">
          <section className="bg-white border border-slate-200/80 rounded-xl p-6">
            <h2 className="text-[15px] font-semibold text-slate-900 mb-1">What you’re open to</h2>
            <p className="text-[12px] text-slate-500 mb-5">
              How others should approach you - collaboration, consulting, services, teaching
            </p>

            <ul className="space-y-3">
              {opennessFlags.map((flag) => (
                <li
                  key={flag.key}
                  className="flex items-start justify-between gap-4 p-3.5 rounded-lg border border-slate-100"
                >
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">{flag.label}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5">{flag.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={flag.value}
                    onClick={() =>
                      saveAvailability({
                        ...availability,
                        [flag.key]: !flag.value,
                      })
                    }
                    className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                      flag.value ? 'bg-slate-900' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        flag.value ? 'translate-x-4' : ''
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white border border-slate-200/80 rounded-xl p-6">
            <label className="block text-[12px] font-medium text-slate-500 mb-1.5">
              Availability notes
            </label>
            <textarea
              value={availability.availability_notes || ''}
              onChange={(e) =>
                setAvailability((prev) => ({ ...prev, availability_notes: e.target.value }))
              }
              onBlur={() => saveAvailability(availability)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-md text-[13px] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
              placeholder="e.g. Available for method consulting in Q3; seeking CRISPR collaborators"
            />
          </section>
        </div>
      )}

      {activeTab === 'transparency' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <section className="bg-white border border-slate-200/80 rounded-xl p-6">
              <h2 className="text-[15px] font-semibold text-slate-900 mb-1">Transparency impact</h2>
              <p className="text-[12px] text-slate-500 mb-5">
                Credit for documenting what did not work - community standing, not a work queue
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Failures shared', value: transparency.shared },
                  { label: 'Marked helpful', value: transparency.helpfulVotes },
                  { label: '“Saved me” votes', value: transparency.savedVotes },
                  { label: 'Hours documented', value: transparency.estimatedHoursSaved },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-3"
                  >
                    <p className="text-xl font-semibold text-slate-900 tabular-nums">{stat.value}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {transparency.estimatedMoneySaved > 0 && (
                <p className="text-[13px] text-slate-600 mt-4">
                  Documented experimental cost:{' '}
                  <span className="font-semibold text-slate-900">
                    ${transparency.estimatedMoneySaved.toLocaleString()}
                  </span>
                </p>
              )}
            </section>

            <section className="bg-white border border-slate-200/80 rounded-xl p-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-[15px] font-semibold text-slate-900">Negative results</h2>
                <Link
                  to="/negative-results"
                  className="text-[12px] font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                >
                  Open database
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
              {transparency.shared === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg">
                  <FireIcon className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-[13px] text-slate-700 font-medium">No failures shared yet</p>
                  <p className="text-[12px] text-slate-500 mt-1 mb-3">
                    Sharing a negative result builds trust and helps other labs avoid wasted work.
                  </p>
                  <Link
                    to="/negative-results"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
                  >
                    Share a negative result
                  </Link>
                </div>
              ) : (
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  You have contributed {transparency.shared} negative result
                  {transparency.shared === 1 ? '' : 's'} to the community database
                  {transparency.savedVotes > 0
                    ? `, helping peers ${transparency.savedVotes} time${
                        transparency.savedVotes === 1 ? '' : 's'
                      }.`
                    : '.'}
                </p>
              )}
            </section>
          </div>

          <aside>
            <section className="bg-slate-50 border border-slate-200/80 rounded-xl p-5">
              <p className="text-[13px] font-medium text-slate-800">Transparency as reputation</p>
              <p className="text-[12px] text-slate-500 mt-1.5 leading-relaxed">
                Documenting failed experiments is a first-class scientific contribution - not a career
                risk buried in a lab drawer.
              </p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
