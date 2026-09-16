'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { METRICS, ACTIVITY, GEO_USAGE, DLAB } from '@/gaep/data/content';
import { ROUTES } from '@/gaep/navigation';


export default function DashboardPage() {

  const [activeWorkspaces, setActiveWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const terminate = async (name: string) => {
  await fetch('http://localhost:5000/terminate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspace_name: name })
  });
  // Trigger a re-fetch of the list
  const res = await fetch('http://localhost:5000/workspaces');
  const data = await res.json();
  setActiveWorkspaces(data.workspaces);
};

  // 2. Fetch data from your Python Orchestrator
  useEffect(() => {
    fetch('http://localhost:5000/workspaces')
      .then((res) => res.json())
      .then((data) => {
        setActiveWorkspaces(data.workspaces);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch workspaces", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="fade">
      <h2 className="section-title">Dashboard</h2>
      <p className="section-sub">Platform adoption, cross-geo usage, and the proven value behind GAEP.</p>

      <div className="stats" style={{ justifyContent: 'flex-start' }}>
        {METRICS.map((m) => (
          <div key={m.key} className="stat"><div className="num">{m.value}</div><div className="lbl">{m.label}</div></div>
        ))}
      </div>

      <div className="grid2" style={{ marginTop: 32 }}>
        <div>
          <h3 className="section-title" style={{ fontSize: 20 }}>India + US usage</h3>
          <p className="section-sub">Follow-the-sun experimentation across geographies.</p>
          {GEO_USAGE.map((g) => (
            <div key={g.geo} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span>{g.geo} team</span>
                <span className="muted">{g.workspaces} workspaces &middot; {g.share}%</span>
              </div>
              <div className="geobar"><span style={{ width: PCT(g.share) }} /></div>
            </div>
          ))}
        </div>

        <div>
        <h3 className="section-title" style={{ fontSize: 20 }}>Active workspaces</h3>
        
        {loading ? (
          <p>Loading workspaces...</p>
        ) : activeWorkspaces.length === 0 ? (
          <p className="muted">No active workspaces found.</p>
        ) : (
          activeWorkspaces.map((w: any) => (
            <div key={w.name} className="row">
              {/* Note: I'm mapping the data structure returned by your Python script */}
              <span>{w.name} &mdash; <span className="muted">Status: {w.status}</span></span>
              <span className="gaepc">{w.image}</span>
              <span className="gaepc"> <button className="btn-small" onClick={() => terminate(w.name)}>Stop</button></span>

            </div>
            
          ))
        )}
      </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <h3 className="section-title" style={{ fontSize: 20 }}>Recent activity</h3>
        {ACTIVITY.map((a) => (
          <div key={a.id} className="row">
            <span><b>{a.who}</b> {a.action}</span>
            <span className="muted">{a.when}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40 }}>
        <h3 className="section-title" style={{ fontSize: 20 }}>This model already delivered</h3>
        <p className="section-sub">GAEP is not a bet on an untested idea. A predecessor lab powered 15+ real initiatives.</p>
        <div className="grid">
          {DLAB.map((d) => (
            <div key={d.id} className="card">
              <h3 style={{ color: 'var(--teal)', fontSize: 15 }}>{d.title}</h3>
              <p>{d.summary}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link className="btn" href={ROUTES.catalog}>Start experimenting</Link>
        </div>
      </div>
    </div>
  );
}

function PCT(n: number): string { return n + '%'; }
