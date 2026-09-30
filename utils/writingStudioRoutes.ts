/**
 * Writing Studio — canonical routes & IDs.
 *
 * Path is the source of truth for *where* you are in the studio.
 * Document content, citations, and AI state stay in React/server.
 *
 * Tree:
 *   /writing-studio                              desk (manuscript list)
 *   /writing-studio/new                          template picker
 *   /writing-studio/new/:docType                 picker filtered by doc type
 *   /writing-studio/compose/:templateId          unsaved draft (no server id yet)
 *   /writing-studio/compose/:templateId/s/:sectionId[/:panel]
 *   /writing-studio/m/:docId                     saved manuscript → redirects to section
 *   /writing-studio/m/:docId/s/:sectionId[/:panel]
 *   /writing-studio/tools/:toolId                studio tools (generate | library)
 *
 * Query (ephemeral / cross-cutting):
 *   ?invite=TOKEN   collab accept
 *   ?notice=slides  one-shot toast
 *   ?cite=ID        seed citation on compose
 *   ?grantId=ID     link grant wizard → grant draft
 */

import type { WritingDocType } from './writingTemplates';

export const STUDIO_ROOT = '/writing-studio';

export const STUDIO_PANEL_IDS = [
  'guide',
  'details',
  'share',
  'sources',
  'analyze',
  'export',
  'view',
] as const;

export type StudioPanelId = (typeof STUDIO_PANEL_IDS)[number];

export const STUDIO_TOOL_IDS = ['generate', 'library'] as const;
export type StudioToolId = (typeof STUDIO_TOOL_IDS)[number];

export const STUDIO_DOC_TYPES: WritingDocType[] = [
  'research_paper',
  'review_paper',
  'research_proposal',
  'grant',
  'other',
];

/** High-level studio surface (for analytics / chrome). */
export type StudioViewId = 'desk' | 'new' | 'compose' | 'manuscript' | 'tool';

export type StudioRoute =
  | { view: 'desk' }
  | { view: 'new'; docType?: WritingDocType }
  | {
      view: 'compose';
      templateId: string;
      sectionId?: string;
      panel?: StudioPanelId;
    }
  | {
      view: 'manuscript';
      docId: string;
      sectionId?: string;
      panel?: StudioPanelId;
    }
  | { view: 'tool'; toolId: StudioToolId };

const PANEL_SET = new Set<string>(STUDIO_PANEL_IDS);
const TOOL_SET = new Set<string>(STUDIO_TOOL_IDS);
const DOC_TYPE_SET = new Set<string>(STUDIO_DOC_TYPES);

function isPanel(s: string | undefined): s is StudioPanelId {
  return Boolean(s && PANEL_SET.has(s));
}

function isTool(s: string | undefined): s is StudioToolId {
  return Boolean(s && TOOL_SET.has(s));
}

function isDocType(s: string | undefined): s is WritingDocType {
  return Boolean(s && DOC_TYPE_SET.has(s));
}

/** Safe path segment (ids from DB / templates are slug-like). */
function enc(segment: string): string {
  return encodeURIComponent(segment);
}

function dec(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function isStudioPanelId(value: string | null | undefined): value is StudioPanelId {
  return isPanel(value || undefined);
}

export function isStudioToolId(value: string | null | undefined): value is StudioToolId {
  return isTool(value || undefined);
}

/** Build a path from a typed route object. */
export function studioPath(route: StudioRoute): string {
  switch (route.view) {
    case 'desk':
      return STUDIO_ROOT;
    case 'new':
      return route.docType
        ? `${STUDIO_ROOT}/new/${enc(route.docType)}`
        : `${STUDIO_ROOT}/new`;
    case 'compose': {
      let p = `${STUDIO_ROOT}/compose/${enc(route.templateId)}`;
      if (route.sectionId) {
        p += `/s/${enc(route.sectionId)}`;
        if (route.panel) p += `/${enc(route.panel)}`;
      }
      return p;
    }
    case 'manuscript': {
      let p = `${STUDIO_ROOT}/m/${enc(route.docId)}`;
      if (route.sectionId) {
        p += `/s/${enc(route.sectionId)}`;
        if (route.panel) p += `/${enc(route.panel)}`;
      }
      return p;
    }
    case 'tool':
      return `${STUDIO_ROOT}/tools/${enc(route.toolId)}`;
    default:
      return STUDIO_ROOT;
  }
}

export const studioDeskPath = (): string => studioPath({ view: 'desk' });

export const studioNewPath = (docType?: WritingDocType): string =>
  studioPath({ view: 'new', docType });

export const studioComposePath = (
  templateId: string,
  sectionId?: string,
  panel?: StudioPanelId
): string => studioPath({ view: 'compose', templateId, sectionId, panel });

export const studioManuscriptPath = (
  docId: string,
  sectionId?: string,
  panel?: StudioPanelId
): string => studioPath({ view: 'manuscript', docId, sectionId, panel });

export const studioToolPath = (toolId: StudioToolId): string =>
  studioPath({ view: 'tool', toolId });

/** Invite stays query-scoped so it works from desk or mid-edit. */
export function studioInviteUrl(token: string, baseOrigin?: string): string {
  const path = `${STUDIO_ROOT}?invite=${enc(token)}`;
  if (!baseOrigin) return path;
  return `${baseOrigin.replace(/\/$/, '')}${path}`;
}

/**
 * Parse pathname under /writing-studio.
 * Returns null if path is outside the studio tree.
 */
export function parseStudioPath(pathname: string): StudioRoute | null {
  const raw = pathname.replace(/\/+$/, '') || '/';
  if (raw !== STUDIO_ROOT && !raw.startsWith(`${STUDIO_ROOT}/`)) return null;

  const rest = raw === STUDIO_ROOT ? '' : raw.slice(STUDIO_ROOT.length + 1);
  if (!rest) return { view: 'desk' };

  const parts = rest.split('/').filter(Boolean).map(dec);

  if (parts[0] === 'new') {
    const docType = parts[1];
    if (docType && isDocType(docType)) return { view: 'new', docType };
    return { view: 'new' };
  }

  if (parts[0] === 'tools' && parts[1] && isTool(parts[1])) {
    return { view: 'tool', toolId: parts[1] };
  }

  if (parts[0] === 'm' && parts[1]) {
    const docId = parts[1];
    if (parts[2] === 's' && parts[3]) {
      const sectionId = parts[3];
      const panel = isPanel(parts[4]) ? parts[4] : undefined;
      return { view: 'manuscript', docId, sectionId, panel };
    }
    return { view: 'manuscript', docId };
  }

  if (parts[0] === 'compose' && parts[1]) {
    const templateId = parts[1];
    if (parts[2] === 's' && parts[3]) {
      const sectionId = parts[3];
      const panel = isPanel(parts[4]) ? parts[4] : undefined;
      return { view: 'compose', templateId, sectionId, panel };
    }
    return { view: 'compose', templateId };
  }

  // Unknown under /writing-studio → treat as desk (caller may redirect)
  return { view: 'desk' };
}

export type LegacyStudioQuery = {
  doc?: string;
  section?: string;
  panel?: string;
  flow?: string;
  type?: string;
  template?: string;
  notice?: string;
  invite?: string;
  cite?: string;
  grantId?: string;
};

export function readLegacyStudioQuery(search: string): LegacyStudioQuery {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return {
    doc: q.get('doc') || undefined,
    section: q.get('section') || undefined,
    panel: q.get('panel') || undefined,
    flow: q.get('flow') || undefined,
    type: q.get('type') || undefined,
    template: q.get('template') || undefined,
    notice: q.get('notice') || undefined,
    invite: q.get('invite') || undefined,
    cite: q.get('cite') || undefined,
    grantId: q.get('grantId') || undefined,
  };
}

/**
 * Map legacy ?doc=&flow=&type= query links onto canonical paths.
 * Preserves invite / notice / cite / grantId as query when needed.
 */
export function legacyStudioSearchToLocation(
  pathname: string,
  search: string
): { pathname: string; search: string } | null {
  if (pathname !== STUDIO_ROOT && !pathname.startsWith(`${STUDIO_ROOT}/`)) {
    return null;
  }

  // Already on a structured path — only strip migrated query keys if present
  const alreadyStructured =
    pathname !== STUDIO_ROOT &&
    (pathname.includes('/m/') ||
      pathname.includes('/compose/') ||
      pathname.includes('/tools/') ||
      pathname.includes('/new'));

  const legacy = readLegacyStudioQuery(search);
  const hasMigratable =
    Boolean(legacy.doc) ||
    Boolean(legacy.flow) ||
    Boolean(legacy.type) ||
    Boolean(legacy.template) ||
    Boolean(legacy.section) ||
    Boolean(legacy.panel);

  if (alreadyStructured && !hasMigratable) return null;
  if (!hasMigratable && pathname === STUDIO_ROOT) return null;

  let nextPath = pathname === STUDIO_ROOT ? STUDIO_ROOT : pathname;

  if (legacy.flow === 'generate' || legacy.flow === 'library') {
    nextPath = studioToolPath(legacy.flow);
  } else if (legacy.doc) {
    const panel = isPanel(legacy.panel) ? legacy.panel : undefined;
    nextPath = studioManuscriptPath(legacy.doc, legacy.section, panel);
  } else if (legacy.template) {
    const panel = isPanel(legacy.panel) ? legacy.panel : undefined;
    nextPath = studioComposePath(legacy.template, legacy.section, panel);
  } else if (legacy.type && isDocType(legacy.type)) {
    nextPath = studioNewPath(legacy.type);
  }

  const keep = new URLSearchParams();
  if (legacy.invite) keep.set('invite', legacy.invite);
  if (legacy.notice) keep.set('notice', legacy.notice);
  if (legacy.cite) keep.set('cite', legacy.cite);
  if (legacy.grantId) keep.set('grantId', legacy.grantId);
  // present was a flow — convert to notice
  if (legacy.flow === 'present') keep.set('notice', 'slides');

  const qs = keep.toString();
  const nextSearch = qs ? `?${qs}` : '';

  if (nextPath === pathname && nextSearch === (search.startsWith('?') ? search : search ? `?${search}` : '')) {
    return null;
  }

  return { pathname: nextPath, search: nextSearch };
}

/** Append allowed query keys onto a studio path. */
export function withStudioQuery(
  path: string,
  query: Partial<Pick<LegacyStudioQuery, 'invite' | 'notice' | 'cite' | 'grantId'>>
): string {
  const q = new URLSearchParams();
  if (query.invite) q.set('invite', query.invite);
  if (query.notice) q.set('notice', query.notice);
  if (query.cite) q.set('cite', query.cite);
  if (query.grantId) q.set('grantId', query.grantId);
  const qs = q.toString();
  return qs ? `${path}?${qs}` : path;
}

/** True when the route is the immersive manuscript editor (not desk / new / tools). */
export function isWritingStudioEditorPath(pathname: string): boolean {
  return /^\/writing-studio\/(compose|m)(\/|$)/.test(pathname);
}
