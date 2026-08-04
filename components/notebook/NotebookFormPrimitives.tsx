import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { XMarkIcon, PlusIcon } from '../icons';

const textareaClass =
  'w-full px-3 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 focus:border-transparent resize-y';

const labelClass = 'block text-[13px] font-medium text-slate-700 mb-1.5';
const hintClass = 'mt-1 text-[12px] text-slate-500';

export function NotebookFormModal({
  title,
  subtitle,
  onCancel,
  onSubmit,
  submitLabel,
  children,
  maxWidth = 'max-w-2xl',
}: {
  title: string;
  subtitle?: string;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div
        className={`bg-white rounded-xl w-full ${maxWidth} max-h-[92vh] overflow-hidden border border-slate-200 my-6 flex flex-col`}
      >
        <div className="px-6 py-5 border-b border-slate-200 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h2>
              {subtitle && (
                <p className="mt-1 text-[13px] text-slate-600">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="px-6 py-5 overflow-y-auto flex-1 space-y-8">{children}</div>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex justify-end gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-slate-300 text-slate-700 hover:bg-white"
            >
              Cancel
            </Button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="pb-3 border-b border-slate-100">
        <h3 className="text-[13px] font-semibold text-slate-900 uppercase tracking-wide">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-[12px] text-slate-500">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="text-slate-400 font-normal"> *</span>}
      </label>
      {children}
      {hint && <p className={hintClass}>{hint}</p>}
    </div>
  );
}

export function TextArea({
  className = '',
  value,
  onChange,
  rows,
  placeholder,
  required,
  id,
  name,
  disabled,
}: {
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  id?: string;
  name?: string;
  disabled?: boolean;
}) {
  return (
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={`${textareaClass} ${className}`}
    />
  );
}

/** Chip-style list editor; empty strings are ignored on add. */
export function TagListField({
  label,
  hint,
  values,
  onChange,
  placeholder = 'Add item and press Enter',
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const items = values.filter((v) => v.trim());

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...items, t]);
    setDraft('');
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-md text-[12px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/80"
                aria-label={`Remove ${item}`}
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button
          type="button"
          variant="outline"
          onClick={add}
          className="shrink-0 border-slate-300 text-slate-700 px-3"
        >
          <PlusIcon className="w-4 h-4" />
        </Button>
      </div>
      {hint && <p className={hintClass}>{hint}</p>}
    </div>
  );
}

export function SegmentedChoice<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md border transition-colors ${
                active
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
