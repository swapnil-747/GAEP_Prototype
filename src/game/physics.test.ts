import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { update, flap, physicsConfig } from './physics';
import { DSEDeveloper, GameState } from './types';
import { DEFAULT_CONFIG } from './constants';

const { gravity, flapStrength, terminalVelocity } = DEFAULT_CONFIG.developer;

function createDeveloper(overrides: Partial<DSEDeveloper> = {}): DSEDeveloper {
  return {
    x: 80,
    y: 300,
    velocity: 0,
    width: 40,
    height: 30,
    ...overrides,
  };
}

describe('Physics Engine', () => {
  describe('update()', () => {
    it('applies gravity to velocity when game state is playing', () => {
      const dev = createDeveloper({ velocity: 0 });
      const result = update(dev, 'playing');
      expect(result.velocity).toBe(gravity);
    });

    it('updates y position by new velocity when playing', () => {
      const dev = createDeveloper({ y: 300, velocity: 0 });
      const result = update(dev, 'playing');
      expect(result.y).toBe(300 + gravity);
    });

    it('accumulates velocity over multiple updates', () => {
      const dev = createDeveloper({ velocity: 2 });
      const result = update(dev, 'playing');
      expect(result.velocity).toBe(2 + gravity);
      expect(result.y).toBe(dev.y + 2 + gravity);
    });

    it('clamps velocity to terminal velocity', () => {
      const dev = createDeveloper({ velocity: terminalVelocity });
      const result = update(dev, 'playing');
      expect(result.velocity).toBe(terminalVelocity);
    });

    it('does not exceed terminal velocity when gravity would push past it', () => {
      const dev = createDeveloper({ velocity: terminalVelocity - 0.1 });
      const result = update(dev, 'playing');
      expect(result.velocity).toBeLessThanOrEqual(terminalVelocity);
    });

    it('does not change x position', () => {
      const dev = createDeveloper({ x: 80 });
      const result = update(dev, 'playing');
      expect(result.x).toBe(80);
    });

    it('is a no-op when game state is ready', () => {
      const dev = createDeveloper({ y: 300, velocity: 5 });
      const result = update(dev, 'ready');
      expect(result).toEqual(dev);
    });

    it('is a no-op when game state is splash', () => {
      const dev = createDeveloper({ y: 300, velocity: 5 });
      const result = update(dev, 'splash');
      expect(result).toEqual(dev);
    });

    it('is a no-op when game state is game_over', () => {
      const dev = createDeveloper({ y: 300, velocity: 5 });
      const result = update(dev, 'game_over');
      expect(result).toEqual(dev);
    });

    it('handles negative velocity (upward movement)', () => {
      const dev = createDeveloper({ y: 300, velocity: -8 });
      const result = update(dev, 'playing');
      expect(result.velocity).toBe(-8 + gravity);
      expect(result.y).toBe(300 + (-8 + gravity));
    });
  });

  describe('flap()', () => {
    it('sets velocity to flapStrength', () => {
      const dev = createDeveloper({ velocity: 5 });
      const result = flap(dev);
      expect(result.velocity).toBe(flapStrength);
    });

    it('overrides positive velocity with flapStrength', () => {
      const dev = createDeveloper({ velocity: terminalVelocity });
      const result = flap(dev);
      expect(result.velocity).toBe(flapStrength);
    });

    it('overrides negative velocity with flapStrength', () => {
      const dev = createDeveloper({ velocity: -10 });
      const result = flap(dev);
      expect(result.velocity).toBe(flapStrength);
    });

    it('does not change position', () => {
      const dev = createDeveloper({ x: 80, y: 200 });
      const result = flap(dev);
      expect(result.x).toBe(80);
      expect(result.y).toBe(200);
    });

    it('does not change dimensions', () => {
      const dev = createDeveloper({ width: 40, height: 30 });
      const result = flap(dev);
      expect(result.width).toBe(40);
      expect(result.height).toBe(30);
    });
  });

  describe('physicsConfig', () => {
    it('exposes gravity constant matching config', () => {
      expect(physicsConfig.gravity).toBe(DEFAULT_CONFIG.developer.gravity);
    });

    it('exposes flapStrength constant matching config', () => {
      expect(physicsConfig.flapStrength).toBe(DEFAULT_CONFIG.developer.flapStrength);
    });

    it('exposes terminalVelocity constant matching config', () => {
      expect(physicsConfig.terminalVelocity).toBe(DEFAULT_CONFIG.developer.terminalVelocity);
    });
  });
});

describe('Feature: flappy-bird-game, Property 1: Gravity is state-dependent', () => {
  /**
   * **Validates: Requirements 1.1, 1.2, 7.3**
   *
   * For any DSE Developer state, when the game state is "playing", applying a physics
   * update SHALL increase the developer's downward velocity by exactly the gravity constant
   * and leave the developer's x position unchanged. When the game state is "ready" or
   * "splash", applying a physics update SHALL not change the developer's velocity or position.
   */

  const { gravity, terminalVelocity } = DEFAULT_CONFIG.developer;

  const developerArb = fc.record({
    x: fc.double({ min: 0, max: 400, noNaN: true, noDefaultInfinity: true }),
    y: fc.double({ min: 0, max: 600, noNaN: true, noDefaultInfinity: true }),
    velocity: fc.double({ min: -50, max: terminalVelocity, noNaN: true, noDefaultInfinity: true }),
    width: fc.double({ min: 10, max: 100, noNaN: true, noDefaultInfinity: true }),
    height: fc.double({ min: 10, max: 100, noNaN: true, noDefaultInfinity: true }),
  });

  it('when playing, gravity increases downward velocity by exactly the gravity constant (below terminal velocity)', () => {
    fc.assert(
      fc.property(
        developerArb.filter((dev) => dev.velocity + gravity <= terminalVelocity),
        (developer) => {
          const result = update(developer, 'playing');
          expect(result.velocity).toBeCloseTo(developer.velocity + gravity, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('when playing, velocity is clamped to terminal velocity', () => {
    fc.assert(
      fc.property(
        developerArb.filter((dev) => dev.velocity + gravity > terminalVelocity),
        (developer) => {
          const result = update(developer, 'playing');
          expect(result.velocity).toBe(terminalVelocity);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('when playing, x position remains unchanged', () => {
    fc.assert(
      fc.property(developerArb, (developer) => {
        const result = update(developer, 'playing');
        expect(result.x).toBe(developer.x);
      }),
      { numRuns: 100 }
    );
  });

  it('when game state is "ready", velocity and position are unchanged', () => {
    fc.assert(
      fc.property(developerArb, (developer) => {
        const result = update(developer, 'ready');
        expect(result.x).toBe(developer.x);
        expect(result.y).toBe(developer.y);
        expect(result.velocity).toBe(developer.velocity);
      }),
      { numRuns: 100 }
    );
  });

  it('when game state is "splash", velocity and position are unchanged', () => {
    fc.assert(
      fc.property(developerArb, (developer) => {
        const result = update(developer, 'splash');
        expect(result.x).toBe(developer.x);
        expect(result.y).toBe(developer.y);
        expect(result.velocity).toBe(developer.velocity);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: flappy-bird-game, Property 2: Flap sets upward velocity', () => {
  /**
   * **Validates: Requirements 1.3**
   *
   * For any DSE Developer with any current velocity, applying a flap SHALL set the
   * developer's velocity to exactly the configured flapStrength value (an upward impulse),
   * regardless of the developer's previous velocity.
   */

  const { flapStrength, terminalVelocity } = DEFAULT_CONFIG.developer;

  const developerArb = fc.record({
    x: fc.double({ min: 0, max: 400, noNaN: true, noDefaultInfinity: true }),
    y: fc.double({ min: 0, max: 600, noNaN: true, noDefaultInfinity: true }),
    velocity: fc.double({ min: -50, max: 50, noNaN: true, noDefaultInfinity: true }),
    width: fc.double({ min: 10, max: 100, noNaN: true, noDefaultInfinity: true }),
    height: fc.double({ min: 10, max: 100, noNaN: true, noDefaultInfinity: true }),
  });

  it('flap sets velocity to exactly flapStrength regardless of previous velocity', () => {
    fc.assert(
      fc.property(developerArb, (developer) => {
        const result = flap(developer);
        expect(result.velocity).toBe(flapStrength);
      }),
      { numRuns: 100 }
    );
  });

  it('flap does not change the developer position (x and y)', () => {
    fc.assert(
      fc.property(developerArb, (developer) => {
        const result = flap(developer);
        expect(result.x).toBe(developer.x);
        expect(result.y).toBe(developer.y);
      }),
      { numRuns: 100 }
    );
  });

  it('flap does not change the developer dimensions (width and height)', () => {
    fc.assert(
      fc.property(developerArb, (developer) => {
        const result = flap(developer);
        expect(result.width).toBe(developer.width);
        expect(result.height).toBe(developer.height);
      }),
      { numRuns: 100 }
    );
  });
});
