/**
 * Paper repository — upsert/dedupe canonical papers + user library.
 */

import crypto from 'crypto';
import pool from '../../../database/config.js';
import {
  CanonicalPaper,
  normalizeDoi,
  normalizeTitle,
  firstAuthorKey,
  mergeCanonical,
  authorsToStrings,
} from './types.js';

const parseJson = <T>(v: unknown, fallback: T): T => {
  if (v == null) return fallback;
  if (typeof v === 'object') return v as T;
  try {
    return JSON.parse(String(v)) as T;
  } catch {
    return fallback;
  }
};

export function rowToPaper(row: any): CanonicalPaper & { id: string } {
  const authorsRaw = parseJson<any[]>(row.authors, []);
  const authors = authorsRaw.map((a) =>
    typeof a === 'string' ? { name: a } : { name: a.name || 'Unknown', orcid: a.orcid, affiliation: a.affiliation }
  );
  return {
    id: row.id,
    title: row.title,
    abstract: row.abstract,
    publicationType: row.publication_type,
    publicationYear: row.publication_year,
    publicationDate: row.publication_date,
    doi: row.doi,
    pmid: row.pmid,
    pmcid: row.pmcid,
    openalexId: row.openalex_id,
    semanticScholarId: row.semantic_scholar_id,
    journalName: row.journal_name,
    journalIssn: row.journal_issn,
    publisher: row.publisher,
    volume: row.volume,
    issue: row.issue,
    pages: row.pages,
    authors,
    affiliations: parseJson(row.affiliations, []),
    keywords: parseJson(row.keywords, []),
    meshTerms: parseJson(row.mesh_terms, []),
    topics: parseJson(row.topics, []),
    citationCount: row.citation_count,
    isOpenAccess: Boolean(row.is_open_access),
    openAccessStatus: row.open_access_status,
    openAccessUrl: row.open_access_url,
    pdfUrl: row.pdf_url,
    sourceUrl: row.source_url,
    metadataSource: row.metadata_source,
    metadataAvailable: Boolean(row.metadata_available),
    abstractAvailable: Boolean(row.abstract_available),
    fullTextAvailable: Boolean(row.full_text_available),
    pdfAvailable: Boolean(row.pdf_available),
    pdfAccessType: row.pdf_access_type,
    normalizedTitle: row.normalized_title,
  };
}

export class PaperRepository {
  static async findExisting(paper: CanonicalPaper): Promise<(CanonicalPaper & { id: string }) | null> {
    const doi = normalizeDoi(paper.doi);
    if (doi) {
      const r = await pool.query(`SELECT * FROM papers WHERE doi = $1 LIMIT 1`, [doi]);
      if (r.rows?.[0]) return rowToPaper(r.rows[0]);
    }
    if (paper.pmid) {
      const r = await pool.query(`SELECT * FROM papers WHERE pmid = $1 LIMIT 1`, [paper.pmid]);
      if (r.rows?.[0]) return rowToPaper(r.rows[0]);
    }
    if (paper.openalexId) {
      const r = await pool.query(`SELECT * FROM papers WHERE openalex_id = $1 LIMIT 1`, [
        paper.openalexId,
      ]);
      if (r.rows?.[0]) return rowToPaper(r.rows[0]);
    }
    if (paper.pmcid) {
      const r = await pool.query(`SELECT * FROM papers WHERE pmcid = $1 LIMIT 1`, [paper.pmcid]);
      if (r.rows?.[0]) return rowToPaper(r.rows[0]);
    }

    // Conservative fuzzy match
    const nt = normalizeTitle(paper.title);
    const year = paper.publicationYear;
    const first = firstAuthorKey(paper.authors);
    if (nt && year && first) {
      const r = await pool.query(
        `SELECT * FROM papers WHERE normalized_title = $1 AND publication_year = $2 LIMIT 20`,
        [nt, year]
      );
      for (const row of r.rows || []) {
        const existing = rowToPaper(row);
        if (firstAuthorKey(existing.authors) === first) return existing;
      }
    }
    return null;
  }

  static async upsert(paper: CanonicalPaper): Promise<CanonicalPaper & { id: string }> {
    const existing = await this.findExisting(paper);
    if (existing) {
      const merged = mergeCanonical(existing, paper);
      await pool.query(
        `UPDATE papers SET
          title=$1, abstract=$2, publication_type=$3, publication_year=$4, publication_date=$5,
          doi=$6, pmid=$7, pmcid=$8, openalex_id=$9, semantic_scholar_id=$10,
          journal_name=$11, journal_issn=$12, publisher=$13, volume=$14, issue=$15, pages=$16,
          authors=$17, affiliations=$18, keywords=$19, mesh_terms=$20, topics=$21,
          citation_count=$22, is_open_access=$23, open_access_status=$24, open_access_url=$25,
          pdf_url=$26, source_url=$27, metadata_source=$28,
          metadata_available=$29, abstract_available=$30, full_text_available=$31,
          pdf_available=$32, pdf_access_type=$33, normalized_title=$34,
          metadata_last_updated_at=NOW(), updated_at=NOW()
         WHERE id=$35`,
        [
          merged.title,
          merged.abstract || null,
          merged.publicationType || null,
          merged.publicationYear || null,
          merged.publicationDate || null,
          normalizeDoi(merged.doi),
          merged.pmid || null,
          merged.pmcid || null,
          merged.openalexId || null,
          merged.semanticScholarId || null,
          merged.journalName || null,
          merged.journalIssn || null,
          merged.publisher || null,
          merged.volume || null,
          merged.issue || null,
          merged.pages || null,
          JSON.stringify(merged.authors || []),
          JSON.stringify(merged.affiliations || []),
          JSON.stringify(merged.keywords || []),
          JSON.stringify(merged.meshTerms || []),
          JSON.stringify(merged.topics || []),
          merged.citationCount ?? 0,
          merged.isOpenAccess ? 1 : 0,
          merged.openAccessStatus || null,
          merged.openAccessUrl || null,
          merged.pdfUrl || null,
          merged.sourceUrl || null,
          merged.metadataSource || null,
          merged.metadataAvailable !== false ? 1 : 0,
          merged.abstractAvailable || merged.abstract ? 1 : 0,
          merged.fullTextAvailable ? 1 : 0,
          merged.pdfAvailable || merged.pdfUrl ? 1 : 0,
          merged.pdfAccessType || null,
          normalizeTitle(merged.title),
          existing.id,
        ]
      );
      await this.syncIdentifiers(existing.id, merged);
      const r = await pool.query(`SELECT * FROM papers WHERE id = $1`, [existing.id]);
      return rowToPaper(r.rows[0]);
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO papers (
        id, title, abstract, publication_type, publication_year, publication_date,
        doi, pmid, pmcid, openalex_id, semantic_scholar_id,
        journal_name, journal_issn, publisher, volume, issue, pages,
        authors, affiliations, keywords, mesh_terms, topics,
        citation_count, is_open_access, open_access_status, open_access_url,
        pdf_url, source_url, metadata_source,
        metadata_available, abstract_available, full_text_available,
        pdf_available, pdf_access_type, normalized_title, metadata_last_updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
        $23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,NOW()
      )`,
      [
        id,
        paper.title,
        paper.abstract || null,
        paper.publicationType || null,
        paper.publicationYear || null,
        paper.publicationDate || null,
        normalizeDoi(paper.doi),
        paper.pmid || null,
        paper.pmcid || null,
        paper.openalexId || null,
        paper.semanticScholarId || null,
        paper.journalName || null,
        paper.journalIssn || null,
        paper.publisher || null,
        paper.volume || null,
        paper.issue || null,
        paper.pages || null,
        JSON.stringify(paper.authors || []),
        JSON.stringify(paper.affiliations || []),
        JSON.stringify(paper.keywords || []),
        JSON.stringify(paper.meshTerms || []),
        JSON.stringify(paper.topics || []),
        paper.citationCount ?? 0,
        paper.isOpenAccess ? 1 : 0,
        paper.openAccessStatus || null,
        paper.openAccessUrl || null,
        paper.pdfUrl || null,
        paper.sourceUrl || null,
        paper.metadataSource || null,
        1,
        paper.abstract ? 1 : 0,
        paper.fullTextAvailable ? 1 : 0,
        paper.pdfUrl ? 1 : 0,
        paper.pdfAccessType || null,
        normalizeTitle(paper.title),
      ]
    );
    await this.syncIdentifiers(id, paper);
    const r = await pool.query(`SELECT * FROM papers WHERE id = $1`, [id]);
    return rowToPaper(r.rows[0]);
  }

  private static async syncIdentifiers(paperId: string, paper: CanonicalPaper) {
    const pairs: Array<[string, string]> = [];
    if (paper.doi) pairs.push(['doi', normalizeDoi(paper.doi)!]);
    if (paper.pmid) pairs.push(['pmid', paper.pmid]);
    if (paper.pmcid) pairs.push(['pmcid', paper.pmcid]);
    if (paper.openalexId) pairs.push(['openalex', paper.openalexId]);
    for (const [type, value] of pairs) {
      try {
        await pool.query(
          `INSERT IGNORE INTO paper_identifiers (id, paper_id, id_type, id_value)
           VALUES ($1, $2, $3, $4)`,
          [crypto.randomUUID(), paperId, type, value]
        );
      } catch {
        /* ignore */
      }
    }
  }

  static async getById(id: string) {
    const r = await pool.query(`SELECT * FROM papers WHERE id = $1`, [id]);
    return r.rows?.[0] ? rowToPaper(r.rows[0]) : null;
  }

  static async addToLibrary(
    userId: string,
    paperId: string,
    opts?: { projectId?: string; notes?: string; tags?: string[] }
  ) {
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO user_library_items (id, user_id, paper_id, project_id, notes, tags)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON DUPLICATE KEY UPDATE updated_at = NOW()`,
      [
        id,
        userId,
        paperId,
        opts?.projectId || null,
        opts?.notes || null,
        JSON.stringify(opts?.tags || []),
      ]
    );
    const r = await pool.query(
      `SELECT * FROM user_library_items WHERE user_id = $1 AND paper_id = $2`,
      [userId, paperId]
    );
    return r.rows?.[0] || null;
  }

  static async listLibrary(
    userId: string,
    opts: {
      q?: string;
      favorite?: boolean;
      hasPdf?: boolean;
      openAccess?: boolean;
      collectionId?: string;
      projectId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const limit = Math.min(100, opts.limit || 50);
    const offset = opts.offset || 0;
    const params: any[] = [userId];
    let sql = `
      SELECT
        uli.id AS library_item_id,
        uli.user_id,
        uli.paper_id,
        uli.project_id,
        uli.is_favorite,
        uli.tags,
        uli.notes,
        uli.user_pdf_path,
        uli.user_pdf_text,
        uli.created_at AS library_created_at,
        uli.updated_at AS library_updated_at,
        p.id AS pid,
        p.title, p.abstract, p.publication_type, p.publication_year, p.publication_date,
        p.doi, p.pmid, p.pmcid, p.openalex_id, p.semantic_scholar_id,
        p.journal_name, p.journal_issn, p.publisher, p.volume, p.issue, p.pages,
        p.authors, p.affiliations, p.keywords, p.mesh_terms, p.topics,
        p.citation_count, p.is_open_access, p.open_access_status, p.open_access_url,
        p.pdf_url, p.source_url, p.metadata_source,
        p.metadata_available, p.abstract_available, p.full_text_available,
        p.pdf_available, p.pdf_access_type, p.normalized_title
      FROM user_library_items uli
      INNER JOIN papers p ON p.id = uli.paper_id
      WHERE uli.user_id = $1`;
    if (opts.favorite) sql += ` AND uli.is_favorite = 1`;
    if (opts.openAccess) sql += ` AND p.is_open_access = 1`;
    if (opts.hasPdf) sql += ` AND (p.pdf_url IS NOT NULL OR uli.user_pdf_path IS NOT NULL)`;
    if (opts.projectId) {
      params.push(opts.projectId);
      sql += ` AND uli.project_id = $${params.length}`;
    }
    if (opts.collectionId) {
      params.push(opts.collectionId);
      sql += ` AND EXISTS (
        SELECT 1 FROM reference_collection_items rci
        WHERE rci.collection_id = $${params.length} AND rci.paper_id = p.id
      )`;
    }
    if (opts.q?.trim()) {
      params.push(`%${opts.q.trim()}%`);
      const i = params.length;
      sql += ` AND (p.title LIKE $${i} OR p.doi LIKE $${i} OR p.pmid LIKE $${i} OR uli.notes LIKE $${i} OR CAST(p.authors AS CHAR) LIKE $${i})`;
    }
    sql += ` ORDER BY uli.updated_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const r = await pool.query(sql, params);
    return (r.rows || []).map((row: any) => ({
      libraryItemId: row.library_item_id,
      paperId: row.paper_id,
      isFavorite: Boolean(row.is_favorite),
      notes: row.notes,
      tags: parseJson(row.tags, []),
      userPdfPath: row.user_pdf_path,
      hasUserPdfText: Boolean(row.user_pdf_text),
      projectId: row.project_id,
      paper: rowToPaper({
        ...row,
        id: row.pid || row.paper_id,
      }),
      updatedAt: row.library_updated_at,
      createdAt: row.library_created_at,
    }));
  }

  static toCitationRecord(paper: CanonicalPaper & { id?: string }) {
    return {
      id: paper.id,
      title: paper.title,
      authors: authorsToStrings(paper.authors || []),
      year: paper.publicationYear,
      journal: paper.journalName,
      volume: paper.volume,
      issue: paper.issue,
      pages: paper.pages,
      doi: paper.doi,
      url: paper.sourceUrl,
      abstract: paper.abstract,
    };
  }

  /**
   * Link transitional writing_citations into canonical papers + user library
   * when a DOI (or PMID-like identifier) is present.
   */
  static async syncWritingCitationsForUser(userId: string, limit = 50): Promise<number> {
    const r = await pool.query(
      `SELECT wc.id, wc.title, wc.authors, wc.year, wc.journal, wc.volume, wc.issue,
              wc.pages, wc.doi, wc.url, wc.abstract
       FROM writing_citations wc
       LEFT JOIN user_library_items uli
         ON uli.user_id = wc.user_id AND uli.writing_citation_id = wc.id
       WHERE wc.user_id = $1 AND wc.doi IS NOT NULL AND wc.doi != '' AND uli.id IS NULL
       LIMIT $2`,
      [userId, limit]
    );
    let n = 0;
    for (const row of r.rows || []) {
      try {
        const authorsRaw = row.authors;
        const authorsList: string[] = Array.isArray(authorsRaw)
          ? authorsRaw
          : typeof authorsRaw === 'string'
            ? JSON.parse(authorsRaw || '[]')
            : [];
        const paper = await this.upsert({
          title: row.title,
          authors: authorsList.map((name: string) => ({ name })),
          publicationYear: row.year,
          journalName: row.journal,
          volume: row.volume,
          issue: row.issue,
          pages: row.pages,
          doi: row.doi,
          sourceUrl: row.url,
          abstract: row.abstract,
          metadataSource: 'writing_citations_sync',
        });
        await pool.query(
          `INSERT INTO user_library_items (id, user_id, paper_id, writing_citation_id)
           VALUES ($1, $2, $3, $4)
           ON DUPLICATE KEY UPDATE writing_citation_id = COALESCE(writing_citation_id, VALUES(writing_citation_id)), updated_at = NOW()`,
          [crypto.randomUUID(), userId, paper.id, row.id]
        );
        n++;
      } catch {
        /* skip bad rows */
      }
    }
    return n;
  }
}
