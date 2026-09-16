'use client';

import { useRef, useEffect, useState } from 'react';
import { DEFAULT_CONFIG } from '../game/constants';
import { createGameEngine, RenderCallback } from '../game/engine';
import { RuntimeState } from '../game/types';
import {
  clear,
  drawSplashScreen,
  drawReadyScreen,
  drawDeveloper,
  drawBlockers,
  drawScore,
  drawGameOver,
} from '../game/renderer';

/**
 * DSEDeveloperJourney - Main React component for the Flappy Bird-style game.
 * Mounts a canvas element and manages the game engine lifecycle.
 */
export default function DSEDeveloperJourney() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<typeof createGameEngine> | null>(null);
  const [canvasSupported, setCanvasSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setCanvasSupported(false);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setCanvasSupported(false);
      return;
    }

    // Define the render callback that draws the appropriate screen based on game state
    const renderCallback: RenderCallback = (state: RuntimeState) => {
      clear(ctx);

      switch (state.gameState) {
        case 'splash':
          drawSplashScreen(ctx);
          break;
        case 'ready':
          drawReadyScreen(ctx);
          drawDeveloper(ctx, state.developer);
          break;
        case 'playing':
          drawBlockers(ctx, state.blockers, DEFAULT_CONFIG.canvas.height);
          drawDeveloper(ctx, state.developer);
          drawScore(ctx, state.score);
          break;
        case 'game_over':
          drawBlockers(ctx, state.blockers, DEFAULT_CONFIG.canvas.height);
          drawDeveloper(ctx, state.developer);
          drawScore(ctx, state.score);
          drawGameOver(ctx, state.score, state.collidedBlockerLabel);
          break;
      }
    };

    // Create and start the game engine
    const engine = createGameEngine(renderCallback);
    engineRef.current = engine;
    engine.start();

    // Set up event listeners
    const handleClick = () => {
      engine.handleInput();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      engine.handleInput();
    };

    canvas.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      engine.stop();
      canvas.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      engineRef.current = null;
    };
  }, []);

  if (!canvasSupported) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Canvas is not supported in your browser. Please use a modern browser to play this game.</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={DEFAULT_CONFIG.canvas.width}
      height={DEFAULT_CONFIG.canvas.height}
      style={{
        display: 'block',
        margin: '0 auto',
        cursor: 'pointer',
      }}
      aria-label="DSE Developer's Journey Game"
      role="img"
      tabIndex={0}
    />
  );
}
