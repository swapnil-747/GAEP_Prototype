import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { createGameStateManager } from './state';
import { GameState } from './types';

describe('GameStateManager', () => {
  describe('initialization', () => {
    it('starts in splash state by default', () => {
      const manager = createGameStateManager();
      expect(manager.current).toBe('splash');
    });

    it('starts in provided initial state', () => {
      const manager = createGameStateManager('ready');
      expect(manager.current).toBe('ready');
    });
  });

  describe('valid transitions', () => {
    it('transitions from splash to ready', () => {
      const manager = createGameStateManager('splash');
      manager.transition('ready');
      expect(manager.current).toBe('ready');
    });

    it('transitions from ready to playing', () => {
      const manager = createGameStateManager('ready');
      manager.transition('playing');
      expect(manager.current).toBe('playing');
    });

    it('transitions from playing to game_over', () => {
      const manager = createGameStateManager('playing');
      manager.transition('game_over');
      expect(manager.current).toBe('game_over');
    });

    it('transitions from game_over to ready', () => {
      const manager = createGameStateManager('game_over');
      manager.transition('ready');
      expect(manager.current).toBe('ready');
    });
  });

  describe('invalid transitions are no-ops', () => {
    it('does not transition from splash to playing', () => {
      const manager = createGameStateManager('splash');
      manager.transition('playing');
      expect(manager.current).toBe('splash');
    });

    it('does not transition from splash to game_over', () => {
      const manager = createGameStateManager('splash');
      manager.transition('game_over');
      expect(manager.current).toBe('splash');
    });

    it('does not transition from ready to game_over', () => {
      const manager = createGameStateManager('ready');
      manager.transition('game_over');
      expect(manager.current).toBe('ready');
    });

    it('does not transition from ready to splash', () => {
      const manager = createGameStateManager('ready');
      manager.transition('splash');
      expect(manager.current).toBe('ready');
    });

    it('does not transition from playing to ready', () => {
      const manager = createGameStateManager('playing');
      manager.transition('ready');
      expect(manager.current).toBe('playing');
    });

    it('does not transition from playing to splash', () => {
      const manager = createGameStateManager('playing');
      manager.transition('splash');
      expect(manager.current).toBe('playing');
    });

    it('does not transition from game_over to playing', () => {
      const manager = createGameStateManager('game_over');
      manager.transition('playing');
      expect(manager.current).toBe('game_over');
    });

    it('does not transition from game_over to splash', () => {
      const manager = createGameStateManager('game_over');
      manager.transition('splash');
      expect(manager.current).toBe('game_over');
    });

    it('does not transition to the same state', () => {
      const manager = createGameStateManager('playing');
      manager.transition('playing');
      expect(manager.current).toBe('playing');
    });
  });

  describe('onTransition callback', () => {
    it('calls callback on valid transition', () => {
      const manager = createGameStateManager('splash');
      const callback = vi.fn();
      manager.onTransition(callback);

      manager.transition('ready');

      expect(callback).toHaveBeenCalledWith('splash', 'ready');
    });

    it('does not call callback on invalid transition', () => {
      const manager = createGameStateManager('splash');
      const callback = vi.fn();
      manager.onTransition(callback);

      manager.transition('game_over');

      expect(callback).not.toHaveBeenCalled();
    });

    it('supports multiple callbacks', () => {
      const manager = createGameStateManager('ready');
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      manager.onTransition(cb1);
      manager.onTransition(cb2);

      manager.transition('playing');

      expect(cb1).toHaveBeenCalledWith('ready', 'playing');
      expect(cb2).toHaveBeenCalledWith('ready', 'playing');
    });

    it('calls callback for each valid transition in sequence', () => {
      const manager = createGameStateManager('splash');
      const callback = vi.fn();
      manager.onTransition(callback);

      manager.transition('ready');
      manager.transition('playing');
      manager.transition('game_over');
      manager.transition('ready');

      expect(callback).toHaveBeenCalledTimes(4);
      expect(callback).toHaveBeenNthCalledWith(1, 'splash', 'ready');
      expect(callback).toHaveBeenNthCalledWith(2, 'ready', 'playing');
      expect(callback).toHaveBeenNthCalledWith(3, 'playing', 'game_over');
      expect(callback).toHaveBeenNthCalledWith(4, 'game_over', 'ready');
    });
  });
});


describe('Feature: flappy-bird-game, Property 12: Game state transition validity', () => {
  /**
   * **Validates: Requirements 7.2, 8.5**
   *
   * For any game state, valid transitions SHALL be limited to:
   * Splash → Ready, Ready → Playing, Playing → Game_Over, Game_Over → Ready.
   * No other transitions SHALL be allowed.
   */

  const ALL_STATES: GameState[] = ['splash', 'ready', 'playing', 'game_over'];

  const VALID_TRANSITIONS: Record<GameState, GameState> = {
    splash: 'ready',
    ready: 'playing',
    playing: 'game_over',
    game_over: 'ready',
  };

  const gameStateArb = fc.constantFrom<GameState>(...ALL_STATES);

  it('valid transitions succeed and update state correctly', () => {
    fc.assert(
      fc.property(gameStateArb, (fromState) => {
        const manager = createGameStateManager(fromState);
        const validTarget = VALID_TRANSITIONS[fromState];

        manager.transition(validTarget);

        expect(manager.current).toBe(validTarget);
      }),
      { numRuns: 100 }
    );
  });

  it('invalid transitions are no-ops and do not change state', () => {
    fc.assert(
      fc.property(gameStateArb, gameStateArb, (fromState, toState) => {
        // Skip valid transitions — we only care about invalid ones here
        if (toState === VALID_TRANSITIONS[fromState]) return;

        const manager = createGameStateManager(fromState);
        manager.transition(toState);

        expect(manager.current).toBe(fromState);
      }),
      { numRuns: 100 }
    );
  });

  it('sequences of random transitions only reach states reachable via valid paths', () => {
    const transitionSequenceArb = fc.array(gameStateArb, { minLength: 1, maxLength: 20 });

    fc.assert(
      fc.property(transitionSequenceArb, (transitions) => {
        const manager = createGameStateManager('splash');

        for (const target of transitions) {
          const before = manager.current;
          manager.transition(target);

          if (target === VALID_TRANSITIONS[before]) {
            // Valid transition: state should update
            expect(manager.current).toBe(target);
          } else {
            // Invalid transition: state should remain unchanged
            expect(manager.current).toBe(before);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
