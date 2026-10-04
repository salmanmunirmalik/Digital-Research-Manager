import type { FloorScenario } from './types';
import { dayOne } from '../../content/lab-floors/dayOne';
import { ideaStudio } from '../../content/lab-floors/ideaStudio';
import { benchPlan } from '../../content/lab-floors/benchPlan';
import { colleagues } from '../../content/lab-floors/colleagues';
import { skillSprint } from '../../content/lab-floors/skillSprint';

const FLOORS: FloorScenario[] = [dayOne, ideaStudio, benchPlan, colleagues, skillSprint];

export function listLabFloors(): FloorScenario[] {
  return FLOORS;
}

export function getLabFloor(id: string): FloorScenario | null {
  return FLOORS.find((f) => f.id === id) || null;
}

export function getScene(floor: FloorScenario, sceneId: string) {
  return floor.scenes.find((s) => s.id === sceneId) || null;
}
