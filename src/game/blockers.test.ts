import { describe, it, expect } from 'vitest';
import { generate, update, shouldGenerate, blockersConfig } from './blockers';
import { BlockerPair } from './types';
import { DEFAULT_CONFIG, BLOCKER_LABELS } from './constants';

const { width, gapHeight, speed, spawnInterval, minGapY, maxGapY } = DEFAULT_CONFIG.blockers;
const canvasWidth = DEFAULT_CONFIG.canvas.width;

function createBlocker(overrides: Partial<BlockerPair> = {}): BlockerPair {
  return {
    x: 300,
    gapY: 300,
    gapHeight,
    width,
    scored: false,
    label: 'Admin Access Delays',
    ...overrides,
  };
}

describe('Blocker Generator', () => {
  describe('generate()', () => {
    it('creates a blocker at the right edge of the canvas', () => {
      const blocker = generate();
      expect(blocker.x).toBe(canvasWidth);
    });

    it('creates a blocker with the configured width', () => {
      const blocker = generate();
      expect(blocker.width).toBe(width);
    });

    it('creates a blocker with the configured gap height', () => {
      const blocker = generate();
      expect(blocker.gapHeight).toBe(gapHeight);
    });

    it('creates a blocker with scored set to false', () => {
      const blocker = generate();
      expect(blocker.scored).toBe(false);
    });

    it('creates a blocker with gapY within [minGapY, maxGapY]', () => {
      // Run multiple times to check randomization stays in bounds
      for (let i = 0; i < 50; i++) {
        const blocker = generate();
        expect(blocker.gapY).toBeGreaterThanOrEqual(minGapY);
        expect(blocker.gapY).toBeLessThanOrEqual(maxGapY);
      }
    });

    it('creates a blocker with a label from the predefined list', () => {
      for (let i = 0; i < 50; i++) {
        const blocker = generate();
        expect(BLOCKER_LABELS).toContain(blocker.label);
      }
    });
  });

  describe('update()', () => {
    it('moves blockers left by speed when game state is playing', () => {
      const blockers = [createBlocker({ x: 200 })];
      const result = update(blockers, 'playing');
      expect(result[0].x).toBe(200 - speed);
    });

    it('moves multiple blockers left by speed', () => {
      const blockers = [
        createBlocker({ x: 200 }),
        createBlocker({ x: 350 }),
      ];
      const result = update(blockers, 'playing');
      expect(result[0].x).toBe(200 - speed);
      expect(result[1].x).toBe(350 - speed);
    });

    it('removes blockers that have moved entirely off-screen', () => {
      const blockers = [
        createBlocker({ x: -width }),  // x + width = 0, still barely visible
        createBlocker({ x: -width - 1 }),  // x + width = -1, off-screen
        createBlocker({ x: 200 }),
      ];
      const result = update(blockers, 'playing');
      // After moving left by speed:
      // blocker at -width: new x = -width - speed, x + width = -speed < 0 → removed
      // blocker at -width - 1: new x = -width - 1 - speed, x + width = -1 - speed < 0 → removed
      // blocker at 200: new x = 200 - speed = 197, x + width = 257 > 0 → kept
      expect(result).toHaveLength(1);
      expect(result[0].x).toBe(200 - speed);
    });

    it('does not move blockers when game state is ready', () => {
      const blockers = [createBlocker({ x: 200 })];
      const result = update(blockers, 'ready');
      expect(result[0].x).toBe(200);
    });

    it('does not move blockers when game state is splash', () => {
      const blockers = [createBlocker({ x: 200 })];
      const result = update(blockers, 'splash');
      expect(result[0].x).toBe(200);
    });

    it('does not move blockers when game state is game_over', () => {
      const blockers = [createBlocker({ x: 200 })];
      const result = update(blockers, 'game_over');
      expect(result[0].x).toBe(200);
    });

    it('preserves other blocker properties when updating', () => {
      const blockers = [createBlocker({ x: 200, gapY: 250, scored: true, label: 'DevOps Overload' })];
      const result = update(blockers, 'playing');
      expect(result[0].gapY).toBe(250);
      expect(result[0].gapHeight).toBe(gapHeight);
      expect(result[0].width).toBe(width);
      expect(result[0].scored).toBe(true);
      expect(result[0].label).toBe('DevOps Overload');
    });

    it('returns empty array when all blockers move off-screen', () => {
      const blockers = [
        createBlocker({ x: -width + speed - 1 }),  // after move: x + width = speed - 1 - speed = -1 < 0
      ];
      const result = update(blockers, 'playing');
      expect(result).toHaveLength(0);
    });

    it('returns empty array when given empty array', () => {
      const result = update([], 'playing');
      expect(result).toHaveLength(0);
    });
  });

  describe('shouldGenerate()', () => {
    it('returns true when there are no blockers', () => {
      expect(shouldGenerate([])).toBe(true);
    });

    it('returns true when rightmost blocker is far enough from canvas right edge', () => {
      const blockers = [createBlocker({ x: canvasWidth - spawnInterval })];
      expect(shouldGenerate(blockers)).toBe(true);
    });

    it('returns false when rightmost blocker is too close to canvas right edge', () => {
      const blockers = [createBlocker({ x: canvasWidth - spawnInterval + 1 })];
      expect(shouldGenerate(blockers)).toBe(false);
    });

    it('considers the rightmost blocker among multiple blockers', () => {
      const blockers = [
        createBlocker({ x: 50 }),
        createBlocker({ x: canvasWidth - 10 }),  // rightmost, too close
      ];
      expect(shouldGenerate(blockers)).toBe(false);
    });

    it('returns true when distance exactly equals spawn interval', () => {
      const blockers = [createBlocker({ x: canvasWidth - spawnInterval })];
      expect(shouldGenerate(blockers)).toBe(true);
    });
  });

  describe('blockersConfig', () => {
    it('exposes width matching config', () => {
      expect(blockersConfig.width).toBe(DEFAULT_CONFIG.blockers.width);
    });

    it('exposes gapHeight matching config', () => {
      expect(blockersConfig.gapHeight).toBe(DEFAULT_CONFIG.blockers.gapHeight);
    });

    it('exposes speed matching config', () => {
      expect(blockersConfig.speed).toBe(DEFAULT_CONFIG.blockers.speed);
    });

    it('exposes spawnInterval matching config', () => {
      expect(blockersConfig.spawnInterval).toBe(DEFAULT_CONFIG.blockers.spawnInterval);
    });

    it('exposes minGapY matching config', () => {
      expect(blockersConfig.minGapY).toBe(DEFAULT_CONFIG.blockers.minGapY);
    });

    it('exposes maxGapY matching config', () => {
      expect(blockersConfig.maxGapY).toBe(DEFAULT_CONFIG.blockers.maxGapY);
    });
  });
});

import * as fc from 'fast-check';

describe('Feature: flappy-bird-game, Property 4: Blocker gap position within bounds', () => {
  /**
   * **Validates: Requirements 2.2**
   *
   * For any generated blocker pair, the gap center Y position SHALL be
   * within the configured [minGapY, maxGapY] range.
   */
  it('generated blocker gapY is always within [minGapY, maxGapY]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 999 }), (_seed) => {
        const blocker = generate();
        expect(blocker.gapY).toBeGreaterThanOrEqual(minGapY);
        expect(blocker.gapY).toBeLessThanOrEqual(maxGapY);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: flappy-bird-game, Property 5: Blocker gap size invariant', () => {
  /**
   * **Validates: Requirements 2.4**
   *
   * For any generated blocker pair, the gap height SHALL equal the configured
   * gapHeight constant.
   */
  it('generated blocker gapHeight always equals the configured gapHeight constant', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 999 }), (_seed) => {
        const blocker = generate();
        expect(blocker.gapHeight).toBe(DEFAULT_CONFIG.blockers.gapHeight);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: flappy-bird-game, Property 6: Blocker movement is state-dependent', () => {
  /**
   * **Validates: Requirements 2.3, 5.3**
   *
   * For any set of blockers, when the game state is 'playing', applying one update tick
   * SHALL decrease each blocker's x position by the configured speed constant.
   * When the game state is 'game_over', applying an update tick SHALL leave all blocker
   * positions unchanged.
   */

  const arbBlockerPair = fc.record({
    x: fc.integer({ min: Math.ceil(speed + width), max: 2000 }), // positive enough to not be filtered out after update
    gapY: fc.integer({ min: Math.ceil(minGapY), max: Math.floor(maxGapY) }),
    gapHeight: fc.constant(gapHeight),
    width: fc.constant(width),
    scored: fc.boolean(),
    label: fc.constantFrom(
      'Admin Access Delays' as const,
      'DevOps Overload' as const,
      'Geo Restrictions' as const,
      'No Experimentation Platform' as const
    ),
  });

  const arbBlockerArray = fc.array(arbBlockerPair, { minLength: 1, maxLength: 10 });

  it('when playing, each blocker x decreases by exactly the speed constant', () => {
    fc.assert(
      fc.property(arbBlockerArray, (blockers) => {
        const result = update(blockers, 'playing');

        expect(result).toHaveLength(blockers.length);
        for (let i = 0; i < blockers.length; i++) {
          expect(result[i].x).toBe(blockers[i].x - speed);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('when game_over, all blocker positions remain unchanged', () => {
    fc.assert(
      fc.property(arbBlockerArray, (blockers) => {
        const result = update(blockers, 'game_over');

        expect(result).toHaveLength(blockers.length);
        for (let i = 0; i < blockers.length; i++) {
          expect(result[i].x).toBe(blockers[i].x);
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: flappy-bird-game, Property 7: Off-screen blocker removal', () => {
  /**
   * **Validates: Requirements 2.5**
   *
   * For any set of blockers at various x positions, after an update, all blockers
   * whose x + width < 0 SHALL be removed, and all blockers whose x + width >= 0
   * SHALL be retained with their relative order preserved.
   */

  const arbBlockerPair = (xArb: fc.Arbitrary<number>) =>
    fc.record({
      x: xArb,
      gapY: fc.integer({ min: minGapY, max: maxGapY }),
      gapHeight: fc.constant(gapHeight),
      width: fc.constant(width),
      scored: fc.boolean(),
      label: fc.constantFrom(
        'Admin Access Delays' as const,
        'DevOps Overload' as const,
        'Geo Restrictions' as const,
        'No Experimentation Platform' as const
      ),
    });

  // Generate blockers with x positions spanning off-screen to on-screen range
  // After update: new_x = x - speed, removed if new_x + width < 0, i.e. x < speed - width
  const arbBlockerArray = fc.array(
    arbBlockerPair(fc.integer({ min: -500, max: 2000 })),
    { minLength: 0, maxLength: 15 }
  );

  it('all blockers where (x - speed + width < 0) are removed after update', () => {
    fc.assert(
      fc.property(arbBlockerArray, (blockers) => {
        const result = update(blockers, 'playing');

        // Blockers that should be removed: those where (x - speed + width < 0)
        const shouldBeRemoved = blockers.filter((b) => b.x - speed + width < 0);

        // None of the removed blockers should appear in the result
        for (const removed of shouldBeRemoved) {
          const found = result.some(
            (r) => r.x === removed.x - speed && r.gapY === removed.gapY && r.label === removed.label
          );
          expect(found).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('all blockers where (x - speed + width >= 0) are retained after update', () => {
    fc.assert(
      fc.property(arbBlockerArray, (blockers) => {
        const result = update(blockers, 'playing');

        // Blockers that should be retained: those where (x - speed + width >= 0)
        const shouldBeRetained = blockers.filter((b) => b.x - speed + width >= 0);

        expect(result).toHaveLength(shouldBeRetained.length);

        // Each retained blocker should appear in the result with its x decremented by speed
        for (let i = 0; i < shouldBeRetained.length; i++) {
          expect(result[i].x).toBe(shouldBeRetained[i].x - speed);
          expect(result[i].gapY).toBe(shouldBeRetained[i].gapY);
          expect(result[i].width).toBe(shouldBeRetained[i].width);
          expect(result[i].label).toBe(shouldBeRetained[i].label);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('relative order of retained blockers is preserved after update', () => {
    fc.assert(
      fc.property(arbBlockerArray, (blockers) => {
        const result = update(blockers, 'playing');

        // Get the indices of retained blockers from the original array
        const retainedOriginal = blockers
          .map((b, i) => ({ blocker: b, index: i }))
          .filter(({ blocker }) => blocker.x - speed + width >= 0);

        expect(result).toHaveLength(retainedOriginal.length);

        // Verify order preservation: result[i] corresponds to retainedOriginal[i]
        for (let i = 0; i < retainedOriginal.length; i++) {
          expect(result[i].x).toBe(retainedOriginal[i].blocker.x - speed);
          expect(result[i].gapY).toBe(retainedOriginal[i].blocker.gapY);
          expect(result[i].scored).toBe(retainedOriginal[i].blocker.scored);
          expect(result[i].label).toBe(retainedOriginal[i].blocker.label);
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: flappy-bird-game, Property 11: Blocker label assignment from valid set', () => {
  /**
   * **Validates: Requirements 2.6**
   *
   * For any generated blocker pair, the assigned label SHALL be a member of the
   * predefined BLOCKER_LABELS list ('Admin Access Delays', 'DevOps Overload',
   * 'Geo Restrictions', 'No Experimentation Platform').
   */
  it('generated blocker label is always a member of BLOCKER_LABELS', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 999 }), (_seed) => {
        const blocker = generate();
        expect(BLOCKER_LABELS).toContain(blocker.label);
      }),
      { numRuns: 100 }
    );
  });
});
