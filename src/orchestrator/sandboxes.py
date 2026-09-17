from __future__ import annotations

import json
import random
import time
import uuid
from typing import Any


def generate_aws_credentials(user_id: str, workspace_name: str) -> dict[str, Any]:
    random_id = uuid.uuid4().hex[:8].upper()
    access_key = f"AKIA{random_id}{uuid.uuid4().hex[:8].upper()}"
    secret_key = f"{uuid.uuid4().hex}{uuid.uuid4().hex}"[:40]
    session_token = f"AQoDYXdzEEoa8{uuid.uuid4().hex}{uuid.uuid4().hex}"
    
    return {
        "provider": "AWS (Amazon Web Services)",
        "account_id": "184920491823",
        "account_name": "Boeing-Commercial-GovCloud-Sandbox",
        "role_arn": "arn:aws:iam::184920491823:role/GAEP-Engineer-Sandbox-Role",
        "region": "us-west-2",
        "access_key_id": access_key,
        "secret_access_key": secret_key,
        "session_token": session_token,
        "budget_cap_usd": 50.00,
        "current_spend_usd": 0.00,
        "allowed_services": [
            "Amazon S3 (Encrypted Buckets)",
            "AWS Lambda (Serverless Compute)",
            "Amazon Athena (Interactive SQL Queries)",
            "Amazon Bedrock (GenAI Foundation Models)",
            "Amazon SageMaker (Studio Notebooks)",
        ],
        "console_url": "https://us-west-2.console.aws.amazon.com/",
        "cli_config": f"[default]\naws_access_key_id = {access_key}\naws_secret_access_key = {secret_key}\naws_session_token = {session_token}\nregion = us-west-2",
    }


def generate_azure_credentials(user_id: str, workspace_name: str) -> dict[str, Any]:
    sub_id = str(uuid.uuid4())
    tenant_id = "3b4a5c6d-7e8f-9012-3456-7890abcdef12"
    client_id = str(uuid.uuid4())
    client_secret = f"~GAEP_{uuid.uuid4().hex[:24]}"
    
    return {
        "provider": "Microsoft Azure",
        "subscription_id": sub_id,
        "subscription_name": "Boeing-Avionics-Innovation-Sandbox",
        "tenant_id": tenant_id,
        "client_id": client_id,
        "client_secret": client_secret,
        "resource_group": f"rg-gaep-{workspace_name[:12]}",
        "region": "centralus",
        "budget_cap_usd": 50.00,
        "current_spend_usd": 0.00,
        "allowed_services": [
            "Azure Blob Storage (Encrypted)",
            "Azure OpenAI (GPT-4o and Embeddings)",
            "Azure Functions (Python/TypeScript)",
            "Azure Synapse Analytics",
        ],
        "console_url": "https://portal.azure.com/",
        "cli_config": f"az login --service-principal -u {client_id} -p {client_secret} --tenant {tenant_id}\naz account set --subscription {sub_id}",
    }


def generate_gcp_credentials(user_id: str, workspace_name: str) -> dict[str, Any]:
    import os
    try:
        from gcp_vender import get_master_key_path
        key_file = get_master_key_path()
    except Exception:
        try:
            from src.orchestrator.gcp_vender import get_master_key_path
            key_file = get_master_key_path()
        except Exception:
            key_file = None

    project_id = None
    sa_email = None
    sa_key_json = None

    if key_file and key_file.exists():
        try:
            raw = json.loads(key_file.read_text(encoding="utf-8"))
            if raw.get("project_id"):
                project_id = raw["project_id"]
                sa_email = raw.get("client_email", f"gaep-vender@{project_id}.iam.gserviceaccount.com")
                sa_key_json = raw
        except Exception:
            pass

    if not project_id:
        env_project = os.environ.get("GCP_PROJECT_ID")
        project_id = env_project if env_project else f"boeing-gaep-sandbox-{uuid.uuid4().hex[:6]}"
        sa_email = f"sa-engineer@{project_id}.iam.gserviceaccount.com"
        sa_key_json = {
            "type": "service_account",
            "project_id": project_id,
            "private_key_id": uuid.uuid4().hex,
            "client_email": sa_email,
            "client_id": str(random.randint(100000000000000000, 999999999999999999)),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }

    console_url = f"https://console.cloud.google.com/welcome?project={project_id}"

    return {
        "provider": "Google Cloud Platform (GCP)",
        "project_id": project_id,
        "project_name": "Boeing Flight Analytics Sandbox",
        "service_account": sa_email,
        "region": "us-central1",
        "budget_cap_usd": 50.00,
        "current_spend_usd": 0.00,
        "allowed_services": [
            "Google BigQuery (Petabyte SQL Analytics)",
            "Vertex AI (Gemini 1.5 Pro and Search)",
            "Cloud Storage (GCS Multi-Region)",
            "Cloud Run (Serverless Microservices)",
        ],
        "console_url": console_url,
        "service_account_json": sa_key_json,
        "cli_config": f"gcloud auth activate-service-account {sa_email} --key-file=sa-key.json\ngcloud config set project {project_id}",
    }


def generate_splunk_data() -> dict[str, Any]:
    return {
        "instance_name": "Splunk Enterprise (Boeing Flight Ops)",
        "default_index": "avionics-telemetry-787",
        "sample_queries": [
            "index=avionics component=hydraulics | stats avg(pressure_psi), max(pressure_psi) by aircraft_tail",
            "index=flight-dispatch status=DELAY | timechart count by delay_reason",
            "index=vibration-sensors frequency_hz > 450 | table timestamp, tail_num, sensor_id, peak_amplitude",
        ],
        "telemetry_samples": [
            {"timestamp": "2026-09-17T11:40:12Z", "tail_num": "N787BA", "component": "hydraulics", "pressure_psi": 3020, "status": "OPTIMAL"},
            {"timestamp": "2026-09-17T11:40:14Z", "tail_num": "N787BA", "component": "hydraulics", "pressure_psi": 2995, "status": "OPTIMAL"},
            {"timestamp": "2026-09-17T11:40:16Z", "tail_num": "VT-BOE", "component": "vibration", "frequency_hz": 482, "status": "ELEVATED_ANOMALY"},
            {"timestamp": "2026-09-17T11:40:18Z", "tail_num": "VT-BOE", "component": "engine_egt", "temp_celsius": 645, "status": "OPTIMAL"},
        ],
    }


def generate_kibana_data() -> dict[str, Any]:
    return {
        "dashboard_name": "Fleet Telemetry & Flight Health Dashboard",
        "indices": ["avionics-telemetry-787", "flight-dispatch-logs", "supplier-lead-times"],
        "total_events_indexed": 148200,
        "health": "green",
        "active_visualizations": [
            "Hydraulic Pressure Variance Heatmap",
            "Turbine EGT Temperature Time Series",
            "Dispatch Anomaly Rate per 1,000 Flight Hours",
        ],
    }


def generate_elasticsearch_data() -> dict[str, Any]:
    return {
        "cluster_name": "boeing-gaep-search-cluster",
        "cluster_status": "green",
        "nodes": 1,
        "indices": [
            {"name": "aircraft-parts-catalog", "docs_count": 45200, "size": "124MB"},
            {"name": "faa-airworthiness-directives", "docs_count": 8900, "size": "38MB"},
            {"name": "maintenance-work-orders", "docs_count": 94100, "size": "210MB"},
        ],
        "rest_endpoint": "http://localhost:9200",
    }


def generate_jira_data() -> dict[str, Any]:
    return {
        "project_key": "AVION",
        "project_name": "Boeing 787 Avionics & Predictive Maintenance",
        "active_sprint": "Sprint 42 - Hydraulic Telemetry & RAG Pipeline",
        "columns": [
            {
                "title": "To Do",
                "tickets": [
                    {"id": "AVION-112", "title": "Benchmark API latency on edge gateway during turbulence events", "priority": "Medium", "type": "Task", "assignee": "Swapnil P."},
                    {"id": "AVION-114", "title": "Integrate FAA Airworthiness directive embedding pipeline", "priority": "High", "type": "Story", "assignee": "Unassigned"},
                ]
            },
            {
                "title": "In Progress",
                "tickets": [
                    {"id": "AVION-104", "title": "Stream real-time hydraulic pressure telemetry to cockpit warning system", "priority": "Highest", "type": "BugFix", "assignee": "Lead Engineer"},
                    {"id": "AVION-108", "title": "Validate scikit-learn parts degradation baseline model", "priority": "High", "type": "Story", "assignee": "Data Scientist"},
                ]
            },
            {
                "title": "In Review",
                "tickets": [
                    {"id": "AVION-105", "title": "High-frequency vibration stream parser for flight data recorder", "priority": "Medium", "type": "Story", "assignee": "Senior Developer"},
                ]
            },
            {
                "title": "Done",
                "tickets": [
                    {"id": "AVION-101", "title": "Provision GAEP ephemeral test sandbox architecture", "priority": "Highest", "type": "Epic", "assignee": "Core Team"},
                    {"id": "AVION-102", "title": "Implement JWT session cookie authentication layer", "priority": "High", "type": "Task", "assignee": "Core Team"},
                ]
            }
        ]
    }


def generate_playwright_data() -> dict[str, Any]:
    return {
        "test_suite": "Boeing Flight Operations & GAEP E2E Suite",
        "framework": "Playwright v1.44 (TypeScript)",
        "test_files": [
            {"file": "tests/flight-dispatch.spec.ts", "tests": 6, "passed": 6, "failed": 0, "duration": "840ms"},
            {"file": "tests/parts-catalog.spec.ts", "tests": 8, "passed": 8, "failed": 0, "duration": "1.1s"},
            {"file": "tests/telemetry-alert.spec.ts", "tests": 5, "passed": 5, "failed": 0, "duration": "620ms"},
        ],
        "sample_spec": """import { test, expect } from '@playwright/test';

test('verify real-time hydraulic sensor telemetry alert', async ({ page }) => {
  await page.goto('http://localhost:3000/gaep/workspace');
  await expect(page.getByText('Hydraulic Sensor Telemetry')).toBeVisible();
  
  // Verify threshold warning trigger
  const pressureVal = await page.locator('.telemetry-metric').innerText();
  expect(parseInt(pressureVal)).toBeGreaterThan(2800);
});
""",
    }


def generate_salesforce_data() -> dict[str, Any]:
    return {
        "org_type": "Developer Scratch Org (Aerospace Fleet Edition)",
        "org_id": "00D5e000001aBCdEAM",
        "instance_url": "https://boeing-sandbox-dev-ed.develop.my.salesforce.com",
        "objects": [
            {"name": "Account", "records": [
                {"Name": "Air India TechOps Fleet", "Industry": "Aviation / Airlines", "FleetSize": 128, "ContractStatus": "Active Platinum"},
                {"Name": "United Airlines Maintenance", "Industry": "Aviation / Airlines", "FleetSize": 340, "ContractStatus": "Active Enterprise"},
                {"Name": "Singapore Airlines Engineering", "Industry": "Aviation / Airlines", "FleetSize": 96, "ContractStatus": "Active Gold"},
            ]},
            {"name": "Maintenance_Contract__c", "records": [
                {"Contract_Number__c": "CTR-787-88219", "Aircraft_Type__c": "Boeing 787-9", "SLA__c": "4 Hours AOG Response"},
                {"Contract_Number__c": "CTR-777-44012", "Aircraft_Type__c": "Boeing 777X", "SLA__c": "2 Hours AOG Response"},
            ]},
        ],
        "rest_api_endpoint": "/services/data/v59.0/sobjects/Account",
    }


def get_sandbox_payload(template_id: str, user_id: str, workspace_name: str) -> dict[str, Any]:
    if template_id == "aws-sandbox":
        return {"cloud_credentials": generate_aws_credentials(user_id, workspace_name)}
    elif template_id == "azure-sandbox":
        return {"cloud_credentials": generate_azure_credentials(user_id, workspace_name)}
    elif template_id == "gcp-sandbox":
        return {"cloud_credentials": generate_gcp_credentials(user_id, workspace_name)}
    elif template_id == "splunk":
        return {"splunk_data": generate_splunk_data()}
    elif template_id == "kibana":
        return {"kibana_data": generate_kibana_data()}
    elif template_id == "elasticsearch":
        return {"elasticsearch_data": generate_elasticsearch_data()}
    elif template_id == "jira":
        return {"jira_data": generate_jira_data()}
    elif template_id == "playwright":
        return {"playwright_data": generate_playwright_data()}
    elif template_id == "salesforce":
        return {"salesforce_data": generate_salesforce_data()}
    return {}
