import type { FloorScenario } from '../../utils/labFloors/types';

/** Skill Sprint — learning a method as the least experienced person */
export const skillSprint: FloorScenario = {
  id: 'skill-sprint',
  title: 'Skill Sprint',
  subtitle: 'Learn a method when you’re the least experienced person in the room.',
  durationMinutes: 8,
  skills: ['observe', 'practice', 'notes', 'humility'],
  startSceneId: 'shadow',
  scenes: [
    {
      id: 'shadow',
      title: 'Shadowing',
      narration:
        'You’re learning Western blotting from Maya, who is fast and slightly impatient. First hour: watch only.',
      roleFlavor: {
        phd: 'You need competence without pretending expertise.',
        ra: 'Reliability matters more than looking clever.',
        intern: 'You have limited sessions — attention is your scarce resource.',
      },
      choices: [
        {
          id: 'phone',
          text: 'Half-watch while answering messages.',
          consequence: 'You miss the critical transfer step. Maya notices.',
          nextSceneId: 'ask',
          skillDeltas: { observe: 'miss', humility: 'miss' },
        },
        {
          id: 'active',
          text: 'Watch actively: note order, times, and what “good” looks like.',
          consequence: 'Your notes become a second brain. Maya relaxes.',
          nextSceneId: 'ask',
          skillDeltas: { observe: 'good', notes: 'good' },
        },
        {
          id: 'interrupt',
          text: 'Interrupt every 30 seconds with theory questions.',
          consequence: 'Curiosity is good; timing is a skill. Maya shortens the session.',
          nextSceneId: 'ask',
          skillDeltas: { observe: 'ok', humility: 'ok' },
        },
      ],
    },
    {
      id: 'ask',
      title: 'When to ask',
      narration:
        'Maya says “equilibrate the membrane.” You’ve heard the word; you’ve never done it.',
      choices: [
        {
          id: 'nod',
          text: 'Nod as if you understand.',
          consequence: 'You fake competence into a ruined blot.',
          nextSceneId: 'hands',
          skillDeltas: { humility: 'miss', observe: 'miss' },
        },
        {
          id: 'ask_now',
          text: 'Ask: “Show me once what equilibrate means here — timing and volume.”',
          consequence: 'One minute now saves an afternoon. Maya prefers honesty.',
          nextSceneId: 'hands',
          skillDeltas: { humility: 'good', observe: 'good' },
        },
        {
          id: 'google',
          text: 'Secretly Google under the bench.',
          consequence: 'Generic advice ≠ this lab’s SOP. You still mess up volumes.',
          nextSceneId: 'hands',
          skillDeltas: { humility: 'ok', notes: 'miss' },
        },
      ],
    },
    {
      id: 'hands',
      title: 'First hands-on',
      narration:
        'Maya lets you load gels. Your hands shake. A lane looks overloaded.',
      choices: [
        {
          id: 'hide',
          text: 'Hide the mistake and hope.',
          consequence: 'The blot tells on you later — louder.',
          nextSceneId: 'sop',
          skillDeltas: { humility: 'miss', practice: 'miss' },
        },
        {
          id: 'flag',
          text: 'Flag it: “Lane 4 may be overloaded — note it and continue?”',
          consequence: 'Mistakes become data. Trust increases.',
          nextSceneId: 'sop',
          skillDeltas: { humility: 'good', notes: 'good', practice: 'good' },
        },
        {
          id: 'quit',
          text: 'Apologize endlessly and offer to stop forever.',
          consequence: 'Humility tipped into fragility. Maya needs a learner, not a crisis.',
          nextSceneId: 'sop',
          skillDeltas: { humility: 'ok', practice: 'miss' },
        },
      ],
    },
    {
      id: 'sop',
      title: 'SOP vs folklore',
      narration:
        'The written SOP says 60 minutes. Maya says “we do 45 — trust me.”',
      choices: [
        {
          id: 'blind_maya',
          text: 'Follow Maya only; never update the doc.',
          consequence: 'Folklore accumulates. The next newcomer suffers.',
          nextSceneId: 'solo',
          skillDeltas: { notes: 'miss', observe: 'ok' },
        },
        {
          id: 'reconcile',
          text: 'Do 45 with Maya, then ask to annotate the SOP with why.',
          consequence: 'You respect craft and leave a trail. Lab memory improves.',
          nextSceneId: 'solo',
          skillDeltas: { notes: 'good', humility: 'good', observe: 'good' },
        },
        {
          id: 'argue',
          text: 'Argue that SOPs are sacred and refuse.',
          consequence: 'Principle without curiosity can look rigid on day three.',
          nextSceneId: 'solo',
          skillDeltas: { humility: 'miss', practice: 'ok' },
        },
      ],
    },
    {
      id: 'solo',
      title: 'First solo attempt',
      narration:
        'Maya is away. You can run a small practice blot on spare samples.',
      choices: [
        {
          id: 'skip_practice',
          text: 'Skip practice — wait for a “real” sample.',
          consequence: 'Your first real sample becomes your training wreck.',
          nextSceneId: 'teachback',
          skillDeltas: { practice: 'miss', humility: 'ok' },
        },
        {
          id: 'deliberate',
          text: 'Run a deliberate practice with a checklist and timed notes.',
          consequence: 'Reps with reflection beat talent myths.',
          nextSceneId: 'teachback',
          skillDeltas: { practice: 'good', notes: 'good' },
        },
        {
          id: 'youtube',
          text: 'Watch three YouTube videos instead of touching the bench.',
          consequence: 'Helpful complement — not a substitute for motor learning.',
          nextSceneId: 'teachback',
          skillDeltas: { practice: 'ok', observe: 'ok' },
        },
      ],
    },
    {
      id: 'teachback',
      title: 'Teach-back',
      narration:
        'Maya returns: “Explain the critical steps to me as if I’m new.”',
      choices: [
        {
          id: 'vague_tb',
          text: 'Give a vague overview with buzzwords.',
          consequence: 'You reveal the gaps. Better now than in a paper revision.',
          nextSceneId: null,
          skillDeltas: { observe: 'ok', humility: 'ok' },
        },
        {
          id: 'precise_tb',
          text: 'Teach-back with times, failure modes, and what you’d check if bands look weird.',
          consequence: 'Mastery signal. Maya signs you off for supervised solos.',
          nextSceneId: null,
          skillDeltas: { observe: 'good', practice: 'good', notes: 'good', humility: 'good' },
        },
        {
          id: 'read_sop',
          text: 'Read the SOP aloud without understanding.',
          consequence: 'Literacy ≠ skill. Maya schedules another shadow session.',
          nextSceneId: null,
          skillDeltas: { practice: 'miss', notes: 'ok' },
        },
      ],
    },
  ],
  debrief: {
    summary:
      'Learning methods is an apprenticeship: observe deliberately, ask before faking, practice on purpose, write what the SOP doesn’t say, and stay humble without collapsing.',
    tips: [
      'Never nod through a step you can’t teach back.',
      'Convert folklore into annotated SOP lines.',
      'Use cheap practice reps before precious samples.',
    ],
    skillLabels: {
      observe: 'Observe deliberately',
      practice: 'Practice on purpose',
      notes: 'Capture procedural memory',
      humility: 'Ask without faking',
    },
  },
};
