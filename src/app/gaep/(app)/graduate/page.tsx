'use client';
import { useState } from 'react';
import Link from 'next/link';
import { GRADUATE_STAGES } from '@/gaep/data/content';
import { advanceStage, initialGraduate, isGraduationComplete } from '@/gaep/graduate';
import { ROUTES } from '@/gaep/navigation';

export default function GraduatePage() {
  const [state, setState] = useState(initialGraduate);
  const complete = isGraduationComplete(state);

  return (
    <div className="fade">
      <h2 className="section-title">Graduate to production</h2>
      <p className="section-sub">A good prototype should not die in a sandbox. GAEP promotes it through governance, not around it.</p>
      <div className="divider" style={{ marginBottom: 28 }} />

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {GRADUATE_STAGES.map((s, i) => {
          const done = i < state.completed;
          const active = i === state.completed;
          return (
            <div key={s.id} className="card" style={{ borderColor: done ? 'var(--teal)' : active ? 'var(--orange)' : undefined }}>
              <div className="icon">{s.icon}</div>
              <h3>{i + 1}. {s.label} {done ? '✓' : ''}</h3>
              <p>{s.description}</p>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        {complete ? (
          <div className="note" style={{ justifyContent: 'center' }}>
            <div className="emoji">🚀</div>
            <p>Prototype <b>promoted to production</b>. This is the loop that turns fast experimentation into real business value.</p>
          </div>
        ) : (
          <button className="btn purple" onClick={() => setState(advanceStage(state))}>
            Advance stage ({state.completed}/{GRADUATE_STAGES.length})
          </button>
        )}
        {complete && (
          <div style={{ marginTop: 20 }}>
            <Link className="btn" href={ROUTES.dashboard}>Back to dashboard</Link>
          </div>
        )}
      </div>
    </div>
  );
}
