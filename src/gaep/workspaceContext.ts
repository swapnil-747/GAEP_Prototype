import { WorkspaceSelection, TemplateId } from './types';
import { TEMPLATE_IDS } from './data/templates';

export function buildWorkspaceQuery(sel: WorkspaceSelection): string {
  const p = new URLSearchParams();
  p.set('template', sel.template);
  if (sel.dataset) p.set('dataset', sel.dataset);
  if (sel.size) p.set('size', sel.size);
  if (sel.ttl) p.set('ttl', sel.ttl);
  return p.toString();
}

export function parseWorkspaceQuery(qs: string): WorkspaceSelection {
  const p = new URLSearchParams(qs);
  const t = p.get('template');
  const template = (TEMPLATE_IDS as string[]).includes(t ?? '')
    ? (t as TemplateId) : 'aiml';
  return {
    template,
    dataset: p.get('dataset') ?? undefined,
    size: (p.get('size') as WorkspaceSelection['size']) ?? undefined,
    ttl: p.get('ttl') ?? undefined,
  };
}
