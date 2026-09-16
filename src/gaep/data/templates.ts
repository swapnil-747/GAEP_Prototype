import { WorkspaceTemplate } from '../types';

export const TEMPLATES: WorkspaceTemplate[] = [
  { id: 'aiml', icon: '🤖', name: 'AI/ML Notebook', tag: 'Most popular',
    description: 'JupyterLab with Python, scikit-learn, XGBoost and PyTorch. For demand forecasting, pricing and parts-recommendation models.',
    chips: ['JupyterLab', 'PyTorch', 'scikit-learn', 'MLflow'] },
  { id: 'genai', icon: '✨', name: 'GenAI + Vector DB', tag: 'New',
    description: 'LLM sandbox with a vector database and a RAG starter. Build a parts-catalog assistant or supplier-doc search over your own data.',
    chips: ['LLM', 'pgvector', 'RAG', 'LangChain'] },
  { id: 'stream', icon: '🌊', name: 'Streaming / Real-time',
    description: 'Kafka + Spark streaming for data-in-motion — order events, inventory changes and telemetry from the parts supply chain.',
    chips: ['Kafka', 'Spark', 'Flink'] },
  { id: 'bi', icon: '📊', name: 'Dashboards / BI',
    description: 'Superset + Grafana to explore and visualize. Stand up an operational dashboard over curated data in minutes.',
    chips: ['Superset', 'Grafana'] },
  { id: 'db', icon: '🗄️', name: 'Database Sandbox',
    description: 'Spin up transactional, NoSQL, graph, columnar, timeseries or search stores to benchmark and prototype.',
    chips: ['Postgres', 'MongoDB', 'Neo4j', 'Teradata'] },
  { id: 'data', icon: '📦', name: 'Data Product Builder',
    description: 'Notebook + pipeline tooling to shape curated datasets into reusable, shareable data products for the whole team.',
    chips: ['Airflow', 'dbt', 'Parquet'] },
  { id: 'datascience', icon: '📦', name: 'Jupyter Lab',
    description: 'A jupyter notebook to run python and ds programs.',
    chips: ['JupyterLab'] },
  { id: 'workbench', icon: '📦', name: 'Linux VNC',
    description: 'A virtual machine to perform tasks',
    chips: ['VM'] },
];

export function getTemplateById(id: string): WorkspaceTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);
