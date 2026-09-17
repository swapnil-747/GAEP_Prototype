import Link from 'next/link';
import { ROUTES } from '@/gaep/navigation';
import { RED_TAPE } from '@/gaep/data/content';

export default function LandingPage() {
  return (
    <div className="fade">
      <div className="topbar">
        <Link className="brand" href={ROUTES.landing}>
          <div className="logo">G</div>
          <div className="name">GAEP<small>Global Analytics Experimentation Platform</small></div>
        </Link>
        <div className="nav">
          <Link href={ROUTES.login} className="on">Sign in</Link>
        </div>
      </div>

      <div className="hero">
        <div className="kicker">The analytics lab, reborn — for India &amp; the US</div>
        <h1>Go from <span>idea to validated prototype</span><br />in minutes, not months</h1>
        <p className="sub">GAEP is a secure, self-service experimentation lab for our analytics &amp; AI/ML team.
          Spin up a governed sandbox for any tool in our ecosystem in a single click — no tickets, no approvals,
          no red tape — explore, learn, and graduate what works.</p>
        <div className="cta">
          <Link className="btn" href={ROUTES.login}>Enter the lab →</Link>
          <Link className="btn ghost" href={ROUTES.dashboard}>See the value</Link>
        </div>

        <div className="stats">
          <div className="stat"><div className="num">&lt; 5 min</div><div className="lbl">to a running sandbox</div></div>
          <div className="stat"><div className="num">0</div><div className="lbl">approvals needed</div></div>
          <div className="stat"><div className="num">15+</div><div className="lbl">projects proved the model</div></div>
          <div className="stat"><div className="num">India + US</div><div className="lbl">one shared lab</div></div>
        </div>

        <div className="note">
          <div className="emoji">🐦</div>
          <p>Remember the <b>new team member</b> joining the flock? Today they hit blocker after blocker just to get
            an environment, some data, and the right access. GAEP clears those pipes — a newcomer in Bangalore or
            Seattle is experimenting on <b>day one</b> instead of raising tickets for weeks.</p>
        </div>
      </div>

      <div className="wrap">
        <h2 className="section-title">The pain we&apos;re removing</h2>
        <p className="section-sub">Big-company silos and red tape make trying a tool slow. GAEP flips that.</p>
        <div className="divider" style={{ marginBottom: 20 }} />
        <div className="form-card" style={{ maxWidth: '100%' }}>
          <table className="redtape">
            <thead>
              <tr><th></th><th>Traditional access</th><th>With GAEP</th></tr>
            </thead>
            <tbody>
              {RED_TAPE.map((r) => (
                <tr key={r.dimension}>
                  <td className="muted">{r.dimension}</td>
                  <td className="trad">{r.traditional}</td>
                  <td className="gaepc">{r.gaep}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link className="btn" href={ROUTES.login}>Enter the lab →</Link>
        </div>
      </div>
    </div>
  );
}
