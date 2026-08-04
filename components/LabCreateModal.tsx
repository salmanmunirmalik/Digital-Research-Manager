import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';
import { XMarkIcon } from './icons';

export interface CreatedLab {
  id: string;
  name: string;
  institution: string;
  department: string;
}

interface LabCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (lab: CreatedLab) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const authHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token') || ''}`,
});

const LabCreateModal: React.FC<LabCreateModalProps> = ({ open, onClose, onCreated }) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    institution: (user as any)?.current_institution || '',
    department: (user as any)?.department || '',
    description: '',
    address: (user as any)?.location || '',
    website_url: '',
    research_areas: '',
  });

  if (!open) return null;

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.institution.trim() || !form.department.trim()) {
      setError('Name, institution, and department are required.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/labs`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          institution: form.institution.trim(),
          department: form.department.trim(),
          description: form.description.trim() || null,
          address: form.address.trim() || null,
          website_url: form.website_url.trim() || null,
          research_areas: form.research_areas
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not create lab');
      onCreated(data.lab);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not create lab');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Create a lab</h2>
            <p className="mt-1 text-sm text-slate-600">
              Labs stay private in your workspace until you showcase them on Networking.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-3">
          {error && (
            <div className="rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>
          )}
          <label className="block text-xs font-medium text-slate-600">
            Lab name *
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Systems Immunology Lab"
              required
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-600">
              Institution *
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={form.institution}
                onChange={(e) => set('institution', e.target.value)}
                required
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Department / field *
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={form.department}
                onChange={(e) => set('department', e.target.value)}
                required
              />
            </label>
          </div>
          <label className="block text-xs font-medium text-slate-600">
            Short description
            <textarea
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm min-h-[72px]"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What does this lab work on?"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Research areas (comma-separated)
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={form.research_areas}
              onChange={(e) => set('research_areas', e.target.value)}
              placeholder="CRISPR, Single-cell, Immunology"
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-600">
              Location (city, country)
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Barcelona, Spain"
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Website
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={form.website_url}
                onChange={(e) => set('website_url', e.target.value)}
                placeholder="https://"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create lab'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabCreateModal;
