import { describe, it, expect } from 'vitest';
import GamePage from './page';

describe('GamePage', () => {
  it('returns a React element with a main wrapper', () => {
    const element = GamePage();
    expect(element.type).toBe('main');
  });

  it('has centering styles on the main wrapper', () => {
    const element = GamePage();
    expect(element.props.style).toEqual(
      expect.objectContaining({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      })
    );
  });

  it('renders DSEDeveloperJourney as a child', () => {
    const element = GamePage();
    // The child should be the DSEDeveloperJourney component
    expect(element.props.children).toBeDefined();
    expect(element.props.children.type).toBeDefined();
  });
});
