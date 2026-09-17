'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TEMPLATES } from '@/gaep/data/templates';
import { TOOLS } from '@/gaep/data/tools';
import { ROUTES } from '@/gaep/navigation';

type Tab = 'templates' | 'tools';

export default function CatalogPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('templates');

  function launchTemplate(id: string) {
    router.push(`${ROUTES.provision}?template=${id}`);
  }
  function launchTool() {
    // Tools route into the same provision flow (mock) using the AI/ML base.
    router.push(`${ROUTES.provision}?template=aiml`);
  }

  return (
    <div className="fade">
      <h2 className="section-title">Catalog</h2>
      <p className="section-sub">Pick a ready-made workspace, or launch a sandbox for any tool in our ecosystem — one click, no approvals.</p>

      <div className="toolbar-tabs">
        <button className={`btn ${tab === 'templates' ? '' : 'ghost'}`} onClick={() => setTab('templates')}>Workspace templates</button>
        <button className={`btn ${tab === 'tools' ? '' : 'ghost'}`} onClick={() => setTab('tools')}>Ecosystem tools</button>
      </div>
      <div className="divider" style={{ marginBottom: 28 }} />

      {tab === 'templates' ? (
        <div className="grid">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="card click" onClick={() => launchTemplate(t.id)}>
              {t.tag && <div className="tag-top">{t.tag}</div>}
              <div className="icon">{t.icon}</div>
              <h3>{t.name}</h3>
              <p>{t.description}</p>
              <div className="chips">{t.chips.map((c) => <span key={c} className="chip">{c}</span>)}</div>
              <button className="btn" style={{ marginTop: 16, width: '100%' }}>Provision workspace →</button>
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="section-sub" style={{ marginTop: -8 }}>Illustrative set — the catalog is easily extended with more of our ecosystem.</p>
          <div className="grid">
            {TOOLS.map((t) => (
              <div key={t.id} className="card click" onClick={launchTool}>
                {t.tag && <div className="tag-top">{t.tag}</div>}
                <div className="icon">{t.icon}</div>
                <div className="cat">{t.category}</div>
                <h3>{t.name}</h3>
                <p>{t.description}</p>
                <div className="chips">{t.chips.map((c) => <span key={c} className="chip">{c}</span>)}</div>
                <button className="btn" style={{ marginTop: 16, width: '100%' }}>Launch sandbox →</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
