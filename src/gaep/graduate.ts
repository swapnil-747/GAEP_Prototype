import { GRADUATE_STAGES } from './data/content';

export interface GraduateState { completed: number; }
export const initialGraduate: GraduateState = { completed: 0 };

export function advanceStage(s: GraduateState): GraduateState {
  return { completed: Math.min(s.completed + 1, GRADUATE_STAGES.length) };
}
export function isGraduationComplete(s: GraduateState): boolean {
  return s.completed >= GRADUATE_STAGES.length;
}
