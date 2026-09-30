/**
 * Writing Studio API — documents, templates, AI assist, citation library.
 *
 * NOTE: `writing_citations` is transitional personal library storage.
 * Canonical papers + user_library_items (Evidence & References /api/research)
 * are the shared scholarly spine. DOI adds dual-write into that spine.
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../../database/config.js';
import {
  listWritingTemplates,
  getWritingTemplate,
  emptyWritingDraft,
  WritingDocType,
  WritingDraftContent,
  DOC_TYPE_LABELS,
} from '../../utils/writingTemplates.js';
import { WritingAssistService } from '../services/writing/WritingAssistService.js';
import {
  parseBibtex,
  formatBibliography,
  formatInText,
  normalizeDoi,
  CitationRecord,
} from '../services/writing/citationFormat.js';
import { paperFetchingService } from '../services/doiIntegration.js';
import { PaperRepository } from '../services/scholarly/PaperRepository.js';
import { CitationSupportService } from '../services/scholarly/CitationSupportService.js';
import { WritingCollabService } from '../services/writing/WritingCollabService.js';
import { WritingDraftAnalysisService } from '../services/writing/WritingDraftAnalysisService.js';
import writingCollabRoutes from './writingCollab.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_DIR = path.join(process.cwd(), 'uploads', 'writing-pdfs');
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf') ||
      file.mimetype === 'text/plain';
    cb(null, ok);
  },
});

const router = Router();
router.use(authenticateToken);

const paperToCitation = (paper: any): CitationRecord => {
  const authors = (paper.authors || [])
    .map((a: any) => {
      if (typeof a === 'string') return a.trim();
      if (!a || typeof a !== 'object') return '';
      if (a.name && String(a.name).trim()) return String(a.name).trim();
      const fromParts = [a.lastName, a.firstName].filter(Boolean).join(', ').trim();
      if (fromParts) return fromParts;
      const givenFamily = [a.family, a.given].filter(Boolean).join(', ').trim();
      return givenFamily;
    })
    .filter((name: string) => {
      const n = name.trim();
      if (!n) return false;
      // Drop placeholder author labels from sparse Crossref/OpenAlex records
      return !/^(unknown|anonymous|n\/a|none|null)$/i.test(n);
    });

  const yearRaw = paper.year ?? paper.publicationYear ?? null;
  const year =
    yearRaw != null && Number.isFinite(Number(yearRaw)) ? Number(yearRaw) : null;

  return {
    title: String(paper.title || '').trim() || 'Untitled',
    authors,
    year,
    journal: paper.journal || paper.journalName || null,
    volume: paper.volume || null,
    issue: paper.issue || null,
    pages: paper.pages || null,
    doi: paper.doi ? normalizeDoi(paper.doi) : null,
    url:
      paper.url ||
      paper.sourceUrl ||
      (paper.doi ? `https://doi.org/${normalizeDoi(paper.doi)}` : null),
    abstract: paper.abstract || null,
    sourceType: 'article',
  };
};

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const mapDocument = (row: any) => ({
  id: row.id,
  userId: row.user_id,
  docType: row.doc_type,
  templateId: row.template_id,
  title: row.title,
  status: row.status,
  citationStyle: row.citation_style,
  content: parseJson<WritingDraftContent>(row.content, emptyWritingDraft(row.template_id)),
  metadata: parseJson(row.metadata, {}),
  contentRevision: Number(row.content_revision || 1),
  isShared: Boolean(row.is_shared),
  myRole: row.my_role || (row.user_id ? 'owner' : undefined),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapCitation = (
  row: any
): CitationRecord & { id: string; userId?: string; paperId?: string | null } => {
  const paperId = row.paper_id || row.paperId || null;
  const writingId = row.id;
  return {
    id: paperId || writingId,
    userId: row.user_id,
    title: row.title,
    authors: parseJson<string[]>(row.authors, []),
    year: row.year,
    journal: row.journal,
    volume: row.volume,
    issue: row.issue,
    pages: row.pages,
    doi: row.doi,
    url: row.url,
    abstract: row.abstract,
    citationKey: row.citation_key,
    sourceType: row.source_type,
    rawBibtex: row.raw_bibtex,
    notes: row.notes,
    sourceText: row.source_text || null,
    paperId,
    // Keep writing citation id for source/PDF endpoints that still key on writing_citations
    ...(writingId && paperId && writingId !== paperId
      ? { writingCitationId: writingId }
      : {}),
  } as CitationRecord & {
    id: string;
    userId?: string;
    paperId?: string | null;
    writingCitationId?: string;
  };
};

/** Enrich writing_citations rows with canonical paper_id from user_library_items. */
async function enrichCitationsWithPaperId(
  userId: string,
  rows: any[]
): Promise<any[]> {
  if (!rows?.length) return [];
  const ids = rows.map((r) => r.id).filter(Boolean);
  let paperByWriting: Record<string, string> = {};
  try {
    const linked = await pool.query(
      `SELECT writing_citation_id, paper_id
       FROM user_library_items
       WHERE user_id = $1 AND writing_citation_id IN (${ids.map((_, i) => `$${i + 2}`).join(',')})`,
      [userId, ...ids]
    );
    for (const row of linked.rows || []) {
      if (row.writing_citation_id && row.paper_id) {
        paperByWriting[row.writing_citation_id] = row.paper_id;
      }
    }
  } catch {
    /* library table optional */
  }
  return rows.map((r) => ({
    ...r,
    paper_id: r.paper_id || paperByWriting[r.id] || null,
  }));
}

/**
 * Resolve a writing_citation id from either a writing_citations.id or a papers.id.
 * Creates a writing_citation from the canonical paper when needed.
 */
async function resolveWritingCitationId(
  userId: string,
  idOrPaperId: string
): Promise<{ writingCitationId: string; paperId: string | null; row: any } | null> {
  const asWriting = await pool.query(
    `SELECT * FROM writing_citations WHERE id = $1 AND user_id = $2`,
    [idOrPaperId, userId]
  );
  if (asWriting.rows?.[0]) {
    const enriched = await enrichCitationsWithPaperId(userId, [asWriting.rows[0]]);
    return {
      writingCitationId: asWriting.rows[0].id,
      paperId: enriched[0]?.paper_id || null,
      row: enriched[0],
    };
  }

  // Treat as canonical paper id (Evidence & References library)
  let paper: Awaited<ReturnType<typeof PaperRepository.getById>> = null;
  try {
    paper = await PaperRepository.getById(idOrPaperId);
  } catch {
    paper = null;
  }
  if (!paper) return null;

  // Must be in user's library (or allow attach by creating library link)
  let lib = await pool.query(
    `SELECT id, writing_citation_id FROM user_library_items
     WHERE user_id = $1 AND paper_id = $2 LIMIT 1`,
    [userId, paper.id]
  );
  if (!lib.rows?.[0]) {
    try {
      await PaperRepository.addToLibrary(userId, paper.id, {});
      lib = await pool.query(
        `SELECT id, writing_citation_id FROM user_library_items
         WHERE user_id = $1 AND paper_id = $2 LIMIT 1`,
        [userId, paper.id]
      );
    } catch {
      /* continue — still allow creating writing citation */
    }
  }

  if (lib.rows?.[0]?.writing_citation_id) {
    const existing = await pool.query(
      `SELECT * FROM writing_citations WHERE id = $1 AND user_id = $2`,
      [lib.rows[0].writing_citation_id, userId]
    );
    if (existing.rows?.[0]) {
      return {
        writingCitationId: existing.rows[0].id,
        paperId: paper.id,
        row: { ...existing.rows[0], paper_id: paper.id },
      };
    }
  }

  // Match by DOI to an existing writing citation
  if (paper.doi) {
    const byDoi = await pool.query(
      `SELECT * FROM writing_citations
       WHERE user_id = $1 AND LOWER(doi) = LOWER($2)
       LIMIT 1`,
      [userId, paper.doi]
    );
    if (byDoi.rows?.[0]) {
      try {
        await pool.query(
          `UPDATE user_library_items
           SET writing_citation_id = $1, updated_at = NOW()
           WHERE user_id = $2 AND paper_id = $3`,
          [byDoi.rows[0].id, userId, paper.id]
        );
      } catch {
        /* ignore */
      }
      return {
        writingCitationId: byDoi.rows[0].id,
        paperId: paper.id,
        row: { ...byDoi.rows[0], paper_id: paper.id },
      };
    }
  }

  const writingId = crypto.randomUUID();
  const authors = (paper.authors || [])
    .map((a) => (typeof a === 'string' ? a : a.name || ''))
    .map((n) => n.trim())
    .filter((n) => n && !/^(unknown|anonymous)$/i.test(n));
  await pool.query(
    `INSERT INTO writing_citations
     (id, user_id, title, authors, year, journal, volume, issue, pages, doi, url, abstract, source_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'article')`,
    [
      writingId,
      userId,
      paper.title,
      JSON.stringify(authors),
      paper.publicationYear || null,
      paper.journalName || null,
      paper.volume || null,
      paper.issue || null,
      paper.pages || null,
      paper.doi || null,
      paper.sourceUrl || paper.openAccessUrl || null,
      paper.abstract || null,
    ]
  );
  try {
    await pool.query(
      `UPDATE user_library_items
       SET writing_citation_id = $1, updated_at = NOW()
       WHERE user_id = $2 AND paper_id = $3`,
      [writingId, userId, paper.id]
    );
  } catch {
    /* ignore */
  }
  const row = await pool.query(`SELECT * FROM writing_citations WHERE id = $1`, [writingId]);
  return {
    writingCitationId: writingId,
    paperId: paper.id,
    row: { ...row.rows[0], paper_id: paper.id },
  };
}

// Write Together: /documents/:id/collaborators|invitations|presence|locks|events
router.use('/documents/:id', writingCollabRoutes);

/** GET /api/writing/invitations/:token — preview invite (auth required) */
router.get('/invitations/:token', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const invite = await WritingCollabService.getInvitationByToken(req.params.token);
    if (!invite) return res.status(404).json({ error: 'Invitation not found' });
    res.json({ success: true, invitation: invite });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to load invitation' });
  }
});

/** POST /api/writing/invitations/:token/accept */
router.post('/invitations/:token/accept', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const result = await WritingCollabService.acceptInvitation(
      req.params.token,
      req.user.id,
      req.user.email
    );
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Could not accept invitation' });
  }
});

/** GET /api/writing/templates */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const docType = req.query.docType as WritingDocType | undefined;
    const templates = listWritingTemplates(docType);
    res.json({
      success: true,
      docTypes: DOC_TYPE_LABELS,
      templates: templates.map((t) => ({
        id: t.id,
        docType: t.docType,
        name: t.name,
        shortName: t.shortName,
        region: t.region,
        description: t.description,
        standards: t.standards,
        evaluationCriteria: t.evaluationCriteria,
        tips: t.tips,
        officialNotes: t.officialNotes,
        defaultCitationStyle: t.defaultCitationStyle,
        wordLimit: t.wordLimit,
        pageLimit: t.pageLimit,
        sectionCount: t.sections.length,
        primaryAgent: t.primaryAgent,
        sections: t.sections,
      })),
    });
  } catch (error: any) {
    console.error('writing templates error:', error);
    res.status(500).json({ error: error.message || 'Failed to list templates' });
  }
});

/** GET /api/writing/templates/:id */
router.get('/templates/:id', async (req: Request, res: Response) => {
  const template = getWritingTemplate(req.params.id);
  res.json({ success: true, template });
});

/** GET /api/writing/documents */
router.get('/documents', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const docType = req.query.docType as string | undefined;
    const params: any[] = [req.user.id];
    let sql = `
      SELECT d.*,
        CASE WHEN d.user_id = $1 THEN 0 ELSE 1 END AS is_shared,
        CASE WHEN d.user_id = $1 THEN 'owner' ELSE COALESCE(c.role, 'viewer') END AS my_role
      FROM writing_documents d
      LEFT JOIN writing_collaborators c
        ON c.document_id = d.id AND c.user_id = $1 AND c.status = 'active'
      WHERE d.user_id = $1 OR c.id IS NOT NULL`;
    if (docType) {
      sql += ` AND d.doc_type = $2`;
      params.push(docType);
    }
    sql += ` ORDER BY d.updated_at DESC LIMIT 100`;
    const result = await pool.query(sql, params);
    res.json({ success: true, documents: (result.rows || []).map(mapDocument) });
  } catch (error: any) {
    console.error('writing documents list error:', error);
    const missing = /doesn't exist|ER_NO_SUCH_TABLE/i.test(error.message || '');
    res.status(500).json({
      error: missing
        ? 'Writing Studio tables missing. Run: pnpm run db:migrate'
        : error.message || 'Failed to list documents',
    });
  }
});

/** GET /api/writing/documents/:id */
router.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const access = await WritingCollabService.resolveAccess(req.params.id, req.user.id);
    if (!access) return res.status(404).json({ error: 'Document not found' });

    const result = await pool.query(`SELECT * FROM writing_documents WHERE id = $1`, [
      req.params.id,
    ]);
    const row = result.rows?.[0];
    if (!row) return res.status(404).json({ error: 'Document not found' });

    try {
      await WritingCollabService.ensureOwnerCollaborator(req.params.id, row.user_id);
    } catch { /* optional */ }

    const cites = await pool.query(
      `SELECT c.* FROM writing_citations c
       INNER JOIN writing_document_citations dc ON dc.citation_id = c.id
       WHERE dc.document_id = $1
       ORDER BY dc.sort_order ASC, c.year DESC`,
      [req.params.id]
    );
    const enriched = await enrichCitationsWithPaperId(req.user.id, cites.rows || []);

    res.json({
      success: true,
      document: mapDocument({
        ...row,
        is_shared: !access.isOwner,
        my_role: access.role,
      }),
      access,
      citations: enriched.map(mapCitation),
    });
  } catch (error: any) {
    console.error('writing document get error:', error);
    res.status(500).json({ error: error.message || 'Failed to load document' });
  }
});

/** POST /api/writing/documents */
router.post('/documents', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const templateId = String(req.body.templateId || 'paper_imrad_journal');
    const template = getWritingTemplate(templateId);
    const content: WritingDraftContent =
      req.body.content && typeof req.body.content === 'object'
        ? { ...emptyWritingDraft(templateId), ...req.body.content, templateId, docType: template.docType }
        : emptyWritingDraft(templateId);

    if (req.body.title) content.title = String(req.body.title);

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO writing_documents
       (id, user_id, doc_type, template_id, title, status, citation_style, content, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        req.user.id,
        template.docType,
        template.id,
        content.title || 'Untitled',
        req.body.status || 'draft',
        content.citationStyle || template.defaultCitationStyle,
        JSON.stringify(content),
        JSON.stringify(req.body.metadata || {}),
      ]
    );

    try {
      await WritingCollabService.ensureOwnerCollaborator(id, req.user.id);
    } catch { /* collab tables optional until migrate */ }

    const result = await pool.query(`SELECT * FROM writing_documents WHERE id = $1`, [id]);
    res.status(201).json({ success: true, document: mapDocument(result.rows[0]) });
  } catch (error: any) {
    console.error('writing document create error:', error);
    res.status(500).json({ error: error.message || 'Failed to create document' });
  }
});

/** PUT /api/writing/documents/:id */
router.put('/documents/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const access = await WritingCollabService.resolveAccess(req.params.id, req.user.id);
    if (!access) return res.status(404).json({ error: 'Document not found' });
    if (!access.canEdit) return res.status(403).json({ error: 'Read-only access' });

    const existing = await pool.query(`SELECT * FROM writing_documents WHERE id = $1`, [
      req.params.id,
    ]);
    if (!existing.rows?.[0]) return res.status(404).json({ error: 'Document not found' });

    const prev = mapDocument(existing.rows[0]);
    let content: WritingDraftContent =
      req.body.content && typeof req.body.content === 'object'
        ? { ...prev.content, ...req.body.content }
        : prev.content;

    content = WritingCollabService.filterContentForWrite(access, prev.content, content);

    const fullAccess = access.isOwner || access.accessScope === 'entire';
    const title = fullAccess
      ? req.body.title != null
        ? String(req.body.title)
        : content.title || prev.title
      : prev.title;
    content.title = title;
    const status = fullAccess ? req.body.status || prev.status : prev.status;
    const citationStyle = fullAccess
      ? req.body.citationStyle || content.citationStyle || prev.citationStyle
      : prev.citationStyle;
    content.citationStyle = citationStyle as any;

    await pool.query(
      `UPDATE writing_documents SET
         title = $1,
         status = $2,
         citation_style = $3,
         template_id = $4,
         doc_type = $5,
         content = $6,
         metadata = $7,
         content_revision = COALESCE(content_revision, 1) + 1,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [
        title,
        status,
        citationStyle,
        content.templateId || prev.templateId,
        content.docType || prev.docType,
        JSON.stringify(content),
        JSON.stringify(fullAccess ? req.body.metadata ?? prev.metadata ?? {} : prev.metadata ?? {}),
        req.params.id,
      ]
    );

    const result = await pool.query(`SELECT * FROM writing_documents WHERE id = $1`, [
      req.params.id,
    ]);
    WritingCollabService.emit(req.params.id, {
      type: 'revision',
      revision: Number(result.rows[0]?.content_revision || 1),
      userId: req.user.id,
    });
    res.json({ success: true, document: mapDocument(result.rows[0]), access });
  } catch (error: any) {
    console.error('writing document update error:', error);
    res.status(500).json({ error: error.message || 'Failed to update document' });
  }
});

/** DELETE /api/writing/documents/:id */
router.delete('/documents/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const access = await WritingCollabService.resolveAccess(req.params.id, req.user.id);
    if (!access?.isOwner) {
      return res.status(403).json({ error: 'Only the main author can delete this document' });
    }
    await pool.query(`DELETE FROM writing_document_citations WHERE document_id = $1`, [
      req.params.id,
    ]);
    try {
      await pool.query(`DELETE FROM writing_collaborators WHERE document_id = $1`, [req.params.id]);
      await pool.query(`DELETE FROM writing_invitations WHERE document_id = $1`, [req.params.id]);
      await pool.query(`DELETE FROM writing_section_locks WHERE document_id = $1`, [req.params.id]);
      await pool.query(`DELETE FROM writing_presence WHERE document_id = $1`, [req.params.id]);
    } catch { /* tables may not exist */ }
    await pool.query(`DELETE FROM writing_documents WHERE id = $1 AND user_id = $2`, [
      req.params.id,
      req.user.id,
    ]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('writing document delete error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete document' });
  }
});

/** POST /api/writing/documents/:id/assist */
router.post('/documents/:id/assist', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const access = await WritingCollabService.resolveAccess(req.params.id, req.user.id);
    if (!access) return res.status(404).json({ error: 'Document not found' });
    if (!access.canEdit) return res.status(403).json({ error: 'Edit access required for AI assist' });

    const existing = await pool.query(`SELECT * FROM writing_documents WHERE id = $1`, [
      req.params.id,
    ]);
    if (!existing.rows?.[0]) return res.status(404).json({ error: 'Document not found' });

    const doc = mapDocument(existing.rows[0]);
    const draft: WritingDraftContent =
      req.body.draft && typeof req.body.draft === 'object'
        ? { ...doc.content, ...req.body.draft }
        : doc.content;

    if (req.body.sectionId && !WritingCollabService.canEditSection(access, String(req.body.sectionId))) {
      return res.status(403).json({ error: 'You cannot edit this section' });
    }

    const mode = (req.body.mode || 'section') as
      | 'section'
      | 'full'
      | 'citations'
      | 'continue';
    const result = await WritingAssistService.assist({
      userId: req.user.id,
      userRole: req.user.role,
      draft,
      mode,
      sectionId: req.body.sectionId,
      instruction: req.body.instruction,
      groundedSources: Array.isArray(req.body.groundedSources)
        ? req.body.groundedSources
        : undefined,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Assist failed' });
    }

    res.json({
      success: true,
      agentType: result.agentType,
      sectionUpdates: result.sectionUpdates || [],
      continuedText: result.continuedText,
      content: result.content,
      bibliography: result.bibliography,
    });
  } catch (error: any) {
    console.error('writing assist error:', error);
    res.status(500).json({ error: error.message || 'Assist failed' });
  }
});

/** POST /api/writing/documents/:id/analyze — pre-submission academic checklist */
router.post('/documents/:id/analyze', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const access = await WritingCollabService.resolveAccess(req.params.id, req.user.id);
    if (!access) return res.status(404).json({ error: 'Document not found' });

    const existing = await pool.query(`SELECT * FROM writing_documents WHERE id = $1`, [
      req.params.id,
    ]);
    if (!existing.rows?.[0]) return res.status(404).json({ error: 'Document not found' });
    const doc = mapDocument(existing.rows[0]);
    const draft: WritingDraftContent =
      req.body.draft && typeof req.body.draft === 'object'
        ? { ...doc.content, ...req.body.draft }
        : doc.content;

    const cites = await pool.query(
      `SELECT COUNT(*) AS cnt FROM writing_document_citations WHERE document_id = $1`,
      [req.params.id]
    );
    const citationCount = Number(cites.rows?.[0]?.cnt || 0);

    const analysis = await WritingDraftAnalysisService.analyze({
      userId: req.user.id,
      userRole: req.user.role,
      draft,
      citationCount,
      bibliography: req.body.bibliography || undefined,
      enrichWithAi: Boolean(req.body.enrichWithAi),
    });

    res.json({ success: true, analysis });
  } catch (error: any) {
    console.error('writing analyze error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

/** POST /api/writing/analyze — analyze unsaved draft body */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const draft = req.body.draft as WritingDraftContent;
    if (!draft?.templateId) {
      return res.status(400).json({ error: 'draft.templateId is required' });
    }
    const analysis = await WritingDraftAnalysisService.analyze({
      userId: req.user.id,
      userRole: req.user.role,
      draft,
      citationCount: Number(req.body.citationCount || 0),
      bibliography: req.body.bibliography || undefined,
      enrichWithAi: Boolean(req.body.enrichWithAi),
    });
    res.json({ success: true, analysis });
  } catch (error: any) {
    console.error('writing analyze error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

/** POST /api/writing/assist — ephemeral assist without saved document */
router.post('/assist', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const draft = req.body.draft as WritingDraftContent;
    if (!draft?.templateId) {
      return res.status(400).json({ error: 'draft.templateId is required' });
    }
    const result = await WritingAssistService.assist({
      userId: req.user.id,
      userRole: req.user.role,
      draft,
      mode: req.body.mode || 'section',
      sectionId: req.body.sectionId,
      instruction: req.body.instruction,
      groundedSources: Array.isArray(req.body.groundedSources)
        ? req.body.groundedSources
        : undefined,
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Assist failed' });
    }
    res.json({
      success: true,
      agentType: result.agentType,
      sectionUpdates: result.sectionUpdates || [],
      continuedText: result.continuedText,
      content: result.content,
      bibliography: result.bibliography,
    });
  } catch (error: any) {
    console.error('writing assist error:', error);
    res.status(500).json({ error: error.message || 'Assist failed' });
  }
});

/** GET /api/writing/citations */
router.get('/citations', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const q = String(req.query.q || '').trim();
    const params: any[] = [req.user.id];
    let sql = `SELECT * FROM writing_citations WHERE user_id = $1`;
    if (q) {
      sql += ` AND (title LIKE $2 OR doi LIKE $2 OR citation_key LIKE $2)`;
      params.push(`%${q}%`);
    }
    sql += ` ORDER BY updated_at DESC LIMIT 200`;
    const result = await pool.query(sql, params);
    const enriched = await enrichCitationsWithPaperId(req.user.id, result.rows || []);
    res.json({ success: true, citations: enriched.map(mapCitation) });
  } catch (error: any) {
    console.error('citations list error:', error);
    res.status(500).json({ error: error.message || 'Failed to list citations' });
  }
});

/** POST /api/writing/citations */
router.post('/citations', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ error: 'title is required' });

    const id = crypto.randomUUID();
    const authors = Array.isArray(req.body.authors)
      ? req.body.authors
      : String(req.body.authors || '')
          .split(/;|,/)
          .map((s: string) => s.trim())
          .filter(Boolean);

    await pool.query(
      `INSERT INTO writing_citations
       (id, user_id, title, authors, year, journal, volume, issue, pages, doi, url, abstract,
        citation_key, source_type, raw_bibtex, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        id,
        req.user.id,
        title,
        JSON.stringify(authors),
        req.body.year ? Number(req.body.year) : null,
        req.body.journal || null,
        req.body.volume || null,
        req.body.issue || null,
        req.body.pages || null,
        req.body.doi || null,
        req.body.url || null,
        req.body.abstract || null,
        req.body.citationKey || null,
        req.body.sourceType || 'article',
        req.body.rawBibtex || null,
        req.body.notes || null,
      ]
    );

    if (req.body.documentId) {
      await pool.query(
        `INSERT IGNORE INTO writing_document_citations (document_id, citation_id, sort_order)
         VALUES ($1, $2, $3)`,
        [req.body.documentId, id, req.body.sortOrder || 0]
      );
    }

    let paperId: string | null = req.body.paperId ? String(req.body.paperId) : null;
    if (paperId) {
      try {
        await PaperRepository.addToLibrary(req.user.id, paperId, {});
        await pool.query(
          `UPDATE user_library_items
           SET writing_citation_id = $1, updated_at = NOW()
           WHERE user_id = $2 AND paper_id = $3`,
          [id, req.user.id, paperId]
        );
      } catch (e) {
        console.warn('paperId link skipped:', (e as Error).message);
        paperId = null;
      }
    } else if (req.body.doi) {
      try {
        const stored = await PaperRepository.upsert({
          title,
          authors: authors.map((name: string) => ({ name })),
          publicationYear: req.body.year ? Number(req.body.year) : undefined,
          journalName: req.body.journal || undefined,
          doi: req.body.doi || undefined,
          sourceUrl: req.body.url || undefined,
          abstract: req.body.abstract || undefined,
          metadataSource: 'writing_manual',
        });
        paperId = stored.id;
        await PaperRepository.addToLibrary(req.user.id, stored.id, {});
        await pool.query(
          `UPDATE user_library_items
           SET writing_citation_id = $1, updated_at = NOW()
           WHERE user_id = $2 AND paper_id = $3`,
          [id, req.user.id, stored.id]
        );
      } catch {
        /* optional */
      }
    }

    const result = await pool.query(`SELECT * FROM writing_citations WHERE id = $1`, [id]);
    res.status(201).json({
      success: true,
      citation: mapCitation({ ...result.rows[0], paper_id: paperId }),
    });
  } catch (error: any) {
    console.error('citation create error:', error);
    res.status(500).json({ error: error.message || 'Failed to create citation' });
  }
});

/** POST /api/writing/citations/import-bibtex */
router.post('/citations/import-bibtex', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const bibtex = String(req.body.bibtex || '');
    const parsed = parseBibtex(bibtex);
    if (parsed.length === 0) {
      return res.status(400).json({ error: 'No BibTeX entries found' });
    }

    const created: any[] = [];
    for (const item of parsed) {
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO writing_citations
         (id, user_id, title, authors, year, journal, volume, issue, pages, doi, url, abstract,
          citation_key, source_type, raw_bibtex)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          id,
          req.user.id,
          item.title,
          JSON.stringify(item.authors || []),
          item.year || null,
          item.journal || null,
          item.volume || null,
          item.issue || null,
          item.pages || null,
          item.doi || null,
          item.url || null,
          item.abstract || null,
          item.citationKey || null,
          item.sourceType || 'article',
          item.rawBibtex || bibtex,
        ]
      );
      if (req.body.documentId) {
        await pool.query(
          `INSERT IGNORE INTO writing_document_citations (document_id, citation_id)
           VALUES ($1, $2)`,
          [req.body.documentId, id]
        );
      }
      const row = await pool.query(`SELECT * FROM writing_citations WHERE id = $1`, [id]);
      created.push(mapCitation(row.rows[0]));
    }

    res.status(201).json({ success: true, count: created.length, citations: created });
  } catch (error: any) {
    console.error('bibtex import error:', error);
    res.status(500).json({ error: error.message || 'BibTeX import failed' });
  }
});

/** POST /api/writing/citations/:id/attach — id may be writing_citations.id OR papers.id */
router.post('/citations/:id/attach', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const documentId = String(req.body.documentId || '');
    if (!documentId) return res.status(400).json({ error: 'documentId required' });

    const resolved = await resolveWritingCitationId(req.user.id, req.params.id);
    if (!resolved) {
      return res.status(404).json({
        error: 'Citation not found in your library. Import the paper first.',
      });
    }

    const doc = await pool.query(
      `SELECT id FROM writing_documents WHERE id = $1 AND user_id = $2`,
      [documentId, req.user.id]
    );
    if (!doc.rows?.[0]) {
      const access = await WritingCollabService.resolveAccess(documentId, req.user.id);
      if (!access?.canEdit) {
        return res.status(404).json({ error: 'Document not found' });
      }
    }

    await pool.query(
      `INSERT IGNORE INTO writing_document_citations (document_id, citation_id, sort_order)
       VALUES ($1, $2, $3)`,
      [documentId, resolved.writingCitationId, req.body.sortOrder || 0]
    );

    const citation = mapCitation(resolved.row);
    res.json({
      success: true,
      citation,
      writingCitationId: resolved.writingCitationId,
      paperId: resolved.paperId,
    });
  } catch (error: any) {
    console.error('citation attach error:', error);
    res.status(500).json({ error: error.message || 'Attach failed' });
  }
});

/** GET /api/writing/lookup?q=DOI|PMID|title */
router.get('/lookup', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 3) {
      return res.status(400).json({ error: 'Query q must be at least 3 characters' });
    }
    const paper = await paperFetchingService.fetchPaper(q);
    if (!paper) {
      return res.status(404).json({ error: 'No paper found for that identifier or query' });
    }
    res.json({ success: true, paper, citation: paperToCitation(paper) });
  } catch (error: any) {
    console.error('writing lookup error:', error);
    res.status(500).json({ error: error.message || 'Lookup failed' });
  }
});

/** GET /api/writing/search?q=&limit= */
router.get('/search', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 3) {
      return res.status(400).json({ error: 'Query q must be at least 3 characters' });
    }
    const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit || '8'), 10) || 8));
    const papers = await paperFetchingService.searchAcrossAll(q, limit);
    res.json({
      success: true,
      results: papers.map((p) => ({ paper: p, citation: paperToCitation(p) })),
    });
  } catch (error: any) {
    console.error('writing search error:', error);
    res.status(500).json({ error: error.message || 'Search failed' });
  }
});

/** POST /api/writing/citations/from-doi — fetch metadata and save to library */
router.post('/citations/from-doi', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const identifier = String(req.body.doi || req.body.query || '').trim();
    if (!identifier) return res.status(400).json({ error: 'doi or query is required' });

    const paper = await paperFetchingService.fetchPaper(identifier);
    if (!paper?.title) {
      const looksLikeUrl = /^https?:\/\//i.test(identifier);
      return res.status(404).json({
        error: looksLikeUrl
          ? 'Could not find a DOI/PMID in that link. Paste a DOI (10.…), PubMed URL, doi.org link, or search by paper title instead.'
          : 'Could not resolve paper metadata. Try a DOI, PubMed ID, or a clearer paper title.',
      });
    }
    const meta = paperToCitation(paper);
    const id = crypto.randomUUID();

    await pool.query(
      `INSERT INTO writing_citations
       (id, user_id, title, authors, year, journal, volume, issue, pages, doi, url, abstract,
        citation_key, source_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        id,
        req.user.id,
        meta.title,
        JSON.stringify(meta.authors || []),
        meta.year || null,
        meta.journal || null,
        meta.volume || null,
        meta.issue || null,
        meta.pages || null,
        meta.doi || null,
        meta.url || null,
        meta.abstract || null,
        meta.citationKey || null,
        'article',
      ]
    );

    if (req.body.documentId) {
      await pool.query(
        `INSERT IGNORE INTO writing_document_citations (document_id, citation_id)
         VALUES ($1, $2)`,
        [req.body.documentId, id]
      );
    }

    // Dual-write into canonical papers spine for structural {{cite:paperId}}
    let paperId: string | null = null;
    try {
      const stored = await PaperRepository.upsert({
        title: meta.title,
        authors: (meta.authors || []).map((name) => ({ name })),
        publicationYear: meta.year || undefined,
        journalName: meta.journal || undefined,
        volume: meta.volume || undefined,
        issue: meta.issue || undefined,
        pages: meta.pages || undefined,
        doi: meta.doi || undefined,
        sourceUrl: meta.url || undefined,
        abstract: meta.abstract || undefined,
        metadataSource: 'writing_from_doi',
      });
      paperId = stored.id;
      await PaperRepository.addToLibrary(req.user.id, stored.id, {
        notes: undefined,
      });
      await pool.query(
        `UPDATE user_library_items SET writing_citation_id = $1, updated_at = NOW()
         WHERE user_id = $2 AND paper_id = $3`,
        [id, req.user.id, stored.id]
      );
    } catch (e) {
      console.warn('canonical dual-write skipped:', (e as Error).message);
    }

    const row = await pool.query(`SELECT * FROM writing_citations WHERE id = $1`, [id]);
    const citation = { ...mapCitation(row.rows[0]), paperId, id: paperId || id };
    res.status(201).json({ success: true, citation, writingCitationId: id, paperId });
  } catch (error: any) {
    console.error('from-doi error:', error);
    res.status(500).json({ error: error.message || 'Failed to add from DOI' });
  }
});

/** PATCH /api/writing/citations/:id/source — attach pasted source notes for grounding */
router.patch('/citations/:id/source', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const resolved = await resolveWritingCitationId(req.user.id, req.params.id);
    if (!resolved) return res.status(404).json({ error: 'Citation not found' });
    const sourceText = String(req.body.sourceText || '').slice(0, 200_000);
    await pool.query(
      `UPDATE writing_citations SET source_text = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3`,
      [sourceText || null, resolved.writingCitationId, req.user.id]
    );
    const row = await pool.query(
      `SELECT * FROM writing_citations WHERE id = $1 AND user_id = $2`,
      [resolved.writingCitationId, req.user.id]
    );
    if (!row.rows?.[0]) return res.status(404).json({ error: 'Citation not found' });
    res.json({
      success: true,
      citation: mapCitation({ ...row.rows[0], paper_id: resolved.paperId }),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save source text' });
  }
});

/** POST /api/writing/citations/:id/pdf — upload PDF or text file for grounding */
router.post('/citations/:id/pdf', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const resolved = await resolveWritingCitationId(req.user.id, req.params.id);
    if (!resolved) return res.status(404).json({ error: 'Citation not found' });
    const writingId = resolved.writingCitationId;

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file?.buffer) return res.status(400).json({ error: 'file is required' });

    let sourceText = '';
    const isPdf =
      file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      try {
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
        const parsed = await pdfParse(file.buffer);
        sourceText = (parsed.text || '').slice(0, 200_000);
      } catch (e: any) {
        return res.status(400).json({
          error: `PDF text extraction failed: ${e?.message || 'unknown error'}. You can paste source notes instead.`,
        });
      }
    } else {
      sourceText = file.buffer.toString('utf8').slice(0, 200_000);
    }

    const safeId = String(writingId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    if (!safeId) return res.status(400).json({ error: 'Invalid citation id' });
    const filename = `${safeId}-${Date.now()}${isPdf ? '.pdf' : '.txt'}`;
    const dest = path.resolve(PDF_DIR, filename);
    if (!dest.startsWith(path.resolve(PDF_DIR) + path.sep)) {
      return res.status(400).json({ error: 'Invalid upload path' });
    }
    fs.writeFileSync(dest, file.buffer);
    const relPath = path.posix.join('uploads', 'writing-pdfs', filename);

    await pool.query(
      `UPDATE writing_citations SET source_text = $1, pdf_path = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4`,
      [sourceText || null, relPath, writingId, req.user.id]
    );

    const row = await pool.query(`SELECT * FROM writing_citations WHERE id = $1`, [writingId]);
    res.json({
      success: true,
      citation: mapCitation({ ...row.rows[0], paper_id: resolved.paperId }),
      extractedChars: sourceText.length,
    });
  } catch (error: any) {
    console.error('pdf upload error:', error);
    res.status(500).json({ error: error.message || 'PDF upload failed' });
  }
});

/** DELETE /api/writing/citations/:id — id may be writing_citations.id OR papers.id */
router.delete('/citations/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const rawId = String(req.params.id || '').trim();
    if (!rawId) return res.status(400).json({ error: 'id required' });

    const documentId = String(
      req.query.documentId || (req.body && req.body.documentId) || ''
    ).trim();
    const fromLibraryFlag = String(
      req.query.fromLibrary ?? (req.body && req.body.fromLibrary) ?? ''
    ).toLowerCase();
    // With documentId and without fromLibrary=true → detach from draft only
    const detachOnly = Boolean(documentId) && fromLibraryFlag !== 'true';

    // Read-only resolve (never create citations on delete)
    let writingId: string | null = null;
    let paperId: string | null = null;

    const asWriting = await pool.query(
      `SELECT id FROM writing_citations WHERE id = $1 AND user_id = $2`,
      [rawId, req.user.id]
    );
    if (asWriting.rows?.[0]) {
      writingId = asWriting.rows[0].id;
      try {
        const linked = await pool.query(
          `SELECT paper_id FROM user_library_items
           WHERE user_id = $1 AND writing_citation_id = $2 LIMIT 1`,
          [req.user.id, writingId]
        );
        paperId = linked.rows?.[0]?.paper_id || null;
      } catch {
        /* optional */
      }
    } else {
      // Treat as paper id
      paperId = rawId;
      try {
        const linked = await pool.query(
          `SELECT writing_citation_id FROM user_library_items
           WHERE user_id = $1 AND paper_id = $2 LIMIT 1`,
          [req.user.id, rawId]
        );
        writingId = linked.rows?.[0]?.writing_citation_id || null;
      } catch {
        /* optional */
      }
      if (!writingId) {
        // Fallback: writing citation stored under same id, or DOI match later skipped
        const maybe = await pool.query(
          `SELECT id FROM writing_citations WHERE id = $1 AND user_id = $2`,
          [rawId, req.user.id]
        );
        writingId = maybe.rows?.[0]?.id || null;
      }
    }

    if (detachOnly) {
      if (writingId) {
        await pool.query(
          `DELETE FROM writing_document_citations
           WHERE document_id = $1 AND citation_id = $2`,
          [documentId, writingId]
        );
      }
      return res.json({
        success: true,
        detached: true,
        writingCitationId: writingId,
        paperId,
      });
    }

    if (writingId) {
      await pool.query(`DELETE FROM writing_document_citations WHERE citation_id = $1`, [
        writingId,
      ]);
      await pool.query(`DELETE FROM writing_citations WHERE id = $1 AND user_id = $2`, [
        writingId,
        req.user.id,
      ]);
    }

    const libraryPaperId = paperId || rawId;
    try {
      await pool.query(
        `DELETE FROM user_library_items WHERE user_id = $1 AND paper_id = $2`,
        [req.user.id, libraryPaperId]
      );
    } catch {
      /* optional */
    }

    res.json({
      success: true,
      removed: true,
      writingCitationId: writingId,
      paperId: libraryPaperId,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Delete failed' });
  }
});

/** POST /api/writing/citations/format */
router.post('/citations/format', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const style = String(req.body.style || 'APA');
    let citations: CitationRecord[] = [];

    if (Array.isArray(req.body.citationIds) && req.body.citationIds.length) {
      const ids = (req.body.citationIds as unknown[])
        .map((id) => String(id))
        .filter((id) => /^[a-zA-Z0-9_-]{8,64}$/.test(id))
        .slice(0, 200);
      if (ids.length === 0) {
        return res.status(400).json({ error: 'No valid citationIds' });
      }
      const result = await pool.query(
        `SELECT * FROM writing_citations WHERE user_id = $1`,
        [req.user.id]
      );
      const idSet = new Set(ids);
      citations = (result.rows || [])
        .map(mapCitation)
        .filter((c) => c.id && idSet.has(c.id));
    } else if (req.body.documentId) {
      const result = await pool.query(
        `SELECT c.* FROM writing_citations c
         INNER JOIN writing_document_citations dc ON dc.citation_id = c.id
         WHERE dc.document_id = $1 AND c.user_id = $2
         ORDER BY dc.sort_order ASC`,
        [req.body.documentId, req.user.id]
      );
      citations = (result.rows || []).map(mapCitation);
    }

    const bibliography = citations
      .map((c, i) => formatBibliography(c, style))
      .join('\n\n');
    const inText = citations.map((c, i) => ({
      id: (c as any).id,
      inText: formatInText(c, style, i),
      bibliography: formatBibliography(c, style),
    }));

    res.json({ success: true, style, bibliography, citations: inText });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Format failed' });
  }
});

/** POST /api/writing/citations/suggest — select a claim → accurate supporting refs */
router.post('/citations/suggest', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const claim = String(req.body.claim || req.body.text || '').trim();
    if (claim.length < 12) {
      return res.status(400).json({
        error: 'Select a fuller sentence (at least ~12 characters) to find a citation.',
      });
    }
    const excludePaperIds = Array.isArray(req.body.excludePaperIds)
      ? req.body.excludePaperIds.map(String)
      : Array.isArray(req.body.citedPaperIds)
        ? req.body.citedPaperIds.map(String)
        : [];
    const result = await CitationSupportService.suggestForClaim({
      userId: req.user.id,
      claim,
      excludePaperIds,
      webLimit: Number(req.body.limit || 10),
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('citation suggest error:', error);
    res.status(500).json({ error: error.message || 'Citation suggest failed' });
  }
});

/** POST /api/writing/citations/verify — reviewer check of cited papers vs claim */
router.post('/citations/verify', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const claim = String(req.body.claim || req.body.text || '').trim();
    const paperIds: string[] = Array.isArray(req.body.paperIds)
      ? req.body.paperIds.map(String)
      : [];
    if (claim.length < 12 || !paperIds.length) {
      return res.status(400).json({
        error: 'Provide the claim text and at least one paperId to verify.',
      });
    }
    const result = await CitationSupportService.verifyCitations({
      userId: req.user.id,
      claim,
      paperIds,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('citation verify error:', error);
    res.status(500).json({ error: error.message || 'Citation verify failed' });
  }
});

export default router;
