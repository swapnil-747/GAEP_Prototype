import { EcosystemTool } from '../types';

// Illustrative, NOT exhaustive. The catalog is easily extended.
export const TOOLS: EcosystemTool[] = [
  { id: 'ai-foundry', name: 'AI Foundry', category: 'AI/GenAI', icon: '🧠',
    description: 'Enterprise model catalog & fine-tuning workspace. Explore foundation models without any setup.',
    chips: ['Models', 'Fine-tune', 'Prompts'], tag: 'Popular' },
  { id: 'langchain', name: 'LangChain', category: 'AI/GenAI', icon: '🔗',
    description: 'Build LLM chains, agents and RAG pipelines in a ready notebook.',
    chips: ['Agents', 'RAG', 'Chains'] },
  { id: 'dataiq', name: 'DataIQ', category: 'Data/DB', icon: '📐',
    description: 'Data quality, profiling and lineage. Understand a dataset before you build on it.',
    chips: ['Profiling', 'Lineage', 'DQ'] },
  { id: 'teradata', name: 'Teradata', category: 'Data/DB', icon: '🗃️',
    description: 'Scale-out analytics database sandbox for benchmarking and SQL experimentation.',
    chips: ['SQL', 'MPP', 'Analytics'] },
  { id: 'spark', name: 'Apache Spark', category: 'Data/DB', icon: '⚡',
    description: 'Distributed compute for large-scale data processing and ML feature pipelines.',
    chips: ['PySpark', 'SQL', 'MLlib'] },
  { id: 'gcp', name: 'GCP Services', category: 'Cloud', icon: '☁️',
    description: 'Curated Google Cloud services — BigQuery, Vertex AI, Cloud Functions — in a governed sandbox.',
    chips: ['BigQuery', 'Vertex AI'], tag: 'Popular' },
  { id: 'aws', name: 'AWS Services', category: 'Cloud', icon: '🟧',
    description: 'Explore AWS analytics & ML services — S3, SageMaker, Athena — without provisioning your own account.',
    chips: ['S3', 'SageMaker', 'Athena'] },
  { id: 'azure', name: 'Azure Services', category: 'Cloud', icon: '🔷',
    description: 'Try Azure data & AI services in a time-boxed, governed workspace.',
    chips: ['Synapse', 'ML Studio'] },
  { id: 'kiro', name: 'Kiro', category: 'AI/GenAI', icon: '🌀',
    description: 'Agentic AI development environment for spec-driven building and rapid prototyping.',
    chips: ['Specs', 'Agents'], tag: 'New' },
  { id: 'dynatrace', name: 'Dynatrace', category: 'Observability', icon: '📈',
    description: 'Application observability and performance analytics sandbox.',
    chips: ['APM', 'Traces', 'Metrics'] },
  { id: 'apig', name: 'APIG', category: 'Integration', icon: '🔌',
    description: 'API gateway sandbox to design, mock and test API integrations.',
    chips: ['Gateway', 'Mock', 'Routes'] },
  { id: 'moveworks', name: 'Moveworks', category: 'Automation', icon: '🤝',
    description: 'Conversational AI automation platform — explore intent flows and bots.',
    chips: ['Bots', 'NLU', 'Automation'] },
  { id: 'blueprism', name: 'Blue Prism', category: 'Automation', icon: '🦾',
    description: 'RPA sandbox to prototype process automations safely.',
    chips: ['RPA', 'Automation'] },
];

export const TOOL_CATEGORIES: EcosystemTool['category'][] = [
  'AI/GenAI', 'Cloud', 'Data/DB', 'Streaming', 'Observability', 'Automation', 'Integration',
];

export function getToolById(id: string): EcosystemTool | undefined {
  return TOOLS.find((t) => t.id === id);
}
