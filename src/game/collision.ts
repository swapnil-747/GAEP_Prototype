import { BoundingBox, BlockerPair, CollisionResult } from './types';

/**
 * Checks if the developer's bounding box collides with a single blocker pair.
 * Only checks collision with the bottom blocker post (bottom-up obstacle).
 * The top region is removed for easier gameplay.
 *
 * @param developer - Developer's bounding box
 * @param blocker - The blocker pair to check against
 * @param canvasHeight - Height of the game canvas
 * @returns true if collision detected, false otherwise
 */
export function checkBlockerCollision(
  developer: BoundingBox,
  blocker: BlockerPair,
  canvasHeight: number
): boolean {
  // Check horizontal overlap first (early exit if no x overlap)
  const devRight = developer.x + developer.width;
  const blockerRight = blocker.x + blocker.width;

  if (devRight <= blocker.x || developer.x >= blockerRight) {
    return false;
  }

  // Only check overlap with bottom blocker region (bottomBlockerTop to canvasHeight)
  const bottomBlockerTop = blocker.gapY + blocker.gapHeight / 2;
  const devBottom = developer.y + developer.height;

  if (devBottom > bottomBlockerTop && developer.y < canvasHeight) {
    return true;
  }

  return false;
}

/**
 * Checks if the developer's bounding box has gone outside the canvas boundaries.
 * Only checks the bottom boundary — flying above the screen is allowed.
 *
 * @param developer - Developer's bounding box
 * @param _canvasWidth - Width of the canvas (unused, kept for interface compatibility)
 * @param canvasHeight - Height of the game canvas
 * @returns true if boundary collision detected, false otherwise
 */
export function checkBoundaryCollision(
  developer: BoundingBox,
  _canvasWidth: number,
  canvasHeight: number
): boolean {
  if (developer.y + developer.height > canvasHeight) {
    return true;
  }

  return false;
}

/**
 * Checks the developer against all blockers and canvas boundaries.
 * Iterates through all blockers and returns a CollisionResult indicating
 * whether a collision occurred and which blocker caused it.
 *
 * Boundary collisions are checked first, then blocker collisions.
 *
 * @param developer - Developer's bounding box
 * @param blockers - Array of all active blocker pairs
 * @param canvasWidth - Width of the game canvas
 * @param canvasHeight - Height of the game canvas
 * @returns CollisionResult with collision status and the collided blocker (if any)
 */
export function checkAllCollisions(
  developer: BoundingBox,
  blockers: BlockerPair[],
  canvasWidth: number,
  canvasHeight: number
): CollisionResult {
  // Check boundary collision
  if (checkBoundaryCollision(developer, canvasWidth, canvasHeight)) {
    return { collided: true, collidedBlocker: null };
  }

  // Check each blocker for collision
  for (const blocker of blockers) {
    if (checkBlockerCollision(developer, blocker, canvasHeight)) {
      return { collided: true, collidedBlocker: blocker };
    }
  }

  return { collided: false, collidedBlocker: null };
}
