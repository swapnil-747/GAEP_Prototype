import { RuntimeState, GameState, DSEDeveloper, BlockerPair } from './types';
import { DEFAULT_CONFIG } from './constants';
import { update as physicsUpdate, flap } from './physics';
import { generate as generateBlocker, update as updateBlockers, shouldGenerate } from './blockers';
import { checkAllCollisions } from './collision';
import { checkAndUpdate as scoreCheckAndUpdate, reset as scoreReset } from './score';
import { createGameStateManager, GameStateManager } from './state';

/**
 * Maximum deltaTime (in ms) to prevent large jumps when the tab regains focus.
 */
const MAX_DELTA_TIME = 33;

/**
 * Creates initial developer state from config.
 */
function createInitialDeveloper(): DSEDeveloper {
  return {
    x: DEFAULT_CONFIG.developer.startX,
    y: DEFAULT_CONFIG.developer.startY,
    velocity: 0,
    width: DEFAULT_CONFIG.developer.width,
    height: DEFAULT_CONFIG.developer.height,
  };
}

/**
 * Creates the initial runtime state.
 */
function createInitialState(): RuntimeState {
  return {
    gameState: 'splash',
    developer: createInitialDeveloper(),
    blockers: [],
    score: 0,
    frameCount: 0,
    lastTimestamp: 0,
    collidedBlockerLabel: null,
  };
}

export interface GameEngine {
  start(): void;
  stop(): void;
  reset(): void;
  handleInput(): void;
  getState(): RuntimeState;
}

export type RenderCallback = (state: RuntimeState) => void;

/**
 * Creates the central game engine orchestrator.
 *
 * @param renderCallback - Function called each frame with the current runtime state
 * @returns GameEngine interface for controlling the game loop
 */
export function createGameEngine(renderCallback: RenderCallback): GameEngine {
  let state: RuntimeState = createInitialState();
  let stateManager: GameStateManager = createGameStateManager('splash');
  let animationFrameId: number | null = null;

  // Keep state.gameState in sync with the state manager
  stateManager.onTransition((_from: GameState, to: GameState) => {
    state = { ...state, gameState: to };
  });

  function gameLoop(timestamp: number): void {
    // Calculate deltaTime, capping to prevent large jumps
    let deltaTime = timestamp - state.lastTimestamp;
    if (state.lastTimestamp === 0) {
      deltaTime = 16; // First frame: assume ~60fps
    }
    deltaTime = Math.min(deltaTime, MAX_DELTA_TIME);

    state = { ...state, lastTimestamp: timestamp };

    if (state.gameState === 'playing') {
      // 1. Update physics
      const updatedDeveloper = physicsUpdate(state.developer, state.gameState);

      // 2. Update blockers (generate if needed, move, remove off-screen)
      let updatedBlockers = updateBlockers(state.blockers, state.gameState);
      if (shouldGenerate(updatedBlockers)) {
        updatedBlockers = [...updatedBlockers, generateBlocker()];
      }

      // 3. Check collisions
      const collisionResult = checkAllCollisions(
        updatedDeveloper,
        updatedBlockers,
        DEFAULT_CONFIG.canvas.width,
        DEFAULT_CONFIG.canvas.height
      );

      if (collisionResult.collided) {
        // Transition to game_over
        const collidedLabel = collisionResult.collidedBlocker
          ? collisionResult.collidedBlocker.label
          : null;

        state = {
          ...state,
          developer: updatedDeveloper,
          blockers: updatedBlockers,
          collidedBlockerLabel: collidedLabel,
          frameCount: state.frameCount + 1,
        };

        stateManager.transition('game_over');
      } else {
        // 4. Update score
        const scoreResult = scoreCheckAndUpdate(updatedDeveloper.x, updatedBlockers);

        state = {
          ...state,
          developer: updatedDeveloper,
          blockers: scoreResult.blockers,
          score: state.score + scoreResult.scored,
          frameCount: state.frameCount + 1,
        };
      }
    } else {
      state = { ...state, frameCount: state.frameCount + 1 };
    }

    // 5. Trigger render
    renderCallback(state);

    // Continue loop
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  return {
    start(): void {
      if (animationFrameId !== null) return; // Already running
      animationFrameId = requestAnimationFrame(gameLoop);
    },

    stop(): void {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    },

    reset(): void {
      state = {
        gameState: 'ready',
        developer: createInitialDeveloper(),
        blockers: [],
        score: 0,
        frameCount: 0,
        lastTimestamp: 0,
        collidedBlockerLabel: null,
      };
      stateManager = createGameStateManager('ready');
      stateManager.onTransition((_from: GameState, to: GameState) => {
        state = { ...state, gameState: to };
      });
    },

    handleInput(): void {
      switch (state.gameState) {
        case 'splash':
          stateManager.transition('ready');
          break;
        case 'ready':
          stateManager.transition('playing');
          state = { ...state, developer: flap(state.developer) };
          break;
        case 'playing':
          state = { ...state, developer: flap(state.developer) };
          break;
        case 'game_over':
          this.reset();
          break;
      }
    },

    getState(): RuntimeState {
      return state;
    },
  };
}
