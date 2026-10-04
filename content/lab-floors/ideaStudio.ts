import type { FloorScenario } from '../../utils/labFloors/types';

/** Idea Studio — vague interest → testable question */
export const ideaStudio: FloorScenario = {
  id: 'idea-studio',
  title: 'Idea Studio',
  subtitle: 'Turn a vague interest into a testable question and a first design sketch.',
  durationMinutes: 9,
  skills: ['narrow', 'falsify', 'scope', 'evidence'],
  startSceneId: 'spark',
  scenes: [
    {
      id: 'spark',
      title: 'The spark',
      narration:
        'You’re excited about “inflammation and aging.” Your PI says: “Great theme. Bring me a question we could falsify in six months — not a TED talk.”',
      roleFlavor: {
        phd: 'This will become your thesis spine — or a year of fog.',
        ra: 'You’re supporting someone else’s aims; clarity protects your time.',
        intern: 'You need a small, finishable question — not a career.',
      },
      choices: [
        {
          id: 'keep_broad',
          text: 'Keep it broad: “How does inflammation cause aging?”',
          consequence: 'Your PI winces. Unfalsifiable giants don’t guide experiments.',
          nextSceneId: 'literature',
          skillDeltas: { narrow: 'miss', falsify: 'miss' },
        },
        {
          id: 'mechanism',
          text: 'Propose: “Does chronic IL-6 elevation impair muscle stem-cell renewal in aged mice?”',
          consequence: 'Still big — but now it has a mechanism, a readout, and a population.',
          nextSceneId: 'literature',
          skillDeltas: { narrow: 'good', falsify: 'good' },
        },
        {
          id: 'method_first',
          text: 'Lead with a cool method you want to learn, then reverse-fit a question.',
          consequence: 'Methods in search of questions produce pretty, empty papers.',
          nextSceneId: 'literature',
          skillDeltas: { narrow: 'miss', scope: 'miss' },
        },
      ],
    },
    {
      id: 'literature',
      title: 'What is already known?',
      narration:
        'You open PubMed. There are 4,000 hits. Your cursor blinks. How do you start without drowning?',
      choices: [
        {
          id: 'random_20',
          text: 'Skim twenty random abstracts and call it a review.',
          consequence: 'You’ll miss the key paper everyone cites. Sampling without a plan is theater.',
          nextSceneId: 'gap',
          skillDeltas: { evidence: 'miss' },
        },
        {
          id: 'reviews_then_recent',
          text: 'Start with 2–3 recent reviews, then chase the 5–8 primary papers they lean on.',
          consequence: 'You inherit a map, then verify it. Efficient and honest.',
          nextSceneId: 'gap',
          skillDeltas: { evidence: 'good', narrow: 'good' },
        },
        {
          id: 'only_preprints',
          text: 'Only read last month’s preprints so you’re “cutting edge.”',
          consequence: 'You miss foundational constraints. Edge without foundations is brittle.',
          nextSceneId: 'gap',
          skillDeltas: { evidence: 'ok' },
        },
      ],
    },
    {
      id: 'gap',
      title: 'Finding the gap',
      narration:
        'A review says the IL-6 ↔ stem-cell link is suggested in vitro but unclear in aged tissue with proper controls. Your PI asks: “What’s the gap in one sentence?”',
      choices: [
        {
          id: 'nobody',
          text: '“Nobody has studied this.”',
          consequence: 'Almost always false. Overclaiming gaps erodes credibility.',
          nextSceneId: 'design',
          skillDeltas: { evidence: 'miss', falsify: 'miss' },
        },
        {
          id: 'precise_gap',
          text: '“In vivo evidence in aged muscle with sham and cytokine controls is thin.”',
          consequence: 'Specific. Contestable. Fundable. Good science speech.',
          nextSceneId: 'design',
          skillDeltas: { evidence: 'good', falsify: 'good', narrow: 'good' },
        },
        {
          id: 'tool_gap',
          text: '“We need a new imaging platform first.”',
          consequence: 'Maybe true later — but it postpones the scientific question.',
          nextSceneId: 'design',
          skillDeltas: { scope: 'miss' },
        },
      ],
    },
    {
      id: 'design',
      title: 'First design sketch',
      narration:
        'Whiteboard time. You must sketch Aim · Comparison · Readout · Falsifier. Your PI waits with a marker.',
      choices: [
        {
          id: 'no_control',
          text: 'Treat aged mice with anti-IL-6 and measure regeneration — no sham, no young arm.',
          consequence: 'Any effect is uninterpretable. Design failed before pipettes moved.',
          nextSceneId: 'scope_check',
          skillDeltas: { falsify: 'miss', scope: 'miss' },
        },
        {
          id: 'minimal',
          text: 'Aged ± anti-IL-6 vs isotype; primary readout: satellite-cell counts; pre-registered stop rule.',
          consequence: 'Minimal but clean. You can be wrong — which means you can learn.',
          nextSceneId: 'scope_check',
          skillDeltas: { falsify: 'good', scope: 'good' },
        },
        {
          id: 'kitchen_sink',
          text: 'Add RNA-seq, proteomics, three tissues, and a human cohort in v1.',
          consequence: 'Your six-month window evaporates. Ambition without scope is a trap.',
          nextSceneId: 'scope_check',
          skillDeltas: { scope: 'miss', narrow: 'miss' },
        },
      ],
    },
    {
      id: 'scope_check',
      title: 'Scope check',
      narration:
        'A senior postdoc says: “Cute. Do you have antibody validation and a power guess?”',
      choices: [
        {
          id: 'defensive',
          text: 'Defend the idea emotionally — “It’ll work.”',
          consequence: 'Emotion isn’t a methods section. They stop mentoring you for a week.',
          nextSceneId: 'pitch',
          skillDeltas: { falsify: 'miss', evidence: 'miss' },
        },
        {
          id: 'list_unknowns',
          text: 'List unknowns: validation status, effect-size guesses, and a pilot week.',
          consequence: 'Mature. Uncertainty on the table is how designs get stronger.',
          nextSceneId: 'pitch',
          skillDeltas: { evidence: 'good', scope: 'good' },
        },
        {
          id: 'delegate',
          text: 'Say you’ll “figure it out later” and change the subject.',
          consequence: 'Later never comes cleanly. Deferred risks compound.',
          nextSceneId: 'pitch',
          skillDeltas: { scope: 'miss' },
        },
      ],
    },
    {
      id: 'pitch',
      title: 'One-pager',
      narration:
        'Your PI wants a half-page: question, why it matters, approach, risks, next two weeks.',
      choices: [
        {
          id: 'essay',
          text: 'Write three pages of background and one vague aim.',
          consequence: 'Nobody reads it. Background without a decision wastes attention.',
          nextSceneId: null,
          skillDeltas: { narrow: 'miss', scope: 'miss' },
        },
        {
          id: 'tight',
          text: 'Write the half-page they asked for — with a falsifier and a pilot plan.',
          consequence: 'Approved with edits. Clarity earns autonomy.',
          nextSceneId: null,
          skillDeltas: { narrow: 'good', falsify: 'good', scope: 'good', evidence: 'good' },
        },
        {
          id: 'slides_only',
          text: 'Make glamorous slides with no written plan.',
          consequence: 'Pretty. Unusable for reagents, ethics, or co-authors.',
          nextSceneId: null,
          skillDeltas: { scope: 'ok', narrow: 'miss' },
        },
      ],
    },
  ],
  debrief: {
    summary:
      'Good research ideas are narrow enough to test, honest about evidence gaps, and scoped to time and controls. Breadth feels impressive; falsifiability creates progress.',
    tips: [
      'Force a one-sentence gap that a skeptic could argue with.',
      'Design the comparison that would prove you wrong.',
      'Protect a six-month window: fewer readouts, cleaner arms.',
    ],
    skillLabels: {
      narrow: 'Narrow the question',
      falsify: 'Design for falsifiability',
      scope: 'Scope to time & resources',
      evidence: 'Ground in prior evidence',
    },
  },
};
