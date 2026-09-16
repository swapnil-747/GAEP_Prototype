'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DATASETS, DURATIONS, PROVISION_STEPS } from '@/gaep/data/content';
import { getTemplateById } from '@/gaep/data/templates';
import { ROUTES } from '@/gaep/navigation';
import { buildWorkspaceQuery } from '@/gaep/workspaceContext';
import { advanceProvisioning, initialProvision, isProvisionComplete } from '@/gaep/provisioning';
import { provisionWorkspace } from '@/platform/api';

function ProvisionInner() {
  const router = useRouter();
  const params = useSearchParams();
  const templateId = params.get('template') ?? 'aiml';
  const template = getTemplateById(templateId) ?? getTemplateById('aiml')!;
  const workspaceUrlRef = useRef<string>(""); // This variable lives as long as the component

  const [dataset, setDataset] = useState(DATASETS[0].name);
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('small');
  const [ttl, setTtl] = useState(DURATIONS[1].label);
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState<string | null>(null); // New state for errors
  const [state, setState] = useState(initialProvision);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleProvision = async () => {
    try {
      setError(null);
      setProvisioning(true);
      
      const result = await provisionWorkspace({
        workspace_name: `poc-${template.id}-${Date.now()}`,
        template: template.id,
        ttl: ttl
      });
      
      if (result.status === 'Success') {
        // Save the URL here so the useEffect can find it later!
        workspaceUrlRef.current = result.url; 
        setState(advanceProvisioning(state));
      }
    } catch (err) {
      setError("Failed to reach the platform orchestrator.");
      setProvisioning(false);
    }
  };


    useEffect(() => {
    if (!provisioning) return;
    timer.current = setInterval(() => {
      setState((s) => {
        const next = advanceProvisioning(s);
        if (isProvisionComplete(next)) {
          if (timer.current) clearInterval(timer.current);
          
          // Now you can safely access the URL!
          const workspaceUrl = workspaceUrlRef.current; 
          const q = buildWorkspaceQuery({ template: template.id, dataset, size, ttl });

          setTimeout(() => {
            router.push(`${ROUTES.workspace}?${q}&url=${encodeURIComponent(workspaceUrl)}`);
          }, 500);
        }
        return next;
      });
    }, 650);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [provisioning]); // eslint-disable-line react-hooks/exhaustive-deps

  const sizes: Array<{ id: 'small' | 'medium' | 'large'; label: string }> = [
    { id: 'small', label: 'Small · 2 vCPU / 8 GB' },
    { id: 'medium', label: 'Medium · 4 vCPU / 16 GB' },
    { id: 'large', label: 'Large · 8 vCPU / 32 GB + GPU' },
  ];

  if (provisioning) {
    return (
      <div className="fade" style={{ textAlign: 'center', maxWidth: 620, margin: '60px auto' }}>
        <div className="ring" />
        <h2 className="section-title" style={{ textAlign: 'center' }}>Spinning up your workspace…</h2>
        <p className="section-sub" style={{ textAlign: 'center' }}>This is the part that used to take weeks.</p>
        <div className="steps" style={{ margin: '26px auto 0' }}>
          {PROVISION_STEPS.map((step, i) => {
            const done = i < state.completed;
            return (
              <div key={step.id} className={`step ${done ? 'done' : ''}`}>
                <span className="dot">{done ? '✓' : ''}</span>{step.label}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="fade">
      <h2 className="section-title">Provision: <span style={{ color: 'var(--teal)' }}>{template.name}</span></h2>
      <p className="section-sub">Configure your governed, transient workspace. Nothing here needs a ticket.</p>
      <div className="form-card">
        <div className="field">
          <label>Curated dataset</label>
          <select value={dataset} onChange={(e) => setDataset(e.target.value)}>
            {DATASETS.map((d) => <option key={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Workspace size</label>
          <div className="opts">
            {sizes.map((s) => (
              <div key={s.id} className={`opt ${size === s.id ? 'sel' : ''}`} onClick={() => setSize(s.id)}>{s.label}</div>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Transient access duration (auto-expires — keeps us governed)</label>
          <div className="opts">
            {DURATIONS.map((d) => (
              <div key={d.id} className={`opt ${ttl === d.label ? 'sel' : ''}`} onClick={() => setTtl(d.label)}>{d.label}</div>
            ))}
          </div>
        </div>
        <div className="gov">
          <span className="g">🔒 Time-boxed access</span>
          <span className="g">⏳ Auto-expiry</span>
          <span className="g">🏷️ Data classification respected</span>
          <span className="g">📝 Audit trail</span>
        </div>
        {error && (
          <div style={{ color: '#ff4d4f', marginBottom: '10px', fontSize: '0.9rem' }}>
           {error}
          </div>
        )}
        <button 
          className="btn" 
          onClick={handleProvision} 
          disabled={provisioning}
        >
         {provisioning ? '🚀 Provisioning...' : '🚀 Provision now — one click, no approval'}
        </button>
      </div>
    </div>
  );
}

export default function ProvisionPage() {
  return (
    <Suspense fallback={<div className="wrap">Loading…</div>}>
      <ProvisionInner />
    </Suspense>
  );
}
