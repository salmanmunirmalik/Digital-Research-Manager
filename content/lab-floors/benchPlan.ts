import type { FloorScenario } from '../../utils/labFloors/types';

/** Bench Plan — planning an experiment */
export const benchPlan: FloorScenario = {
  id: 'bench-plan',
  title: 'Bench Plan',
  subtitle: 'Plan an experiment: controls, replicates, reagents, timeline, and risk.',
  durationMinutes: 9,
  skills: ['controls', 'replicates', 'prep', 'risk'],
  startSceneId: 'brief',
  scenes: [
    {
      id: 'brief',
      title: 'Friday ask',
      narration:
        'Your PI: “Run the cytokine treatment next week. Keep it clean. Don’t burn the last antibody vial.” You have a half-day to plan.',
      roleFlavor: {
        phd: 'This result may anchor a figure — pressure is real.',
        ra: 'You’re expected to execute reliably more than invent.',
        intern: 'You must not create irreversible reagent waste.',
      },
      choices: [
        {
          id: 'wing_it',
          text: 'Start Monday with vibes and a printed protocol from 2019.',
          consequence: 'You’ll discover missing reagents mid-run. Chaos is not a plan.',
          nextSceneId: 'controls',
          skillDeltas: { prep: 'miss', risk: 'miss' },
        },
        {
          id: 'checklist',
          text: 'Build a one-page plan: arms, n, reagents, contingencies, stop rules.',
          consequence: 'Boring. Professional. Your future self will thank you.',
          nextSceneId: 'controls',
          skillDeltas: { prep: 'good', risk: 'good' },
        },
        {
          id: 'overplan',
          text: 'Write a 12-page methods novel before ordering tips.',
          consequence: 'Planning becomes procrastination. The week slips.',
          nextSceneId: 'controls',
          skillDeltas: { prep: 'ok' },
        },
      ],
    },
    {
      id: 'controls',
      title: 'Controls',
      narration:
        'A colleague asks: “What’s your negative and positive control?” You pause longer than you should.',
      choices: [
        {
          id: 'vehicle_only',
          text: 'Vehicle only — “that’s enough.”',
          consequence: 'Without a positive, a null result is ambiguous: biology or broken assay?',
          nextSceneId: 'n',
          skillDeltas: { controls: 'miss' },
        },
        {
          id: 'both',
          text: 'Vehicle + known positive stimulus; process controls for staining.',
          consequence: 'Now a flat line means something. Controls buy interpretation.',
          nextSceneId: 'n',
          skillDeltas: { controls: 'good' },
        },
        {
          id: 'historical',
          text: 'Skip controls — use last month’s figure as comparison.',
          consequence: 'Batch effects laugh at historical controls.',
          nextSceneId: 'n',
          skillDeltas: { controls: 'miss', risk: 'miss' },
        },
      ],
    },
    {
      id: 'n',
      title: 'Sample size',
      narration:
        'How many biological replicates? Someone says “n=3 is science.” Someone else says “power or nothing.”',
      choices: [
        {
          id: 'n3_blind',
          text: 'Default to n=3 because “that’s what people do.”',
          consequence: 'Sometimes fine for pilots — not a reason. Write the reason.',
          nextSceneId: 'reagents',
          skillDeltas: { replicates: 'ok' },
        },
        {
          id: 'pilot_then',
          text: 'Pilot a pilot n with variance notes, then decide the confirmatory n.',
          consequence: 'Honest sequencing of uncertainty. Good experimental hygiene.',
          nextSceneId: 'reagents',
          skillDeltas: { replicates: 'good', risk: 'good' },
        },
        {
          id: 'n30',
          text: 'Commit to n=30 without checking animals, cost, or time.',
          consequence: 'You block the animal facility and your own calendar.',
          nextSceneId: 'reagents',
          skillDeltas: { replicates: 'miss', prep: 'miss' },
        },
      ],
    },
    {
      id: 'reagents',
      title: 'Reagents',
      narration:
        'The shared antibody box has one vial left, unlabeled concentration. The freezer log is incomplete.',
      choices: [
        {
          id: 'use_anyway',
          text: 'Use it — “probably fine.”',
          consequence: 'You burn the last aliquot on an uninterpretable blot.',
          nextSceneId: 'timeline',
          skillDeltas: { prep: 'miss', risk: 'miss' },
        },
        {
          id: 'validate_or_order',
          text: 'Pause: validate or order a replacement before the run.',
          consequence: 'One day delay; weeks of credibility saved.',
          nextSceneId: 'timeline',
          skillDeltas: { prep: 'good', risk: 'good' },
        },
        {
          id: 'borrow_secret',
          text: 'Quietly take another lab’s vial without asking.',
          consequence: 'You poison trust. Reagents are relationships.',
          nextSceneId: 'timeline',
          skillDeltas: { risk: 'miss', prep: 'miss' },
        },
      ],
    },
    {
      id: 'timeline',
      title: 'Timeline',
      narration:
        'Your calendar: treatment Tuesday, harvest Thursday, analysis Friday before group meeting.',
      choices: [
        {
          id: 'tight',
          text: 'Keep the heroic schedule — no buffer.',
          consequence: 'A centrifuge fails Wednesday. You present empty hands.',
          nextSceneId: 'risks',
          skillDeltas: { risk: 'miss', prep: 'ok' },
        },
        {
          id: 'buffer',
          text: 'Insert a buffer day and a pre-meeting dry run of the analysis script.',
          consequence: 'Slightly less glamorous; far more survivable.',
          nextSceneId: 'risks',
          skillDeltas: { risk: 'good', prep: 'good' },
        },
        {
          id: 'split',
          text: 'Split harvest across two days without updating the plan.',
          consequence: 'Hidden batch effects enter quietly.',
          nextSceneId: 'risks',
          skillDeltas: { controls: 'miss', replicates: 'ok' },
        },
      ],
    },
    {
      id: 'risks',
      title: 'Pre-mortem',
      narration:
        'Sam asks you to name three ways this experiment fails before it starts.',
      choices: [
        {
          id: 'deny',
          text: '“It shouldn’t fail if I’m careful.”',
          consequence: 'Care is not a risk register. Hubris is a method.',
          nextSceneId: 'go',
          skillDeltas: { risk: 'miss' },
        },
        {
          id: 'premortem',
          text: 'List: bad antibody, timing slip, analysis bug — with mitigations.',
          consequence: 'Now the plan has immune cells. You’re thinking like a scientist.',
          nextSceneId: 'go',
          skillDeltas: { risk: 'good', prep: 'good' },
        },
        {
          id: 'blame',
          text: 'Blame shared equipment and move on.',
          consequence: 'Externalizing risk without a backup is still a miss.',
          nextSceneId: 'go',
          skillDeltas: { risk: 'ok' },
        },
      ],
    },
    {
      id: 'go',
      title: 'Go / no-go',
      narration:
        'Monday morning. Everything is almost ready. One control plate is cracked. Meeting is Friday.',
      choices: [
        {
          id: 'push',
          text: 'Push ahead with a missing control to “save the week.”',
          consequence: 'You generate data you can’t defend. Worse than no data.',
          nextSceneId: null,
          skillDeltas: { controls: 'miss', risk: 'miss' },
        },
        {
          id: 'delay',
          text: 'Delay 48 hours, replace the plate, tell stakeholders early.',
          consequence: 'Adult communication. The science stays interpretable.',
          nextSceneId: null,
          skillDeltas: { controls: 'good', risk: 'good', prep: 'good' },
        },
        {
          id: 'silent',
          text: 'Delay silently and hope nobody notices.',
          consequence: 'Trust damage exceeds the schedule hit.',
          nextSceneId: null,
          skillDeltas: { risk: 'miss' },
        },
      ],
    },
  ],
  debrief: {
    summary:
      'Experiment planning is risk management with scientific taste: controls for meaning, replicates for confidence, prep for reality, and buffers for the world.',
    tips: [
      'Write arms and controls before you touch a pipette.',
      'Treat scarce reagents as shared trust, not personal inventory.',
      'Do a three-failure pre-mortem; add one calendar buffer.',
    ],
    skillLabels: {
      controls: 'Design controls',
      replicates: 'Choose replicates wisely',
      prep: 'Prepare materials & timeline',
      risk: 'Anticipate risk',
    },
  },
};
