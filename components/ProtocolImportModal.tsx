import React, { useCallback, useRef, useState } from 'react';
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  ClipboardDocumentIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import type { ProtocolFormValues } from './ProtocolForm';
import {
  extractTextFromDocx,
  smartParseProtocolText,
} from '../utils/protocolImport';

type Props = {
  onCancel: () => void;
  onParsed: (values: Partial<ProtocolFormValues>, meta?: { sourceLabel: string }) => void;
};

type Mode = 'upload' | 'paste';

const ProtocolImportModal: React.FC<Props> = ({ onCancel, onParsed }) => {
  const [mode, setMode] = useState<Mode>('upload');
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState('');
  const [htmlPreview, setHtmlPreview] = useState('');
  const [parsed, setParsed] = useState<ReturnType<typeof smartParseProtocolText> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const applyParsed = useCallback((text: string, name?: string, html?: string) => {
    if (!text.trim()) {
      setError('No readable text found. Try pasting the content, or use a .docx file.');
      setParsed(null);
      return;
    }
    const result = smartParseProtocolText(text, { filename: name });
    setParsed(result);
    setHtmlPreview(html || '');
    setError('');
  }, []);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    setFileName(file.name);
    setBusy(true);
    setError('');
    try {
      if (lower.endsWith('.docx')) {
        const { text, html } = await extractTextFromDocx(file);
        applyParsed(text, file.name, html);
      } else if (lower.endsWith('.txt') || lower.endsWith('.md')) {
        const text = await file.text();
        applyParsed(text, file.name);
      } else if (lower.endsWith('.doc')) {
        setError(
          'Legacy .doc isn’t supported in-browser. Save as .docx in Word, or paste the text.'
        );
        setParsed(null);
      } else {
        setError('Use a .docx Word file, or .txt / .md. You can also paste text.');
        setParsed(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not read that file.');
      setParsed(null);
    } finally {
      setBusy(false);
    }
  };

  const handlePasteAnalyze = () => {
    applyParsed(pasteText, 'pasted-protocol.txt');
  };

  const handleContinue = () => {
    if (!parsed) return;
    const { rawPreview: _r, detectedSections: _d, ...formValues } = parsed;
    onParsed(formValues, {
      sourceLabel: fileName || (mode === 'paste' ? 'Pasted text' : 'Import'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="protocol-import-title"
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <div>
            <h2 id="protocol-import-title" className="text-[16px] font-semibold text-slate-900">
              Import protocol
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Upload a Word SOP or paste text — we’ll detect sections and open the editor for you.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pt-3 flex gap-1.5 border-b border-slate-100">
          {(
            [
              { id: 'upload' as const, label: 'Word / file', icon: DocumentArrowUpIcon },
              { id: 'paste' as const, label: 'Paste text', icon: ClipboardDocumentIcon },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`relative px-3.5 py-2 text-[13px] font-medium inline-flex items-center gap-1.5 ${
                mode === tab.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {mode === tab.id ? (
                <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-slate-900 rounded-full" />
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {mode === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void handleFile(e.dataTransfer.files?.[0] || null);
              }}
              className={`rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
                dragOver
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <DocumentArrowUpIcon className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-slate-800">
                Drop a .docx Word protocol here
              </p>
              <p className="text-[12px] text-slate-500 mt-1 mb-4">
                Or choose a file — we’ll extract and structure Objective, Materials, Procedure, Safety…
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".docx,.txt,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="hidden"
                onChange={(e) => void handleFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50"
              >
                {busy ? 'Reading…' : 'Choose file'}
              </button>
              {fileName ? (
                <p className="text-[12px] text-slate-600 mt-3">Selected: {fileName}</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-[13px] font-medium text-slate-700">
                Paste from Word, email, or notes
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={10}
                placeholder={`Example:\n\nTitle: Western blot for phospho-ERK\n\nObjective\nDetect phosphorylated ERK in cell lysates.\n\nMaterials\n- Lysis buffer\n- Primary Ab (1:1000)\n\nProcedure\n1. Lyse cells on ice\n2. Run SDS-PAGE\n…`}
                className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-mono"
              />
              <button
                type="button"
                disabled={!pasteText.trim()}
                onClick={handlePasteAnalyze}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50"
              >
                <SparklesIcon className="w-4 h-4" />
                Analyze structure
              </button>
            </div>
          )}

          {error ? (
            <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          ) : null}

          {parsed ? (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <SparklesIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">
                      {parsed.title}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Detected:{' '}
                      {parsed.detectedSections.length
                        ? parsed.detectedSections.join(', ')
                        : 'body as procedure'}
                      {' · '}
                      {(parsed.materials || []).length} materials
                      {' · '}~{parsed.estimated_duration} min
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 max-h-64 overflow-hidden">
                <div className="p-3 overflow-y-auto max-h-64 text-[12px] text-slate-700 space-y-2">
                  <p>
                    <span className="font-medium text-slate-900">Summary: </span>
                    {parsed.description}
                  </p>
                  {parsed.objective ? (
                    <p>
                      <span className="font-medium text-slate-900">Objective: </span>
                      {parsed.objective.slice(0, 200)}
                      {parsed.objective.length > 200 ? '…' : ''}
                    </p>
                  ) : null}
                  {parsed.procedure ? (
                    <p className="whitespace-pre-wrap text-slate-600">
                      <span className="font-medium text-slate-900">Procedure preview: </span>
                      {parsed.procedure.slice(0, 400)}
                      {parsed.procedure.length > 400 ? '…' : ''}
                    </p>
                  ) : null}
                </div>
                <div className="p-3 overflow-y-auto max-h-64 bg-slate-50/80">
                  <p className="text-[11px] font-medium text-slate-500 mb-2 uppercase tracking-wide">
                    {htmlPreview ? 'Word preview' : 'Source text'}
                  </p>
                  {htmlPreview ? (
                    <div
                      className="prose prose-sm max-w-none text-slate-700 text-[12px]"
                      // Sanitized-ish: mammoth HTML from user's own file
                      dangerouslySetInnerHTML={{ __html: htmlPreview }}
                    />
                  ) : (
                    <pre className="text-[11px] text-slate-600 whitespace-pre-wrap font-sans">
                      {parsed.rawPreview.slice(0, 1200)}
                      {parsed.rawPreview.length > 1200 ? '…' : ''}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2 bg-white">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-[13px] font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parsed}
            onClick={handleContinue}
            className="px-3.5 py-2 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50"
          >
            Review in editor
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProtocolImportModal;
