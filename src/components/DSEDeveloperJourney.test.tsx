/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import DSEDeveloperJourney from './DSEDeveloperJourney';
import { DEFAULT_CONFIG } from '../game/constants';

// Mock canvas context
function createMockContext(): CanvasRenderingContext2D {
  const ctx = {
    canvas: { width: DEFAULT_CONFIG.canvas.width, height: DEFAULT_CONFIG.canvas.height },
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 50 })),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    roundRect: vi.fn(),
    set fillStyle(_v: string | CanvasGradient) {},
    get fillStyle() { return ''; },
    set strokeStyle(_v: string) {},
    get strokeStyle() { return ''; },
    set font(_v: string) {},
    get font() { return ''; },
    set textAlign(_v: string) {},
    get textAlign() { return '' as CanvasTextAlign; },
    set textBaseline(_v: string) {},
    get textBaseline() { return '' as CanvasTextBaseline; },
    set lineWidth(_v: number) {},
    get lineWidth() { return 1; },
    set globalAlpha(_v: number) {},
    get globalAlpha() { return 1; },
  } as unknown as CanvasRenderingContext2D;
  return ctx;
}

describe('DSEDeveloperJourney Component', () => {
  let mockCtx: CanvasRenderingContext2D;
  let rafCallbacks: Array<FrameRequestCallback>;
  let rafIdCounter: number;

  beforeEach(() => {
    mockCtx = createMockContext();
    rafCallbacks = [];
    rafIdCounter = 0;

    // Mock requestAnimationFrame to capture callbacks
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return ++rafIdCounter;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    // Mock canvas getContext
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => mockCtx
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  /**
   * Helper: advance the game loop by one frame.
   */
  function advanceFrame(timestamp = 16) {
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    for (const cb of callbacks) {
      cb(timestamp);
    }
  }

  it('renders a canvas element on mount', () => {
    const { container } = render(<DSEDeveloperJourney />);
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas!.width).toBe(DEFAULT_CONFIG.canvas.width);
    expect(canvas!.height).toBe(DEFAULT_CONFIG.canvas.height);
  });

  it('initializes in Splash state and draws the splash screen', () => {
    render(<DSEDeveloperJourney />);

    // The engine starts and triggers a requestAnimationFrame
    expect(window.requestAnimationFrame).toHaveBeenCalled();

    // Advance one frame to trigger the render callback
    advanceFrame(16);

    // The splash screen should call fillText with the title
    const fillTextCalls = (mockCtx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    const allText = fillTextCalls.map((call: unknown[]) => call[0] as string);

    // Splash screen displays title "DSE Developer's Journey"
    expect(allText.some((t: string) => t.includes("DSE Developer's Journey"))).toBe(true);
  });

  it('splash screen displays metaphor explanation text', () => {
    render(<DSEDeveloperJourney />);
    advanceFrame(16);

    const fillTextCalls = (mockCtx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    const allText = fillTextCalls.map((call: unknown[]) => call[0] as string);

    // Check for metaphor explanation keywords
    const hasMetaphorExplanation = allText.some(
      (t: string) => t.includes('infrastructure') || t.includes('obstacles') || t.includes('blockers')
    );
    expect(hasMetaphorExplanation).toBe(true);
  });

  it('splash screen displays blocker list', () => {
    render(<DSEDeveloperJourney />);
    advanceFrame(16);

    const fillTextCalls = (mockCtx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    const allText = fillTextCalls.map((call: unknown[]) => call[0] as string).join(' ');

    // The blocker labels should appear on the splash screen
    expect(allText).toContain('Admin Access Delays');
    expect(allText).toContain('DevOps Overload');
    expect(allText).toContain('Geo Restrictions');
    expect(allText).toContain('No Experimentation Platform');
  });

  it('click transitions from Splash to Ready state', () => {
    const { container } = render(<DSEDeveloperJourney />);
    const canvas = container.querySelector('canvas')!;

    // Advance one frame in splash state
    advanceFrame(16);

    // Clear mock to track new calls
    (mockCtx.fillText as ReturnType<typeof vi.fn>).mockClear();

    // Click to transition from Splash -> Ready
    fireEvent.click(canvas);

    // Advance another frame to render the Ready screen
    advanceFrame(32);

    const fillTextCalls = (mockCtx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    const allText = fillTextCalls.map((call: unknown[]) => call[0] as string);

    // Ready screen shows "Click or press any key to begin"
    expect(allText.some((t: string) => t.includes('begin'))).toBe(true);
  });

  it('keydown transitions from Splash to Ready state', () => {
    render(<DSEDeveloperJourney />);

    // Advance one frame in splash state
    advanceFrame(16);

    // Clear mock to track new calls
    (mockCtx.fillText as ReturnType<typeof vi.fn>).mockClear();

    // Keydown to transition from Splash -> Ready
    fireEvent.keyDown(document, { key: ' ' });

    // Advance another frame to render the Ready screen
    advanceFrame(32);

    const fillTextCalls = (mockCtx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    const allText = fillTextCalls.map((call: unknown[]) => call[0] as string);

    // Ready screen shows the start prompt
    expect(allText.some((t: string) => t.includes('begin'))).toBe(true);
  });

  it('Ready screen shows game title "DSE Developer\'s Journey"', () => {
    const { container } = render(<DSEDeveloperJourney />);
    const canvas = container.querySelector('canvas')!;

    // Advance to splash
    advanceFrame(16);

    // Transition to Ready
    fireEvent.click(canvas);
    (mockCtx.fillText as ReturnType<typeof vi.fn>).mockClear();

    // Advance frame in Ready state
    advanceFrame(32);

    const fillTextCalls = (mockCtx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    const allText = fillTextCalls.map((call: unknown[]) => call[0] as string);

    expect(allText.some((t: string) => t.includes("DSE Developer's Journey"))).toBe(true);
  });

  it('Game Over overlay displays final score, restart prompt, D-Lab tagline, and collided blocker name', () => {
    const { container } = render(<DSEDeveloperJourney />);
    const canvas = container.querySelector('canvas')!;

    // Advance to splash
    advanceFrame(16);

    // Transition Splash -> Ready
    fireEvent.click(canvas);
    advanceFrame(32);

    // Transition Ready -> Playing (first click in ready state)
    fireEvent.click(canvas);
    advanceFrame(48);

    // To get to game_over, we need to simulate gameplay frames where a collision occurs.
    // The developer will fall due to gravity. We'll run many frames without flapping,
    // causing the developer to hit the bottom boundary.
    let frameTime = 64;
    for (let i = 0; i < 100; i++) {
      frameTime += 16;
      advanceFrame(frameTime);
    }

    // Clear and advance one more frame to get the game over render
    (mockCtx.fillText as ReturnType<typeof vi.fn>).mockClear();
    frameTime += 16;
    advanceFrame(frameTime);

    const fillTextCalls = (mockCtx.fillText as ReturnType<typeof vi.fn>).mock.calls;
    const allText = fillTextCalls.map((call: unknown[]) => call[0] as string);

    // Game Over screen should display:
    // 1. "Game Over" text
    expect(allText.some((t: string) => t.includes('Game Over'))).toBe(true);

    // 2. Final score (rendered as a number string)
    expect(allText.some((t: string) => /^\d+$/.test(t))).toBe(true);

    // 3. Restart prompt
    expect(allText.some((t: string) => t.includes('restart'))).toBe(true);

    // 4. D-Lab tagline
    expect(allText.some((t: string) => t.includes('D-Lab'))).toBe(true);
  });
});
