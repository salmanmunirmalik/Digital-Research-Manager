/**
 * Supplier workspace - manage directory profile and catalog (display only).
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import SupplierRegisterForm, {
  SupplierRegisterValues,
} from '../components/SupplierRegisterForm';
import Input from '../components/ui/Input';
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

type Supplier = {
  id: string;
  company_name: string;
  contact_email: string;
  contact_phone?: string;
  website?: string;
  location?: string;
  country?: string;
  description?: string;
  specializations: string[];
  verified?: boolean;
  is_active?: boolean;
};

type CatalogItem = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  pricing_note?: string;
  is_active?: boolean;
};

const SupplierWorkspacePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showCatalogForm, setShowCatalogForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [catalogForm, setCatalogForm] = useState({
    name: '',
    description: '',
    category: '',
    pricing_note: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/marketplace/suppliers/me`, {
        headers: authHeaders(),
      });
      setSupplier(res.data.supplier);
      setCatalog(res.data.catalog || []);
      if (!res.data.supplier) setShowRegister(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRegister = async (data: SupplierRegisterValues) => {
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/marketplace/suppliers/register`, data, {
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

  const handleUpdate = async (data: SupplierRegisterValues) => {
    setSubmitting(true);
    try {
      await axios.put(`${API_BASE}/marketplace/suppliers/me`, data, {
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

  const handleAddCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/marketplace/suppliers/me/catalog`, catalogForm, {
        headers: authHeaders(),
      });
      setShowCatalogForm(false);
      setCatalogForm({ name: '', description: '', category: '', pricing_note: '' });
      await load();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCatalog = async (id: string) => {
    if (!confirm('Remove this catalog item?')) return;
    try {
      await axios.delete(`${API_BASE}/marketplace/suppliers/me/catalog/${id}`, {
        headers: authHeaders(),
      });
      await load();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to remove item');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center text-slate-500 text-sm">
        Loading supplier workspace…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          to="/marketplace?tab=suppliers"
          className="inline-flex items-center gap-1.5 text-[13px] text-slate-600 hover:text-slate-900"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to marketplace
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
            Supplier workspace
          </h1>
          <p className="mt-1.5 text-[14px] text-slate-600">
            Manage your directory listing. Researchers contact you by email - no deals here.
          </p>
        </div>
        {supplier && (
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

      {!supplier ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center">
          <h2 className="text-[15px] font-semibold text-slate-900 mb-2">
            No supplier profile yet
          </h2>
          <p className="text-[13px] text-slate-500 mb-5">
            Register to appear in the supplies directory for {user?.email || 'your account'}.
          </p>
          <button
            type="button"
            onClick={() => setShowRegister(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
          >
            Register as supplier
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{supplier.company_name}</h2>
                {supplier.location && (
                  <p className="mt-1 text-[13px] text-slate-500 inline-flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5" />
                    {[supplier.location, supplier.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                  supplier.is_active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {supplier.is_active ? 'Listed' : 'Hidden'}
              </span>
            </div>
            {supplier.description && (
              <p className="mt-4 text-[13px] text-slate-600 leading-relaxed">
                {supplier.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {(supplier.specializations || []).map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
            <a
              href={`mailto:${supplier.contact_email}`}
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-slate-700 hover:text-slate-900"
            >
              <EnvelopeIcon className="w-4 h-4" />
              {supplier.contact_email}
            </a>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Catalog</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Optional display-only products or categories (no checkout).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogForm(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
              >
                <PlusIcon className="w-4 h-4" />
                Add item
              </button>
            </div>
            {catalog.length === 0 ? (
              <p className="text-[13px] text-slate-500 py-6 text-center">
                No catalog items yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {catalog.map((item) => (
                  <li key={item.id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-medium text-slate-900">{item.name}</p>
                      {item.description && (
                        <p className="text-[12px] text-slate-500 mt-0.5">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-slate-500">
                        {item.category && <span>{item.category}</span>}
                        {item.pricing_note && <span>· {item.pricing_note}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCatalog(item.id)}
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
            onClick={() => navigate(`/marketplace?tab=suppliers&view=${supplier.id}`)}
            className="text-[13px] text-slate-600 hover:text-slate-900"
          >
            View public listing →
          </button>
        </div>
      )}

      {(showRegister || (!supplier && showRegister !== false)) && showRegister && (
        <SupplierRegisterForm
          mode="register"
          initialData={{
            contact_email: user?.email || '',
          }}
          onSubmit={handleRegister}
          onCancel={() => {
            setShowRegister(false);
            if (!supplier) navigate('/marketplace?tab=suppliers');
          }}
          isSubmitting={submitting}
        />
      )}

      {showEdit && supplier && (
        <SupplierRegisterForm
          mode="edit"
          initialData={{
            company_name: supplier.company_name,
            contact_email: supplier.contact_email,
            contact_phone: supplier.contact_phone || '',
            website: supplier.website || '',
            location: supplier.location || '',
            country: supplier.country || '',
            description: supplier.description || '',
            specializations: supplier.specializations || [],
          }}
          onSubmit={handleUpdate}
          onCancel={() => setShowEdit(false)}
          isSubmitting={submitting}
        />
      )}

      {showCatalogForm && (
        <NotebookFormModal
          title="Add catalog item"
          subtitle="Shown on your public directory page for information only"
          onCancel={() => setShowCatalogForm(false)}
          onSubmit={handleAddCatalog}
          submitLabel={submitting ? 'Saving…' : 'Add item'}
          maxWidth="max-w-lg"
        >
          <FormSection title="Item">
            <Field label="Name" required>
              <Input
                value={catalogForm.name}
                onChange={(e) => setCatalogForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </Field>
            <Field label="Category">
              <Input
                value={catalogForm.category}
                onChange={(e) => setCatalogForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Reagents"
              />
            </Field>
            <Field label="Description">
              <TextArea
                value={catalogForm.description}
                onChange={(e) =>
                  setCatalogForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
              />
            </Field>
            <Field label="Pricing note">
              <Input
                value={catalogForm.pricing_note}
                onChange={(e) =>
                  setCatalogForm((f) => ({ ...f, pricing_note: e.target.value }))
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

export default SupplierWorkspacePage;
