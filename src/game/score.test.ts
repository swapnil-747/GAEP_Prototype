import { describe, it, expect } from 'vitest';
import { checkAndUpdate, reset } from './score';
import { BlockerPair } from './types';

function makeBlocker(overrides: Partial<BlockerPair> = {}): BlockerPair {
  return {
    x: 100,
    gapY: 300,
    gapHeight: 150,
    width: 60,
    scored: false,
    label: 'Admin Access Delays',
    ...overrides,
  };
}

describe('score', () => {
  describe('reset', () => {
    it('returns 0', () => {
      expect(reset()).toBe(0);
    });
  });

  describe('checkAndUpdate', () => {
    it('scores when developer x passes blocker trailing edge', () => {
      const blockers = [makeBlocker({ x: 100, width: 60 })];
      // developer at x=161 is past 100+60=160
      const result = checkAndUpdate(161, blockers);
      expect(result.scored).toBe(1);
      expect(result.blockers[0].scored).toBe(true);
    });

    it('does not score when developer has not passed blocker', () => {
      const blockers = [makeBlocker({ x: 100, width: 60 })];
      // developer at x=150 is not past 100+60=160
      const result = checkAndUpdate(150, blockers);
      expect(result.scored).toBe(0);
      expect(result.blockers[0].scored).toBe(false);
    });

    it('does not score when developer is exactly at blocker trailing edge', () => {
      const blockers = [makeBlocker({ x: 100, width: 60 })];
      // developer at x=160 is exactly at edge, not past it
      const result = checkAndUpdate(160, blockers);
      expect(result.scored).toBe(0);
      expect(result.blockers[0].scored).toBe(false);
    });

    it('does not score already-scored blockers', () => {
      const blockers = [makeBlocker({ x: 100, width: 60, scored: true })];
      const result = checkAndUpdate(200, blockers);
      expect(result.scored).toBe(0);
      expect(result.blockers[0].scored).toBe(true);
    });

    it('scores multiple blockers in a single call', () => {
      const blockers = [
        makeBlocker({ x: 50, width: 60 }),
        makeBlocker({ x: 80, width: 60 }),
      ];
      // developer at x=141 is past both 50+60=110 and 80+60=140
      const result = checkAndUpdate(141, blockers);
      expect(result.scored).toBe(2);
      expect(result.blockers[0].scored).toBe(true);
      expect(result.blockers[1].scored).toBe(true);
    });

    it('only scores blockers that have been passed', () => {
      const blockers = [
        makeBlocker({ x: 50, width: 60 }),  // trailing edge at 110
        makeBlocker({ x: 200, width: 60 }), // trailing edge at 260
      ];
      // developer at x=120 passes first but not second
      const result = checkAndUpdate(120, blockers);
      expect(result.scored).toBe(1);
      expect(result.blockers[0].scored).toBe(true);
      expect(result.blockers[1].scored).toBe(false);
    });

    it('returns empty array when no blockers exist', () => {
      const result = checkAndUpdate(100, []);
      expect(result.scored).toBe(0);
      expect(result.blockers).toEqual([]);
    });

    it('does not mutate the original blockers array', () => {
      const blockers = [makeBlocker({ x: 50, width: 60 })];
      const original = [...blockers];
      checkAndUpdate(200, blockers);
      expect(blockers[0].scored).toBe(original[0].scored);
    });
  });
});

import * as fc from 'fast-check';

/**
 * Feature: flappy-bird-game, Property 9: Score increment on pass
 * Validates: Requirements 4.1
 */
describe('Property 9: Score increment on pass', () => {
  const blockerLabelArb = fc.constantFrom(
    'Admin Access Delays' as const,
    'DevOps Overload' as const,
    'Geo Restrictions' as const,
    'No Experimentation Platform' as const
  );

  const blockerArb = fc.record({
    x: fc.float({ min: -500, max: 1000, noNaN: true }),
    gapY: fc.float({ min: 120, max: 480, noNaN: true }),
    gapHeight: fc.constant(150),
    width: fc.float({ min: 10, max: 200, noNaN: true }),
    scored: fc.boolean(),
    label: blockerLabelArb,
  });

  const blockersArb = fc.array(blockerArb, { minLength: 0, maxLength: 10 });
  const developerXArb = fc.float({ min: -100, max: 1500, noNaN: true });

  it('increments score by 1 for each unscored blocker the developer has passed', () => {
    fc.assert(
      fc.property(developerXArb, blockersArb, (developerX, blockers) => {
        const result = checkAndUpdate(developerX, blockers);

        // Count how many unscored blockers the developer has passed
        const expectedNewScores = blockers.filter(
          (b) => !b.scored && developerX > b.x + b.width
        ).length;

        expect(result.scored).toBe(expectedNewScores);
      }),
      { numRuns: 100 }
    );
  });

  it('marks each newly-passed unscored blocker as scored', () => {
    fc.assert(
      fc.property(developerXArb, blockersArb, (developerX, blockers) => {
        const result = checkAndUpdate(developerX, blockers);

        for (let i = 0; i < blockers.length; i++) {
          const original = blockers[i];
          const updated = result.blockers[i];

          if (!original.scored && developerX > original.x + original.width) {
            // Blocker was unscored and developer passed it - should now be scored
            expect(updated.scored).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('never increments score for already-scored blockers', () => {
    fc.assert(
      fc.property(developerXArb, blockersArb, (developerX, blockers) => {
        // Filter to only already-scored blockers
        const allScoredBlockers = blockers.map((b) => ({ ...b, scored: true }));
        const result = checkAndUpdate(developerX, allScoredBlockers);

        // No score should be added regardless of developer position
        expect(result.scored).toBe(0);

        // All blockers should remain scored
        for (const b of result.blockers) {
          expect(b.scored).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('total scored equals count of newly-passed unscored blockers', () => {
    fc.assert(
      fc.property(developerXArb, blockersArb, (developerX, blockers) => {
        const result = checkAndUpdate(developerX, blockers);

        // Count newly-scored blockers in the result
        let newlyScoredCount = 0;
        for (let i = 0; i < blockers.length; i++) {
          if (!blockers[i].scored && result.blockers[i].scored) {
            newlyScoredCount++;
          }
        }

        // The scored return value should match the count of blockers that flipped to scored
        expect(result.scored).toBe(newlyScoredCount);

        // And the total newly-passed unscored count should match
        const expectedPassed = blockers.filter(
          (b) => !b.scored && developerX > b.x + b.width
        ).length;
        expect(newlyScoredCount).toBe(expectedPassed);
      }),
      { numRuns: 100 }
    );
  });
});
