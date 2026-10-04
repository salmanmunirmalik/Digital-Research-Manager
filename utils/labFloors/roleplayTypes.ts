/**
 * Lab Floors — AI roleplay types (PhD Starter Year and future modules).
 */

export type RoleplayCharacter = {
  id: string;
  name: string;
  title: string;
  /** Short blurb shown in cast picker */
  blurb: string;
  /** System-prompt voice / behavior for the AI */
  voice: string;
};

export type RoleplayBeat = {
  id: string;
  title: string;
  /** Timeline label, e.g. "Week 1" */
  chapter: string;
  setting: string;
  /** What the student is practicing */
  objective: string;
  /** Soft coaching shown beside chat (not a quiz) */
  coachingHint: string;
  primaryCharacterId: string;
  availableCharacterIds: string[];
  openingNarration: string;
  openingLine: { characterId: string; text: string };
  /** Soft cue for when to advance */
  advanceHint: string;
  /** Soft floor before suggesting advance */
  minTurns: number;
  skills: string[];
};

export type RoleplayDebrief = {
  summary: string;
  tips: string[];
  skillLabels: Record<string, string>;
};

export type RoleplayModule = {
  id: string;
  title: string;
  subtitle: string;
  overview: string;
  durationMinutes: number;
  characters: RoleplayCharacter[];
  beats: RoleplayBeat[];
  debrief: RoleplayDebrief;
};

export type RoleplayChatMessage = {
  id: string;
  role: 'user' | 'character' | 'narrator';
  characterId?: string;
  content: string;
  coachWhisper?: string;
};

export type RoleplayBeatProgress = {
  beatId: string;
  turnCount: number;
  completedAt?: string;
};

export type RoleplayRunProgress = {
  moduleId: string;
  currentBeatId: string;
  beatProgress: Record<string, RoleplayBeatProgress>;
  completedAt?: string;
  updatedAt: string;
};
