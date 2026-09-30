/**
 * Writing Studio editor display preferences (local to the writer).
 * Applied as CSS — does not alter manuscript content or citations.
 */

export type EditorFontSize = 'sm' | 'md' | 'lg' | 'xl';
export type EditorLineSpacing = 'compact' | 'comfortable' | 'relaxed' | 'loose';
export type EditorFontFamily = 'serif' | 'sans' | 'dyslexic';
export type EditorMeasure = 'narrow' | 'medium' | 'wide';
export type EditorPageTone = 'paper' | 'soft' | 'night';
export type EditorTextAlign = 'left' | 'center' | 'right' | 'justify';

export type WritingEditorPrefs = {
  fontSize: EditorFontSize;
  lineSpacing: EditorLineSpacing;
  fontFamily: EditorFontFamily;
  measure: EditorMeasure;
  pageTone: EditorPageTone;
  textAlign: EditorTextAlign;
  focusMode: boolean;
};

export const DEFAULT_WRITING_EDITOR_PREFS: WritingEditorPrefs = {
  fontSize: 'md',
  lineSpacing: 'comfortable',
  fontFamily: 'serif',
  measure: 'medium',
  pageTone: 'paper',
  textAlign: 'left',
  focusMode: false,
};

const STORAGE_KEY = 'drm.writingStudio.editorPrefs';

const FONT_SIZE_PX: Record<EditorFontSize, string> = {
  sm: '1rem',
  md: '1.1875rem',
  lg: '1.3125rem',
  xl: '1.5rem',
};

const LINE_SPACING: Record<EditorLineSpacing, string> = {
  compact: '1.55',
  comfortable: '1.85',
  relaxed: '2.05',
  loose: '2.35',
};

const MEASURE: Record<EditorMeasure, string> = {
  narrow: '34rem',
  medium: '44rem',
  wide: '56rem',
};

const FONT_FAMILY: Record<EditorFontFamily, string> = {
  serif: "var(--ws-display)",
  sans: "var(--ws-ui)",
  dyslexic: "'Lexend', 'Atkinson Hyperlegible', var(--ws-ui)",
};

const TEXT_ALIGN: Record<EditorTextAlign, string> = {
  left: 'left',
  center: 'center',
  right: 'right',
  justify: 'justify',
};

export function loadWritingEditorPrefs(): WritingEditorPrefs {
  if (typeof window === 'undefined') return { ...DEFAULT_WRITING_EDITOR_PREFS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_WRITING_EDITOR_PREFS };
    const parsed = JSON.parse(raw) as Partial<WritingEditorPrefs>;
    const merged = { ...DEFAULT_WRITING_EDITOR_PREFS, ...parsed };
    if (!TEXT_ALIGN[merged.textAlign]) merged.textAlign = 'left';
    return merged;
  } catch {
    return { ...DEFAULT_WRITING_EDITOR_PREFS };
  }
}

export function saveWritingEditorPrefs(prefs: WritingEditorPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota / private mode */
  }
}

/** CSS custom properties applied to the desk root. */
export function writingEditorPrefsToStyle(
  prefs: WritingEditorPrefs
): Record<string, string> {
  return {
    '--ws-edit-size': FONT_SIZE_PX[prefs.fontSize],
    '--ws-edit-leading': LINE_SPACING[prefs.lineSpacing],
    '--ws-edit-measure': MEASURE[prefs.measure],
    '--ws-edit-font': FONT_FAMILY[prefs.fontFamily],
    '--ws-edit-align': TEXT_ALIGN[prefs.textAlign] || 'left',
  };
}

export const FONT_SIZE_OPTIONS: { id: EditorFontSize; label: string }[] = [
  { id: 'sm', label: 'S' },
  { id: 'md', label: 'M' },
  { id: 'lg', label: 'L' },
  { id: 'xl', label: 'XL' },
];

export const LINE_SPACING_OPTIONS: { id: EditorLineSpacing; label: string }[] = [
  { id: 'compact', label: 'Compact' },
  { id: 'comfortable', label: 'Comfortable' },
  { id: 'relaxed', label: 'Relaxed' },
  { id: 'loose', label: 'Loose' },
];

export const FONT_FAMILY_OPTIONS: { id: EditorFontFamily; label: string; hint: string }[] = [
  { id: 'serif', label: 'Serif', hint: 'Manuscript feel' },
  { id: 'sans', label: 'Sans', hint: 'Clean drafting' },
  { id: 'dyslexic', label: 'Clear', hint: 'High legibility' },
];

export const MEASURE_OPTIONS: { id: EditorMeasure; label: string }[] = [
  { id: 'narrow', label: 'Narrow' },
  { id: 'medium', label: 'Medium' },
  { id: 'wide', label: 'Wide' },
];

export const PAGE_TONE_OPTIONS: { id: EditorPageTone; label: string }[] = [
  { id: 'paper', label: 'Paper' },
  { id: 'soft', label: 'Soft' },
  { id: 'night', label: 'Night' },
];

export const TEXT_ALIGN_OPTIONS: { id: EditorTextAlign; label: string; hint: string }[] = [
  { id: 'left', label: 'Left', hint: 'Align left' },
  { id: 'center', label: 'Center', hint: 'Align center' },
  { id: 'right', label: 'Right', hint: 'Align right' },
  { id: 'justify', label: 'Justify', hint: 'Justify both edges' },
];
