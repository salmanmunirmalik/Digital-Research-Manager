import React, { useEffect, useState } from 'react';
import { XMarkIcon } from './icons';

export type DashboardNoteFormValues = {
  content: string;
  color: string;
};

type Props = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initial?: DashboardNoteFormValues | null;
  submitting?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: DashboardNoteFormValues) => void | Promise<void>;
};

const COLORS = [
  { id: 'yellow', label: 'Amber', swatch: 'bg-amber-300' },
  { id: 'blue', label: 'Sky', swatch: 'bg-sky-300' },
  { id: 'green', label: 'Green', swatch: 'bg-emerald-300' },
  { id: 'pink', label: 'Rose', swatch: 'bg-rose-300' },
  { id: 'purple', label: 'Violet', swatch: 'bg-violet-300' },
] as const;

const DashboardNoteForm: React.FC<Props> = ({
  isOpen,
  mode,
  initial,
  submitting = false,
  error,
  onClose,
  onSubmit,
}) => {
  const [content, setContent] = useState('');
  const [color, setColor] = useState('yellow');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setContent(initial?.content || '');
    setColor(initial?.color || 'yellow');
    setLocalError('');
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setLocalError('Write something before saving.');
      return;
    }
    setLocalError('');
    await onSubmit({ content: content.trim(), color });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-note-form-title"
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 id="dashboard-note-form-title" className="text-[15px] font-semibold text-slate-900">
              {mode === 'edit' ? 'Edit note' : 'New note'}
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Sticky notes sync with your lab notebook quick notes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="dashboard-note-content" className="block text-[13px] font-medium text-slate-700 mb-1">
              Note <span className="text-red-500">*</span>
            </label>
            <textarea
              id="dashboard-note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              autoFocus
              placeholder="e.g. Restock PBS, follow up with PI on grant draft…"
              className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 resize-y min-h-[120px]"
            />
          </div>

          <div>
            <p className="text-[13px] font-medium text-slate-700 mb-2">Color</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`inline-flex items-center gap-2 px-2.5 py-1.5 text-[12px] rounded-full border transition-colors ${
                    color === c.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${c.swatch}`} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {(localError || error) ? (
            <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {localError || error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-[13px] font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DashboardNoteForm;
