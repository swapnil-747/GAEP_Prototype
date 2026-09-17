import {
  CuratedDataset, TransientAccessDuration, ProvisionStep, GraduateStage,
  DashboardMetric, ActiveWorkspace, ActivityEntry, DLabInitiative,
  SharedExperiment, GeoUsage, RedTapeRow, GuidedStarter, ReusableAsset,
} from '../types';

export const DATASETS: CuratedDataset[] = [
  { id: 'parts', name: 'Parts catalog & specifications' },
  { id: 'demand', name: 'Demand & sales history' },
  { id: 'pricing', name: 'Pricing & margin' },
  { id: 'supplier', name: 'Supplier & sourcing' },
  { id: 'logistics', name: 'Logistics & fulfillment' },
  { id: 'byo', name: 'Bring my own (upload later)' },
];

export const DURATIONS: TransientAccessDuration[] = [
  { id: '4h', label: '4 hours' },
  { id: '1d', label: '1 day' },
  { id: '1w', label: '1 week' },
  { id: '30d', label: '30 days' },
  { id: '1m', label: '1 min' },
];

export const PROVISION_STEPS: ProvisionStep[] = [
  { id: 'compute', label: 'Allocating compute' },
  { id: 'govern', label: 'Applying governance & access policy' },
  { id: 'data', label: 'Mounting curated dataset' },
  { id: 'stack', label: 'Installing stack & sample notebooks' },
  { id: 'ready', label: 'Workspace ready' },
];

export const GRADUATE_STAGES: GraduateStage[] = [
  { id: 'validate', label: 'Validate', icon: '✅', description: 'Prototype beats baseline & is peer-reviewed in the workspace.' },
  { id: 'govern', label: 'Govern', icon: '🛡️', description: 'Security, data-classification & compliance checks run automatically.' },
  { id: 'package', label: 'Package', icon: '📦', description: 'Code, model & data lineage bundled as a promotable artifact.' },
  { id: 'promote', label: 'Promote', icon: '🚀', description: 'Deployed to the enterprise production path with one approval.' },
];

export const METRICS: DashboardMetric[] = [
  { key: 'activeWorkspaces', label: 'Active workspaces', value: '38' },
  { key: 'projects', label: 'Projects enabled', value: '15+' },
  { key: 'timeToWorkspace', label: 'Avg time to workspace', value: '< 5 min' },
  { key: 'costSaved', label: 'Est. setup effort saved', value: '~240 hrs/mo' },
];

export const ACTIVE_WORKSPACES: ActiveWorkspace[] = [
  { id: 'w1', template: 'AI/ML Notebook', owner: 'A. Sharma', geo: 'India', status: 'running', expiresIn: '18h' },
  { id: 'w2', template: 'GenAI + Vector DB', owner: 'J. Miller', geo: 'US', status: 'running', expiresIn: '3d' },
  { id: 'w3', template: 'Database Sandbox', owner: 'R. Iyer', geo: 'India', status: 'expiring', expiresIn: '40m' },
  { id: 'w4', template: 'Streaming / Real-time', owner: 'K. Chen', geo: 'US', status: 'running', expiresIn: '6h' },
  { id: 'w5', template: 'Dashboards / BI', owner: 'P. Nair', geo: 'India', status: 'running', expiresIn: '2d' },
];

export const ACTIVITY: ActivityEntry[] = [
  { id: 'a1', who: 'A. Sharma', action: 'launched an AI/ML Notebook on demand history', when: '4 min ago' },
  { id: 'a2', who: 'J. Miller', action: 'shared "Supplier RAG assistant" to the gallery', when: '22 min ago' },
  { id: 'a3', who: 'R. Iyer', action: 'benchmarked Teradata vs Postgres', when: '1 hr ago' },
  { id: 'a4', who: 'K. Chen', action: 'graduated a forecast model to production', when: '3 hrs ago' },
];

export const GEO_USAGE: GeoUsage[] = [
  { geo: 'India', workspaces: 22, share: 58 },
  { geo: 'US', workspaces: 16, share: 42 },
];

export const RED_TAPE: RedTapeRow[] = [
  { dimension: 'Time to access', traditional: '2–3 weeks', gaep: '< 5 minutes' },
  { dimension: 'Approvals', traditional: '3–4 sign-offs', gaep: '0 — self-service' },
  { dimension: 'Tickets raised', traditional: 'Multiple', gaep: 'None' },
  { dimension: 'Guidance', traditional: 'Ask around / hope', gaep: 'Built-in quickstart' },
  { dimension: 'Cleanup', traditional: 'Manual, forgotten', gaep: 'Auto-expires' },
];

export const DLAB: DLabInitiative[] = [
  { id: 'd1', title: 'ML productionization', summary: 'Prototyped ML model deployment & serverless predictions over REST — concept to validated deployment.' },
  { id: 'd2', title: 'Neo4j graph benchmarking', summary: 'Graph DB performance benchmarking and proposal for a query-intensive use case.' },
  { id: 'd3', title: 'Kafka streaming', summary: 'Kafka connect bridging sources & sinks; MQ → NoSQL sink; IoT message store.' },
  { id: 'd4', title: 'Postgres columnar substitution', summary: 'Postgres cluster benchmarked as a substitute for a costly existing setup.' },
  { id: 'd5', title: 'Superset/Druid dashboards', summary: 'Native dashboarding evaluated against incumbent BI tools for cost & performance.' },
  { id: 'd6', title: 'Solr search', summary: 'Search & indexing integrated to give a project fast query-result access.' },
  { id: 'd7', title: 'Docker/OpenShift CI/CD', summary: 'Containerization & registry images used to prove deployment concepts.' },
  { id: 'd8', title: 'MongoDB evaluation', summary: 'NoSQL flavor comparison for a project use case.' },
  { id: 'd9', title: 'Team onboarding', summary: 'Dedicated nodes & workspaces so teams learned the stack hands-on, fast.' },
];

export const GALLERY: SharedExperiment[] = [
  { id: 'g1', title: 'Supplier RAG assistant', author: 'J. Miller', geo: 'US', tool: 'GenAI + Vector DB', summary: 'RAG over supplier docs to answer sourcing questions.', reuses: 7 },
  { id: 'g2', title: 'Parts demand forecast', author: 'A. Sharma', geo: 'India', tool: 'AI/ML Notebook', summary: 'Gradient-boosted forecast beating the current baseline (MAPE 6.8% vs 11.2%).', reuses: 12 },
  { id: 'g3', title: 'Teradata vs Postgres', author: 'R. Iyer', geo: 'India', tool: 'Database Sandbox', summary: 'Cost/performance benchmark for a columnar workload.', reuses: 4 },
  { id: 'g4', title: 'Order-events stream', author: 'K. Chen', geo: 'US', tool: 'Streaming / Real-time', summary: 'Kafka pipeline for real-time inventory changes.', reuses: 5 },
  { id: 'g5', title: 'Pricing anomaly detector', author: 'P. Nair', geo: 'India', tool: 'AI/ML Notebook', summary: 'Flags margin anomalies across the parts catalog.', reuses: 6 },
  { id: 'g6', title: 'Catalog search on Solr', author: 'M. Davis', geo: 'US', tool: 'Database Sandbox', summary: 'Fast faceted search prototype over the parts catalog.', reuses: 3 },
];

export const RUNNING_SERVICES = ['JupyterLab', 'MLflow', 'Postgres'];
export const REUSABLE_ASSETS: ReusableAsset[] = [
  { id: 'r1', name: 'forecasting_template' },
  { id: 'r2', name: 'rag_starter' },
];

const DEFAULT_STARTER: GuidedStarter = {
  title: 'Quickstart: try these 3 things',
  steps: [
    { title: 'Load a curated dataset', detail: 'curated.load("demand_history") — governed and ready, no setup.' },
    { title: 'Run the sample model', detail: 'Execute the notebook cells to train a baseline in seconds.' },
    { title: 'Share or graduate', detail: 'Publish to the gallery, or graduate a winner to production.' },
  ],
};

const STARTERS: Record<string, GuidedStarter> = {
  genai: { title: 'Quickstart: try these 3 things',
    steps: [
      { title: 'Index your docs', detail: 'Embed supplier docs into the vector DB with one cell.' },
      { title: 'Ask a question', detail: 'Run the RAG chain to answer a sourcing question.' },
      { title: 'Tune & share', detail: 'Adjust the prompt, then publish to the gallery.' },
    ] },
  db: { title: 'Quickstart: try these 3 things',
    steps: [
      { title: 'Connect a store', detail: 'Pick Postgres, Teradata or MongoDB — already running.' },
      { title: 'Load sample data', detail: 'Seed the parts catalog and run a benchmark query.' },
      { title: 'Compare & share', detail: 'Record results and share the benchmark to the gallery.' },
    ] },
};

export function getStarter(templateOrTool: string): GuidedStarter {
  return STARTERS[templateOrTool] ?? DEFAULT_STARTER;
}
