/**
 * Citation Support AI — author/reviewer quality for claims ↔ references.
 *
 * Pipeline (always):
 *  1) Search user's library / draft sources (0 external hallucination risk)
 *  2) Scholarly web search (OpenAlex / Crossref / PubMed…)
 *  3) Strict LLM judge on abstract/source text only
 *  4) If nothing accurately supports the claim → honest decline
 *
 * Never invent DOIs, authors, years, or findings.
 */

import pool from '../../../database/config.js';
import { AIProviderFactory } from '../AIProviderFactory.js';
import { ChatMessage } from '../AIProvider.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getApiKeyWithFallback } from '../../routes/aiProviderKeys.js';
import {
  consumePlatformQuota,
  tryPlatformAiAccess,
} from '../platformAiAccess.js';
import { ScholarlyService } from './ScholarlyService.js';
import { PaperRepository } from './PaperRepository.js';
import { CanonicalPaper } from './types.js';
import { ScholarSidekickService } from './ScholarSidekickService.js';
import type { SidekickVerifyVerdict } from './ScholarSidekickService.js';

export type SupportVerdict =
  | 'supports'
  | 'partially_supports'
  | 'does_not_support'
  | 'contradicts'
  | 'insufficient_text'
  | 'cannot_judge';

export type CitationCandidate = {
  paperId: string;
  title: string;
  authors: string[];
  year?: number | null;
  journal?: string | null;
  doi?: string | null;
  abstract?: string | null;
  source: 'library' | 'web';
  verdict: SupportVerdict;
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
  excerpt: string | null;
  alreadyCited?: boolean;
  /** Scholar Sidekick fabrication / retraction / OA integrity */
  integrity?: {
    verifyVerdict?: SidekickVerifyVerdict;
    verifyConfidence?: string;
    isRetracted?: boolean;
    hasConcern?: boolean;
    isOa?: boolean;
    oaStatus?: string | null;
    oaUrl?: string | null;
    provider: 'scholar-sidekick' | 'skipped';
  };
};

export type SuggestResult = {
  claim: string;
  found: boolean;
  message: string;
  candidates: CitationCandidate[];
  searchedLibrary: number;
  searchedWeb: number;
  usedLlmJudge: boolean;
  disclaimer: string;
};

export type VerifyResult = {
  claim: string;
  assessments: Array<{
    paperId: string;
    title: string;
    verdict: SupportVerdict;
    confidence: 'high' | 'medium' | 'low';
    rationale: string;
    excerpt: string | null;
    reviewerNote: string;
    integrity?: {
      verifyVerdict?: SidekickVerifyVerdict;
      isRetracted?: boolean;
      hasConcern?: boolean;
    };
  }>;
  overall: 'adequate' | 'weak' | 'unsupported' | 'mixed';
  message: string;
  disclaimer: string;
};

const SORRY =
  'Sorry — I could not find a suitable reference that accurately supports this statement. Please search manually and verify the source yourself before citing.';

const JUDGE_SYSTEM = `You are a meticulous academic reviewer helping an author cite accurately.

Rules you MUST follow:
1. Judge ONLY from the provided SOURCE TEXT (abstract or excerpt). Do not use outside knowledge about the paper.
2. Do NOT invent DOIs, authors, years, journals, statistics, or findings that are not in the source text.
3. "supports" = the source clearly states or directly entails the CLAIM (same population/intervention/outcome direction when applicable).
4. "partially_supports" = source supports only part of the claim, or a weaker/related finding.
5. "does_not_support" = topic overlap but claim is not evidenced.
6. "contradicts" = source findings go against the claim.
7. "insufficient_text" = source too thin to judge.
8. Prefer honesty over helpfulness. If unsure, use insufficient_text or does_not_support — never "supports".
9. Reject circular or tautological matches that merely restate keywords without substantive evidence.
10. Respond with ONLY valid JSON:
{"verdict":"supports|partially_supports|does_not_support|contradicts|insufficient_text","confidence":"high|medium|low","rationale":"1-2 sentences","excerpt":"short quote from source or null"}`;

const DISCLAIMER =
  'AI-assisted citation check. You remain responsible for verifying every source before publication. Prefer primary literature you have read.';

function extractJson(text: string): any | null {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1].trim() : trimmed;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function tokenOverlap(claim: string, text: string): number {
  const claimTokens = claim
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3);
  if (!claimTokens.length || !text) return 0;
  const hay = text.toLowerCase();
  const hits = claimTokens.filter((t) => hay.includes(t)).length;
  return hits / claimTokens.length;
}

function paperAuthors(p: CanonicalPaper): string[] {
  return (p.authors || []).map((a) =>
    typeof a === 'string' ? a : a.name || 'Unknown'
  );
}

async function resolveChatProvider(
  userId: string
): Promise<{ provider: string; providerName: string; apiKey: string } | null> {
  let apiAssignment = await getApiForTask(userId, 'summarization');
  if (apiAssignment && !apiAssignment.apiKeyId) {
    const platformTry = await tryPlatformAiAccess(userId);
    if (!platformTry.ok) return null;
    await consumePlatformQuota(userId);
    return {
      provider: platformTry.access.provider,
      providerName: platformTry.access.providerName,
      apiKey: platformTry.access.apiKey,
    };
  }
  if (apiAssignment?.apiKey) {
    return {
      provider: apiAssignment.provider,
      providerName: apiAssignment.providerName,
      apiKey: apiAssignment.apiKey,
    };
  }
  const key = await getApiKeyWithFallback(userId, 'google_gemini', true);
  if (!key) return null;
  const platformTry = await tryPlatformAiAccess(userId);
  if (platformTry.ok) {
    await consumePlatformQuota(userId);
    return {
      provider: platformTry.access.provider,
      providerName: platformTry.access.providerName,
      apiKey: platformTry.access.apiKey,
    };
  }
  return { provider: 'google_gemini', providerName: 'Google Gemini', apiKey: key };
}

async function llmJudge(
  userId: string,
  claim: string,
  sourceText: string,
  paperTitle: string
): Promise<{
  verdict: SupportVerdict;
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
  excerpt: string | null;
  usedLlm: boolean;
} | null> {
  const text = (sourceText || '').trim().slice(0, 3500);
  if (text.length < 40) {
    return {
      verdict: 'insufficient_text',
      confidence: 'low',
      rationale: 'Not enough source text (abstract/PDF) to judge support accurately.',
      excerpt: null,
      usedLlm: false,
    };
  }

  const provider = await resolveChatProvider(userId);
  if (!provider) {
    // Conservative heuristic fallback — never claim "supports" without LLM
    const ratio = tokenOverlap(claim, text);
    if (ratio >= 0.5) {
      return {
        verdict: 'partially_supports',
        confidence: 'low',
        rationale:
          'Keyword overlap only (AI judge unavailable). Treat as unverified — read the source before citing.',
        excerpt: text.slice(0, 220),
        usedLlm: false,
      };
    }
    return {
      verdict: 'does_not_support',
      confidence: 'medium',
      rationale: 'Insufficient overlap and AI judge unavailable.',
      excerpt: null,
      usedLlm: false,
    };
  }

  try {
    const ai = AIProviderFactory.createProvider(provider.provider, provider.apiKey);
    const messages: ChatMessage[] = [
      { role: 'system', content: JUDGE_SYSTEM },
      {
        role: 'user',
        content: `CLAIM:\n${claim}\n\nPAPER TITLE:\n${paperTitle}\n\nSOURCE TEXT:\n${text}`,
      },
    ];
    const resp = await ai.chat(messages, { temperature: 0.1, maxTokens: 400 });
    const parsed = extractJson(resp.content || '');
    const verdict = String(parsed?.verdict || 'cannot_judge') as SupportVerdict;
    const allowed: SupportVerdict[] = [
      'supports',
      'partially_supports',
      'does_not_support',
      'contradicts',
      'insufficient_text',
      'cannot_judge',
    ];
    return {
      verdict: allowed.includes(verdict) ? verdict : 'cannot_judge',
      confidence:
        parsed?.confidence === 'high' || parsed?.confidence === 'medium'
          ? parsed.confidence
          : 'low',
      rationale: String(parsed?.rationale || 'No rationale provided.').slice(0, 500),
      excerpt: parsed?.excerpt ? String(parsed.excerpt).slice(0, 400) : text.slice(0, 220),
      usedLlm: true,
    };
  } catch (e) {
    console.warn('Citation LLM judge failed:', (e as Error).message);
    return null;
  }
}

async function loadLibraryPapers(
  userId: string,
  limit = 80
): Promise<Array<CanonicalPaper & { id: string; sourceText?: string }>> {
  const r = await pool.query(
    `SELECT p.*, uli.user_pdf_text
     FROM user_library_items uli
     INNER JOIN papers p ON p.id = uli.paper_id
     WHERE uli.user_id = $1
     ORDER BY uli.updated_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return (r.rows || []).map((row: any) => {
    const paper = {
      id: row.id,
      title: row.title,
      abstract: row.abstract,
      publicationYear: row.publication_year,
      journalName: row.journal_name,
      doi: row.doi,
      authors: (() => {
        try {
          const a = typeof row.authors === 'string' ? JSON.parse(row.authors) : row.authors;
          return Array.isArray(a) ? a : [];
        } catch {
          return [];
        }
      })(),
      citationCount: row.citation_count,
      sourceUrl: row.source_url,
    } as CanonicalPaper & { id: string };
    return {
      ...paper,
      sourceText: row.user_pdf_text || row.abstract || '',
    };
  });
}

function dedupeByPaperId<T extends { paperId: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of list) {
    if (!item.paperId || seen.has(item.paperId)) continue;
    seen.add(item.paperId);
    out.push(item);
  }
  return out;
}

export class CitationSupportService {
  /**
   * Find accurate supporting references for a selected claim / sentence.
   */
  static async suggestForClaim(opts: {
    userId: string;
    claim: string;
    /** Paper ids already cited in the manuscript — avoid recommending repeats */
    excludePaperIds?: string[];
    preferLibrary?: boolean;
    webLimit?: number;
  }): Promise<SuggestResult> {
    const claim = opts.claim.trim().replace(/\s+/g, ' ');
    if (claim.length < 12) {
      return {
        claim,
        found: false,
        message: 'Select a fuller sentence or claim (at least a short clause) to search for citations.',
        candidates: [],
        searchedLibrary: 0,
        searchedWeb: 0,
        usedLlmJudge: false,
        disclaimer: DISCLAIMER,
      };
    }

    const exclude = new Set((opts.excludePaperIds || []).filter(Boolean));
    let usedLlmJudge = false;
    const judged: CitationCandidate[] = [];

    // ——— 1) Library first ———
    const library = await loadLibraryPapers(opts.userId);
    const libraryRanked = library
      .filter((p) => p.id && !exclude.has(p.id))
      .map((p) => {
        const text = `${p.title}\n${p.sourceText || p.abstract || ''}`;
        return { p, score: tokenOverlap(claim, text) };
      })
      .filter((x) => x.score >= 0.12)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    for (const { p } of libraryRanked) {
      const source = (p.sourceText || p.abstract || '').trim();
      const judge = await llmJudge(opts.userId, claim, source, p.title);
      if (judge?.usedLlm) usedLlmJudge = true;
      if (!judge) continue;
      if (judge.verdict !== 'supports' && judge.verdict !== 'partially_supports') continue;
      // Require medium+ confidence for library "supports"
      if (judge.verdict === 'supports' && judge.confidence === 'low') continue;

      judged.push({
        paperId: p.id,
        title: p.title,
        authors: paperAuthors(p),
        year: p.publicationYear,
        journal: p.journalName,
        doi: p.doi,
        abstract: p.abstract,
        source: 'library',
        verdict: judge.verdict,
        confidence: judge.confidence,
        rationale: judge.rationale,
        excerpt: judge.excerpt,
        alreadyCited: exclude.has(p.id),
      });
    }

    // Strong library hits → stop (no need to burn web + more tokens)
    const strongLibrary = judged.filter(
      (c) => c.verdict === 'supports' && (c.confidence === 'high' || c.confidence === 'medium')
    );
    if (strongLibrary.length > 0) {
      return {
        claim,
        found: true,
        message: `Found ${strongLibrary.length} accurate match(es) in your library.`,
        candidates: dedupeByPaperId(strongLibrary).slice(0, 5),
        searchedLibrary: library.length,
        searchedWeb: 0,
        usedLlmJudge,
        disclaimer: DISCLAIMER,
      };
    }

    // ——— 2) Web scholarly search ———
    let webPapers: CanonicalPaper[] = [];
    try {
      const search = await ScholarlyService.search({
        query: claim.slice(0, 300),
        limit: opts.webLimit || 10,
        sort: 'relevance',
      });
      webPapers = search.papers || [];
    } catch (e) {
      console.warn('Web scholarly search failed:', (e as Error).message);
    }

    const webCandidates = [];
    for (const paper of webPapers.slice(0, 8)) {
      let stored: (CanonicalPaper & { id: string }) | null = null;
      try {
        stored = await PaperRepository.upsert(paper);
      } catch {
        continue;
      }
      if (!stored?.id || exclude.has(stored.id)) continue;
      if (judged.some((j) => j.paperId === stored!.id)) continue;

      const source = (stored.abstract || paper.abstract || '').trim();
      const judge = await llmJudge(opts.userId, claim, source, stored.title || paper.title);
      if (judge?.usedLlm) usedLlmJudge = true;
      if (!judge) continue;
      if (judge.verdict !== 'supports' && judge.verdict !== 'partially_supports') continue;
      if (judge.verdict === 'supports' && judge.confidence === 'low') continue;
      // Web results: require at least partially_supports with medium confidence, or supports
      if (
        judge.verdict === 'partially_supports' &&
        judge.confidence === 'low'
      ) {
        continue;
      }

      webCandidates.push({
        paperId: stored.id,
        title: stored.title,
        authors: paperAuthors(stored),
        year: stored.publicationYear,
        journal: stored.journalName,
        doi: stored.doi,
        abstract: stored.abstract,
        source: 'web' as const,
        verdict: judge.verdict,
        confidence: judge.confidence,
        rationale: judge.rationale,
        excerpt: judge.excerpt,
      });
    }

    const ranked = dedupeByPaperId([...judged, ...webCandidates])
      .sort((a, b) => {
        const rank = (v: SupportVerdict, c: string) =>
          (v === 'supports' ? 20 : 10) + (c === 'high' ? 3 : c === 'medium' ? 1 : 0);
        return rank(b.verdict, b.confidence) - rank(a.verdict, a.confidence);
      })
      .slice(0, 5);

    // Scholar Sidekick: fabrication + retraction gate before showing Cite
    let all = ranked;
    try {
      all = await ScholarSidekickService.enrichCandidatesIntegrity(ranked);
      // Drop clear fabrications and retracted papers from cite suggestions
      all = all.filter((c) => {
        if (c.integrity?.isRetracted) return false;
        if (c.integrity?.verifyVerdict === 'mismatch') return false;
        return true;
      });
    } catch {
      /* Sidekick optional */
    }

    if (!all.length) {
      return {
        claim,
        found: false,
        message: SORRY,
        candidates: [],
        searchedLibrary: library.length,
        searchedWeb: webPapers.length,
        usedLlmJudge,
        disclaimer: DISCLAIMER,
      };
    }

    return {
      claim,
      found: true,
      message:
        all.some((c) => c.source === 'library') && all.every((c) => c.source === 'library')
          ? `Found ${all.length} suitable reference(s) in your library.`
          : `Found ${all.length} candidate reference(s) after library + literature search. Review before citing.`,
      candidates: all,
      searchedLibrary: library.length,
      searchedWeb: webPapers.length,
      usedLlmJudge,
      disclaimer: DISCLAIMER,
    };
  }

  /**
   * Verify whether already-cited papers support the selected claim (reviewer mode).
   */
  static async verifyCitations(opts: {
    userId: string;
    claim: string;
    paperIds: string[];
  }): Promise<VerifyResult> {
    const claim = opts.claim.trim();
    const assessments: VerifyResult['assessments'] = [];

    for (const paperId of opts.paperIds.slice(0, 6)) {
      const paper = await PaperRepository.getById(paperId);
      if (!paper) {
        assessments.push({
          paperId,
          title: 'Unknown paper',
          verdict: 'cannot_judge' as SupportVerdict,
          confidence: 'low' as const,
          rationale: 'Paper not found in the database.',
          excerpt: null,
          reviewerNote: 'Missing reference — remove or replace.',
        });
        continue;
      }

      const libRow = await pool.query(
        `SELECT user_pdf_text FROM user_library_items WHERE user_id = $1 AND paper_id = $2`,
        [opts.userId, paperId]
      );
      const sourceText =
        libRow.rows?.[0]?.user_pdf_text || paper.abstract || '';

      const judge = await llmJudge(opts.userId, claim, sourceText, paper.title);
      const verdict = judge?.verdict || 'cannot_judge';
      let reviewerNote = 'Reviewer: verify this citation against the full text.';
      if (verdict === 'supports') {
        reviewerNote = 'Reviewer: citation appears adequate for this claim (still verify).';
      } else if (verdict === 'partially_supports') {
        reviewerNote = 'Reviewer: only partial support — consider a stronger or additional source.';
      } else if (verdict === 'contradicts') {
        reviewerNote = 'Reviewer: this source may undermine the claim — do not use as support.';
      } else if (verdict === 'does_not_support' || verdict === 'insufficient_text') {
        reviewerNote = 'Reviewer: citation does not clearly support the claim — replace or remove.';
      }

      assessments.push({
        paperId,
        title: paper.title,
        verdict,
        confidence: judge?.confidence || 'low',
        rationale: judge?.rationale || 'Unable to judge.',
        excerpt: judge?.excerpt || null,
        reviewerNote,
      });

      // Best-effort Scholar Sidekick integrity on cited papers
      if (paper.doi || paper.pmid) {
        try {
          const [verify, retraction] = await Promise.all([
            ScholarSidekickService.verifyClaimedPaper({
              title: paper.title,
              doi: paper.doi,
              pmid: paper.pmid,
              authors: paperAuthors(paper),
              year: paper.publicationYear,
              journal: paper.journalName,
            }),
            ScholarSidekickService.checkRetraction(paper.doi || `PMID:${paper.pmid}`),
          ]);
          const last = assessments[assessments.length - 1];
          last.integrity = {
            verifyVerdict: verify.ok ? verify.verdict : undefined,
            isRetracted: retraction.ok ? retraction.isRetracted : undefined,
            hasConcern: retraction.ok
              ? retraction.hasConcern || retraction.hasCorrections
              : undefined,
          };
          if (retraction.ok && retraction.isRetracted) {
            last.reviewerNote =
              'CRITICAL: This paper appears retracted — do not cite as support.';
          } else if (verify.ok && verify.verdict === 'mismatch') {
            last.reviewerNote =
              'CRITICAL: Metadata does not match the DOI record — possible fabricated citation.';
          }
        } catch {
          /* optional */
        }
      }
    }

    const supports = assessments.filter((a) => a.verdict === 'supports').length;
    const partial = assessments.filter((a) => a.verdict === 'partially_supports').length;
    const bad = assessments.filter((a) =>
      ['does_not_support', 'contradicts', 'insufficient_text', 'cannot_judge'].includes(
        a.verdict
      )
    ).length;

    let overall: VerifyResult['overall'] = 'mixed';
    let message = '';
    if (assessments.length === 0) {
      overall = 'unsupported';
      message = 'No citations provided to verify.';
    } else if (supports > 0 && bad === 0) {
      overall = 'adequate';
      message = 'Cited sources appear to support the claim (verify before submission).';
    } else if (supports === 0 && partial === 0) {
      overall = 'unsupported';
      message =
        'Sorry — the cited reference(s) do not accurately support this statement. Please search manually for a better source.';
    } else if (supports === 0 && partial > 0) {
      overall = 'weak';
      message = 'Only weak/partial support found. Consider stronger evidence.';
    } else {
      overall = 'mixed';
      message = 'Mixed results — some citations help, others do not. Tighten your sourcing.';
    }

    return {
      claim,
      assessments,
      overall,
      message,
      disclaimer: DISCLAIMER,
    };
  }
}
