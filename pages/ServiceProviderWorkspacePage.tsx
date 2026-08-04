/**
 * Service provider workspace - manage directory profile and offerings (display only).
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import ServiceProviderRegisterForm, {
  ServiceProviderRegisterValues,
} from '../components/ServiceProviderRegisterForm';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import {
  NotebookFormModal,
  FormSection,
  Field,
  TextArea,
} from '../components/notebook/NotebookFormPrimitives';
import {
  EnvelopeIcon,
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token') || ''}`,
});

type Provider = {
  id: string;
  display_name: string;
  contact_email: string;
  contact_phone?: string;
  website?: string;
  institution?: string;
  location?: string;
  bio?: string;
  expertise_areas: string[];
  techniques: string[];
  pricing_note?: string;
  verified?: boolean;
  is_active?: boolean;
};

type Offering = {
  id: string;
  title: string;
  description?: string;
  service_type?: string;
  turnaround_note?: string;
  pricing_note?: string;
  tags?: string[];
};

const ServiceProviderWorkspacePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showOfferingForm, setShowOfferingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [offeringForm, setOfferingForm] = useState({
    title: '',
    description: '',
    service_type: 'consulting',
    turnaround_note: '',
    pricing_note: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/marketplace/service-providers/me`, {
        headers: authHeaders(),
      });
      setProvider(res.data.provider);
      setOfferings(res.data.offerings || []);
      if (!res.data.provider) setShowRegister(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRegister = async (data: ServiceProviderRegisterValues) => {
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/marketplace/service-providers/register`, data, {
        headers: authHeaders(),
      });
      setShowRegister(false);
      await load();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: ServiceProviderRegisterValues) => {
    setSubmitting(true);
    try {
      await axios.put(`${API_BASE}/marketplace/service-providers/me`, data, {
        headers: authHeaders(),
      });
      setShowEdit(false);
      await load();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE}/marketplace/service-providers/me/offerings`,
        offeringForm,
        { headers: authHeaders() }
      );
      setShowOfferingForm(false);
      setOfferingForm({
        title: '',
        description: '',
        service_type: 'consulting',
        turnaround_note: '',
        pricing_note: '',
      });
      await load();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add offering');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOffering = async (id: string) => {
    if (!confirm('Remove this offering?')) return;
    try {
      await axios.delete(
        `${API_BASE}/marketplace/service-providers/me/offerings/${id}`,
        { headers: authHeaders() }
      );
      await load();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to remove offering');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center text-slate-500 text-sm">
        Loading provider workspace…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          to="/marketplace?tab=services"
          className="inline-flex items-center gap-1.5 text-[13px] text-slate-600 hover:text-slate-900"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to marketplace
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Service provider workspace
          </h1>
          <p className="mt-1.5 text-[14px] text-slate-600">
            Manage your directory listing. Researchers email you directly - no bookings here.
          </p>
        </div>
        {provider && (
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
          >
            <PencilIcon className="w-4 h-4" />
            Edit profile
          </button>
        )}
      </div>

      {!provider ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center">
          <h2 className="text-[15px] font-semibold text-slate-900 mb-2">
            No service provider profile yet
          </h2>
          <p className="text-[13px] text-slate-500 mb-5">
            Register to appear in the services directory for {user?.email || 'your account'}.
          </p>
          <button
            type="button"
            onClick={() => setShowRegister(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
          >
            Register as service provider
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{provider.display_name}</h2>
                {(provider.institution || provider.location) && (
                  <p className="mt-1 text-[13px] text-slate-500 inline-flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5" />
                    {[provider.institution, provider.location].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                  provider.is_active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {provider.is_active ? 'Listed' : 'Hidden'}
              </span>
            </div>
            {provider.bio && (
              <p className="mt-4 text-[13px] text-slate-600 leading-relaxed">{provider.bio}</p>
            )}
            {provider.pricing_note && (
              <p className="mt-2 text-[12px] text-slate-500">{provider.pricing_note}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {(provider.expertise_areas || []).map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
            <a
              href={`mailto:${provider.contact_email}`}
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-slate-700 hover:text-slate-900"
            >
              <EnvelopeIcon className="w-4 h-4" />
              {provider.contact_email}
            </a>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Offerings</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Informational services you provide (contact via email).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOfferingForm(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
              >
                <PlusIcon className="w-4 h-4" />
                Add offering
              </button>
            </div>
            {offerings.length === 0 ? (
              <p className="text-[13px] text-slate-500 py-6 text-center">No offerings yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {offerings.map((item) => (
                  <li key={item.id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-medium text-slate-900">{item.title}</p>
                      {item.description && (
                        <p className="text-[12px] text-slate-500 mt-0.5">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-slate-500">
                        {item.service_type && <span>{item.service_type.replace(/_/g, ' ')}</span>}
                        {item.turnaround_note && <span>· {item.turnaround_note}</span>}
                        {item.pricing_note && <span>· {item.pricing_note}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteOffering(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                      aria-label="Remove"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate(`/marketplace?tab=services&view=${provider.id}`)}
            className="text-[13px] text-slate-600 hover:text-slate-900"
          >
            View public listing →
          </button>
        </div>
      )}

      {showRegister && (
        <ServiceProviderRegisterForm
          mode="register"
          initialData={{
            display_name:
              user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.username || '',
            contact_email: user?.email || '',
          }}
          onSubmit={handleRegister}
          onCancel={() => {
            setShowRegister(false);
            if (!provider) navigate('/marketplace?tab=services');
          }}
          isSubmitting={submitting}
        />
      )}

      {showEdit && provider && (
        <ServiceProviderRegisterForm
          mode="edit"
          initialData={{
            display_name: provider.display_name,
            contact_email: provider.contact_email,
            contact_phone: provider.contact_phone || '',
            website: provider.website || '',
            institution: provider.institution || '',
            location: provider.location || '',
            bio: provider.bio || '',
            expertise_areas: provider.expertise_areas || [],
            techniques: provider.techniques || [],
            pricing_note: provider.pricing_note || '',
          }}
          onSubmit={handleUpdate}
          onCancel={() => setShowEdit(false)}
          isSubmitting={submitting}
        />
      )}

      {showOfferingForm && (
        <NotebookFormModal
          title="Add service offering"
          subtitle="Shown on your public directory page for information only"
          onCancel={() => setShowOfferingForm(false)}
          onSubmit={handleAddOffering}
          submitLabel={submitting ? 'Saving…' : 'Add offering'}
          maxWidth="max-w-lg"
        >
          <FormSection title="Offering">
            <Field label="Title" required>
              <Input
                value={offeringForm.title}
                onChange={(e) => setOfferingForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </Field>
            <Field label="Type">
              <Select
                value={offeringForm.service_type}
                onChange={(e) =>
                  setOfferingForm((f) => ({ ...f, service_type: e.target.value }))
                }
                options={[
                  { value: 'consulting', label: 'Consulting' },
                  { value: 'data_analysis', label: 'Data analysis' },
                  { value: 'training', label: 'Training' },
                  { value: 'protocol_development', label: 'Protocol development' },
                  { value: 'manuscript_editing', label: 'Manuscript editing' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </Field>
            <Field label="Description">
              <TextArea
                value={offeringForm.description}
                onChange={(e) =>
                  setOfferingForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
              />
            </Field>
            <Field label="Turnaround note">
              <Input
                value={offeringForm.turnaround_note}
                onChange={(e) =>
                  setOfferingForm((f) => ({ ...f, turnaround_note: e.target.value }))
                }
                placeholder="e.g. Typically 1–2 weeks"
              />
            </Field>
            <Field label="Pricing note">
              <Input
                value={offeringForm.pricing_note}
                onChange={(e) =>
                  setOfferingForm((f) => ({ ...f, pricing_note: e.target.value }))
                }
                placeholder="Quote on request"
              />
            </Field>
          </FormSection>
        </NotebookFormModal>
      )}
    </div>
  );
};

export default ServiceProviderWorkspacePage;
