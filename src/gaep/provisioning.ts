import { PROVISION_STEPS } from './data/content';

export interface ProvisionState { completed: number; }
export const initialProvision: ProvisionState = { completed: 0 };

export function advanceProvisioning(s: ProvisionState): ProvisionState {
  return { completed: Math.min(s.completed + 1, PROVISION_STEPS.length) };
}
export function isProvisionComplete(s: ProvisionState): boolean {
  return s.completed >= PROVISION_STEPS.length;
}
