# GAEP Platform Orchestrator (Prototype)

## Overview
The GAEP (Global Aerospace Engineering Platform) Prototype is a self-service orchestration platform designed to reduce infrastructure lead time for engineering POCs. It abstracts complex Docker management into a web-based portal, allowing engineers to spin up ephemeral workspaces for data science and workbench development.

## Tech Stack
- Frontend: Next.js (TypeScript), React
- Backend/Orchestrator: Python (FastAPI), Docker SDK
- Infrastructure: Docker Compose (local environment)

## Getting Started

### Prerequisites
- Docker Desktop
- Node.js (v18+)
- Python 3.9+

### Installation
1. Install Frontend Dependencies:
   `npm install`
2. Setup Orchestrator Dependencies:
   `cd orchestrator`
   `pip install fastapi uvicorn docker`

### Running the Platform
1. Start the Orchestrator (Backend):
   `cd src/orchestrator`
   `python orchestrator.py`
2. Start the Dashboard (Frontend):
   Open new terminal
   `npm run dev`
3. Access: Navigate to http://localhost:3000/gaep/provision

## Architecture Highlights
- Dynamic Port Mapping: Orchestrator retrieves assigned ports from Docker to prevent collisions.
- Resource Lifecycle: Includes a background loop monitoring workspace TTL (Time-To-Live) to decommission expired containers.
- Service Decoupling: UI is separated from orchestration logic, allowing for easy migration to K8s/OpenShift.

## Step-by-Step Replication
- In DockerHub search and pull these three images:
    1. dorowu/ubuntu-desktop-lxde-vnc
    2. jupyter/datascience-notebook
    3. nginx

- Run the the backend files as shown above.
- Go to catalog and at the bottom you will find two new templates. Provision either of those. 