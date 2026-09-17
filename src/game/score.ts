import { BlockerPair } from './types';

/**
 * Score tracking module for DSE Developer's Journey.
 *
 * Provides pure functions for score management:
 * - checkAndUpdate: detects when the developer passes blockers and increments score
 * - reset: returns the initial score value (0)
 *
 * Score state is managed externally; these functions are pure transformations.
 */

/**
 * Checks if the developer has passed any unscored blockers and updates accordingly.
 *
 * A blocker is considered "passed" when the developer's x position exceeds
 * the blocker's trailing edge (blocker.x + blocker.width).
 *
 * @param developerX - The developer's current x position
 * @param blockers - The current array of blocker pairs
 * @returns An object with the number of new points scored and updated blockers array
 */
export function checkAndUpdate(
  developerX: number,
  blockers: BlockerPair[]
): { scored: number; blockers: BlockerPair[] } {
  let scored = 0;
  const updatedBlockers = blockers.map((blocker) => {
    if (!blocker.scored && developerX > blocker.x + blocker.width) {
      scored += 1;
      return { ...blocker, scored: true };
    }
    return blocker;
  });

  return { scored, blockers: updatedBlockers };
}

/**
 * Returns the initial score value.
 * Since score state is managed externally, this simply returns 0.
 */
export function reset(): number {
  return 0;
}
