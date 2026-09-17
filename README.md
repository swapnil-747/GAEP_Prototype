# GAEP Platform Orchestrator (Prototype)

## Overview
The GAEP (Global Aerospace Engineering Platform) Prototype is a self-service orchestration platform designed to reduce infrastructure lead time for engineering POCs. It abstracts complex Docker management into a web-based portal, allowing engineers to spin up ephemeral workspaces for data science and workbench development.

## Tech Stack
- Frontend: Next.js (TypeScript), React
- Backend/Orchestrator: Python (FastAPI), Docker SDK, PyJWT
- Infrastructure: Docker Compose (local environment)

## Getting Started

### Prerequisites
- Docker Desktop
- Node.js (v18+)
- Python 3.9+

### Installation
1. Install Frontend Dependencies:
   ```bash
   npm install
   ```
2. Setup Orchestrator Dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *(or `cd src/orchestrator && pip install -r ../../requirements.txt`)*

### Running the Platform
1. Start the Orchestrator (Backend):
   ```bash
   cd src/orchestrator
   python orchestrator.py
   ```
   The backend API will run at `http://localhost:5000`.

2. Start the Dashboard (Frontend):
   Open a new terminal and run:
   ```bash
   npm run dev
   ```
   The frontend will run at `http://localhost:3000`.

3. Access the Platform:
   - Login: `http://localhost:3000/gaep/login`
     - Default demo user: `engineer@example.com`
     - Password: `password123`
     - Or create a new account using the "Create account" tab.
   - Catalog: `http://localhost:3000/gaep/catalog`
   - Provision Workspaces: `http://localhost:3000/gaep/provision`
   - Active Workspaces Dashboard: `http://localhost:3000/gaep/dashboard`

## Architecture Highlights
- Authentication: Secure session management using HTTP-only cookies and JWT tokens.
- Dynamic Port Mapping: Orchestrator retrieves assigned ports from Docker to prevent collisions.
- Resource Lifecycle: Includes a background janitor loop monitoring workspace TTL (Time-To-Live) to decommission expired containers.
- Service Decoupling: UI is separated from orchestration logic, allowing for easy migration to K8s/OpenShift.

## Step-by-Step Replication
- In DockerHub search and pull these images (if testing with live containers):
    1. `dorowu/ubuntu-desktop-lxde-vnc`
    2. `jupyter/datascience-notebook`
    3. `nginx`

- Run the backend orchestrator and frontend dev server as shown above.
- Go to catalog / provision page to launch your workspaces.

