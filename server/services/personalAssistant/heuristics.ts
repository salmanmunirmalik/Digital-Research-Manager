/**
 * Fast personal-assistant intent + date + library-find helpers (no AI / DB deps).
 * Ask AI must run these BEFORE any LLM token spend.
 */

import type { AssistantActionRequest } from './tools.js';

const ACTION_HINT =
  /\b(remind|reminder|todo|to-?do|task|note|notes|remember|schedule|calendar|meeting|appointment|call|add|save|write|create|list|show|what are my|find|search|open|locate|get|pull up|protocol|library|experiment|manuscript|draft)\b/i;

export function todayIso(timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function addDaysIso(baseIso: string, days: number): string {
  const d = new Date(`${baseIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Resolve relative date phrases → YYYY-MM-DD */
export function resolveRelativeDate(
  text: string,
  today: string = todayIso()
): string | null {
  const t = text.toLowerCase();
  if (/\btoday\b/.test(t)) return today;
  if (/\btomorrow\b/.test(t)) return addDaysIso(today, 1);
  if (/\bday after tomorrow\b/.test(t)) return addDaysIso(today, 2);
  if (/\bnext week\b/.test(t)) return addDaysIso(today, 7);

  const inDays = t.match(/\bin\s+(\d+)\s+days?\b/);
  if (inDays) return addDaysIso(today, Number(inDays[1]));

  const weekday = t.match(
    /\b(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/
  );
  if (weekday) {
    const names = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const target = names.indexOf(weekday[1]);
    const base = new Date(`${today}T12:00:00Z`);
    const cur = base.getUTCDay();
    let delta = (target - cur + 7) % 7;
    if (delta === 0) delta = 7;
    return addDaysIso(today, delta);
  }

  const iso = t.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  return null;
}

export function stripPageContext(message: string): string {
  const idx = message.indexOf('\n\n--- Page context ---');
  return (idx >= 0 ? message.slice(0, idx) : message).trim();
}

/** Clean search query extracted from natural language */
export function cleanSearchQuery(raw: string): string {
  return raw
    .replace(
      /\b(from|in)\s+(my|the)\s+(protocol\s+)?library\b/gi,
      ''
    )
    .replace(/\b(please|thanks|thank you)\b/gi, '')
    .replace(/[?.!]+$/g, '')
    .replace(/^[\s:;,\-–—]+|[\s:;,\-–—]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export type LibraryFindKind = 'protocol' | 'experiment' | 'writing_doc' | 'note';

export type LibraryFindIntent = {
  kind: LibraryFindKind;
  query: string;
  openBest: boolean;
};

/**
 * Detect "find/open X from my library" intents — must never spend LLM tokens.
 */
export function extractLibraryFind(message: string): LibraryFindIntent | null {
  const m = stripPageContext(message);
  if (!m) return null;

  const openBest = /\b(open|show|pull up|go to|take me to)\b/i.test(m);

  // Protocol library (highest priority for this product surface)
  if (/\bprotocols?\b/i.test(m)) {
    const patterns = [
      /(?:find|search|locate|get|open|show|pull up)\s+(?:(?:the|a|my|an)\s+)?protocols?\s+(?:for|about|on|called|named|titled|:)\s+(.+)/i,
      /(?:find|search|locate|get|open|show|pull up)\s+(.+?)\s+protocols?\b/i,
      /protocols?\s+(?:for|about|on|called|named|titled)\s+(.+)/i,
      /(?:from|in)\s+my\s+protocol\s+library[:\s]+(.+)/i,
      /(?:find|search|get|open)\s+(?:(?:the|a|my)\s+)?protocols?\s+(?:in|from)\s+my\b.*?\b(?:for|about|on)?\s*(.+)/i,
    ];
    for (const re of patterns) {
      const match = m.match(re);
      if (match?.[1]) {
        const query = cleanSearchQuery(match[1]);
        if (query.length >= 2) {
          return { kind: 'protocol', query, openBest: openBest || true };
        }
      }
    }
    // "find protocol …" with leftover words after stripping boilerplate
    if (/\b(find|search|locate|get|open|show)\b.*\bprotocols?\b/i.test(m)) {
      let q = m
        .replace(
          /\b(find|search|locate|get|open|show|pull up|the|a|an|my|protocol|protocols|for|about|on|from|in|library)\b/gi,
          ' '
        )
        .replace(/\s+/g, ' ')
        .trim();
      q = cleanSearchQuery(q);
      if (q.length >= 2) return { kind: 'protocol', query: q, openBest: true };
    }
  }

  // Experiments
  if (/\bexperiments?\b/i.test(m) && /\b(find|search|open|show|list|my)\b/i.test(m)) {
    const match = m.match(
      /(?:find|search|open|show)\s+(?:(?:the|a|my)\s+)?experiments?\s+(?:for|about|on|called|named)?\s*(.+)/i
    );
    const query = cleanSearchQuery(match?.[1] || m.replace(/\bexperiments?\b/gi, ''));
    if (query.length >= 2) return { kind: 'experiment', query, openBest };
  }

  // Writing drafts
  if (
    /\b(manuscript|draft|writing\s+studio|document)\b/i.test(m) &&
    /\b(find|search|open|show)\b/i.test(m)
  ) {
    const match = m.match(
      /(?:find|search|open|show)\s+(?:(?:the|a|my)\s+)?(?:manuscript|draft|document)\s+(?:called|named|titled|about|on)?\s*(.+)/i
    );
    const query = cleanSearchQuery(match?.[1] || '');
    if (query.length >= 2) return { kind: 'writing_doc', query, openBest };
  }

  return null;
}

export function looksLikeLibraryFind(message: string): boolean {
  return extractLibraryFind(message) !== null;
}

export function looksLikePersonalAction(message: string): boolean {
  const m = message.trim();
  if (!m || m.length > 2000) return false;
  if (looksLikeLibraryFind(m)) return true;
  if (!ACTION_HINT.test(m)) return false;
  const personal =
    /\b(remind me|add (a |my )?note|write (in|to) my notes|save (a |this )?note|note that|create (a )?(reminder|task|todo)|schedule|put (it |this )?on my calendar|list my (notes|reminders|tasks)|show my (notes|reminders)|what are my (notes|reminders))\b/i.test(
      m
    ) ||
    /^(remind|note|todo|schedule|add reminder|add note)\b/i.test(m);
  return personal || /\b(remind me|my notes|my reminders|my calendar)\b/i.test(m);
}

/**
 * True when this request should be tried with internal tools before any LLM.
 */
export function prefersInternalFirst(message: string): boolean {
  const m = stripPageContext(message);
  if (looksLikeLibraryFind(m) || looksLikePersonalAction(m)) return true;
  return /\b(from my|in my|my protocol|my library|my notes|my reminders|my experiments|my drafts)\b/i.test(
    m
  );
}

/** Fast path without LLM for common phrasings */
export function heuristicPlan(
  message: string,
  today: string
): { reply: string; actions: AssistantActionRequest[]; internalOnly?: boolean } | null {
  const m = stripPageContext(message);

  const find = extractLibraryFind(m);
  if (find) {
    if (find.kind === 'protocol') {
      return {
        reply: `Searching your protocol library for “${find.query}”…`,
        internalOnly: true,
        actions: [
          {
            tool: 'find_protocol',
            args: { query: find.query, open_best: find.openBest, limit: 8 },
          },
        ],
      };
    }
    if (find.kind === 'experiment') {
      return {
        reply: `Searching your experiments for “${find.query}”…`,
        internalOnly: true,
        actions: [
          {
            tool: 'find_experiment',
            args: { query: find.query, open_best: find.openBest, limit: 8 },
          },
        ],
      };
    }
    if (find.kind === 'writing_doc') {
      return {
        reply: `Searching your Writing Studio drafts for “${find.query}”…`,
        internalOnly: true,
        actions: [
          {
            tool: 'find_writing_doc',
            args: { query: find.query, open_best: find.openBest, limit: 8 },
          },
        ],
      };
    }
  }

  if (/\b(list|show|what are)\s+my\s+notes\b/i.test(m) || /^my notes\??$/i.test(m)) {
    return {
      reply: 'Here are your recent notes.',
      internalOnly: true,
      actions: [{ tool: 'list_notes', args: { limit: 8 } }],
    };
  }
  if (
    /\b(list|show|what are)\s+my\s+(reminders|tasks|todos)\b/i.test(m) ||
    /^my reminders\??$/i.test(m)
  ) {
    return {
      reply: 'Here are your open reminders.',
      internalOnly: true,
      actions: [{ tool: 'list_reminders', args: { limit: 8 } }],
    };
  }
  if (/\b(list|show)\s+my\s+(calendar|events|meetings)\b/i.test(m)) {
    return {
      reply: 'Here are your upcoming events.',
      internalOnly: true,
      actions: [{ tool: 'list_calendar_events', args: { limit: 8 } }],
    };
  }
  if (/\b(list|show)\s+my\s+protocols?\b/i.test(m)) {
    return {
      reply: 'Here are protocols from your library.',
      internalOnly: true,
      actions: [{ tool: 'find_protocol', args: { query: '', limit: 12 } }],
    };
  }

  const notePatterns = [
    /(?:add|save|create|write)\s+(?:(?:a|an|this|my)\s+)?(?:quick\s+)?notes?\s*(?:that|saying|about|:)?\s*["“]?(.+?)["”]?$/i,
    /write\s+in\s+my\s+notes\s*(?:that|:)?\s*["“]?(.+?)["”]?$/i,
    /note\s+that\s+["“]?(.+?)["”]?$/i,
    /^note[:\s]+(.+)$/i,
  ];
  for (const re of notePatterns) {
    const match = m.match(re);
    if (match?.[1]?.trim()) {
      const content = match[1].trim().replace(/^["“]|["”]$/g, '');
      return {
        reply: 'Saving that to your notes.',
        internalOnly: true,
        actions: [{ tool: 'create_note', args: { content } }],
      };
    }
  }

  const remindPatterns = [
    /remind\s+me\s+to\s+(.+)$/i,
    /(?:add|create|set)\s+(?:a\s+)?(?:reminder|todo|task)\s*(?:to|:)?\s*(.+)$/i,
    /^reminder[:\s]+(.+)$/i,
  ];
  for (const re of remindPatterns) {
    const match = m.match(re);
    if (match?.[1]?.trim()) {
      const rest = match[1].trim();
      const due = resolveRelativeDate(rest, today);
      let title = rest
        .replace(
          /\s+(tomorrow|today|day after tomorrow|next week|in \d+ days?|on (monday|tuesday|wednesday|thursday|friday|saturday|sunday)|by 20\d{2}-\d{2}-\d{2}|20\d{2}-\d{2}-\d{2})\s*$/i,
          ''
        )
        .trim();
      if (!title) title = rest;
      return {
        reply: due ? `Setting a reminder for ${due}.` : 'Setting that reminder.',
        internalOnly: true,
        actions: [
          {
            tool: 'create_reminder',
            args: { title, due_date: due || undefined },
          },
        ],
      };
    }
  }

  const cal = m.match(
    /(?:schedule|add|create)\s+(?:a\s+)?(?:meeting|appointment|event)\s+(?:(?:with|about|for)\s+)?(.+?)(?:\s+on\s+|\s+)(tomorrow|today|20\d{2}-\d{2}-\d{2}|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)).*$/i
  );
  if (cal?.[1] && cal?.[2]) {
    const due = resolveRelativeDate(cal[2], today) || resolveRelativeDate(m, today);
    if (due) {
      return {
        reply: `Adding that to your calendar on ${due}.`,
        internalOnly: true,
        actions: [
          {
            tool: 'create_calendar_event',
            args: { title: cal[1].trim(), event_date: due },
          },
        ],
      };
    }
  }

  return null;
}
