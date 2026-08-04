import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  BuildingOfficeIcon,
  GlobeAltIcon,
  MapPinIcon,
  UsersIcon,
  EyeIcon,
  ArrowLeftIcon,
} from '../components/icons';

interface LabDetail {
  id: string;
  name: string;
  institution?: string;
  department?: string;
  description?: string;
  address?: string;
  website_url?: string;
  contact_email?: string;
  showcase_tagline?: string;
  research_areas?: string[] | string;
  looking_for?: string[] | string;
  is_showcased?: number | boolean;
  established_year?: number | null;
  principal_researcher_id?: string | null;
  pi_name?: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
}

interface LabMember {
  user_id: string;
  role: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  is_active?: number | boolean;
}

const authHeaders = () => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const parseList = (value: unknown): string[] => {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== 'string') return [];
  const raw = value.trim();
  if (!raw) return [];
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      /* fall through */
    }
  }
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
};

const roleLabel = (role: string) =>
  String(role || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const LabPublicPage: React.FC = () => {
  const { labId } = useParams<{ labId: string }>();
  const [lab, setLab] = useState<LabDetail | null>(null);
  const [members, setMembers] = useState<LabMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!labId) return;
    void loadLab();
  }, [labId]);

  const loadLab = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/labs/${labId}`, { headers: authHeaders() });
      setLab(response.data.lab || null);
      setMembers(
        (response.data.members || []).filter(
          (m: LabMember) => m.is_active === undefined || m.is_active === 1 || m.is_active === true
        )
      );
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load lab');
      setLab(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
      </div>
    );
  }

  if (error || !lab) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Lab not found</h1>
        <p className="mt-2 text-[14px] text-slate-600">{error || 'This lab may be private or removed.'}</p>
        <Link
          to="/collaboration-networking"
          className="inline-flex items-center gap-2 mt-6 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to networking
        </Link>
      </div>
    );
  }

  const researchAreas = parseList(lab.research_areas);
  const lookingFor = parseList(lab.looking_for);
  const piName =
    lab.pi_name ||
    [lab.first_name, lab.last_name].filter(Boolean).join(' ').trim() ||
    'Principal investigator';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        to="/collaboration-networking"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to networking
      </Link>

      <section className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
        <div className="px-6 sm:px-8 py-7">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <BuildingOfficeIcon className="w-7 h-7 text-slate-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 tracking-tight">
                  {lab.name}
                </h1>
                {Boolean(lab.is_showcased) && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800">
                    Live on Networking
                  </span>
                )}
              </div>
              {lab.showcase_tagline && (
                <p className="mt-1.5 text-[15px] font-medium text-slate-800">{lab.showcase_tagline}</p>
              )}
              <p className="mt-1.5 text-[14px] text-slate-600">
                {[lab.institution, lab.department].filter(Boolean).join(' · ')}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-500">
                {lab.address && (
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    {lab.address}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <UsersIcon className="w-4 h-4" />
                  {members.length} member{members.length === 1 ? '' : 's'}
                </span>
                {lab.established_year && <span>Est. {lab.established_year}</span>}
                {lab.website_url && (
                  <a
                    href={lab.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-800 hover:underline"
                  >
                    <GlobeAltIcon className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {lab.description && (
            <p className="mt-6 text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap">
              {lab.description}
            </p>
          )}

          {(researchAreas.length > 0 || lookingFor.length > 0) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {researchAreas.map((area) => (
                <span
                  key={area}
                  className="px-2.5 py-1 text-[12px] rounded-md bg-slate-100 text-slate-700"
                >
                  {area}
                </span>
              ))}
              {lookingFor.map((item) => (
                <span
                  key={item}
                  className="px-2.5 py-1 text-[12px] rounded-md bg-amber-50 text-amber-900"
                >
                  Looking: {item.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[12px] uppercase tracking-wide text-slate-400 font-medium">Led by</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[14px] font-medium text-slate-900">{piName}</p>
              {lab.principal_researcher_id && (
                <Link
                  to={`/profile/${lab.principal_researcher_id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  <EyeIcon className="w-4 h-4" />
                  View profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-900">Members</h2>
          <p className="mt-1 text-[13px] text-slate-500">People listed on this lab roster.</p>
        </div>
        {members.length === 0 ? (
          <p className="px-6 py-10 text-center text-[13px] text-slate-500">No members listed yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {members.map((member) => {
              const name =
                [member.first_name, member.last_name].filter(Boolean).join(' ').trim() ||
                member.username ||
                'Member';
              return (
                <li
                  key={member.user_id}
                  className="px-6 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-slate-900">{name}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5">{roleLabel(member.role)}</p>
                  </div>
                  <Link
                    to={`/profile/${member.user_id}`}
                    className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
                  >
                    <EyeIcon className="w-4 h-4" />
                    View profile
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default LabPublicPage;
