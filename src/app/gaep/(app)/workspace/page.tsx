'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { parseWorkspaceQuery } from '@/gaep/workspaceContext';
import { getTemplateById } from '@/gaep/data/templates';
import { getStarter, RUNNING_SERVICES, REUSABLE_ASSETS } from '@/gaep/data/content';
import { ROUTES } from '@/gaep/navigation';

function WorkspaceInner() {
  const params = useSearchParams();
  const liveUrl = params.get('url'); // Grab the URL passed from provisioning
  console.log("DEBUG: Workspace URL from params:", liveUrl);
  const sel = parseWorkspaceQuery(params.toString());
  const template = getTemplateById(sel.template)!;
  const starter = getStarter(sel.template);
  const sub = [template.name, sel.dataset ?? 'Parts catalog', `expires in ${sel.ttl ?? '1 day'}`].join(' · ');

  return (
    <div className="fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 className="section-title">Your workspace is live 🎉</h2>
          <p className="section-sub">{sub}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="pill">● Running</span>
          {liveUrl && <a className="btn" href={liveUrl} target="_blank" rel="noopener noreferrer">Launch in New Tab ↗</a>}
          <Link className="btn purple" href={ROUTES.graduate}>Graduate to production →</Link>
        </div>
      </div>

      <div className="ws">
        {/* If we have a live URL, show the interactive interface */}
        {liveUrl ? (
           <div className="nb" style={{ height: '70vh', border: '1px solid #ccc' }}>
             <iframe src={liveUrl} width="100%" height="100%" title="Interactive Workbench" />
           </div>
        ) : (
          /* Fallback: Your static mockup if no URL is provided */
          <div className="nb">
            <div className="nb-bar"><div>● ● ●&nbsp;&nbsp;{starter.title}.ipynb</div></div>
            <div className="cell"><pre>{`import pandas as pd\n# Interactive environment loading...`}</pre></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="wrap">Loading…</div>}>
      <WorkspaceInner />
    </Suspense>
  );
}