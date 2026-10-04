/**
 * Lab Floors — branching research-role scenarios (content-first, no AI).
 */

export type RoleId = 'phd' | 'ra' | 'intern';

export type SkillVerdict = 'good' | 'ok' | 'miss';

export type Choice = {
  id: string;
  /** What the player chooses to do */
  text: string;
  /** Next scene id, or null to finish → debrief */
  nextSceneId: string | null;
  /** Short immediate consequence shown after choosing */
  consequence?: string;
  /** Skill tags touched by this choice */
  skillDeltas?: Record<string, SkillVerdict>;
};

export type Scene = {
  id: string;
  title?: string;
  /** Main situation text */
  narration: string;
  /** Optional role-specific flavor appended under narration */
  roleFlavor?: Partial<Record<RoleId, string>>;
  choices: Choice[];
};

export type Debrief = {
  summary: string;
  tips: string[];
  /** Human labels for skill ids used in this floor */
  skillLabels: Record<string, string>;
};

export type FloorScenario = {
  id: string;
  title: string;
  subtitle: string;
  /** Approx play time */
  durationMinutes: number;
  /** Skill ids practiced on this floor */
  skills: string[];
  startSceneId: string;
  scenes: Scene[];
  debrief: Debrief;
};

export type FloorMeta = {
  id: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  skills: string[];
};

export type PathStep = {
  sceneId: string;
  choiceId: string;
};

export type FloorCompletion = {
  completedAt: string;
  role: RoleId;
  path: PathStep[];
  /** Best verdict seen per skill on this run */
  skillResults: Record<string, SkillVerdict>;
};

export type LabFloorsProgress = {
  role: RoleId;
  completions: Record<string, FloorCompletion>;
};
