import { EcosystemTool } from '../types';

// Illustrative, NOT exhaustive. The catalog is easily extended.
export const TOOLS: EcosystemTool[] = [
  { id: 'aws', name: 'AWS Ephemeral Account', category: 'Cloud', icon: '🟧',
    description: 'Time-boxed AWS GovCloud sandbox with $50 budget ceiling, IAM STS access keys, and 1-click console launch.',
    chips: ['S3', 'Lambda', 'Bedrock', 'Athena'], tag: 'Ready to Run' },
  { id: 'azure', name: 'Azure Subscription Sandbox', category: 'Cloud', icon: '🔷',
    description: 'Governed Azure subscription with Service Principal credentials, resource group isolation, and Azure OpenAI access.',
    chips: ['Blob Storage', 'Azure OpenAI', 'Synapse'], tag: 'Ready to Run' },
  { id: 'gcp', name: 'GCP Project Sandbox', category: 'Cloud', icon: '☁️',
    description: 'Dedicated Google Cloud project sandbox with pre-configured Service Account JSON for BigQuery & Vertex AI.',
    chips: ['BigQuery', 'Vertex AI', 'GCS'], tag: 'Ready to Run' },
  { id: 'kibana', name: 'Kibana Telemetry', category: 'Observability', icon: '📈',
    description: 'Real-time telemetry and fleet health visualization pre-loaded with Boeing 787 sensor anomaly indices.',
    chips: ['Elasticsearch', 'Dashboards', 'Sensors'], tag: 'Ready to Run' },
  { id: 'splunk', name: 'Splunk Developer Lab', category: 'Observability', icon: '🔍',
    description: 'Enterprise log analytics and security intelligence workbench pre-seeded with avionics sensor telemetry streams.',
    chips: ['SPL Queries', 'Avionics Logs', 'Vibration'], tag: 'Ready to Run' },
  { id: 'elasticsearch', name: 'Elasticsearch Engine', category: 'Data/DB', icon: '⚡',
    description: 'Distributed RESTful search and analytics cluster pre-seeded with aerospace parts catalogs and FAA directives.',
    chips: ['REST API', 'Full-Text Search', 'Indices'], tag: 'Ready to Run' },
  { id: 'playwright', name: 'Playwright QA Studio', category: 'Quality Engineering', icon: '🎭',
    description: 'End-to-end browser test automation studio with test runner, TypeScript specs, and interactive report viewer.',
    chips: ['E2E Tests', 'TypeScript', 'QA Runner'], tag: 'Ready to Run' },
  { id: 'jira', name: 'Jira Agile Sandbox', category: 'Enterprise & Agile', icon: '📋',
    description: 'Agile Kanban sprint board & backlog pre-loaded with Avionics Engineering stories, tasks, and bug tracks.',
    chips: ['Kanban Board', 'Sprint 42', 'Backlog'], tag: 'Ready to Run' },
  { id: 'salesforce', name: 'Salesforce Dev Org', category: 'Enterprise & Agile', icon: '☁️',
    description: 'Pre-provisioned Developer Scratch Org with mock Airline Accounts, Fleet Maintenance Contracts, and REST Object API.',
    chips: ['Scratch Org', 'Customer 360', 'REST SObjects'], tag: 'Ready to Run' },
  { id: 'ai-foundry', name: 'AI Foundry', category: 'AI/GenAI', icon: '🧠',
    description: 'Enterprise model catalog & fine-tuning workspace. Explore foundation models without any setup.',
    chips: ['Models', 'Fine-tune', 'Prompts'], tag: 'Popular' },
  { id: 'langchain', name: 'LangChain', category: 'AI/GenAI', icon: '🔗',
    description: 'Build LLM chains, agents and RAG pipelines in a ready notebook.',
    chips: ['Agents', 'RAG', 'Chains'] },
  { id: 'dataiq', name: 'DataIQ', category: 'Data/DB', icon: '📐',
    description: 'Data quality, profiling and lineage. Understand a dataset before you build on it.',
    chips: ['Profiling', 'Lineage', 'DQ'] },
  { id: 'spark', name: 'Apache Spark', category: 'Data/DB', icon: '⚡',
    description: 'Distributed compute for large-scale data processing and ML feature pipelines.',
    chips: ['PySpark', 'SQL', 'MLlib'] },
  { id: 'dynatrace', name: 'Dynatrace', category: 'Observability', icon: '📈',
    description: 'Application observability and performance analytics sandbox.',
    chips: ['APM', 'Traces', 'Metrics'] },
];

export const TOOL_CATEGORIES: EcosystemTool['category'][] = [
  'Cloud', 'Observability', 'Data/DB', 'Quality Engineering', 'Enterprise & Agile', 'AI/GenAI', 'Streaming', 'Automation', 'Integration',
];

export function getToolById(id: string): EcosystemTool | undefined {
  return TOOLS.find((t) => t.id === id);
}
