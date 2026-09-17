import { GameState } from './types';

/**
 * Valid state transitions for the game.
 * Splash → Ready, Ready → Playing, Playing → Game_Over, Game_Over → Ready
 */
const VALID_TRANSITIONS: Record<GameState, GameState[]> = {
  splash: ['ready'],
  ready: ['playing'],
  playing: ['game_over'],
  game_over: ['ready'],
};

export type TransitionCallback = (from: GameState, to: GameState) => void;

export interface GameStateManager {
  current: GameState;
  transition(to: GameState): void;
  onTransition(callback: TransitionCallback): void;
}

/**
 * Creates a new GameStateManager starting from the given initial state.
 * Only valid transitions are allowed; invalid transitions are no-ops.
 */
export function createGameStateManager(initialState: GameState = 'splash'): GameStateManager {
  let current: GameState = initialState;
  const listeners: TransitionCallback[] = [];

  return {
    get current(): GameState {
      return current;
    },

    transition(to: GameState): void {
      const allowed = VALID_TRANSITIONS[current];
      if (!allowed.includes(to)) {
        // Invalid transition — no-op
        return;
      }

      const from = current;
      current = to;

      for (const callback of listeners) {
        callback(from, to);
      }
    },

    onTransition(callback: TransitionCallback): void {
      listeners.push(callback);
    },
  };
}
