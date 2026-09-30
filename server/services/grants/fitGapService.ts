/**
 * Grant fit-gap analysis — what the call needs vs what the researcher has.
 */

import pool from '../../../database/config.js';
import { AIProviderFactory } from '../AIProviderFactory.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';

const parseJson = (value: unknown, fallback: unknown = null) => {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

async function buildResearcherProfile(userId: string): Promise<string> {
  const parts: string[] = [];

  const user = await pool.query(
    `SELECT first_name, last_name, research_interests, specialization, expertise, current_institution
     FROM users WHERE id = $1`,
    [userId]
  );
  const u = user.rows[0];
  if (u) {
    parts.push(
      `Researcher: ${[u.first_name, u.last_name].filter(Boolean).join(' ')}`.trim()
    );
    if (u.current_institution) parts.push(`Institution: ${u.current_institution}`);
    if (u.specialization) parts.push(`Specialization: ${u.specialization}`);
    if (u.research_interests) {
      parts.push(
        `Interests: ${
          typeof u.research_interests === 'string'
            ? u.research_interests
            : JSON.stringify(u.research_interests)
        }`
      );
    }
    if (u.expertise) {
      parts.push(
        `Expertise: ${
          typeof u.expertise === 'string' ? u.expertise : JSON.stringify(u.expertise)
        }`
      );
    }
  }

  const prefs = await pool.query(
    `SELECT keywords, disciplines, regions, funding_types, career_stage
     FROM user_grant_preferences WHERE user_id = $1`,
    [userId]
  );
  if (prefs.rows[0]) {
    const p = prefs.rows[0];
    parts.push(`Grant prefs keywords: ${JSON.stringify(parseJson(p.keywords, []))}`);
    parts.push(`Grant prefs disciplines: ${JSON.stringify(parseJson(p.disciplines, []))}`);
    parts.push(`Career stage: ${p.career_stage || 'unspecified'}`);
  }

  const notebooks = await pool.query(
    `SELECT title, content FROM lab_notebook_entries
     WHERE user_id = $1 ORDER BY created_at DESC LIMIT 8`,
    [userId]
  );
  if (notebooks.rows.length) {
    parts.push('Recent notebook themes:');
    notebooks.rows.forEach((n: any) => {
      parts.push(`- ${n.title}: ${String(n.content || '').slice(0, 280)}`);
    });
  }

  const protocols = await pool.query(
    `SELECT title, description, category FROM protocols
     WHERE author_id = $1 ORDER BY created_at DESC LIMIT 8`,
    [userId]
  );
  if (protocols.rows.length) {
    parts.push('Recent protocols:');
    protocols.rows.forEach((p: any) => {
      parts.push(`- ${p.title} (${p.category || 'n/a'}): ${String(p.description || '').slice(0, 200)}`);
    });
  }

  const evidence = await pool.query(
    `SELECT title, summary, conclusions FROM research_data
     WHERE user_id = $1 ORDER BY created_at DESC LIMIT 6`,
    [userId]
  );
  if (evidence.rows.length) {
    parts.push('Recent evidence packs:');
    evidence.rows.forEach((e: any) => {
      parts.push(
        `- ${e.title}: ${String(e.summary || '').slice(0, 200)} | ${String(e.conclusions || '').slice(0, 160)}`
      );
    });
  }

  return parts.join('\n').slice(0, 12000);
}

function extractJson(text: string): Record<string, unknown> | undefined {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    /* continue */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    try {
      return JSON.parse(fence[1].trim()) as Record<string, unknown>;
    } catch {
      /* continue */
    }
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export async function analyzeGrantFitGap(userId: string, grantId: string) {
  const grantResult = await pool.query(`SELECT * FROM grants WHERE id = $1`, [grantId]);
  const grant = grantResult.rows[0];
  if (!grant) {
    throw new Error('Grant not found');
  }

  const profile = await buildResearcherProfile(userId);

  const grantText = [
    `Title: ${grant.title}`,
    grant.summary ? `Summary: ${grant.summary}` : '',
    grant.programme ? `Programme: ${grant.programme}` : '',
    grant.sponsor ? `Sponsor: ${grant.sponsor}` : '',
    grant.action_type ? `Action type: ${grant.action_type}` : '',
    `Disciplines: ${JSON.stringify(parseJson(grant.disciplines, []))}`,
    `Keywords: ${JSON.stringify(parseJson(grant.keywords, []))}`,
    `Eligibility: ${JSON.stringify(parseJson(grant.eligibility, {}))}`,
    `Requirements: ${JSON.stringify(parseJson(grant.requirements, {}))}`,
    grant.region ? `Region: ${grant.region}` : '',
    grant.funding_min != null || grant.funding_max != null
      ? `Funding: ${grant.funding_min ?? '?'} – ${grant.funding_max ?? '?'} ${grant.funding_currency || ''}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const apiAssignment =
    (await getApiForTask(userId, 'content_writing')) ||
    (await getApiForTask(userId, 'data_analysis'));

  if (!apiAssignment) {
    // Heuristic fallback without LLM
    const pref = await pool.query(
      `SELECT keywords, disciplines FROM user_grant_preferences WHERE user_id = $1`,
      [userId]
    );
    const keywords = (parseJson(pref.rows[0]?.keywords, []) as string[]).map((k) =>
      String(k).toLowerCase()
    );
    const disciplines = (parseJson(pref.rows[0]?.disciplines, []) as string[]).map((d) =>
      String(d).toLowerCase()
    );
    const gKeywords = (parseJson(grant.keywords, []) as string[]).map((k) =>
      String(k).toLowerCase()
    );
    const gDisciplines = (parseJson(grant.disciplines, []) as string[]).map((d) =>
      String(d).toLowerCase()
    );
    const covered = [
      ...keywords.filter((k) => gKeywords.some((g) => g.includes(k) || k.includes(g))),
      ...disciplines.filter((d) => gDisciplines.some((g) => g.includes(d) || d.includes(g))),
    ];
    const gaps = gKeywords
      .filter((g) => !keywords.some((k) => g.includes(k) || k.includes(g)))
      .slice(0, 8);

    return {
      mode: 'heuristic' as const,
      fit_score: Math.min(100, covered.length * 12),
      covered: covered.map((c) => ({ area: c, evidence: 'Preference / interest overlap' })),
      gaps: gaps.map((g) => ({
        area: g,
        severity: 'medium',
        suggestion: `Strengthen evidence or narrative around "${g}"`,
      })),
      next_steps: [
        'Add missing keywords to your grant preferences',
        'Link evidence packs and protocols that support the call topics',
        'Draft a proposal section addressing the largest gaps',
      ],
      narrative:
        'Heuristic fit based on keyword/discipline overlap. Configure an AI API key for a deeper analysis.',
      provider: null,
    };
  }

  const provider = AIProviderFactory.createProvider(
    apiAssignment.provider,
    apiAssignment.apiKey
  );

  const system = `You are a research funding advisor. Compare a scientist's profile to a funding call.
Only use the provided profile and call text. Respond with valid JSON:
{
  "fit_score": 0-100,
  "covered": [{ "area": "...", "evidence": "..." }],
  "gaps": [{ "area": "...", "severity": "high"|"medium"|"low", "suggestion": "..." }],
  "next_steps": ["..."],
  "narrative": "2-4 sentences for the scientist"
}`;

  const user = [
    '=== RESEARCHER PROFILE ===',
    profile,
    '',
    '=== FUNDING CALL ===',
    grantText,
  ].join('\n');

  const response = await provider.chat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    {
      apiKey: apiAssignment.apiKey,
      temperature: 0.2,
      maxTokens: 2000,
    }
  );

  const structured = extractJson(response.content || '');
  return {
    mode: 'llm' as const,
    fit_score: Number(structured?.fit_score ?? 0),
    covered: Array.isArray(structured?.covered) ? structured!.covered : [],
    gaps: Array.isArray(structured?.gaps) ? structured!.gaps : [],
    next_steps: Array.isArray(structured?.next_steps) ? structured!.next_steps : [],
    narrative:
      typeof structured?.narrative === 'string'
        ? structured.narrative
        : response.content || '',
    provider: apiAssignment.provider,
    grant: {
      id: grant.id,
      title: grant.title,
    },
  };
}

export { buildResearcherProfile };
