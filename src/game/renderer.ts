import { DSEDeveloper, BlockerPair, BlockerLabel } from './types';
import { BLOCKER_LABELS, DEFAULT_CONFIG } from './constants';

/**
 * Professional color palette for the DSE Developer's Journey game.
 * Designed for leadership presentation aesthetics.
 */
const COLORS = {
  background: '#1a2332',
  backgroundGradientTop: '#1a2332',
  backgroundGradientBottom: '#2d3e50',
  primary: '#3498db',
  primaryDark: '#2980b9',
  accent: '#e74c3c',
  accentLight: '#f39c12',
  text: '#ecf0f1',
  textMuted: '#95a5a6',
  textDark: '#2c3e50',
  overlay: 'rgba(26, 35, 50, 0.9)',
  blockerTop: '#c0392b',
  blockerBottom: '#e74c3c',
  blockerBorder: '#922b21',
  developer: '#3498db',
  developerAccent: '#2ecc71',
  score: '#f1c40f',
  gap: 'rgba(46, 204, 113, 0.1)',
};

/**
 * Font stack for professional readability.
 */
const FONTS = {
  title: 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  subtitle: '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  body: '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  score: 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  label: 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  prompt: '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  tagline: 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

/**
 * Clears the entire canvas and fills with background gradient.
 */
export function clear(ctx: CanvasRenderingContext2D): void {
  const { width, height } = ctx.canvas;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.backgroundGradientTop);
  gradient.addColorStop(1, COLORS.backgroundGradientBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draws the DSE Developer character with a developer persona visual.
 * Renders as a stylized laptop/coding icon.
 */
export function drawDeveloper(ctx: CanvasRenderingContext2D, developer: DSEDeveloper): void {
  const { x, y, width, height } = developer;

  ctx.save();

  // Body - rounded rectangle representing laptop screen
  const cornerRadius = 4;
  ctx.fillStyle = COLORS.developer;
  ctx.strokeStyle = COLORS.primaryDark;
  ctx.lineWidth = 2;

  // Draw laptop screen
  ctx.beginPath();
  ctx.roundRect(x, y, width, height * 0.7, cornerRadius);
  ctx.fill();
  ctx.stroke();

  // Screen content - code lines
  ctx.fillStyle = COLORS.text;
  const lineY = y + 5;
  const lineHeight = 4;
  const lineSpacing = 6;
  for (let i = 0; i < 3; i++) {
    const lineWidth = 10 + Math.random() * 15;
    ctx.fillRect(x + 5, lineY + i * lineSpacing, lineWidth, lineHeight);
  }

  // Laptop base
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillRect(x - 2, y + height * 0.7, width + 4, height * 0.15);

  // Developer head (circle above laptop)
  ctx.fillStyle = COLORS.developerAccent;
  ctx.beginPath();
  ctx.arc(x + width / 2, y - 8, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.primaryDark;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Coding symbol on head (angle brackets)
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('</>', x + width / 2, y - 8);

  ctx.restore();
}

/**
 * Draws all blocker pairs — only bottom-up posts for easier gameplay.
 */
export function drawBlockers(ctx: CanvasRenderingContext2D, blockers: BlockerPair[], canvasHeight: number): void {
  for (const blocker of blockers) {
    const bottomY = blocker.gapY + blocker.gapHeight / 2;
    const bottomHeight = canvasHeight - bottomY;

    // Only draw bottom blocker (bottom-up post)
    drawBlockerRect(ctx, blocker.x, bottomY, blocker.width, bottomHeight, 'bottom');

    // Draw label on the bottom blocker
    drawBlockerLabel(ctx, blocker, canvasHeight);
  }
}

/**
 * Draws a single blocker rectangle with gradient and border styling.
 */
function drawBlockerRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  position: 'top' | 'bottom'
): void {
  if (height <= 0) return;

  ctx.save();

  // Gradient fill
  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, COLORS.blockerTop);
  gradient.addColorStop(0.5, COLORS.blockerBottom);
  gradient.addColorStop(1, COLORS.blockerTop);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  // Border
  ctx.strokeStyle = COLORS.blockerBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // Hazard stripes at the gap edge
  const stripeHeight = 6;
  const stripeY = position === 'top' ? y + height - stripeHeight : y;
  ctx.fillStyle = COLORS.accentLight;
  ctx.fillRect(x, stripeY, width, stripeHeight);

  ctx.restore();
}

/**
 * Renders the label text on the bottom blocker post.
 */
export function drawBlockerLabel(ctx: CanvasRenderingContext2D, blocker: BlockerPair, canvasHeight: number): void {
  const bottomY = blocker.gapY + blocker.gapHeight / 2;
  const bottomHeight = canvasHeight - bottomY;

  ctx.save();
  ctx.font = FONTS.label;
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (bottomHeight > 30) {
    // Rotate and draw on bottom blocker
    const centerX = blocker.x + blocker.width / 2;
    const centerY = bottomY + bottomHeight / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(blocker.label, 0, 0);
  }

  ctx.restore();
}

/**
 * Displays the current score prominently during gameplay.
 */
export function drawScore(ctx: CanvasRenderingContext2D, score: number): void {
  const { width } = ctx.canvas;

  ctx.save();

  // Score with shadow for readability
  ctx.font = FONTS.score;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillText(String(score), width / 2 + 2, 22);

  // Main text
  ctx.fillStyle = COLORS.score;
  ctx.fillText(String(score), width / 2, 20);

  ctx.restore();
}

/**
 * Renders the game-over overlay with final score, D-Lab tagline,
 * the name of the blocker that caused the collision, and restart prompt.
 */
export function drawGameOver(
  ctx: CanvasRenderingContext2D,
  score: number,
  collidedLabel: BlockerLabel | null
): void {
  const { width, height } = ctx.canvas;

  ctx.save();

  // Semi-transparent overlay
  ctx.fillStyle = COLORS.overlay;
  ctx.fillRect(0, 0, width, height);

  // Game Over title
  ctx.font = FONTS.title;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.accent;
  ctx.fillText('Game Over', width / 2, height * 0.25);

  // Final score
  ctx.font = FONTS.score;
  ctx.fillStyle = COLORS.score;
  ctx.fillText(String(score), width / 2, height * 0.35);

  ctx.font = FONTS.subtitle;
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText('Blockers Cleared', width / 2, height * 0.35 + 35);

  // Collided blocker name
  if (collidedLabel) {
    ctx.font = FONTS.subtitle;
    ctx.fillStyle = COLORS.accentLight;
    ctx.fillText(`Blocked by: ${collidedLabel}`, width / 2, height * 0.5);
  }

  // D-Lab tagline - prominent
  ctx.font = FONTS.tagline;
  ctx.fillStyle = COLORS.primary;
  ctx.fillText(DEFAULT_CONFIG.theme.tagline, width / 2, height * 0.62);

  // Restart prompt
  ctx.font = FONTS.prompt;
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText('Click or press any key to restart', width / 2, height * 0.78);

  ctx.restore();
}

/**
 * Renders the ready screen with game title and start prompt.
 */
export function drawReadyScreen(ctx: CanvasRenderingContext2D): void {
  const { width, height } = ctx.canvas;

  ctx.save();

  // Game title
  ctx.font = FONTS.title;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.primary;
  ctx.fillText(DEFAULT_CONFIG.theme.title, width / 2, height * 0.3);

  // Subtitle
  ctx.font = FONTS.subtitle;
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText('Navigate the infrastructure maze', width / 2, height * 0.38);

  // Start prompt
  ctx.font = FONTS.prompt;
  ctx.fillStyle = COLORS.text;
  ctx.fillText('Click or press any key to begin', width / 2, height * 0.6);

  // Developer character preview (static)
  const previewDev: DSEDeveloper = {
    x: width / 2 - 20,
    y: height * 0.47,
    velocity: 0,
    width: 40,
    height: 30,
  };
  drawDeveloper(ctx, previewDev);

  ctx.restore();
}

/**
 * Renders the splash screen with full metaphor explanation,
 * game title, blocker list with descriptions, and start prompt.
 */
export function drawSplashScreen(ctx: CanvasRenderingContext2D): void {
  const { width, height } = ctx.canvas;

  ctx.save();

  // Title
  ctx.font = FONTS.title;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.primary;
  ctx.fillText(DEFAULT_CONFIG.theme.title, width / 2, height * 0.1);

  // Metaphor explanation
  ctx.font = FONTS.body;
  ctx.fillStyle = COLORS.text;
  const explanationLines = [
    'Every DSE developer faces infrastructure',
    'obstacles during onboarding. This game',
    'simulates that journey — navigate through',
    'the blockers to see why we need D-Lab.',
  ];
  let yPos = height * 0.2;
  for (const line of explanationLines) {
    ctx.fillText(line, width / 2, yPos);
    yPos += 20;
  }

  // Blocker list header
  yPos += 15;
  ctx.font = FONTS.subtitle;
  ctx.fillStyle = COLORS.accentLight;
  ctx.fillText('Infrastructure Blockers:', width / 2, yPos);
  yPos += 30;

  // Blocker list items
  ctx.font = FONTS.body;
  ctx.textAlign = 'left';
  const listX = width * 0.12;

  const blockerDescriptions: Record<BlockerLabel, string> = {
    'Admin Access Delays': 'Weeks waiting for permissions',
    'DevOps Overload': 'Shared pipelines, long queues',
    'Geo Restrictions': 'Region locks on dev resources',
    'No Experimentation Platform': 'No safe space to test ideas',
  };

  for (const label of BLOCKER_LABELS) {
    ctx.fillStyle = COLORS.accent;
    ctx.fillText(`• ${label}`, listX, yPos);
    yPos += 18;
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText(`  ${blockerDescriptions[label]}`, listX + 10, yPos);
    yPos += 24;
  }

  // Click to start prompt
  ctx.textAlign = 'center';
  ctx.font = FONTS.prompt;
  ctx.fillStyle = COLORS.text;
  ctx.fillText('Click or press any key to start', width / 2, height * 0.9);

  ctx.restore();
}
