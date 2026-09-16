'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/gaep/navigation';
import { isValidLogin } from '@/gaep/login';

export default function LoginPage() {
  const router = useRouter();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidLogin(u, p)) { setErr('Enter any username and password to continue.'); return; }
    router.push(ROUTES.catalog);
  }

  return (
    <div className="fade">
      <div className="topbar">
        <Link className="brand" href={ROUTES.landing}>
          <div className="logo">G</div>
          <div className="name">GAEP<small>Global Analytics Experimentation Platform</small></div>
        </Link>
      </div>
      <div className="wrap" style={{ maxWidth: 460 }}>
        <h2 className="section-title" style={{ marginTop: 40 }}>Sign in to the lab</h2>
        <p className="section-sub">Demo sign-in — any credentials work.</p>
        <form className="form-card" onSubmit={submit}>
          <div className="field">
            <label>Username or email</label>
            <input value={u} onChange={(e) => setU(e.target.value)} placeholder="you@company.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={p} onChange={(e) => setP(e.target.value)} placeholder="••••••••" />
          </div>
          {err && <p style={{ color: '#e88', fontSize: 13, marginBottom: 14 }}>{err}</p>}
          <button className="btn" type="submit">Sign in →</button>
        </form>
      </div>
    </div>
  );
}
