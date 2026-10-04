import type { RoleplayModule } from '../../utils/labFloors/roleplayTypes';

/**
 * PhD Starter Year — full first-year plan as AI-backed roleplay.
 * You are the new PhD student. Everyone else is played by AI.
 */
export const phdStarterYear: RoleplayModule = {
  id: 'phd-starter-year',
  title: 'PhD Starter Year',
  subtitle: 'A full first-year plan as live roleplay with your PI, peers, and lab staff',
  overview:
    'You just started your PhD. Walk a realistic first year: arrive, set expectations with your PI, learn the lab’s operating system, scope a starter question, plan work, ask for help, handle credit, and leave with a year-one plan you can actually use.',
  durationMinutes: 45,
  characters: [
    {
      id: 'elena',
      name: 'Dr. Elena Vargas',
      title: 'Principal Investigator',
      blurb: 'Supportive but busy. Values clarity, written plans, and honest timelines.',
      voice:
        'You are Dr. Elena Vargas, PI of a mid-size academic lab. Warm but time-scarce. You ask clarifying questions, push for falsifiable aims, and dislike vague “I’ll figure it out.” You never lecture like a textbook — speak like a real mentor in a corridor or office. Keep replies to 2–5 short paragraphs or a few tight sentences. End with a question that invites the student to decide or commit.',
    },
    {
      id: 'sam',
      name: 'Sam Okonkwo',
      title: '4th-year PhD student',
      blurb: 'Knows where everything is. Dry humor. Protective of shared reagents.',
      voice:
        'You are Sam Okonkwo, a 4th-year PhD student. Practical, slightly tired, kind under sarcasm. You teach by showing lab norms (notebooks, −80 inventory, booking calendars). You warn newcomers away from creating messes. Keep replies conversational and specific. Offer one concrete tip per turn. Ask what they need next.',
    },
    {
      id: 'priya',
      name: 'Dr. Priya Mehta',
      title: 'Postdoc',
      blurb: 'Sharp experimental thinker. Helps you turn vague interest into a testable question.',
      voice:
        'You are Dr. Priya Mehta, postdoc. Rigorous, encouraging, allergic to fluffy aims. You help carve a starter question with controls and a kill-criterion. Speak like a smart peer mentor, not a course instructor. Keep replies focused. Challenge soft thinking politely.',
    },
    {
      id: 'jordan',
      name: 'Jordan Lee',
      title: 'Lab manager',
      blurb: 'Runs safety, inventory, access, and onboarding paperwork.',
      voice:
        'You are Jordan Lee, lab manager. Organized, friendly, zero-tolerance for unsafe shortcuts. You care about training logs, PPE, waste streams, booking systems, and documentation. Keep replies clear and procedural when needed, but human. Confirm the student understands next steps.',
    },
    {
      id: 'alex',
      name: 'Alex Chen',
      title: 'Fellow first-year PhD',
      blurb: 'Also new. Good for peer reality-checks and shared anxiety without spiraling.',
      voice:
        'You are Alex Chen, another first-year PhD student. Relatable, a bit anxious, trying hard. You share what worked for you this week and ask genuine questions. Do not pretend to be an expert. Keep tone peer-to-peer.',
    },
  ],
  beats: [
    {
      id: 'week1-arrival',
      title: 'Arrive and find your footing',
      chapter: 'Week 1',
      setting: 'Lab corridor, Monday 9:40 — your first morning with a badge that actually works.',
      objective: 'Introduce yourself, learn how onboarding works here, and leave with 2–3 concrete next steps.',
      coachingHint:
        'Say who you are and what you need. Ask where training, desk, and safety live. Avoid “I’ll just figure it out.”',
      primaryCharacterId: 'jordan',
      availableCharacterIds: ['jordan', 'sam'],
      openingNarration:
        'The lab smells like ethanol and autoclave steam. Your name is on a whiteboard under “New.” Jordan is hanging keys on a rack.',
      openingLine: {
        characterId: 'jordan',
        text: 'Hey — you’re the new PhD, right? Badge worked? Good. Before you touch anything wet, we need safety modules and a lab walkthrough. What have you already done, and what are you hoping to get sorted today?',
      },
      advanceHint: 'When you know your desk, safety checklist, and who to ping for day-to-day questions.',
      minTurns: 3,
      skills: ['ask_early', 'lab_os', 'professionalism'],
    },
    {
      id: 'week1-pi',
      title: 'First real conversation with your PI',
      chapter: 'Week 1',
      setting: 'Elena’s office — 25 minutes blocked, door half-open, laptop open to a grant.',
      objective: 'Align on meeting cadence, expectations for year one, and how she likes updates.',
      coachingHint:
        'Bring a short agenda. Ask how often to meet, what “good progress” looks like at 3 and 12 months, and how she wants bad news.',
      primaryCharacterId: 'elena',
      availableCharacterIds: ['elena'],
      openingNarration:
        'Elena waves you in without looking up, then closes the laptop and gives you full attention.',
      openingLine: {
        characterId: 'elena',
        text: 'Welcome. I know week one is overwhelming. I don’t need a polished plan today — I need to know how you work and what you need from me. What’s on your mind, and what would make this year feel survivable?',
      },
      advanceHint: 'When cadence, update style, and a rough year-one success picture are on the table.',
      minTurns: 4,
      skills: ['ask_early', 'professionalism', 'ownership'],
    },
    {
      id: 'week2-lab-os',
      title: 'Learn the lab’s operating system',
      chapter: 'Week 2',
      setting: 'Bench bay and −80 corridor with Sam, who has 12 minutes between incubations.',
      objective: 'Map where reagents, booking, notebooks, and “don’t touch” live — without looking helpless forever.',
      coachingHint:
        'Ask for the inventory sheet, booking norms, and notebook expectations. Offer to write a one-page “lab map” for yourself.',
      primaryCharacterId: 'sam',
      availableCharacterIds: ['sam', 'jordan'],
      openingNarration:
        'Sam is labeling tubes at speed. They nod toward the freezers without slowing down.',
      openingLine: {
        characterId: 'sam',
        text: 'Okay tour version that doesn’t waste both our times: what do you actually need to do this week — wet work, reading, or admin? I’ll show you the minimum viable lab OS.',
      },
      advanceHint: 'When you can name where booking, −80 inventory, and notebook expectations live.',
      minTurns: 3,
      skills: ['lab_os', 'ask_early', 'documentation'],
    },
    {
      id: 'month1-literature',
      title: 'Read like a starter, not a tourist',
      chapter: 'Month 1',
      setting: 'Postdoc bay — Priya has a printed paper covered in sticky flags.',
      objective: 'Turn “I should read more” into a reading method tied to a possible aim.',
      coachingHint:
        'Ask how they triage papers. Propose a weekly reading goal tied to one question, not a dump of PDFs.',
      primaryCharacterId: 'priya',
      availableCharacterIds: ['priya', 'alex'],
      openingNarration:
        'Priya slides a paper across. The abstract is dense. Alex is two desks over, headphones half-on.',
      openingLine: {
        characterId: 'priya',
        text: 'New students drown in PDFs. Tell me the topic you’re orbiting — even if it’s fuzzy — and I’ll show you how I read for a starter aim instead of collecting citations like Pokémon.',
      },
      advanceHint: 'When you have a reading method and one provisional question worth shaping.',
      minTurns: 3,
      skills: ['design_thinking', 'ownership', 'ask_early'],
    },
    {
      id: 'month2-scope',
      title: 'Scope a year-one starter question',
      chapter: 'Month 2',
      setting: 'Elena’s office again — she asked for a one-pager by Friday.',
      objective: 'Propose a testable starter question with a kill-criterion and a realistic first experiment.',
      coachingHint:
        'State the question, why it matters to the lab, what would falsify it, and what you’ll do in the next 4–6 weeks.',
      primaryCharacterId: 'elena',
      availableCharacterIds: ['elena', 'priya'],
      openingNarration:
        'Elena has your half-finished notes open. She looks curious, not punitive.',
      openingLine: {
        characterId: 'elena',
        text: 'Walk me through the question as if I’m a skeptical colleague. What’s the claim, what’s the first experiment, and how do we know if this line is a dead end?',
      },
      advanceHint: 'When question, controls/kill-criterion, and near-term actions are explicit.',
      minTurns: 4,
      skills: ['design_thinking', 'ownership', 'professionalism'],
    },
    {
      id: 'month2-notebook',
      title: 'Document so future-you survives',
      chapter: 'Month 2',
      setting: 'Your desk — Jordan dropped by after finding an unlabeled tube in the cold room.',
      objective: 'Commit to a notebook habit that the lab accepts (and that you’d trust in six months).',
      coachingHint:
        'Ask what “good enough” documentation looks like here. Propose a template: purpose, reagents, steps, deviations, next action.',
      primaryCharacterId: 'jordan',
      availableCharacterIds: ['jordan', 'sam'],
      openingNarration:
        'Jordan holds a photo of a frost-covered box. No label. Sam is trying not to laugh.',
      openingLine: {
        characterId: 'jordan',
        text: 'This is your friendly warning shot. How are you planning to document experiments so we don’t recreate mysteries? Be honest — what’s your system today?',
      },
      advanceHint: 'When you have a concrete notebook habit and where shared records live.',
      minTurns: 3,
      skills: ['documentation', 'lab_os', 'professionalism'],
    },
    {
      id: 'month3-first-plan',
      title: 'Plan the first real experiment',
      chapter: 'Month 3',
      setting: 'Whiteboard near Sam’s bench — half a sketch of a control panel already there.',
      objective: 'Build a plan with controls, replicates, reagents, timeline, and risks — then stress-test it with someone senior.',
      coachingHint:
        'Talk controls and failure modes out loud. Ask Sam what usually breaks for newcomers on this method.',
      primaryCharacterId: 'sam',
      availableCharacterIds: ['sam', 'priya'],
      openingNarration:
        'The whiteboard marker is almost dead. Sam tosses you a better one.',
      openingLine: {
        characterId: 'sam',
        text: 'Show me the plan like you’re about to waste my favorite enzyme. Controls? Replicates? What happens if the positive control fails on Friday?',
      },
      advanceHint: 'When controls, timeline, and a failure branch are written into the plan.',
      minTurns: 4,
      skills: ['design_thinking', 'ask_early', 'documentation'],
    },
    {
      id: 'month4-help',
      title: 'Ask for help without disappearing',
      chapter: 'Month 4',
      setting: 'Slack DM with Sam — your PCR has failed twice and it’s 6:40pm.',
      objective: 'Practice asking early with context, attempts, and a clear ask — not a panic essay.',
      coachingHint:
        'State goal, what you tried, what you observed, and the one decision you need. Offer times you’re free.',
      primaryCharacterId: 'sam',
      availableCharacterIds: ['sam', 'alex', 'priya'],
      openingNarration:
        'Your last gel is blank again. Alex messages: “you okay?” Sam’s status is green.',
      openingLine: {
        characterId: 'sam',
        text: 'I saw the gel photo in the channel. Before I walk over — what did you already try, and what do you want from me: diagnose, watch you run it, or just sanity-check the primer design?',
      },
      advanceHint: 'When you’ve made a clear ask and agreed a next troubleshooting step.',
      minTurns: 3,
      skills: ['ask_early', 'professionalism', 'ownership'],
    },
    {
      id: 'month5-credit',
      title: 'Credit, conflict, and being a colleague',
      chapter: 'Month 5',
      setting: 'After group meeting — a slide used your figure without your name.',
      objective: 'Address credit professionally and propose a fix without torching the relationship.',
      coachingHint:
        'Assume good intent first. State the fact, the impact, and the ask. Practice with Alex if you need a peer rehearsal.',
      primaryCharacterId: 'alex',
      availableCharacterIds: ['alex', 'sam', 'elena'],
      openingNarration:
        'People are packing laptops. Your figure was on slide 7. No attribution. Your stomach is loud.',
      openingLine: {
        characterId: 'alex',
        text: 'I saw it too. Want to vent for thirty seconds, then figure out what you’d say? Or do you want me to help you draft the message before you talk to Sam or Elena?',
      },
      advanceHint: 'When you’ve chosen a professional approach and practiced the actual words.',
      minTurns: 3,
      skills: ['share_credit', 'professionalism', 'ask_early'],
    },
    {
      id: 'month6-plan',
      title: 'Lock a living year-one plan',
      chapter: 'Month 6 checkpoint',
      setting: 'Elena’s office — mid-year check-in. She wants a plan you can revise, not a performance.',
      objective: 'Leave with a year-one plan: aims, skills to learn, milestones, risks, and support asks.',
      coachingHint:
        'Propose 2–3 aims, skill gaps, quarterly milestones, and what you need from Elena. Invite pushback.',
      primaryCharacterId: 'elena',
      availableCharacterIds: ['elena', 'priya'],
      openingNarration:
        'Elena has a blank page titled “Year 1 — living plan.” She slides it toward you.',
      openingLine: {
        characterId: 'elena',
        text: 'Let’s write the plan together. What should be true by month 12 for you to feel this PhD started well — scientifically and as a colleague? Be specific enough that we can check it in three months.',
      },
      advanceHint: 'When aims, milestones, skills, and support asks are explicit enough to revisit.',
      minTurns: 4,
      skills: ['ownership', 'design_thinking', 'professionalism'],
    },
  ],
  debrief: {
    summary:
      'A strong PhD start is less about genius and more about operating systems: asking early, documenting, scoping falsifiable work, and staying professional under stress. You practiced a full first-year arc you can reuse with real people.',
    tips: [
      'Keep a living one-page year plan: aims, milestones, skills, risks, and asks for your PI — revisit every 8–12 weeks.',
      'When stuck, send context + attempts + one clear ask. Silence costs more than an “early” question.',
      'Treat credit and conflict as lab hygiene: name the fact, impact, and fix — assume good intent until proven otherwise.',
    ],
    skillLabels: {
      ask_early: 'Ask early',
      lab_os: 'Lab operating system',
      professionalism: 'Professional presence',
      ownership: 'Own the plan',
      documentation: 'Document for future-you',
      design_thinking: 'Design for falsifiability',
      share_credit: 'Share credit',
    },
  },
};
