/**
 * Hybrid vector + text protocol search (MySQL-compatible).
 */

import pool from '../../database/config.js';
import {
  cosineSimilarity,
  generateEmbedding,
  parseEmbedding,
  simpleHash,
} from '../utils/embeddings.js';

export interface ProtocolSearchFilters {
  category?: string;
  difficulty?: string;
  minSuccessRate?: number;
}

function protocolText(row: any): string {
  const tags =
    typeof row.tags === 'string'
      ? row.tags
      : Array.isArray(row.tags)
        ? row.tags.join(', ')
        : '';
  return [
    row.title,
    row.description,
    row.category,
    row.objective,
    row.content?.slice?.(0, 4000) || row.content,
    tags,
  ]
    .filter(Boolean)
    .join('\n');
}

function textRelevance(query: string, row: any): number {
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 2);
  const title = String(row.title || '').toLowerCase();
  const desc = String(row.description || '').toLowerCase();
  const category = String(row.category || '').toLowerCase();
  const tags = String(
    Array.isArray(row.tags) ? row.tags.join(' ') : row.tags || ''
  ).toLowerCase();

  let score = 0;
  if (title.includes(q)) score += 10;
  if (desc.includes(q)) score += 5;
  if (category.includes(q)) score += 3;
  if (tags.includes(q)) score += 3;
  for (const t of tokens) {
    if (title.includes(t)) score += 2;
    if (desc.includes(t)) score += 1;
    if (tags.includes(t)) score += 1;
  }
  return score;
}

async function ensureProtocolEmbedding(
  protocol: any,
  userId?: string
): Promise<number[] | null> {
  const text = protocolText(protocol);
  if (!text.trim()) return null;
  const hash = simpleHash(text);

  const existing = await pool.query(
    `SELECT embedding, content_hash FROM protocol_embeddings WHERE protocol_id = $1`,
    [protocol.id]
  );
  if (existing.rows[0] && existing.rows[0].content_hash === hash) {
    return parseEmbedding(existing.rows[0].embedding);
  }

  const generated = await generateEmbedding(text, userId);
  if (!generated?.embedding?.length) return null;

  await pool.query(
    `INSERT INTO protocol_embeddings (
      protocol_id, content_hash, embedding, embedding_model, embedding_provider
    ) VALUES ($1, $2, $3, $4, $5)
    ON DUPLICATE KEY UPDATE
      content_hash = VALUES(content_hash),
      embedding = VALUES(embedding),
      embedding_model = VALUES(embedding_model),
      embedding_provider = VALUES(embedding_provider),
      updated_at = CURRENT_TIMESTAMP`,
    [
      protocol.id,
      hash,
      JSON.stringify(generated.embedding),
      generated.model,
      generated.provider,
    ]
  );

  return generated.embedding;
}

async function loadAccessibleProtocols(
  userId: string,
  role: string | undefined,
  query: string,
  filters: ProtocolSearchFilters,
  limit: number
): Promise<any[]> {
  const like = `%${query}%`;
  const params: any[] = [];
  let sql = `
    SELECT p.*, u.first_name, u.last_name, u.username as creator_name, l.name as lab_name
    FROM protocols p
    JOIN users u ON p.author_id = u.id
    LEFT JOIN labs l ON p.lab_id = l.id
    WHERE COALESCE(p.is_approved, 1) = 1
  `;

  if (role !== 'admin') {
    params.push(userId, userId);
    sql += ` AND (
      p.author_id = $1
      OR p.privacy_level = 'public'
      OR (p.lab_id IS NOT NULL AND p.lab_id IN (
        SELECT lab_id FROM lab_members WHERE user_id = $2 AND COALESCE(is_active, 1) = 1
      ))
    )`;
  }

  // Broad candidate set: title/description/category/content LIKE
  const baseIdx = params.length;
  params.push(like, like, like, like);
  sql += ` AND (
    LOWER(p.title) LIKE LOWER($${baseIdx + 1})
    OR LOWER(COALESCE(p.description,'')) LIKE LOWER($${baseIdx + 2})
    OR LOWER(COALESCE(p.category,'')) LIKE LOWER($${baseIdx + 3})
    OR LOWER(COALESCE(p.content,'')) LIKE LOWER($${baseIdx + 4})
  )`;

  if (filters.category) {
    params.push(filters.category);
    sql += ` AND p.category = $${params.length}`;
  }
  if (filters.difficulty) {
    params.push(filters.difficulty);
    sql += ` AND p.difficulty_level = $${params.length}`;
  }
  if (filters.minSuccessRate != null) {
    params.push(filters.minSuccessRate);
    sql += ` AND COALESCE(p.success_rate, 0) >= $${params.length}`;
  }

  params.push(Math.max(limit * 4, 40));
  sql += ` ORDER BY p.updated_at DESC, p.created_at DESC LIMIT $${params.length}`;

  let result = await pool.query(sql, params);
  if (result.rows.length > 0) return result.rows;

  // Fallback: recent accessible protocols (semantic will rank)
  const fallbackParams: any[] = [];
  let fallback = `
    SELECT p.*, u.first_name, u.last_name, u.username as creator_name, l.name as lab_name
    FROM protocols p
    JOIN users u ON p.author_id = u.id
    LEFT JOIN labs l ON p.lab_id = l.id
    WHERE COALESCE(p.is_approved, 1) = 1
  `;
  if (role !== 'admin') {
    fallbackParams.push(userId, userId);
    fallback += ` AND (
      p.author_id = $1
      OR p.privacy_level = 'public'
      OR (p.lab_id IS NOT NULL AND p.lab_id IN (
        SELECT lab_id FROM lab_members WHERE user_id = $2 AND COALESCE(is_active, 1) = 1
      ))
    )`;
  }
  if (filters.category) {
    fallbackParams.push(filters.category);
    fallback += ` AND p.category = $${fallbackParams.length}`;
  }
  fallbackParams.push(Math.max(limit * 3, 30));
  fallback += ` ORDER BY p.created_at DESC LIMIT $${fallbackParams.length}`;
  result = await pool.query(fallback, fallbackParams);
  return result.rows;
}

export class ProtocolVectorSearch {
  static async search(opts: {
    query: string;
    userId: string;
    role?: string;
    limit?: number;
    filters?: ProtocolSearchFilters;
  }) {
    const limit = opts.limit ?? 20;
    const filters = opts.filters || {};
    const query = opts.query.trim();

    const candidates = await loadAccessibleProtocols(
      opts.userId,
      opts.role,
      query,
      filters,
      limit
    );

    const queryEmb = await generateEmbedding(query, opts.userId);

    const scored: Array<any> = [];
    // Cap embedding work per request
    const toEmbed = candidates.slice(0, Math.min(candidates.length, 40));

    for (const row of toEmbed) {
      const textScore = textRelevance(query, row);
      let semantic = 0;
      if (queryEmb?.embedding) {
        const emb = await ensureProtocolEmbedding(row, opts.userId);
        if (emb) semantic = cosineSimilarity(queryEmb.embedding, emb);
      }
      // Hybrid: semantic dominates when available
      const relevance =
        queryEmb?.embedding && semantic > 0
          ? Math.round((semantic * 70 + Math.min(textScore, 20) * 1.5) * 100) / 100
          : textScore;

      scored.push({
        ...row,
        relevance_score: relevance,
        semantic_score: Math.round(semantic * 1000) / 1000,
        text_score: textScore,
        search_mode: queryEmb?.embedding ? 'hybrid_vector' : 'text',
      });
    }

    scored.sort((a, b) => b.relevance_score - a.relevance_score);
    return {
      results: scored.slice(0, limit),
      query,
      total: scored.length,
      mode: queryEmb?.embedding ? 'hybrid_vector' : 'text_fallback',
    };
  }

  static async similar(protocolId: string, userId: string, limit = 5) {
    const base = await pool.query(`SELECT * FROM protocols WHERE id = $1`, [protocolId]);
    if (!base.rows[0]) return [];

    const baseEmb =
      (await ensureProtocolEmbedding(base.rows[0], userId)) ||
      (await generateEmbedding(protocolText(base.rows[0]), userId))?.embedding;
    if (!baseEmb) {
      // category fallback
      const cat = base.rows[0].category;
      const fb = await pool.query(
        `SELECT p.*, u.first_name, u.last_name, u.username as creator_name
         FROM protocols p
         JOIN users u ON p.author_id = u.id
         WHERE p.id != $1 AND COALESCE(p.is_approved, 1) = 1
           AND ($2 IS NULL OR p.category = $2)
         ORDER BY COALESCE(p.usage_count, 0) DESC
         LIMIT $3`,
        [protocolId, cat || null, limit]
      );
      return fb.rows;
    }

    const others = await pool.query(
      `SELECT p.*, u.first_name, u.last_name, u.username as creator_name, pe.embedding
       FROM protocols p
       JOIN users u ON p.author_id = u.id
       LEFT JOIN protocol_embeddings pe ON pe.protocol_id = p.id
       WHERE p.id != $1 AND COALESCE(p.is_approved, 1) = 1
       ORDER BY p.created_at DESC
       LIMIT 80`,
      [protocolId]
    );

    const scored = [];
    for (const row of others.rows) {
      let emb = parseEmbedding(row.embedding);
      if (!emb) emb = await ensureProtocolEmbedding(row, userId);
      if (!emb) continue;
      const sim = cosineSimilarity(baseEmb, emb);
      scored.push({ ...row, similarity_score: Math.round(sim * 1000) / 1000 });
    }
    scored.sort((a, b) => b.similarity_score - a.similarity_score);
    return scored.slice(0, limit);
  }

  /** Index a single protocol (e.g. after create/update). */
  static async indexProtocol(protocolId: string, userId?: string) {
    const result = await pool.query(`SELECT * FROM protocols WHERE id = $1`, [protocolId]);
    if (!result.rows[0]) return false;
    const emb = await ensureProtocolEmbedding(result.rows[0], userId);
    return Boolean(emb);
  }
}

export default ProtocolVectorSearch;
