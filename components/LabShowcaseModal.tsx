import React, { useEffect, useState } from 'react';
import Button from './ui/Button';
import { LOOKING_FOR_OPTIONS } from '../utils/labShowcase';
import { GlobeAltIcon, XMarkIcon } from './icons';

export interface ShowcaseLabInput {
  id: string;
  name: string;
  description?: string;
  department?: string;
  address?: string;
  website_url?: string;
  showcase_tagline?: string;
  research_areas?: string[] | string;
  looking_for?: string[] | string;
  is_showcased?: boolean | number;
}

interface LabShowcaseModalProps {
  open: boolean;
  lab: ShowcaseLabInput | null;
  onClose: () => void;
  onSaved: (lab: any) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const authHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token') || ''}`,
});

const toList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const LabShowcaseModal: React.FC<LabShowcaseModalProps> = ({ open, lab, onClose, onSaved }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [areasText, setAreasText] = useState('');
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [isShowcased, setIsShowcased] = useState(false);

  useEffect(() => {
    if (!lab || !open) return;
    setTagline(lab.showcase_tagline || '');
    setDescription(lab.description || '');
    setDepartment(lab.department || '');
    setAreasText(toList(lab.research_areas).join(', '));
    setLookingFor(toList(lab.looking_for));
    setAddress(lab.address || '');
    setWebsite(lab.website_url || '');
    setIsShowcased(Boolean(Number(lab.is_showcased)));
    setError('');
  }, [lab, open]);

  if (!open || !lab) return null;

  const toggleLooking = (id: string) => {
    setLookingFor((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const save = async (publish: boolean) => {
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/labs/${lab.id}/showcase`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          isShowcased: publish,
          tagline,
          description,
          department,
          researchAreas: areasText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          lookingFor,
          address,
          website_url: website,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not update showcase');
      onSaved(data.lab);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not update showcase');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <GlobeAltIcon className="w-5 h-5 text-slate-700" />
              Showcase on Networking
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {lab.name} - publish a discovery card so peers can find you. Workspace ops stay private.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>
          )}

          <label className="block text-xs font-medium text-slate-600">
            One-line pitch *
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={280}
              placeholder="Open to CRISPR method collaborations across Europe"
            />
          </label>

          <label className="block text-xs font-medium text-slate-600">
            About the lab
            <textarea
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-600">
              Primary field *
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Research areas
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={areasText}
                onChange={(e) => setAreasText(e.target.value)}
                placeholder="Comma-separated"
              />
            </label>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">Currently looking for</p>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map((opt) => {
                const active = lookingFor.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleLooking(opt.id)}
                    className={`px-2.5 py-1 rounded-md text-[12px] border transition-colors ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-600">
              Location
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="City, Country"
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Website
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            {isShowcased && (
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => void save(false)}
              >
                Unpublish
              </Button>
            )}
            <Button type="button" variant="primary" disabled={submitting} onClick={() => void save(true)}>
              {submitting ? 'Saving…' : isShowcased ? 'Update showcase' : 'Go live on Networking'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabShowcaseModal;
