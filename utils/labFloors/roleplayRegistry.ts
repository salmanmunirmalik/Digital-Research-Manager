import type { RoleplayModule } from './roleplayTypes';
import { phdStarterYear } from '../../content/lab-floors/phdStarterYear';

const ROLEPLAY_MODULES: RoleplayModule[] = [phdStarterYear];

export function listRoleplayModules(): RoleplayModule[] {
  return ROLEPLAY_MODULES;
}

export function getRoleplayModule(id: string): RoleplayModule | null {
  return ROLEPLAY_MODULES.find((m) => m.id === id) || null;
}

export function getRoleplayCharacter(module: RoleplayModule, characterId: string) {
  return module.characters.find((c) => c.id === characterId) || null;
}

export function getRoleplayBeat(module: RoleplayModule, beatId: string) {
  return module.beats.find((b) => b.id === beatId) || null;
}
