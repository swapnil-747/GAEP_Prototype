// GAEP shared TypeScript types. Prototype/demo only — all data is mock.

export type TemplateId =
  | 'aiml'
  | 'genai'
  | 'stream'
  | 'bi'
  | 'db'
  | 'data'
  | 'datascience'
  | 'workbench'
  | 'kibana'
  | 'elasticsearch'
  | 'splunk'
  | 'playwright'
  | 'jira'
  | 'aws-sandbox'
  | 'azure-sandbox'
  | 'gcp-sandbox'
  | 'salesforce';

export interface WorkspaceTemplate {
  id: TemplateId;
  icon: string;
  name: string;
  description: string;
  chips: string[];
  tag?: string;
  category?: string;
}

export type ToolCategory =
  | 'AI/GenAI'
  | 'Cloud'
  | 'Data/DB'
  | 'Streaming'
  | 'Observability'
  | 'Automation'
  | 'Integration'
  | 'Quality Engineering'
  | 'Enterprise & Agile';

export interface EcosystemTool {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  icon: string;
  chips: string[];
  tag?: string;
}

export interface CuratedDataset { id: string; name: string; }
export interface ReusableAsset { id: string; name: string; }
export type WorkspaceSize = 'small' | 'medium' | 'large';
export interface TransientAccessDuration { id: string; label: string; }

export interface ActiveWorkspace {
  id: string;
  template: string;
  owner: string;
  geo: Geo;
  status: 'running' | 'expiring';
  expiresIn: string;
}

export interface DashboardMetric {
  key: 'activeWorkspaces' | 'projects' | 'timeToWorkspace' | 'costSaved';
  label: string;
  value: string;
}

export interface ActivityEntry { id: string; who: string; action: string; when: string; }
export interface DLabInitiative { id: string; title: string; summary: string; }

export interface ProvisionStep { id: string; label: string; }
export interface GraduateStage { id: string; label: string; icon: string; description: string; }

export type Geo = 'India' | 'US';

export interface SharedExperiment {
  id: string;
  title: string;
  author: string;
  geo: Geo;
  tool: string;
  summary: string;
  reuses: number;
}

export interface GuidedStarterStep { title: string; detail: string; }
export interface GuidedStarter { title: string; steps: GuidedStarterStep[]; }

export interface GeoUsage { geo: Geo; workspaces: number; share: number; }

export interface RedTapeRow { dimension: string; traditional: string; gaep: string; }

export interface WorkspaceSelection {
  template: TemplateId;
  dataset?: string;
  size?: WorkspaceSize;
  ttl?: string;
}
