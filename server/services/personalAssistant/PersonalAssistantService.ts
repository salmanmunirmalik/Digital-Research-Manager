/**
 * Personal assistant — Ask AI can take actions.
 * Priority: internal DB/tools (0 tokens) → only if needed, LLM planner / research chat.
 */

import { AIProviderFactory } from '../AIProviderFactory.js';
import { ChatMessage } from '../AIProvider.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getApiKeyWithFallback } from '../../routes/aiProviderKeys.js';
import {
  consumePlatformQuota,
  tryPlatformAiAccess,
} from '../platformAiAccess.js';
import {
  ASSISTANT_TOOL_CATALOG,
  AssistantActionRequest,
  AssistantActionResult,
  AssistantToolName,
  executeAssistantTool,
} from './tools.js';
import {
  heuristicPlan,
  looksLikeLibraryFind,
  looksLikePersonalAction,
  prefersInternalFirst,
  resolveRelativeDate,
  stripPageContext,
  todayIso,
} from './heuristics.js';

export type PersonalAssistantResult = {
  handled: boolean;
  content: string;
  actions: AssistantActionResult[];
  apiUsed: string | null;
  /** When set, UI should navigate (e.g. open protocol page). */
  navigateTo?: string;
  source: 'internal' | 'llm_planner';
  /** Internal search found nothing — caller may fall through to LLM with this hint. */
  libraryMiss?: { tool: string; query: string };
};

export {
  heuristicPlan,
  looksLikePersonalAction,
  looksLikeLibraryFind,
  prefersInternalFirst,
  resolveRelativeDate,
  todayIso,
} from './heuristics.js';

const TOOL_NAMES: AssistantToolName[] = [
  'create_note',
  'list_notes',
  'create_reminder',
  'list_reminders',
  'create_calendar_event',
  'list_calendar_events',
  'find_protocol',
  'find_experiment',
  'find_writing_doc',
];

const FIND_TOOLS = new Set<AssistantToolName>([
  'find_protocol',
  'find_experiment',
  'find_writing_doc',
]);

function extractJsonObject(text: string): unknown | null {
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

function normalizePlan(raw: unknown): {
  mode: 'action' | 'chat';
  reply: string;
  actions: AssistantActionRequest[];
} {
  if (!raw || typeof raw !== 'object') {
    return { mode: 'chat', reply: '', actions: [] };
  }
  const obj = raw as Record<string, unknown>;
  const mode = obj.mode === 'action' ? 'action' : 'chat';
  const reply = String(obj.reply || obj.message || '').trim();
  const actionsRaw = Array.isArray(obj.actions) ? obj.actions : [];
  const actions: AssistantActionRequest[] = [];
  for (const a of actionsRaw) {
    if (!a || typeof a !== 'object') continue;
    const tool = String((a as { tool?: string }).tool || '') as AssistantToolName;
    if (!TOOL_NAMES.includes(tool)) continue;
    const args =
      typeof (a as { args?: unknown }).args === 'object' && (a as { args: object }).args
        ? ((a as { args: Record<string, unknown> }).args as Record<string, unknown>)
        : {};
    actions.push({ tool, args });
  }
  return { mode: actions.length ? 'action' : mode, reply, actions };
}

async function resolveAssistantProvider(
  userId: string
): Promise<{ provider: string; providerName: string; apiKey: string } | null> {
  let apiAssignment = await getApiForTask(userId, 'general_chat');
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
  return {
    provider: 'google_gemini',
    providerName: 'Google Gemini',
    apiKey: key,
  };
}

async function llmPlan(
  userId: string,
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  today: string,
  timeZone: string
): Promise<{
  plan: ReturnType<typeof normalizePlan>;
  apiUsed: string | null;
}> {
  const assignment = await resolveAssistantProvider(userId);
  if (!assignment) {
    return {
      plan: { mode: 'chat', reply: '', actions: [] },
      apiUsed: null,
    };
  }

  const ai = AIProviderFactory.createProvider(assignment.provider, assignment.apiKey);
  const system = `${ASSISTANT_TOOL_CATALOG}

TODAY_ISO=${today}
TIMEZONE=${timeZone}

Respond with ONLY valid JSON:
{
  "mode": "action" | "chat",
  "reply": "short confirmation or answer to the user",
  "actions": [ { "tool": "<name>", "args": { ... } } ]
}
If the user wants something from their library, use find_* tools — never invent content.
If this is not an app action request, use mode "chat", empty actions, and put your helpful answer in reply.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    ...conversationHistory.slice(-6).map((m) => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: String(m.content || '').slice(0, 2000),
    })),
    {
      role: 'user',
      content: stripPageContext(message),
    },
  ];

  const response = await ai.chat(messages, {
    temperature: 0.2,
    maxTokens: 800,
  });
  const parsed = normalizePlan(extractJsonObject(response.content || ''));
  return { plan: parsed, apiUsed: assignment.providerName };
}

function composeReply(
  plannedReply: string,
  results: AssistantActionResult[]
): string {
  const parts: string[] = [];
  if (plannedReply) parts.push(plannedReply);
  const ok = results.filter((r) => r.ok);
  const fail = results.filter((r) => !r.ok);
  if (ok.length) {
    parts.push(ok.map((r) => `✓ ${r.summary}`).join('\n'));
  }
  if (fail.length) {
    parts.push(fail.map((r) => `✗ ${r.summary}`).join('\n'));
  }
  return parts.filter(Boolean).join('\n\n') || 'Done.';
}

/**
 * Try internal tools first (0 AI tokens). Fall through to LLM chat only when
 * library search finds nothing or the message is not an actionable request.
 */
export async function tryHandlePersonalAssistant(opts: {
  userId: string;
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  timeZone?: string;
}): Promise<PersonalAssistantResult | null> {
  const { userId, message, conversationHistory = [], timeZone = 'UTC' } = opts;
  const userText = stripPageContext(message);

  if (!prefersInternalFirst(userText) && !looksLikePersonalAction(userText)) {
    return null;
  }

  const today = todayIso(timeZone);
  let apiUsed: string | null = null;
  let source: 'internal' | 'llm_planner' = 'internal';

  // 1) Heuristics / library find — NEVER calls LLM
  let plan = heuristicPlan(userText, today);

  // 2) LLM planner only if heuristics missed AND it's NOT a library-find phrasing
  //    (library finds must stay internal-only; empty results fall through to research chat)
  if (!plan && looksLikeLibraryFind(userText)) {
    // Should be rare — extractLibraryFind failed but looksLike matched.
    // Force a protocol search from remaining keywords rather than LLM.
    plan = heuristicPlan(`find protocol ${userText}`, today);
  }

  if (!plan && looksLikePersonalAction(userText) && !looksLikeLibraryFind(userText)) {
    try {
      const llm = await llmPlan(userId, userText, conversationHistory, today, timeZone);
      apiUsed = llm.apiUsed;
      source = 'llm_planner';
      if (llm.plan.mode === 'chat' && !llm.plan.actions.length) {
        if (llm.plan.reply) {
          return {
            handled: true,
            content: llm.plan.reply,
            actions: [],
            apiUsed,
            source,
          };
        }
        return null;
      }
      plan = { reply: llm.plan.reply, actions: llm.plan.actions };
    } catch (err) {
      console.error('Personal assistant LLM plan failed:', err);
      return null;
    }
  }

  if (!plan?.actions.length) {
    return null;
  }

  const actions = plan.actions.map((a) => {
    if (
      (a.tool === 'create_reminder' || a.tool === 'create_calendar_event') &&
      !a.args.due_date &&
      !a.args.event_date
    ) {
      const due = resolveRelativeDate(userText, today);
      if (due) {
        return {
          ...a,
          args: {
            ...a.args,
            ...(a.tool === 'create_reminder' ? { due_date: due } : { event_date: due }),
          },
        };
      }
    }
    return a;
  });

  const results: AssistantActionResult[] = [];
  for (const action of actions.slice(0, 5)) {
    results.push(await executeAssistantTool(userId, action));
  }

  // Library find with zero matches → fall through to LLM, with miss metadata
  const findResults = results.filter((r) => FIND_TOOLS.has(r.tool));
  if (
    findResults.length > 0 &&
    findResults.every((r) => r.notFound) &&
    results.every((r) => !r.ok || r.notFound)
  ) {
    const miss = findResults[0];
    return {
      handled: false,
      content: miss.summary,
      actions: results,
      apiUsed: null,
      source: 'internal',
      libraryMiss: {
        tool: miss.tool,
        query: String(miss.data?.query || ''),
      },
    };
  }

  const navigateTo = results.find((r) => r.navigateTo)?.navigateTo;

  return {
    handled: true,
    content: composeReply(plan.reply, results),
    actions: results,
    apiUsed,
    navigateTo,
    source,
  };
}
