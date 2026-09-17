/**
 * Game state representing the current mode of the game.
 * - splash: Introductory screen explaining the metaphor
 * - ready: Waiting for player to start
 * - playing: Active gameplay
 * - game_over: Game has ended, showing results
 */
export type GameState = 'splash' | 'ready' | 'playing' | 'game_over';

/**
 * A blocker label is one of the predefined infrastructure barrier names.
 */
export type BlockerLabel =
  | 'Admin Access Delays'
  | 'DevOps Overload'
  | 'Geo Restrictions'
  | 'No Experimentation Platform';

/**
 * The player-controlled DSE Developer character.
 */
export interface DSEDeveloper {
  x: number;
  y: number;
  velocity: number;
  width: number;
  height: number;
}

/**
 * A pair of top and bottom blockers with a gap between them.
 */
export interface BlockerPair {
  x: number;
  gapY: number;
  gapHeight: number;
  width: number;
  scored: boolean;
  label: BlockerLabel;
}

/**
 * Axis-aligned bounding box for collision detection.
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Result of a collision check.
 */
export interface CollisionResult {
  collided: boolean;
  collidedBlocker: BlockerPair | null;
}

/**
 * Complete runtime state of the game at any point in time.
 */
export interface RuntimeState {
  gameState: GameState;
  developer: DSEDeveloper;
  blockers: BlockerPair[];
  score: number;
  frameCount: number;
  lastTimestamp: number;
  collidedBlockerLabel: BlockerLabel | null;
}

/**
 * Game configuration interface defining all tunable parameters.
 */
export interface GameConfig {
  canvas: {
    width: number;
    height: number;
  };
  developer: {
    startX: number;
    startY: number;
    width: number;
    height: number;
    gravity: number;
    flapStrength: number;
    terminalVelocity: number;
  };
  blockers: {
    width: number;
    gapHeight: number;
    speed: number;
    spawnInterval: number;
    minGapY: number;
    maxGapY: number;
  };
  theme: {
    title: string;
    tagline: string;
    blockerLabels: readonly BlockerLabel[];
  };
}
