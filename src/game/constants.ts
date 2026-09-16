import { BlockerLabel, GameConfig } from './types';

/**
 * Predefined list of infrastructure barrier labels for obstacle blockers.
 * Each label represents a real challenge DSE developers face during onboarding.
 */
export const BLOCKER_LABELS: readonly BlockerLabel[] = [
  'Admin Access Delays',
  'DevOps Overload',
  'Geo Restrictions',
  'No Experimentation Platform',
];

/**
 * Default game configuration with tuned values for balanced gameplay.
 */
export const DEFAULT_CONFIG: GameConfig = {
  canvas: {
    width: 400,
    height: 600,
  },
  developer: {
    startX: 80,
    startY: 300,
    width: 40,
    height: 30,
    gravity: 0.4,
    flapStrength: -7,
    terminalVelocity: 10,
  },
  blockers: {
    width: 50,
    gapHeight: 200,
    speed: 2.5,
    spawnInterval: 220,
    minGapY: 250,
    maxGapY: 380,
  },
  theme: {
    title: "DSE Developer's Journey",
    tagline: 'This is why we need D-Lab',
    blockerLabels: BLOCKER_LABELS,
  },
};
