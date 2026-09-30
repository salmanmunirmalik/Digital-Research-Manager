import {
  extractLibraryFind,
  heuristicPlan,
  looksLikeLibraryFind,
  looksLikePersonalAction,
  prefersInternalFirst,
  resolveRelativeDate,
} from '../../server/services/personalAssistant/heuristics.js';

describe('PersonalAssistant heuristics', () => {
  const today = '2026-09-19';

  test('detects personal action intents', () => {
    expect(looksLikePersonalAction('Remind me to call Peter tomorrow')).toBe(true);
    expect(looksLikePersonalAction('Write in my notes I got good results')).toBe(true);
    expect(looksLikePersonalAction('List my reminders')).toBe(true);
    expect(looksLikePersonalAction('What is CRISPR?')).toBe(false);
  });

  test('detects protocol library finds before any LLM', () => {
    const msg =
      'find the protocol for virology testing from my protocol library';
    expect(looksLikeLibraryFind(msg)).toBe(true);
    expect(prefersInternalFirst(msg)).toBe(true);
    const find = extractLibraryFind(msg);
    expect(find?.kind).toBe('protocol');
    expect(find?.query.toLowerCase()).toMatch(/virology/);
    const plan = heuristicPlan(msg, today);
    expect(plan?.actions[0].tool).toBe('find_protocol');
    expect(plan?.internalOnly).toBe(true);
  });

  test('resolves relative dates', () => {
    expect(resolveRelativeDate('call Peter tomorrow', today)).toBe('2026-09-20');
    expect(resolveRelativeDate('do it today', today)).toBe('2026-09-19');
    expect(resolveRelativeDate('meet on 2026-10-01', today)).toBe('2026-10-01');
  });

  test('plans reminder with due date', () => {
    const plan = heuristicPlan('Remind me to call Peter tomorrow', today);
    expect(plan).not.toBeNull();
    expect(plan!.actions[0].tool).toBe('create_reminder');
    expect(plan!.actions[0].args.title).toMatch(/call Peter/i);
    expect(plan!.actions[0].args.due_date).toBe('2026-09-20');
  });

  test('plans note creation', () => {
    const plan = heuristicPlan(
      'Write in my notes: I got good results today',
      today
    );
    expect(plan).not.toBeNull();
    expect(plan!.actions[0].tool).toBe('create_note');
    expect(String(plan!.actions[0].args.content)).toMatch(/good results/i);
  });

  test('plans list reminders', () => {
    const plan = heuristicPlan('List my reminders', today);
    expect(plan!.actions[0].tool).toBe('list_reminders');
  });
});
