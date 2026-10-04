import type { FloorScenario } from '../../utils/labFloors/types';

/** Colleagues — professional behavior */
export const colleagues: FloorScenario = {
  id: 'colleagues',
  title: 'Colleagues',
  subtitle: 'Credit, conflict, meetings, and asking for feedback like a professional.',
  durationMinutes: 8,
  skills: ['credit', 'conflict', 'feedback', 'meetings'],
  startSceneId: 'figure',
  scenes: [
    {
      id: 'figure',
      title: 'The missing name',
      narration:
        'In group meeting, a senior student presents a figure you generated last week. Your name isn’t on the slide. They say “we generated this.”',
      roleFlavor: {
        phd: 'Authorship and visibility will shape your career narrative.',
        ra: 'Credit is how your contributions stay visible beyond the bench.',
        intern: 'You have little leverage — but silence teaches the wrong norm.',
      },
      choices: [
        {
          id: 'explode',
          text: 'Interrupt angrily in front of everyone.',
          consequence: 'You may be right — and still lose the room. Public heat rarely helps.',
          nextSceneId: 'after',
          skillDeltas: { credit: 'ok', conflict: 'miss' },
        },
        {
          id: 'private',
          text: 'Afterward, privately: “I’d like my contribution named — can we fix the slide?”',
          consequence: 'Firm and professional. Most decent colleagues course-correct.',
          nextSceneId: 'after',
          skillDeltas: { credit: 'good', conflict: 'good' },
        },
        {
          id: 'swallow',
          text: 'Say nothing — “I don’t want drama.”',
          consequence: 'Drama avoided; your work becomes invisible folklore.',
          nextSceneId: 'after',
          skillDeltas: { credit: 'miss' },
        },
      ],
    },
    {
      id: 'after',
      title: 'They respond',
      narration:
        'They shrug: “It was a team thing. Don’t be precious.” Your chest tightens.',
      choices: [
        {
          id: 'escalate_pi',
          text: 'Immediately email the PI cc’ing the whole lab.',
          consequence: 'Nuclear. Sometimes needed later — rarely as first reply.',
          nextSceneId: 'meeting',
          skillDeltas: { conflict: 'miss', credit: 'ok' },
        },
        {
          id: 'facts',
          text: 'Stay factual: dates, files, what you did — ask for corrected attribution going forward.',
          consequence: 'Hard to argue with a timeline. You’ve set a norm without a war.',
          nextSceneId: 'meeting',
          skillDeltas: { credit: 'good', conflict: 'good' },
        },
        {
          id: 'sarcasm',
          text: 'Reply with sarcasm in the lab chat.',
          consequence: 'Audience laughter; long-term allies decrease.',
          nextSceneId: 'meeting',
          skillDeltas: { conflict: 'miss' },
        },
      ],
    },
    {
      id: 'meeting',
      title: 'Lab meeting hygiene',
      narration:
        'Next week you’re presenting. You’ve got messy plots and a beautiful speculation paragraph.',
      choices: [
        {
          id: 'speculate',
          text: 'Lead with speculation; hide the messy caveats.',
          consequence: 'Short-term dazzle; long-term skepticism from people who matter.',
          nextSceneId: 'feedback',
          skillDeltas: { meetings: 'miss' },
        },
        {
          id: 'clear',
          text: 'Lead with question → result → limitation → next experiment.',
          consequence: 'Clear. Mentor-able. This is how meetings create progress.',
          nextSceneId: 'feedback',
          skillDeltas: { meetings: 'good', feedback: 'good' },
        },
        {
          id: 'data_dump',
          text: 'Show every plot you made without a thread.',
          consequence: 'People get lost. Volume isn’t rigor.',
          nextSceneId: 'feedback',
          skillDeltas: { meetings: 'miss' },
        },
      ],
    },
    {
      id: 'feedback',
      title: 'Asking for feedback',
      narration:
        'Your PI has 12 minutes. You can ask for anything.',
      choices: [
        {
          id: 'vague_fb',
          text: '“What do you think?”',
          consequence: 'You get vague warmth. No decisions.',
          nextSceneId: 'conflict2',
          skillDeltas: { feedback: 'miss', meetings: 'ok' },
        },
        {
          id: 'sharp_fb',
          text: '“Should we kill Aim 2, or run one more control first? I need a decision.”',
          consequence: 'You leave with a call. That’s the job of feedback.',
          nextSceneId: 'conflict2',
          skillDeltas: { feedback: 'good', meetings: 'good' },
        },
        {
          id: 'praise',
          text: 'Fish for reassurance that you’re doing fine.',
          consequence: 'You get it. Your project doesn’t.',
          nextSceneId: 'conflict2',
          skillDeltas: { feedback: 'miss' },
        },
      ],
    },
    {
      id: 'conflict2',
      title: 'Bench conflict',
      narration:
        'A peer leaves a shared centrifuge dirty — again — after you asked last month.',
      choices: [
        {
          id: 'passive',
          text: 'Clean it silently and vent to a friend.',
          consequence: 'Problem continues. Resentment composts.',
          nextSceneId: 'collab',
          skillDeltas: { conflict: 'miss' },
        },
        {
          id: 'direct',
          text: 'Direct, kind: “When the rotor is left wet, the next run fails — can we reset to wipe-down?”',
          consequence: 'Behavior-focused, not character-focused. Often works.',
          nextSceneId: 'collab',
          skillDeltas: { conflict: 'good' },
        },
        {
          id: 'poster',
          text: 'Print a passive-aggressive sign with five exclamation marks.',
          consequence: 'Comedy for some; culture poison for others.',
          nextSceneId: 'collab',
          skillDeltas: { conflict: 'miss' },
        },
      ],
    },
    {
      id: 'collab',
      title: 'Collaboration ask',
      narration:
        'Another lab wants your protocol. They offer co-authorship “maybe.”',
      choices: [
        {
          id: 'yes_instant',
          text: 'Send everything immediately with no terms.',
          consequence: 'Generous — and sometimes exploited. Clarity is kindness.',
          nextSceneId: null,
          skillDeltas: { credit: 'miss', feedback: 'ok' },
        },
        {
          id: 'terms',
          text: 'Agree in writing: what they get, what credit looks like, who approves figures.',
          consequence: 'Adult collaboration. Relationships survive contact with reality.',
          nextSceneId: null,
          skillDeltas: { credit: 'good', conflict: 'good', meetings: 'good' },
        },
        {
          id: 'refuse_cold',
          text: 'Refuse coldly without explanation.',
          consequence: 'You protect IP and burn a bridge you might need.',
          nextSceneId: null,
          skillDeltas: { credit: 'ok', conflict: 'miss' },
        },
      ],
    },
  ],
  debrief: {
    summary:
      'Professional labs run on credit clarity, low-drama conflict, decision-seeking feedback, and meetings that create next experiments — not performances.',
    tips: [
      'Address credit privately and specifically before it hardens into habit.',
      'Ask mentors for decisions, not vibes.',
      'Name behaviors and impacts; avoid character attacks.',
    ],
    skillLabels: {
      credit: 'Protect & share credit',
      conflict: 'Handle conflict cleanly',
      feedback: 'Ask for useful feedback',
      meetings: 'Run / use meetings well',
    },
  },
};
