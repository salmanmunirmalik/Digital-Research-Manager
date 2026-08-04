/**
 * Marketplace directory - suppliers & service providers.
 * Contact via email only; no deals, bookings, or checkout.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import SupplierRegisterForm, {
  SupplierRegisterValues,
} from '../components/SupplierRegisterForm';
import ServiceProviderRegisterForm, {
  ServiceProviderRegisterValues,
} from '../components/ServiceProviderRegisterForm';
import PostedBy from '../components/PostedBy';
import {
  SearchIcon,
  BriefcaseIcon,
  PackageIcon,
  MapPinIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XMarkIcon,
  BuildingOfficeIcon,
} from '../components/icons';

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
  owner_name?: string;
  postedByName?: string;
};

type CatalogItem = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  pricing_note?: string;
};

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
  owner_name?: string;
  postedByName?: string;
};

type Offering = {
  id: string;
  title: string;
  description?: string;
  service_type?: string;
  turnaround_note?: string;
  pricing_note?: string;
};

const mailto = (email: string, subject: string) =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}`;

const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'services'>(() =>
    searchParams.get('tab') === 'services' ? 'services' : 'suppliers'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [mySupplierId, setMySupplierId] = useState<string | null>(null);
  const [myProviderId, setMyProviderId] = useState<string | null>(null);
  const [showSupplierRegister, setShowSupplierRegister] = useState(false);
  const [showProviderRegister, setShowProviderRegister] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailSupplier, setDetailSupplier] = useState<{
    supplier: Supplier;
    catalog: CatalogItem[];
  } | null>(null);
  const [detailProvider, setDetailProvider] = useState<{
    provider: Provider;
    offerings: Offering[];
  } | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'services' || tab === 'suppliers') setActiveTab(tab);
  }, [searchParams]);

  const switchTab = (tab: 'suppliers' | 'services') => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    next.delete('view');
    setSearchParams(next);
    setDetailSupplier(null);
    setDetailProvider(null);
  };

  const loadDirectory = async () => {
    setLoading(true);
    try {
      const headers = authHeaders();
      if (activeTab === 'suppliers') {
        const res = await axios.get(`${API_BASE}/marketplace/suppliers`, {
          headers,
          params: searchTerm ? { search: searchTerm } : undefined,
        });
        setSuppliers(res.data.suppliers || []);
      } else {
        const res = await axios.get(`${API_BASE}/marketplace/service-providers`, {
          headers,
          params: searchTerm ? { search: searchTerm } : undefined,
        });
        setProviders(res.data.providers || []);
      }
    } catch (error) {
      console.error('Failed to load marketplace directory:', error);
      if (activeTab === 'suppliers') setSuppliers([]);
      else setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMyProfiles = async () => {
    try {
      const headers = authHeaders();
      const [s, p] = await Promise.all([
        axios.get(`${API_BASE}/marketplace/suppliers/me`, { headers }).catch(() => null),
        axios
          .get(`${API_BASE}/marketplace/service-providers/me`, { headers })
          .catch(() => null),
      ]);
      setMySupplierId(s?.data?.supplier?.id || null);
      setMyProviderId(p?.data?.provider?.id || null);
    } catch {
      /* ignore */
    }
  };

  const removeMySupplier = async () => {
    if (!confirm('Remove your supplier listing from the marketplace?')) return;
    try {
      await axios.delete(`${API_BASE}/marketplace/suppliers/me`, { headers: authHeaders() });
      setMySupplierId(null);
      await loadDirectory();
    } catch (e) {
      console.error(e);
      alert('Could not remove supplier listing');
    }
  };

  const removeMyProvider = async () => {
    if (!confirm('Remove your service provider listing from the marketplace?')) return;
    try {
      await axios.delete(`${API_BASE}/marketplace/service-providers/me`, {
        headers: authHeaders(),
      });
      setMyProviderId(null);
      await loadDirectory();
    } catch (e) {
      console.error(e);
      alert('Could not remove provider listing');
    }
  };

  useEffect(() => {
    loadDirectory();
  }, [activeTab]);

  useEffect(() => {
    loadMyProfiles();
  }, []);

  useEffect(() => {
    const viewId = searchParams.get('view');
    if (!viewId) return;
    if (activeTab === 'suppliers') openSupplier(viewId);
    else openProvider(viewId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('view'), activeTab]);

  const openSupplier = async (id: string) => {
    try {
      const res = await axios.get(`${API_BASE}/marketplace/suppliers/${id}`, {
        headers: authHeaders(),
      });
      setDetailSupplier({
        supplier: res.data.supplier,
        catalog: res.data.catalog || [],
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Could not load supplier');
    }
  };

  const openProvider = async (id: string) => {
    try {
      const res = await axios.get(`${API_BASE}/marketplace/service-providers/${id}`, {
        headers: authHeaders(),
      });
      setDetailProvider({
        provider: res.data.provider,
        offerings: res.data.offerings || [],
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Could not load service provider');
    }
  };

  const handleSupplierRegister = async (data: SupplierRegisterValues) => {
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/marketplace/suppliers/register`, data, {
        headers: authHeaders(),
      });
      setShowSupplierRegister(false);
      await loadMyProfiles();
      await loadDirectory();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProviderRegister = async (data: ServiceProviderRegisterValues) => {
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/marketplace/service-providers/register`, data, {
        headers: authHeaders(),
      });
      setShowProviderRegister(false);
      await loadMyProfiles();
      await loadDirectory();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    if (!searchTerm.trim()) return suppliers;
    const q = searchTerm.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.company_name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q) ||
        s.specializations?.some((x) => x.toLowerCase().includes(q))
    );
  }, [suppliers, searchTerm]);

  const filteredProviders = useMemo(() => {
    if (!searchTerm.trim()) return providers;
    const q = searchTerm.toLowerCase();
    return providers.filter(
      (p) =>
        p.display_name.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) ||
        p.institution?.toLowerCase().includes(q) ||
        p.expertise_areas?.some((x) => x.toLowerCase().includes(q)) ||
        p.techniques?.some((x) => x.toLowerCase().includes(q))
    );
  }, [providers, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              Marketplace
            </h1>
            <p className="mt-1.5 text-[14px] text-slate-600">
              Research supplies and expertise directory. Contact providers by email - no deals on
              this platform.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'suppliers' ? (
              mySupplierId ? (
                <>
                  <Link
                    to="/marketplace/supplier"
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
                  >
                    My supplier workspace
                  </Link>
                  <button
                    type="button"
                    onClick={() => void removeMySupplier()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                  >
                    Remove listing
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSupplierRegister(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
                >
                  Register as supplier
                </button>
              )
            ) : myProviderId ? (
              <>
                <Link
                  to="/marketplace/provider"
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  My provider workspace
                </Link>
                <button
                  type="button"
                  onClick={() => void removeMyProvider()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                >
                  Remove listing
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowProviderRegister(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
              >
                Register as service provider
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-1 border-b border-slate-200">
          <button
            type="button"
            onClick={() => switchTab('suppliers')}
            className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors inline-flex items-center gap-2 ${
              activeTab === 'suppliers' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <PackageIcon className="w-4 h-4" />
            Suppliers
            {activeTab === 'suppliers' && (
              <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-slate-900 rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => switchTab('services')}
            className={`relative px-4 py-2.5 text-[13px] font-medium transition-colors inline-flex items-center gap-2 ${
              activeTab === 'services' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BriefcaseIcon className="w-4 h-4" />
            Service providers
            {activeTab === 'services' && (
              <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-slate-900 rounded-full" />
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadDirectory()}
            placeholder={
              activeTab === 'suppliers'
                ? 'Search suppliers by name, location, or specialty…'
                : 'Search providers by name, expertise, or technique…'
            }
            className="w-full pl-10 pr-4 py-2.5 text-[14px] border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[13px] text-slate-500">Loading directory…</div>
      ) : activeTab === 'suppliers' ? (
        filteredSuppliers.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-xl py-14 text-center px-6">
            <BuildingOfficeIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">No suppliers listed yet</h3>
            <p className="text-[13px] text-slate-500 mb-5">
              Be the first to register your company in the supplies directory.
            </p>
            {!mySupplierId && (
              <button
                type="button"
                onClick={() => setShowSupplierRegister(true)}
                className="inline-flex items-center px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
              >
                Register as supplier
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-[15px] font-semibold text-slate-900">{supplier.company_name}</h3>
                  {supplier.verified && (
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  )}
                </div>
                {(supplier.location || supplier.country) && (
                  <p className="text-[12px] text-slate-500 inline-flex items-center gap-1 mb-2">
                    <MapPinIcon className="w-3.5 h-3.5" />
                    {[supplier.location, supplier.country].filter(Boolean).join(', ')}
                  </p>
                )}
                <p className="text-[13px] text-slate-600 line-clamp-3 flex-1">
                  {supplier.description || 'Research supplies directory listing.'}
                </p>
                <PostedBy
                  name={supplier.postedByName || supplier.owner_name}
                  className="mt-2"
                />
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(supplier.specializations || []).slice(0, 4).map((spec) => (
                    <span
                      key={spec}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px]"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openSupplier(supplier.id)}
                    className="flex-1 px-3 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
                  >
                    View details
                  </button>
                  <a
                    href={mailto(
                      supplier.contact_email,
                      `Inquiry via Digital Research Manager - ${supplier.company_name}`
                    )}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
                  >
                    <EnvelopeIcon className="w-4 h-4" />
                    Contact
                  </a>
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredProviders.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-xl py-14 text-center px-6">
          <BriefcaseIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-[15px] font-semibold text-slate-900 mb-1">
            No service providers listed yet
          </h3>
          <p className="text-[13px] text-slate-500 mb-5">
            Register to offer research expertise in the directory.
          </p>
          {!myProviderId && (
            <button
              type="button"
              onClick={() => setShowProviderRegister(true)}
              className="inline-flex items-center px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
            >
              Register as service provider
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProviders.map((provider) => (
            <div
              key={provider.id}
              className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-[15px] font-semibold text-slate-900">
                  {provider.display_name}
                </h3>
                {provider.verified && (
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                )}
              </div>
              {(provider.institution || provider.location) && (
                <p className="text-[12px] text-slate-500 mb-2">
                  {[provider.institution, provider.location].filter(Boolean).join(' · ')}
                </p>
              )}
              <p className="text-[13px] text-slate-600 line-clamp-3 flex-1">
                {provider.bio || 'Research service provider.'}
              </p>
              <PostedBy
                name={provider.postedByName || provider.owner_name}
                className="mt-2"
              />
              {provider.pricing_note && (
                <p className="mt-2 text-[12px] text-slate-500">{provider.pricing_note}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(provider.expertise_areas || []).slice(0, 4).map((area) => (
                  <span
                    key={area}
                    className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px]"
                  >
                    {area}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => openProvider(provider.id)}
                  className="flex-1 px-3 py-2 text-[13px] font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  View details
                </button>
                <a
                  href={mailto(
                    provider.contact_email,
                    `Inquiry via Digital Research Manager - ${provider.display_name}`
                  )}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
                >
                  <EnvelopeIcon className="w-4 h-4" />
                  Contact
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailSupplier && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {detailSupplier.supplier.company_name}
                </h2>
                {(detailSupplier.supplier.location || detailSupplier.supplier.country) && (
                  <p className="mt-1 text-[13px] text-slate-500">
                    {[detailSupplier.supplier.location, detailSupplier.supplier.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetailSupplier(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {detailSupplier.supplier.description && (
                <p className="text-[14px] text-slate-600 leading-relaxed">
                  {detailSupplier.supplier.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {(detailSupplier.supplier.specializations || []).map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px]"
                  >
                    {s}
                  </span>
                ))}
              </div>
              {detailSupplier.catalog.length > 0 && (
                <div>
                  <h3 className="text-[13px] font-semibold text-slate-900 mb-2">Catalog</h3>
                  <ul className="space-y-2">
                    {detailSupplier.catalog.map((item) => (
                      <li
                        key={item.id}
                        className="border border-slate-100 rounded-lg px-3 py-2"
                      >
                        <p className="text-[13px] font-medium text-slate-900">{item.name}</p>
                        {item.description && (
                          <p className="text-[12px] text-slate-500 mt-0.5">{item.description}</p>
                        )}
                        {(item.category || item.pricing_note) && (
                          <p className="text-[11px] text-slate-500 mt-1">
                            {[item.category, item.pricing_note].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <a
                href={mailto(
                  detailSupplier.supplier.contact_email,
                  `Inquiry via Digital Research Manager - ${detailSupplier.supplier.company_name}`
                )}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
              >
                <EnvelopeIcon className="w-4 h-4" />
                Email {detailSupplier.supplier.contact_email}
              </a>
            </div>
          </div>
        </div>
      )}

      {detailProvider && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {detailProvider.provider.display_name}
                </h2>
                {(detailProvider.provider.institution || detailProvider.provider.location) && (
                  <p className="mt-1 text-[13px] text-slate-500">
                    {[detailProvider.provider.institution, detailProvider.provider.location]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetailProvider(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {detailProvider.provider.bio && (
                <p className="text-[14px] text-slate-600 leading-relaxed">
                  {detailProvider.provider.bio}
                </p>
              )}
              {detailProvider.provider.pricing_note && (
                <p className="text-[13px] text-slate-500">{detailProvider.provider.pricing_note}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {[
                  ...(detailProvider.provider.expertise_areas || []),
                  ...(detailProvider.provider.techniques || []),
                ].map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px]"
                  >
                    {s}
                  </span>
                ))}
              </div>
              {detailProvider.offerings.length > 0 && (
                <div>
                  <h3 className="text-[13px] font-semibold text-slate-900 mb-2">Offerings</h3>
                  <ul className="space-y-2">
                    {detailProvider.offerings.map((item) => (
                      <li
                        key={item.id}
                        className="border border-slate-100 rounded-lg px-3 py-2"
                      >
                        <p className="text-[13px] font-medium text-slate-900">{item.title}</p>
                        {item.description && (
                          <p className="text-[12px] text-slate-500 mt-0.5">{item.description}</p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-1">
                          {[
                            item.service_type?.replace(/_/g, ' '),
                            item.turnaround_note,
                            item.pricing_note,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <a
                href={mailto(
                  detailProvider.provider.contact_email,
                  `Inquiry via Digital Research Manager - ${detailProvider.provider.display_name}`
                )}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800"
              >
                <EnvelopeIcon className="w-4 h-4" />
                Email {detailProvider.provider.contact_email}
              </a>
            </div>
          </div>
        </div>
      )}

      {showSupplierRegister && (
        <SupplierRegisterForm
          initialData={{ contact_email: user?.email || '' }}
          onSubmit={handleSupplierRegister}
          onCancel={() => setShowSupplierRegister(false)}
          isSubmitting={submitting}
        />
      )}

      {showProviderRegister && (
        <ServiceProviderRegisterForm
          initialData={{
            display_name:
              user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.username || '',
            contact_email: user?.email || '',
          }}
          onSubmit={handleProviderRegister}
          onCancel={() => setShowProviderRegister(false)}
          isSubmitting={submitting}
        />
      )}
    </div>
  );
};

export default MarketplacePage;
