/**
 * PDF / source text chunking + Ask Paper RAG (grounded answers only).
 */

import crypto from 'crypto';
import pool from '../../../database/config.js';
import { generateEmbedding, cosineSimilarity, parseEmbedding } from '../../utils/embeddings.js';
import { AgentFactory } from '../AgentFactory.js';
import { gateAgentExecution } from '../safety/agentSafetyGate.js';

function chunkText(text: string, size = 1200, overlap = 150): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    chunks.push(clean.slice(i, i + size));
    i += size - overlap;
  }
  return chunks.slice(0, 80);
}

export class PaperRagService {
  static async indexText(opts: {
    paperId: string;
    userId: string;
    text: string;
    sectionName?: string;
  }): Promise<number> {
    await pool.query(`DELETE FROM paper_chunks WHERE paper_id = $1 AND user_id = $2`, [
      opts.paperId,
      opts.userId,
    ]);
    const parts = chunkText(opts.text);
    let n = 0;
    for (let i = 0; i < parts.length; i++) {
      let embedding: number[] | null = null;
      try {
        const emb = await generateEmbedding(parts[i].slice(0, 8000), opts.userId);
        embedding = emb?.embedding || null;
      } catch {
        embedding = null;
      }
      await pool.query(
        `INSERT INTO paper_chunks (id, paper_id, user_id, section_name, chunk_index, chunk_text, embedding)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          crypto.randomUUID(),
          opts.paperId,
          opts.userId,
          opts.sectionName || null,
          i,
          parts[i],
          embedding ? JSON.stringify(embedding) : null,
        ]
      );
      n++;
    }
    return n;
  }

  static async retrieve(
    userId: string,
    paperIds: string[],
    question: string,
    topK = 6
  ): Promise<Array<{ paperId: string; text: string; section?: string; score: number }>> {
    if (!paperIds.length) return [];
    const placeholders = paperIds.map((_, i) => `$${i + 2}`).join(',');
    const result = await pool.query(
      `SELECT paper_id, chunk_text, section_name, embedding
       FROM paper_chunks
       WHERE user_id = $1 AND paper_id IN (${placeholders})`,
      [userId, ...paperIds]
    );
    const rows = result.rows || [];
    let qEmbed: number[] | null = null;
    try {
      const emb = await generateEmbedding(question.slice(0, 4000), userId);
      qEmbed = emb?.embedding || null;
    } catch {
      qEmbed = null;
    }

    const scored = rows.map((row: any) => {
      const emb = parseEmbedding(row.embedding);
      let score = 0;
      if (qEmbed && emb) score = cosineSimilarity(qEmbed, emb);
      else {
        const q = question.toLowerCase();
        const t = String(row.chunk_text || '').toLowerCase();
        score = q.split(/\s+/).filter((w) => w.length > 3 && t.includes(w)).length / 10;
      }
      return {
        paperId: row.paper_id,
        text: row.chunk_text,
        section: row.section_name || undefined,
        score,
      };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  static async ask(opts: {
    userId: string;
    userRole?: string;
    paperIds: string[];
    question: string;
    paperTitles?: Record<string, string>;
  }): Promise<{ answer: string; passages: any[]; grounded: boolean }> {
    const passages = await this.retrieve(opts.userId, opts.paperIds, opts.question, 6);
    if (!passages.length) {
      return {
        answer: 'Not available from the accessible source. Upload a PDF or attach open-access full text, then try again.',
        passages: [],
        grounded: false,
      };
    }

    const context = passages
      .map(
        (p, i) =>
          `[Passage ${i + 1}] paper=${opts.paperTitles?.[p.paperId] || p.paperId} section=${p.section || 'n/a'}\n${p.text}`
      )
      .join('\n\n');

    const input = {
      title: 'Ask Paper',
      content: `Answer ONLY using the passages. If not present, say "Not available from the accessible source."\n\nQuestion: ${opts.question}\n\nPassages:\n${context}`,
      type: 'research' as const,
      wordLimit: 350,
      style: 'narrative' as const,
    };

    const gate = await gateAgentExecution({
      userId: opts.userId,
      agentType: 'abstract_writing',
      input,
      userRole: opts.userRole,
    });
    if (!gate.allowed) {
      return {
        answer: gate.blockedReason || 'Blocked by safety policy',
        passages,
        grounded: false,
      };
    }

    try {
      const agent = AgentFactory.createAgent('abstract_writing');
      const result = await agent.execute(input, {
        additionalData: { userId: opts.userId },
        conversationHistory: [],
      });
      const answer =
        result.content?.abstract ||
        result.content?.text ||
        (typeof result.content === 'string' ? result.content : null) ||
        passages[0].text.slice(0, 500);
      return { answer: String(answer), passages, grounded: true };
    } catch (e) {
      return {
        answer: `Could not generate an answer. Top passage: ${passages[0].text.slice(0, 400)}`,
        passages,
        grounded: true,
      };
    }
  }
}
