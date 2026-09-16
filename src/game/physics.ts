import { DSEDeveloper, GameState } from './types';
import { DEFAULT_CONFIG } from './constants';

const { gravity, flapStrength, terminalVelocity } = DEFAULT_CONFIG.developer;

/**
 * Applies physics update to the DSE Developer character.
 * When game state is "playing": applies gravity to velocity, updates y position, clamps velocity.
 * When game state is "ready" or "splash": no-op, returns developer unchanged.
 *
 * @param developer - Current developer state
 * @param gameState - Current game state
 * @returns Updated developer state
 */
export function update(developer: DSEDeveloper, gameState: GameState): DSEDeveloper {
  if (gameState !== 'playing') {
    return developer;
  }

  const newVelocity = Math.min(developer.velocity + gravity, terminalVelocity);
  const newY = developer.y + newVelocity;

  return {
    ...developer,
    velocity: newVelocity,
    y: newY,
  };
}

/**
 * Applies a flap impulse to the DSE Developer.
 * Sets velocity to flapStrength regardless of current velocity.
 *
 * @param developer - Current developer state
 * @returns Updated developer state with flap velocity applied
 */
export function flap(developer: DSEDeveloper): DSEDeveloper {
  return {
    ...developer,
    velocity: flapStrength,
  };
}

/**
 * Physics engine constants exposed for testing and external use.
 */
export const physicsConfig = {
  gravity,
  flapStrength,
  terminalVelocity,
} as const;
