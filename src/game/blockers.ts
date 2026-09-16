import { BlockerPair, BlockerLabel, GameState } from './types';
import { DEFAULT_CONFIG, BLOCKER_LABELS } from './constants';

const { width, gapHeight, speed, spawnInterval, minGapY, maxGapY } = DEFAULT_CONFIG.blockers;
const canvasWidth = DEFAULT_CONFIG.canvas.width;

/**
 * Generates a random gap Y position within the configured bounds [minGapY, maxGapY].
 */
function randomGapY(): number {
  return minGapY + Math.random() * (maxGapY - minGapY);
}

/**
 * Selects a random label from the predefined BLOCKER_LABELS list.
 */
function randomLabel(): BlockerLabel {
  const index = Math.floor(Math.random() * BLOCKER_LABELS.length);
  return BLOCKER_LABELS[index];
}

/**
 * Generates a new BlockerPair positioned at the right edge of the canvas.
 * The gap center Y is randomized within [minGapY, maxGapY], gap height is fixed,
 * and a random label is assigned from BLOCKER_LABELS.
 */
export function generate(): BlockerPair {
  return {
    x: canvasWidth,
    gapY: randomGapY(),
    gapHeight,
    width,
    scored: false,
    label: randomLabel(),
  };
}

/**
 * Updates all blockers by moving them left by the configured speed when the game
 * state is "playing". Removes any blockers that have moved entirely off-screen
 * (x + width < 0). Returns a new array with updated blockers.
 *
 * When the game state is not "playing", blockers are returned unchanged.
 */
export function update(blockers: BlockerPair[], gameState: GameState): BlockerPair[] {
  if (gameState !== 'playing') {
    return blockers;
  }

  return blockers
    .map((blocker) => ({
      ...blocker,
      x: blocker.x - speed,
    }))
    .filter((blocker) => blocker.x + blocker.width >= 0);
}

/**
 * Determines whether a new blocker should be generated based on the distance
 * since the last blocker. A new blocker should spawn when there are no existing
 * blockers, or when the rightmost blocker has moved far enough left that the
 * spawn interval distance has been satisfied.
 */
export function shouldGenerate(blockers: BlockerPair[]): boolean {
  if (blockers.length === 0) {
    return true;
  }

  const rightmostX = Math.max(...blockers.map((b) => b.x));
  return canvasWidth - rightmostX >= spawnInterval;
}

/**
 * Exported configuration values for testing and external reference.
 */
export const blockersConfig = {
  width,
  gapHeight,
  speed,
  spawnInterval,
  minGapY,
  maxGapY,
  canvasWidth,
} as const;
