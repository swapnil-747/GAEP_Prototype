'use client';

import React from 'react';
import DSEDeveloperJourney from '../components/DSEDeveloperJourney';

export default function GamePage() {
  return (
    <main
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a2e',
      }}
    >
      <DSEDeveloperJourney />
    </main>
  );
}
