import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import {
  DatabankOrgForm,
  DatabankOrgFormValues,
} from '../components/DatabankForms';
import PostedBy from '../components/PostedBy';
import {
  SearchIcon,
  PlusIcon,
  BuildingOfficeIcon,
  HeartIcon,
  AcademicCapIcon,
  BeakerIcon,
  GlobeIcon,
  UsersIcon,
  CheckCircleIcon,
  DatabaseIcon,
  ShieldCheckIcon,
  MapPinIcon,
  ScaleIcon,
} from '../components/icons';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const authHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token') || ''}`,
});

interface EthicalGuidelines {
  dataUsageTerms: string[];
  acknowledgmentRequired: boolean;
  coAuthorshipPolicy: 'mandatory' | 'negotiable' | 'not_required' | 'case_by_case';
  citationFormat: string;
  privacyCompliance: string[];
  consentLevel: 'full_consent' | 'opt_in' | 'anonymized' | 'public_data';
  commercialUse: 'allowed' | 'restricted' | 'prohibited';
  publicationRights: string;
}

interface DataOffer {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  dataType: string;
  diseaseFocus?: string[];
  populationType: string;
  sampleSize?: number;
  geographicCoverage: string[];
  timePeriod: string;
  accessLevel: 'open' | 'restricted' | 'collaboration_required' | string;
  requirements: string[];
  contactPerson: string;
  lastUpdated: Date;
  requestCount: number;
  ethicalGuidelines: EthicalGuidelines;
}

interface DataBankOrganization {
  id: string;
  name: string;
  type: string;
  category: string;
  country: string;
  region: string;
  contactEmail: string;
  website?: string;
  description: string;
  specializations: string[];
  dataAvailable: DataOffer[];
  verified: boolean;
  rating: number;
  joinedDate: Date;
  lastActive: Date;
  ethicalGuidelines: EthicalGuidelines;
  postedByName?: string | null;
}

const defaultEthicalGuidelines: EthicalGuidelines = {
  dataUsageTerms: [],
  acknowledgmentRequired: true,
  coAuthorshipPolicy: 'negotiable',
  citationFormat: '',
  privacyCompliance: [],
  consentLevel: 'anonymized',
  commercialUse: 'restricted',
  publicationRights: '',
};

const parseSpecializations = (value: unknown): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];
    }
  }
  return [];
};

const mapOffer = (row: any, orgId: string): DataOffer => ({
  id: row.id,
  organizationId: row.organization_id || orgId,
  title: row.title || '',
  description: row.description || '',
  dataType: row.data_type || row.dataType || 'clinical',
  diseaseFocus: Array.isArray(row.disease_focus)
    ? row.disease_focus
    : Array.isArray(row.diseaseFocus)
      ? row.diseaseFocus
      : [],
  populationType: row.population_type || row.populationType || 'general',
  sampleSize: row.sample_size ?? row.sampleSize,
  geographicCoverage: Array.isArray(row.geographic_coverage)
    ? row.geographic_coverage
    : Array.isArray(row.geographicCoverage)
      ? row.geographicCoverage
      : [],
  timePeriod: row.time_period || row.timePeriod || '',
  accessLevel: row.access_level || row.accessLevel || 'restricted',
  requirements: Array.isArray(row.requirements) ? row.requirements : [],
  contactPerson: row.contact_person || row.contactPerson || '',
  lastUpdated: new Date(row.last_updated || row.lastUpdated || Date.now()),
  requestCount: Number(row.request_count ?? row.requestCount ?? 0),
  ethicalGuidelines: { ...defaultEthicalGuidelines },
});

const mapOrganization = (row: any): DataBankOrganization => {
  const offersRaw = Array.isArray(row.dataAvailable)
    ? row.dataAvailable
    : Array.isArray(row.data_offers)
      ? row.data_offers
      : [];

  return {
    id: row.id,
    name: row.name || '',
    type: row.type || 'research_lab',
    category: row.category || 'research',
    country: row.country || '',
    region: row.region || '',
    contactEmail: row.contactEmail || row.contact_email || '',
    website: row.website || undefined,
    description: row.description || '',
    specializations: parseSpecializations(row.specializations),
    dataAvailable: offersRaw.map((o: any) => mapOffer(o, row.id)),
    verified: Boolean(row.verified),
    rating: Number(row.rating ?? row.avg_rating ?? 0),
    joinedDate: new Date(row.joinedDate || row.joined_date || Date.now()),
    lastActive: new Date(row.lastActive || row.last_active || Date.now()),
    ethicalGuidelines: { ...defaultEthicalGuidelines },
    postedByName: row.postedByName || row.posted_by_name || null,
  };
};

const labelize = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

const ResearchDataBankPage: React.FC = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<DataBankOrganization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<DataBankOrganization[]>([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showEthicsModal, setShowEthicsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'recent' | 'verified'>('verified');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/databank/organizations`, {
        headers: authHeaders(),
      });
      if (!response.ok) {
        setOrganizations([]);
        return;
      }
      const data = await response.json();
      const rows = Array.isArray(data) ? data : data.organizations || [];
      setOrganizations(rows.map(mapOrganization));
    } catch (error) {
      console.error('Error loading organizations:', error);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrganizations();
  }, []);

  const handleRegisterOrg = async (formData: DatabankOrgFormValues) => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/databank/organizations`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          category: formData.category,
          country: formData.country,
          region: formData.region,
          contactEmail: formData.contactEmail,
          website: formData.website,
          description: formData.description,
          specializations: formData.specializations,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to register organization');
      }
      const data = await response.json();
      const created = data.organization || data;
      setShowRegistrationForm(false);
      if (created?.id) {
        navigate(`/research-databank/${created.id}`);
        return;
      }
      await loadOrganizations();
    } catch (error) {
      console.error('Error registering organization:', error);
      alert('Could not register organization. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let filtered = organizations.filter((org) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        org.name.toLowerCase().includes(q) ||
        org.description.toLowerCase().includes(q) ||
        org.specializations.some((spec) => spec.toLowerCase().includes(q));
      const matchesType = filterType === 'all' || org.type === filterType;
      const matchesCategory = filterCategory === 'all' || org.category === filterCategory;
      const matchesCountry = filterCountry === 'all' || org.country === filterCountry;
      return matchesSearch && matchesType && matchesCategory && matchesCountry;
    });

    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'recent':
          return b.lastActive.getTime() - a.lastActive.getTime();
        case 'verified':
        default:
          return Number(b.verified) - Number(a.verified) || a.name.localeCompare(b.name);
      }
    });

    setFilteredOrgs(filtered);
  }, [organizations, searchTerm, filterType, filterCategory, filterCountry, sortBy]);

  const getOrgTypeIcon = (type: string) => {
    switch (type) {
      case 'research_lab':
      case 'research_institute':
        return <BeakerIcon className="w-4 h-4" />;
      case 'hospital':
        return <HeartIcon className="w-4 h-4" />;
      case 'university':
      case 'individual':
        return <AcademicCapIcon className="w-4 h-4" />;
      case 'public_sector':
      case 'government':
        return <GlobeIcon className="w-4 h-4" />;
      case 'ngo':
        return <UsersIcon className="w-4 h-4" />;
      default:
        return <BuildingOfficeIcon className="w-4 h-4" />;
    }
  };

  const countries = Array.from(
    new Set(organizations.map((o) => o.country).filter(Boolean))
  ).sort();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Data bank
            </h1>
            <p className="mt-1.5 text-[14px] text-slate-600 max-w-2xl">
              Cross-organization ethical dataset exchange - not personal files.{' '}
              <Link
                to="/data-results"
                className="font-medium text-slate-800 underline-offset-2 hover:underline"
              >
                My data & results
              </Link>
              {' · '}
              <Link
                to="/collaboration-networking"
                className="font-medium text-slate-800 underline-offset-2 hover:underline"
              >
                Networking
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowEthicsModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              <ScaleIcon className="w-4 h-4" />
              Ethics framework
            </button>
            <button
              type="button"
              onClick={() => setShowRegistrationForm(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Register organization
            </button>
          </div>
        </div>

        {/* Compact principles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            {
              icon: ShieldCheckIcon,
              title: 'Privacy first',
              text: 'Anonymized sharing under GDPR / HIPAA / local rules',
            },
            {
              icon: ScaleIcon,
              title: 'Fair attribution',
              text: 'Citation and co-authorship terms are explicit per offer',
            },
            {
              icon: DatabaseIcon,
              title: 'Request-based access',
              text: 'Formal proposals - not anonymous bulk downloads',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200/80 bg-white px-4 py-3.5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                  <item.icon className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-[12px] text-slate-500 leading-relaxed">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-4 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search organizations or specializations…"
                className="pl-9"
              />
            </div>
            <div className="lg:col-span-2">
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">All types</option>
                <option value="university">University</option>
                <option value="research_lab">Research lab</option>
                <option value="research_institute">Research institute</option>
                <option value="hospital">Hospital</option>
                <option value="industry">Industry</option>
                <option value="government">Government</option>
                <option value="ngo">NGO</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="all">All domains</option>
                <option value="clinical">Clinical</option>
                <option value="genomics">Genomics</option>
                <option value="epidemiology">Epidemiology</option>
                <option value="environmental">Environmental</option>
                <option value="research">Research</option>
                <option value="healthcare">Healthcare</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
                <option value="all">All countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="verified">Verified first</option>
                <option value="name">Name</option>
                <option value="rating">Rating</option>
                <option value="recent">Recently active</option>
              </Select>
            </div>
          </div>
          <p className="mt-3 text-[12px] text-slate-500">
            {loading
              ? 'Loading directory…'
              : `${filteredOrgs.length} organization${filteredOrgs.length === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      {/* Directory */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 py-16 text-center text-[13px] text-slate-500">
          Loading organizations…
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 text-center py-14 px-6">
          <DatabaseIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-[15px] font-semibold text-slate-900 mb-1">
            {organizations.length === 0 ? 'Directory is empty' : 'No matches'}
          </h3>
          <p className="text-[13px] text-slate-500 max-w-md mx-auto mb-5">
            {organizations.length === 0
              ? 'Register your organization to list ethical dataset offerings for collaboration.'
              : 'Adjust search or filters to find organizations.'}
          </p>
          {organizations.length === 0 && (
            <button
              type="button"
              onClick={() => setShowRegistrationForm(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
            >
              <PlusIcon className="w-4 h-4" />
              Register organization
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrgs.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => navigate(`/research-databank/${org.id}`)}
              className="text-left bg-white rounded-xl border border-slate-200/80 p-5 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                    {getOrgTypeIcon(org.type)}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-slate-900 truncate">
                      {org.name}
                    </h3>
                    <p className="mt-0.5 text-[12px] text-slate-500 flex items-center gap-1">
                      <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                      {[org.region, org.country].filter(Boolean).join(', ') || 'Location TBD'}
                    </p>
                  </div>
                </div>
                {org.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </div>

              <p className="text-[13px] text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                {org.description || 'No description provided.'}
              </p>
              <PostedBy name={org.postedByName} className="mb-3" />

              {org.specializations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {org.specializations.slice(0, 4).map((spec) => (
                    <span
                      key={spec}
                      className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {spec}
                    </span>
                  ))}
                  {org.specializations.length > 4 && (
                    <span className="px-2 py-0.5 text-[11px] text-slate-500">
                      +{org.specializations.length - 4}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[12px] text-slate-500">
                <span>
                  {org.dataAvailable.length} dataset
                  {org.dataAvailable.length === 1 ? '' : 's'}
                </span>
                <span>{labelize(org.type)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Ethics modal */}
      {showEthicsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[92vh] overflow-hidden border border-slate-200 my-6 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4 shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
                  Ethics framework
                </h2>
                <p className="mt-1 text-[13px] text-slate-600">
                  Attribution, privacy, and access standards for this directory
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEthicsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto space-y-6 text-[13px] text-slate-700 leading-relaxed">
              <section>
                <h3 className="text-[13px] font-semibold text-slate-900 uppercase tracking-wide mb-2">
                  Attribution
                </h3>
                <p className="mb-2">
                  Dataset curation is intellectual contribution. Each offer states whether
                  co-authorship is mandatory, negotiable, case-by-case, or acknowledgment-only.
                </p>
              </section>
              <section>
                <h3 className="text-[13px] font-semibold text-slate-900 uppercase tracking-wide mb-2">
                  Privacy
                </h3>
                <p>
                  Shared data must comply with GDPR, HIPAA where applicable, local law, and
                  institutional IRB / ethics approval for human subjects research.
                </p>
              </section>
              <section>
                <h3 className="text-[13px] font-semibold text-slate-900 uppercase tracking-wide mb-2">
                  Access process
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                  <li>Research purpose and methodology</li>
                  <li>Ethics / IRB reference when required</li>
                  <li>Proposed attribution or collaboration terms</li>
                  <li>Provider review and decision</li>
                </ol>
              </section>
              <section>
                <h3 className="text-[13px] font-semibold text-slate-900 uppercase tracking-wide mb-2">
                  Use restrictions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="rounded-md border border-slate-200 px-3 py-2">
                    <p className="font-semibold text-slate-900 text-[12px]">Allowed</p>
                    <p className="text-[12px] text-slate-500 mt-1">Academic / non-commercial research</p>
                  </div>
                  <div className="rounded-md border border-slate-200 px-3 py-2">
                    <p className="font-semibold text-slate-900 text-[12px]">Restricted</p>
                    <p className="text-[12px] text-slate-500 mt-1">Commercial use needs license</p>
                  </div>
                  <div className="rounded-md border border-slate-200 px-3 py-2">
                    <p className="font-semibold text-slate-900 text-[12px]">Prohibited</p>
                    <p className="text-[12px] text-slate-500 mt-1">Resale or re-identification</p>
                  </div>
                </div>
              </section>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowEthicsModal(false)}
                className="px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showRegistrationForm && (
        <DatabankOrgForm
          onSubmit={handleRegisterOrg}
          onCancel={() => setShowRegistrationForm(false)}
          isSubmitting={submitting}
        />
      )}
    </div>
  );
};

export default ResearchDataBankPage;
