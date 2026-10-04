import type { FloorScenario } from '../../utils/labFloors/types';

/** Day One — joining a new lab */
export const dayOne: FloorScenario = {
  id: 'day-one',
  title: 'Day One',
  subtitle: 'Join a new lab without freezing — intros, notebooks, and asking for help.',
  durationMinutes: 8,
  skills: ['ask_early', 'document', 'orient', 'respect_norms'],
  startSceneId: 'arrival',
  scenes: [
    {
      id: 'arrival',
      title: 'Monday, 9:05',
      narration:
        'Your first morning. The lab door is propped open. Someone is pipetting with headphones on; two people argue softly at a whiteboard about “controls.” Your PI said “find Sam — they’ll get you started.” You don’t know who Sam is.',
      roleFlavor: {
        phd: 'You feel the weight of “this is your scientific home for years.”',
        ra: 'You’re expected to be useful quickly — but nobody handed you a map.',
        intern: 'You have eight weeks. Every hour feels expensive.',
      },
      choices: [
        {
          id: 'hover',
          text: 'Stand near the door and wait for someone to notice you.',
          consequence:
            'Ten minutes pass. Someone eventually asks if you’re lost. You feel smaller than you need to.',
          nextSceneId: 'intro_late',
          skillDeltas: { ask_early: 'miss', orient: 'miss' },
        },
        {
          id: 'ask_nearest',
          text: 'Quietly ask the nearest person: “Hi — I’m new. Who is Sam?”',
          consequence:
            'They smile, point to a desk, and walk you over. You’ve used one sentence to unlock the room.',
          nextSceneId: 'meet_sam',
          skillDeltas: { ask_early: 'good', orient: 'good' },
        },
        {
          id: 'email_pi',
          text: 'Email your PI from the doorway asking where Sam sits.',
          consequence:
            'Your PI is in back-to-backs. The reply arrives at 3pm. You’ve burned a morning of orientation.',
          nextSceneId: 'intro_late',
          skillDeltas: { ask_early: 'miss', respect_norms: 'ok' },
        },
      ],
    },
    {
      id: 'intro_late',
      title: 'Catching up',
      narration:
        'Eventually you find Sam. They look busy. “Ah — you’re the new person. I thought you were starting tomorrow. Grab a stool.”',
      choices: [
        {
          id: 'apologize_over',
          text: 'Over-apologize and offer to come back later.',
          consequence: 'Sam sighs: “No, stay. Just… let’s move.” The tone is already awkward.',
          nextSceneId: 'tour',
          skillDeltas: { ask_early: 'ok' },
        },
        {
          id: 'reset_clean',
          text: 'Reset cleanly: “Thanks — I should have asked earlier. What’s the best first hour?”',
          consequence: 'Sam relaxes. Clear ownership of the miss builds trust.',
          nextSceneId: 'tour',
          skillDeltas: { ask_early: 'good', respect_norms: 'good' },
        },
      ],
    },
    {
      id: 'meet_sam',
      title: 'Sam’s desk',
      narration:
        'Sam is mid-setup. “Welcome. Safety first, then bench etiquette, then your notebook. Do you prefer paper or ELN?”',
      choices: [
        {
          id: 'whatever',
          text: '“Whatever you use is fine.”',
          consequence: 'Fine — but you haven’t shown judgment. Sam picks for you.',
          nextSceneId: 'tour',
          skillDeltas: { document: 'ok', respect_norms: 'ok' },
        },
        {
          id: 'ask_norm',
          text: '“What does the lab standardize on? I’ll match that, then add my habits.”',
          consequence: 'Sam nods. Matching lab norms first is how adults join systems.',
          nextSceneId: 'tour',
          skillDeltas: { document: 'good', respect_norms: 'good' },
        },
        {
          id: 'demand_eln',
          text: 'Insist on your personal favorite tool immediately.',
          consequence:
            'Sam’s face tightens. You’ll fight process wars before you’ve run a gel.',
          nextSceneId: 'tour',
          skillDeltas: { respect_norms: 'miss', document: 'ok' },
        },
      ],
    },
    {
      id: 'tour',
      title: 'The tour',
      narration:
        'Sam walks you past freezers, the chemical cabinet, and a shared reagent fridge. “Don’t move other people’s aliquots. Label everything with date + initials. Questions?”',
      choices: [
        {
          id: 'no_qs',
          text: 'Shake your head — you don’t want to seem needy.',
          consequence:
            'Two days later you’ll thaw the wrong box. Silence felt polite; it was expensive.',
          nextSceneId: 'notebook',
          skillDeltas: { ask_early: 'miss', orient: 'miss' },
        },
        {
          id: 'ask_map',
          text: 'Ask where the −80 inventory sheet lives and who owns common stocks.',
          consequence: 'Sam shows you a spreadsheet and a whiteboard. You’ve just found the lab’s memory.',
          nextSceneId: 'notebook',
          skillDeltas: { ask_early: 'good', orient: 'good' },
        },
        {
          id: 'ask_everything',
          text: 'Fire twelve questions in a row before they finish a sentence.',
          consequence: 'Sam answers two, then says “write a list — we’ll do a second pass.”',
          nextSceneId: 'notebook',
          skillDeltas: { ask_early: 'ok', respect_norms: 'ok' },
        },
      ],
    },
    {
      id: 'notebook',
      title: 'Notebook habits',
      narration:
        'Sam opens a notebook page. “Today: write what you did, why, lot numbers, and what ‘good’ looked like. Future-you is a stranger.”',
      choices: [
        {
          id: 'photo_only',
          text: 'Decide you’ll just photograph the whiteboard later.',
          consequence: 'Photos without context rot. Your PI will ask for details you never captured.',
          nextSceneId: 'ask_help',
          skillDeltas: { document: 'miss' },
        },
        {
          id: 'template',
          text: 'Start a simple template: Aim · Steps · Reagents · Result · Next.',
          consequence: 'Ugly but usable. Consistency beats aesthetics in month one.',
          nextSceneId: 'ask_help',
          skillDeltas: { document: 'good' },
        },
        {
          id: 'wait_perfect',
          text: 'Wait until you invent the perfect Notion system tonight.',
          consequence: 'Nothing gets written today. Perfection is a delay tactic.',
          nextSceneId: 'ask_help',
          skillDeltas: { document: 'miss' },
        },
      ],
    },
    {
      id: 'ask_help',
      title: 'Stuck already',
      narration:
        'You’re asked to find a plasmid map. The shared drive has five folders named “final_FINAL.” Sam is in a meeting for an hour.',
      choices: [
        {
          id: 'guess',
          text: 'Open random folders until something looks right.',
          consequence: 'You email the wrong map to a collaborator. Recoverable — embarrassing.',
          nextSceneId: 'week_one',
          skillDeltas: { ask_early: 'miss', document: 'miss' },
        },
        {
          id: 'slack_channel',
          text: 'Post in the lab chat: “Which folder has pX map v3? Happy to be pointed.”',
          consequence: 'Someone replies in four minutes with a link. Asking in public is often faster than waiting.',
          nextSceneId: 'week_one',
          skillDeltas: { ask_early: 'good', respect_norms: 'good' },
        },
        {
          id: 'wait_sam',
          text: 'Sit idle until Sam returns.',
          consequence: 'Polite paralysis. Your first day teaches the wrong lesson about ownership.',
          nextSceneId: 'week_one',
          skillDeltas: { ask_early: 'miss', orient: 'ok' },
        },
      ],
    },
    {
      id: 'week_one',
      title: 'End of day one',
      narration:
        'Sam asks: “What will you do differently tomorrow?” This is a real question — not small talk.',
      choices: [
        {
          id: 'vague',
          text: '“Work hard and learn everything.”',
          consequence: 'Sam smiles politely. Vague answers don’t build a plan.',
          nextSceneId: null,
          skillDeltas: { orient: 'ok' },
        },
        {
          id: 'specific',
          text: '“I’ll finish safety SOP, map the reagent owners, and draft my notebook template.”',
          consequence: 'Sam looks relieved. Specificity is how juniors become trusted.',
          nextSceneId: null,
          skillDeltas: { orient: 'good', document: 'good', ask_early: 'good' },
        },
        {
          id: 'defer',
          text: '“Whatever you tell me to do.”',
          consequence: 'Dependency feels humble; over time it becomes a burden on mentors.',
          nextSceneId: null,
          skillDeltas: { orient: 'miss', ask_early: 'ok' },
        },
      ],
    },
  ],
  debrief: {
    summary:
      'Joining a lab is less about brilliance on day one and more about orientation, norms, documentation, and asking early. Silence often costs more than a simple question.',
    tips: [
      'Ask one clarifying question early: who owns what, and where does the lab keep its memory?',
      'Match lab notebook norms first; personalize later.',
      'Prefer public, lightweight asks (chat) over waiting in private paralysis.',
    ],
    skillLabels: {
      ask_early: 'Ask early',
      document: 'Document as you go',
      orient: 'Orient to the system',
      respect_norms: 'Respect lab norms',
    },
  },
};
