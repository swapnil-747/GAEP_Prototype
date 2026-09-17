# GAEP (Global Aerospace Engineering Platform) — Self-Service Orchestrator Prototype

## 1. Overview & Purpose
The **GAEP (Global Aerospace Engineering Platform) Prototype** is an enterprise self-service provisioning portal designed to eliminate infrastructure lead times for engineering teams. It enables engineers without immediate access to production corporate infrastructure to spin up governed, ephemeral sandboxes (Data Science, Cloud Accounts, Observability, QA, and Agile) in seconds.

---

## 2. Supported Tool Ecosystem & Catalog

| Tool / Environment | Type & Port | Description & Key Capabilities |
| :--- | :--- | :--- |
| ☁️ **GCP Project Sandbox** | Cloud Vended (`gaep-prototype`) | **Live BigQuery Dataset Vending**: Dynamically provisions ephemeral BigQuery datasets (`boeing_gaep_*`), seeds flight telemetry, and launches Google Cloud Console under Always Free Tier ($0.00). |
| 🟧 **AWS Ephemeral Account** | Cloud Vended ($50 budget cap) | **IAM STS & S3 Sandbox**: Generates short-lived STS tokens, 1-click CLI config, $50 budget ceiling meter, and interactive S3 bucket object manager. |
| 🔷 **Azure Subscription** | Cloud Vended ($50 budget cap) | **Service Principal & Blob Storage**: Ephemeral Service Principal login credentials, Azure Blob storage explorer, and Azure OpenAI integration. |
| 🔍 **Splunk Developer Lab** | Port `8000` (`splunk/splunk:latest`) | **Enterprise Log Analytics**: Pre-loaded with Boeing 787 FDR telemetry streams (hydraulic PSI, vibration anomalies, turbine EGT). Login: `admin` / `AdminPassword123!`. |
| 📈 **Kibana Dashboards** | Port `5601` (`kibana:8.11.0`) | **Visual Telemetry Dashboards**: Graphical fleet health explorer connected directly to Elasticsearch backend. |
| ⚡ **Elasticsearch Engine** | Port `9200` (`elasticsearch:8.11.0`) | **REST API Search Cluster**: Distributed search engine pre-seeded with aerospace parts catalog and airworthiness directives. |
| 🎭 **Playwright QA Studio** | Port `9323` (Playwright Worker) | **End-to-End Test Automation**: Active Node.js test runner daemon executing 19 test specs verifying cockpit telemetry alerts. |
| 📋 **Jira Agile Server** | Port `8080` (Jira + Postgres 14) | **Atlassian Jira Software**: Official enterprise Jira container automatically linked to a dedicated `postgres:14-alpine` database. |
| ☁️ **Salesforce Dev Org** | SaaS Vended | **Customer 360 Fleet Management**: Mock Airline Accounts (Air India, United, Singapore Airlines), maintenance contracts, and REST SObjects API. |
| 📓 **Jupyter Lab** | Port `8888` (`jupyter/datascience-notebook`) | **Data Science Workbench**: Interactive Jupyter notebook pre-configured with Python 3, Pandas, Scikit-learn, and curated datasets. |
| 🖥️ **Linux VNC Desktop** | Port `80` (`dorowu/ubuntu-desktop-lxde-vnc`) | **Virtual Desktop VM**: Lightweight Ubuntu LXDE desktop accessible directly via browser. |

---

## 3. Getting Started & Replication Guide

### Prerequisites
- **Docker Desktop** (running with Linux containers enabled)
- **Node.js** (v18 or v20+)
- **Python** (v3.9 to v3.13)

### Step 1: Clone & Install Dependencies
```bash
# 1. Install Node.js frontend dependencies
npm install

# 2. Install Python backend dependencies
pip install -r requirements.txt
```

### Step 2: (Optional) Pre-Pull Docker Images
To ensure instant offline startup for all container sandboxes:
```bash
docker pull dorowu/ubuntu-desktop-lxde-vnc:latest
docker pull jupyter/datascience-notebook:latest
docker pull splunk/splunk:latest
docker pull elasticsearch:8.11.0
docker pull kibana:8.11.0
docker pull mcr.microsoft.com/playwright:v1.44.0-jammy
docker pull atlassian/jira-software:latest
docker pull postgres:14-alpine
```

### Step 3: (Optional) Configure Live Google Cloud Integration
If you want GAEP to dynamically create real BigQuery datasets in your Google Cloud account:
1. Place your GCP Service Account JSON key in the root directory (e.g. `gaep-prototype-*.json`).
2. Ensure the Service Account has **BigQuery Admin** and **Storage Admin** roles.
3. GAEP will automatically detect the key, create ephemeral BigQuery datasets on provision, and delete them on termination!

---

## 4. Running the Platform

### Start the Backend Orchestrator (Terminal 1)
```bash
python src/orchestrator/orchestrator.py
```
* Backend API: `http://localhost:5000`

### Start the Next.js Frontend (Terminal 2)
```bash
npm run dev
```
* Frontend Portal: `http://localhost:3000`

---

## 5. User Workflow & Navigation

1. **Sign In**:
   - URL: `http://localhost:3000/gaep/login`
   - Default Demo Account: `engineer@example.com` / `password123` (or register a new user in 1 click).
2. **Self-Service Catalog**:
   - URL: `http://localhost:3000/gaep/catalog`
   - Browse by category (Cloud Sandboxes, Observability, QA Automation, Data Science, Enterprise & Agile).
3. **Provisioning & Workbench**:
   - Select TTL (1 hour, 4 hours, 1 day, 7 days) and curated aerospace dataset.
   - Click **"Launch in New Tab ↗"** to access the live external web application / cloud console.
   - Use the in-app **Specialized Control Centers** to inspect live telemetry, copy vended IAM keys, run REST queries, and monitor budget spend.
4. **Active Workspaces & Purge**:
   - URL: `http://localhost:3000/gaep/dashboard`
   - View running sandboxes, time remaining until auto-expiration, or click **"Purge All Workspaces ✕"** for full teardown.

---

## 6. Architecture & Governance Design

```
                     ┌──────────────────────────────────────┐
                     │          Next.js Web Portal          │
                     │  (Catalog, Workbenches, Dashboards)  │
                     └──────────────────┬───────────────────┘
                                        │ HTTP REST / JWT Cookie
                                        ▼
                     ┌──────────────────────────────────────┐
                     │     FastAPI Python Orchestrator      │
                     │  (Dynamic Ports, TTL Janitor, CVM)   │
                     └───────┬──────────────────────┬───────┘
                             │                      │
             Docker Compose Engine          Cloud Vending Machine (CVM)
           ┌────────────────────────┐     ┌────────────────────────────┐
           │ • Splunk / Kibana      │     │ • GCP BigQuery API         │
           │ • Jira + PostgreSQL 14 │     │ • AWS STS / S3 Simulator   │
           │ • Playwright Runner    │     │ • Azure Service Principal  │
           │ • Jupyter / Linux VNC  │     │ • Budget Cap Enforcement   │
           └────────────────────────┘     └────────────────────────────┘
```

- **Authentication**: Secure stateless JWT tokens stored in HTTP-only session cookies.
- **Enterprise Cloud Governance**: Every cloud sandbox is bounded by a **$50.00 USD Budget Cap** and an automated **TTL auto-termination janitor**.
- **No `<iframe>` Embeds**: All tools open via clean new-tab launches paired with in-app polymorphic control centers.
- **Clean Teardown**: Deleting a workspace removes Docker containers, networks, temporary filesystem volumes, and remote BigQuery datasets.

---

## 7. Testing & Quality Assurance

Run the automated test suite and production build verification:
```bash
# Run 150 automated vitest unit tests
npm test

# Build production Next.js artifact
npm run build
```
