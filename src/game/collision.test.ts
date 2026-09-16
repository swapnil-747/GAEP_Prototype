import { describe, it, expect } from 'vitest';
import {
  checkBlockerCollision,
  checkBoundaryCollision,
  checkAllCollisions,
} from './collision';
import { BoundingBox, BlockerPair } from './types';

/**
 * Helper to create a BoundingBox.
 */
function bbox(x: number, y: number, width: number, height: number): BoundingBox {
  return { x, y, width, height };
}

/**
 * Helper to create a BlockerPair.
 */
function blocker(x: number, gapY: number, gapHeight: number, width: number): BlockerPair {
  return {
    x,
    gapY,
    gapHeight,
    width,
    scored: false,
    label: 'DevOps Overload',
  };
}

const CANVAS_HEIGHT = 600;
const CANVAS_WIDTH = 400;

describe('checkBlockerCollision', () => {
  // Blocker at x=200, width=60, gapY=300, gapHeight=150
  // Bottom blocker region: 375 (300 + 150/2) to 600
  // No top blocker collision (removed for easier gameplay)
  const testBlocker = blocker(200, 300, 150, 60);

  it('returns false when developer is above the bottom blocker region', () => {
    // Developer at y=250, height=30 → occupies 250-280, above bottom region (375-600)
    const dev = bbox(210, 250, 40, 30);
    expect(checkBlockerCollision(dev, testBlocker, CANVAS_HEIGHT)).toBe(false);
  });

  it('returns false when developer is not horizontally overlapping', () => {
    const dev = bbox(100, 500, 40, 30);
    expect(checkBlockerCollision(dev, testBlocker, CANVAS_HEIGHT)).toBe(false);
  });

  it('returns false when developer is past the blocker', () => {
    const dev = bbox(261, 500, 40, 30);
    expect(checkBlockerCollision(dev, testBlocker, CANVAS_HEIGHT)).toBe(false);
  });

  it('returns false when developer is in the top region (no top collision)', () => {
    // Developer at y=100, height=30 — would have been a collision before, now safe
    const dev = bbox(210, 100, 40, 30);
    expect(checkBlockerCollision(dev, testBlocker, CANVAS_HEIGHT)).toBe(false);
  });

  it('returns true when developer collides with bottom blocker region', () => {
    // Developer at y=370, height=30 → occupies 370-400, overlaps bottom region (375-600)
    const dev = bbox(210, 370, 40, 30);
    expect(checkBlockerCollision(dev, testBlocker, CANVAS_HEIGHT)).toBe(true);
  });

  it('returns true when developer is entirely in bottom blocker region', () => {
    const dev = bbox(220, 500, 40, 30);
    expect(checkBlockerCollision(dev, testBlocker, CANVAS_HEIGHT)).toBe(true);
  });

  it('returns false when developer is above the bottom blocker top edge', () => {
    // Developer at y=340, height=30 → bottom = 370, which is < 375 (bottomBlockerTop)
    const dev = bbox(210, 340, 40, 30);
    expect(checkBlockerCollision(dev, testBlocker, CANVAS_HEIGHT)).toBe(false);
  });

  it('returns false when developer bottom exactly equals bottom blocker top', () => {
    // Developer at y=345, height=30 → bottom = 375 = bottomBlockerTop → not greater, so no collision
    const dev = bbox(210, 345, 40, 30);
    expect(checkBlockerCollision(dev, testBlocker, CANVAS_HEIGHT)).toBe(false);
  });

  it('returns true when developer bottom just exceeds bottom blocker top', () => {
    // Developer at y=346, height=30 → bottom = 376 > 375 → collision
    const dev = bbox(210, 346, 40, 30);
    expect(checkBlockerCollision(dev, testBlocker, CANVAS_HEIGHT)).toBe(true);
  });
});

describe('checkBoundaryCollision', () => {
  it('returns false when developer is within canvas bounds', () => {
    const dev = bbox(80, 200, 40, 30);
    expect(checkBoundaryCollision(dev, CANVAS_WIDTH, CANVAS_HEIGHT)).toBe(false);
  });

  it('returns false when developer is above the top boundary (no top death)', () => {
    const dev = bbox(80, -5, 40, 30);
    expect(checkBoundaryCollision(dev, CANVAS_WIDTH, CANVAS_HEIGHT)).toBe(false);
  });

  it('returns true when developer is below the bottom boundary', () => {
    const dev = bbox(80, 580, 40, 30);
    expect(checkBoundaryCollision(dev, CANVAS_WIDTH, CANVAS_HEIGHT)).toBe(true);
  });

  it('returns false when developer is exactly at the top edge (y=0)', () => {
    const dev = bbox(80, 0, 40, 30);
    expect(checkBoundaryCollision(dev, CANVAS_WIDTH, CANVAS_HEIGHT)).toBe(false);
  });

  it('returns false when developer bottom exactly touches canvas bottom', () => {
    const dev = bbox(80, 570, 40, 30);
    expect(checkBoundaryCollision(dev, CANVAS_WIDTH, CANVAS_HEIGHT)).toBe(false);
  });

  it('returns false when developer is far above canvas (no top death)', () => {
    const dev = bbox(80, -100, 40, 30);
    expect(checkBoundaryCollision(dev, CANVAS_WIDTH, CANVAS_HEIGHT)).toBe(false);
  });
});

describe('checkAllCollisions', () => {
  const blockers: BlockerPair[] = [
    blocker(100, 300, 150, 60), // Blocker 1: x=100-160, bottom region starts at 375
    blocker(300, 400, 150, 60), // Blocker 2: x=300-360, bottom region starts at 475
  ];

  it('returns no collision when developer is safe', () => {
    const dev = bbox(50, 280, 40, 30);
    const result = checkAllCollisions(dev, blockers, CANVAS_WIDTH, CANVAS_HEIGHT);
    expect(result.collided).toBe(false);
    expect(result.collidedBlocker).toBeNull();
  });

  it('returns no collision when developer is above canvas (no top death)', () => {
    const dev = bbox(50, -10, 40, 30);
    const result = checkAllCollisions(dev, blockers, CANVAS_WIDTH, CANVAS_HEIGHT);
    expect(result.collided).toBe(false);
    expect(result.collidedBlocker).toBeNull();
  });

  it('returns boundary collision when developer is below canvas', () => {
    const dev = bbox(50, 590, 40, 30);
    const result = checkAllCollisions(dev, blockers, CANVAS_WIDTH, CANVAS_HEIGHT);
    expect(result.collided).toBe(true);
    expect(result.collidedBlocker).toBeNull();
  });

  it('returns blocker collision with the specific blocker that was hit', () => {
    // Developer hitting blocker 1's bottom region: x=110 (within 100-160), y=380 (in bottom 375-600)
    const dev = bbox(110, 380, 40, 30);
    const result = checkAllCollisions(dev, blockers, CANVAS_WIDTH, CANVAS_HEIGHT);
    expect(result.collided).toBe(true);
    expect(result.collidedBlocker).toBe(blockers[0]);
  });

  it('returns no collision with empty blockers array and dev in bounds', () => {
    const dev = bbox(80, 300, 40, 30);
    const result = checkAllCollisions(dev, [], CANVAS_WIDTH, CANVAS_HEIGHT);
    expect(result.collided).toBe(false);
    expect(result.collidedBlocker).toBeNull();
  });

  it('returns first colliding blocker when multiple could collide', () => {
    const overlapping: BlockerPair[] = [
      blocker(100, 300, 150, 60),
      blocker(120, 300, 150, 60),
    ];
    // Developer at y=500 (in bottom region for both), x=125 (overlaps both)
    const dev = bbox(125, 500, 40, 30);
    const result = checkAllCollisions(dev, overlapping, CANVAS_WIDTH, CANVAS_HEIGHT);
    expect(result.collided).toBe(true);
    expect(result.collidedBlocker).toBe(overlapping[0]);
  });
});

import * as fc from 'fast-check';

describe('Feature: flappy-bird-game, Property 3: Boundary collision detection (bottom only)', () => {
  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;

  it('reports boundary collision when y + height > canvasHeight (below bottom)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 100, noNaN: true, noDefaultInfinity: true }).chain((height) =>
          fc.record({
            x: fc.double({ min: 0, max: 400, noNaN: true, noDefaultInfinity: true }),
            y: fc.double({
              min: CANVAS_HEIGHT - height + 0.001,
              max: 1000,
              noNaN: true,
              noDefaultInfinity: true,
            }),
            width: fc.double({ min: 1, max: 100, noNaN: true, noDefaultInfinity: true }),
            height: fc.constant(height),
          })
        ),
        (developer) => {
          expect(checkBoundaryCollision(developer, CANVAS_WIDTH, CANVAS_HEIGHT)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('does NOT report boundary collision when y + height <= canvasHeight', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: CANVAS_HEIGHT / 2, noNaN: true, noDefaultInfinity: true }).chain(
          (height) =>
            fc.record({
              x: fc.double({ min: 0, max: 400, noNaN: true, noDefaultInfinity: true }),
              y: fc.double({
                min: -500,
                max: CANVAS_HEIGHT - height,
                noNaN: true,
                noDefaultInfinity: true,
              }),
              width: fc.double({ min: 1, max: 100, noNaN: true, noDefaultInfinity: true }),
              height: fc.constant(height),
            })
        ),
        (developer) => {
          expect(checkBoundaryCollision(developer, CANVAS_WIDTH, CANVAS_HEIGHT)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: flappy-bird-game, Property 8: Bottom blocker collision geometry', () => {
  const CANVAS_HEIGHT = 600;

  const blockerPairArb = fc.record({
    x: fc.double({ min: 0, max: 400, noNaN: true, noDefaultInfinity: true }),
    gapY: fc.double({ min: 50, max: 550, noNaN: true, noDefaultInfinity: true }),
    gapHeight: fc.double({ min: 20, max: 200, noNaN: true, noDefaultInfinity: true }),
    width: fc.double({ min: 10, max: 100, noNaN: true, noDefaultInfinity: true }),
    scored: fc.boolean(),
    label: fc.constant('DevOps Overload' as const),
  });

  it('returns true when developer overlaps the bottom blocker region and is horizontally overlapping', () => {
    fc.assert(
      fc.property(
        blockerPairArb.chain((blk) => {
          const bottomBlockerTop = blk.gapY + blk.gapHeight / 2;
          if (bottomBlockerTop >= CANVAS_HEIGHT) {
            return fc.constant({
              developer: bbox(blk.x + 1, CANVAS_HEIGHT - 5, 10, 10),
              blocker: blk,
            });
          }

          return fc.record({
            developer: fc.record({
              x: fc.double({
                min: blk.x,
                max: blk.x + blk.width - 1,
                noNaN: true,
                noDefaultInfinity: true,
              }),
              y: fc.double({
                min: bottomBlockerTop - 10,
                max: CANVAS_HEIGHT - 1,
                noNaN: true,
                noDefaultInfinity: true,
              }),
              width: fc.double({ min: 1, max: 50, noNaN: true, noDefaultInfinity: true }),
              height: fc.double({ min: 1, max: 100, noNaN: true, noDefaultInfinity: true }),
            }),
            blocker: fc.constant(blk),
          });
        }),
        ({ developer, blocker }) => {
          const devRight = developer.x + developer.width;
          const blockerRight = blocker.x + blocker.width;
          if (devRight <= blocker.x || developer.x >= blockerRight) {
            return;
          }

          const bottomBlockerTop = blocker.gapY + blocker.gapHeight / 2;
          if (bottomBlockerTop >= CANVAS_HEIGHT) {
            return;
          }

          if (developer.y + developer.height > bottomBlockerTop && developer.y < CANVAS_HEIGHT) {
            expect(checkBlockerCollision(developer, blocker, CANVAS_HEIGHT)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false when developer is NOT horizontally overlapping the blocker', () => {
    fc.assert(
      fc.property(
        blockerPairArb,
        fc.double({ min: -100, max: 700, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 1, max: 50, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 1, max: 100, noNaN: true, noDefaultInfinity: true }),
        fc.boolean(),
        (blk, devY, devWidth, devHeight, toLeft) => {
          let devX: number;
          if (toLeft) {
            devX = blk.x - devWidth - 1;
          } else {
            devX = blk.x + blk.width + 1;
          }

          const developer: BoundingBox = { x: devX, y: devY, width: devWidth, height: devHeight };
          expect(checkBlockerCollision(developer, blk, CANVAS_HEIGHT)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false when developer is above the bottom blocker region', () => {
    fc.assert(
      fc.property(
        blockerPairArb.chain((blk) => {
          const bottomBlockerTop = blk.gapY + blk.gapHeight / 2;

          return fc.record({
            developer: fc.record({
              x: fc.double({
                min: blk.x,
                max: blk.x + blk.width - 1,
                noNaN: true,
                noDefaultInfinity: true,
              }),
              y: fc.constant(0),
              width: fc.double({ min: 1, max: 50, noNaN: true, noDefaultInfinity: true }),
              height: fc.double({
                min: 1,
                max: Math.max(1, bottomBlockerTop - 1),
                noNaN: true,
                noDefaultInfinity: true,
              }),
            }),
            blocker: fc.constant(blk),
          });
        }),
        ({ developer, blocker }) => {
          const devRight = developer.x + developer.width;
          const blockerRight = blocker.x + blocker.width;
          if (devRight <= blocker.x || developer.x >= blockerRight) {
            return;
          }

          const bottomBlockerTop = blocker.gapY + blocker.gapHeight / 2;
          if (developer.y + developer.height <= bottomBlockerTop) {
            expect(checkBlockerCollision(developer, blocker, CANVAS_HEIGHT)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
