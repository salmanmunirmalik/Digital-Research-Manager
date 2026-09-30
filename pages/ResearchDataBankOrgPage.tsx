import React, { useEffect, useState } from 'react';
import { getAuthHeaders, getAuthToken, resolveApiBaseUrl, formatApiNetworkError } from '../utils/apiBase';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  DatabankOrgForm,
  DatabankRequestForm,
  DatabankOfferForm,
  DatabankOrgFormValues,
  DatabankRequestFormValues,
  DatabankOfferFormValues,
} from '../components/DatabankForms';
import PostedBy from '../components/PostedBy';
import { canManageResource } from '../utils/ownership';
import {
  CheckCircleIcon,
  MapPinIcon,
  EnvelopeIcon,
  DatabaseIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
} from '../components/icons';

const API_BASE = resolveApiBaseUrl();

const authHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getAuthToken() || ''}`,
});

const labelize = (value: string) =>
  String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

const parseJsonArray = (value: unknown): string[] => {
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

type Offer = {
  id: string;
  title: string;
  description: string;
  dataType: string;
  populationType: string;
  sampleSize: number;
  timePeriod: string;
  accessLevel: string;
  contactPerson: string;
  requirements: string[];
  diseaseFocus: string[];
  geographicCoverage: string[];
  requestCount: number;
  postedByName?: string | null;
};

type Organization = {
  id: string;
  createdBy?: string;
  postedByName?: string | null;
  name: string;
  type: string;
  category: string;
  country: string;
  region: string;
  contactEmail: string;
  website?: string;
  description: string;
  specializations: string[];
  verified: boolean;
  offers: Offer[];
};

const mapOffer = (row: any): Offer => ({
  id: row.id,
  title: row.title || '',
  description: row.description || '',
  dataType: row.data_type || row.dataType || 'clinical',
  populationType: row.population_type || row.populationType || 'general',
  sampleSize: Number(row.sample_size ?? row.sampleSize ?? 0),
  timePeriod: row.time_period || row.timePeriod || '',
  accessLevel: row.access_level || row.accessLevel || 'restricted',
  contactPerson: row.contact_person || row.contactPerson || '',
  requirements: parseJsonArray(row.requirements),
  diseaseFocus: parseJsonArray(row.disease_focus ?? row.diseaseFocus),
  geographicCoverage: parseJsonArray(row.geographic_coverage ?? row.geographicCoverage),
  requestCount: Number(row.request_count ?? row.requestCount ?? 0),
  postedByName: row.postedByName || row.posted_by_name || null,
});

const ResearchDataBankOrgPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showEditOrg, setShowEditOrg] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [requestOffer, setRequestOffer] = useState<Offer | null>(null);

  const isOwner = canManageResource(org?.createdBy, user);

  const loadOrg = async () => {
    if (!orgId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/databank/organizations/${orgId}`, {
        headers: authHeaders(),
      });
      if (!response.ok) {
        setError(response.status === 404 ? 'Organization not found' : 'Failed to load organization');
        setOrg(null);
        return;
      }
      const data = await response.json();
      const row = data.organization || data;
      setOrg({
        id: row.id,
        createdBy: row.created_by || row.createdBy,
        postedByName: row.postedByName || row.posted_by_name || null,
        name: row.name || '',
        type: row.type || '',
        category: row.category || '',
        country: row.country || '',
        region: row.region || '',
        contactEmail: row.contact_email || row.contactEmail || '',
        website: row.website || undefined,
        description: row.description || '',
        specializations: parseJsonArray(row.specializations),
        verified: Boolean(row.verified),
        offers: (row.data_offers || row.dataAvailable || []).map(mapOffer),
      });
    } catch (e) {
      console.error(e);
      setError('Failed to load organization');
      setOrg(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrg();
  }, [orgId]);

  const handleUpdateOrg = async (form: DatabankOrgFormValues) => {
    if (!orgId) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/databank/organizations/${orgId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Update failed');
      setShowEditOrg(false);
      await loadOrg();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Could not update organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!orgId || !org) return;
    if (!confirm(`Delete “${org.name}” and all of its dataset offers?`)) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/databank/organizations/${orgId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Delete failed (${response.status})`);
      }
      navigate('/research-databank');
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Could not delete organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveOffer = async (form: DatabankOfferFormValues) => {
    if (!orgId) return;
    setSubmitting(true);
    try {
      const url = editingOffer
        ? `${API_BASE}/databank/offers/${editingOffer.id}`
        : `${API_BASE}/databank/organizations/${orgId}/offers`;
      const response = await fetch(url, {
        method: editingOffer ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Offer save failed');
      setShowOfferForm(false);
      setEditingOffer(null);
      await loadOrg();
    } catch (e) {
      console.error(e);
      alert('Could not save dataset offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOffer = async (offer: Offer) => {
    if (!confirm(`Delete offer “${offer.title}”?`)) return;
    try {
      const response = await fetch(`${API_BASE}/databank/offers/${offer.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Delete failed');
      await loadOrg();
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Could not delete offer');
    }
  };

  const handleRequest = async (form: DatabankRequestFormValues) => {
    if (!requestOffer) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/databank/data-requests`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          dataOfferId: requestOffer.id,
        }),
      });
      if (!response.ok) throw new Error('Request failed');
      setRequestOffer(null);
      alert('Request submitted.');
      await loadOrg();
    } catch (e) {
      console.error(e);
      alert('Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-[13px] text-slate-500">
        Loading organization…
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <p className="text-[15px] font-semibold text-slate-900 mb-2">
          {error || 'Organization not found'}
        </p>
        <Link
          to="/research-databank"
          className="text-[13px] font-medium text-slate-700 underline-offset-2 hover:underline"
        >
          Back to data bank
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to="/research-databank"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Data bank
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {org.name}
              </h1>
              {org.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-[13px] text-slate-500">
              {labelize(org.type)}
              {org.category ? ` · ${labelize(org.category)}` : ''}
            </p>
            <PostedBy name={org.postedByName} className="mt-2" />
          </div>
          {isOwner && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowEditOrg(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
              >
                <PencilIcon className="w-4 h-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDeleteOrg}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-red-700 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-60"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        <p className="mt-4 text-[14px] text-slate-700 leading-relaxed">
          {org.description || 'No description provided.'}
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
          <div className="rounded-lg border border-slate-200 px-3.5 py-3">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">
              Location
            </p>
            <p className="text-slate-800 flex items-center gap-1.5">
              <MapPinIcon className="w-4 h-4 text-slate-400" />
              {[org.region, org.country].filter(Boolean).join(', ') || '-'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 px-3.5 py-3">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">
              Contact
            </p>
            <p className="text-slate-800 flex items-center gap-1.5 truncate">
              <EnvelopeIcon className="w-4 h-4 text-slate-400 shrink-0" />
              {org.contactEmail || '-'}
            </p>
          </div>
        </div>

        {org.specializations.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {org.specializations.map((spec) => (
              <span
                key={spec}
                className="px-2.5 py-1 text-[12px] font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200"
              >
                {spec}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-[15px] font-semibold text-slate-900">
          Dataset offers ({org.offers.length})
        </h2>
        {isOwner && (
          <button
            type="button"
            onClick={() => {
              setEditingOffer(null);
              setShowOfferForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
          >
            <PlusIcon className="w-4 h-4" />
            Publish offer
          </button>
        )}
      </div>

      {org.offers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 text-center py-12 px-6">
          <DatabaseIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-[14px] font-medium text-slate-900 mb-1">No dataset offers yet</p>
          <p className="text-[13px] text-slate-500 mb-4">
            {isOwner
              ? 'Publish an offer so researchers can request access.'
              : 'This organization has not published datasets yet.'}
          </p>
          {isOwner && (
            <button
              type="button"
              onClick={() => {
                setEditingOffer(null);
                setShowOfferForm(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
            >
              <PlusIcon className="w-4 h-4" />
              Publish offer
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {org.offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-[15px] font-semibold text-slate-900">{offer.title}</h3>
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-md border border-slate-200 bg-slate-50 text-slate-700 shrink-0">
                  {labelize(offer.accessLevel)}
                </span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed mb-3">
                {offer.description}
              </p>
              <PostedBy name={offer.postedByName || org.postedByName} className="mb-3" />
              <div className="grid grid-cols-2 gap-2 text-[12px] text-slate-500 mb-4">
                <span>Type: {labelize(offer.dataType)}</span>
                <span>
                  Samples:{' '}
                  {offer.sampleSize ? offer.sampleSize.toLocaleString() : '-'}
                </span>
                <span>Period: {offer.timePeriod || '-'}</span>
                <span>Requests: {offer.requestCount}</span>
              </div>
              <div className="flex justify-end gap-2">
                {isOwner && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOffer(offer);
                        setShowOfferForm(true);
                      }}
                      className="px-3 py-1.5 text-[12px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOffer(offer)}
                      className="px-3 py-1.5 text-[12px] font-medium text-red-700 border border-red-200 rounded-md hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setRequestOffer(offer)}
                  className="px-3 py-1.5 text-[12px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
                >
                  Request access
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditOrg && (
        <DatabankOrgForm
          mode="edit"
          initialData={{
            name: org.name,
            type: org.type,
            category: org.category,
            country: org.country,
            region: org.region,
            contactEmail: org.contactEmail,
            website: org.website || '',
            description: org.description,
            specializations: org.specializations,
          }}
          onSubmit={handleUpdateOrg}
          onCancel={() => setShowEditOrg(false)}
          isSubmitting={submitting}
        />
      )}

      {showOfferForm && (
        <DatabankOfferForm
          mode={editingOffer ? 'edit' : 'create'}
          initialData={
            editingOffer
              ? {
                  title: editingOffer.title,
                  description: editingOffer.description,
                  dataType: editingOffer.dataType,
                  populationType: editingOffer.populationType,
                  sampleSize: editingOffer.sampleSize,
                  timePeriod: editingOffer.timePeriod,
                  accessLevel: editingOffer.accessLevel,
                  contactPerson: editingOffer.contactPerson,
                  requirements: editingOffer.requirements,
                  diseaseFocus: editingOffer.diseaseFocus,
                  geographicCoverage: editingOffer.geographicCoverage,
                }
              : undefined
          }
          onSubmit={handleSaveOffer}
          onCancel={() => {
            setShowOfferForm(false);
            setEditingOffer(null);
          }}
          isSubmitting={submitting}
        />
      )}

      {requestOffer && (
        <DatabankRequestForm
          offerTitle={requestOffer.title}
          onSubmit={handleRequest}
          onCancel={() => setRequestOffer(null)}
          isSubmitting={submitting}
        />
      )}
    </div>
  );
};

export default ResearchDataBankOrgPage;
