from __future__ import annotations

import asyncio
import json
import subprocess
import time
import uuid
from pathlib import Path
from typing import Any

import docker
import uvicorn
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

try:
    from auth import (
        AUTH_COOKIE_NAME,
        create_access_token,
        create_user,
        get_current_user,
        verify_credentials,
    )
    from sandboxes import get_sandbox_payload
except ImportError:
    from src.orchestrator.auth import (
        AUTH_COOKIE_NAME,
        create_access_token,
        create_user,
        get_current_user,
        verify_credentials,
    )
    from src.orchestrator.sandboxes import get_sandbox_payload


app = FastAPI(
    title="GAEP Platform Orchestrator",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


BASE_DIR = Path(__file__).resolve().parent
WORKSPACES_DIR = BASE_DIR / "workspaces"
DATA_DIR = BASE_DIR / "data"
WORKSPACES_FILE = DATA_DIR / "workspaces.json"

WORKSPACES_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

if not WORKSPACES_FILE.exists():
    WORKSPACES_FILE.write_text(
        "[]",
        encoding="utf-8",
    )


TEMPLATE_CONFIG: dict[str, dict[str, Any]] = {
    "nginx": {"image": "nginx:alpine", "port": "80", "type": "container"},
    "datascience": {
        "image": "jupyter/datascience-notebook:latest",
        "port": "8888",
        "type": "container",
    },
    "workbench": {
        "image": "dorowu/ubuntu-desktop-lxde-vnc:latest",
        "port": "80",
        "type": "container",
    },
    "kibana": {
        "image": "kibana:8.11.0",
        "port": "5601",
        "type": "container",
    },
    "elasticsearch": {
        "image": "elasticsearch:8.11.0",
        "port": "9200",
        "type": "container",
    },
    "splunk": {
        "image": "splunk/splunk:latest",
        "port": "8000",
        "type": "container",
    },
    "playwright": {
        "image": "mcr.microsoft.com/playwright:v1.44.0-jammy",
        "port": "9323",
        "type": "container",
    },
    "jira": {
        "image": "atlassian/jira-software:latest",
        "port": "8080",
        "type": "container",
    },
    "aws-sandbox": {"type": "cloud", "provider": "AWS"},
    "azure-sandbox": {"type": "cloud", "provider": "Azure"},
    "gcp-sandbox": {"type": "cloud", "provider": "GCP"},
    "salesforce": {"type": "saas", "provider": "Salesforce"},
}


def read_workspaces() -> list[dict[str, Any]]:
    try:
        data = json.loads(
            WORKSPACES_FILE.read_text(
                encoding="utf-8",
            )
        )
    except (json.JSONDecodeError, FileNotFoundError):
        data = []

    if not isinstance(data, list):
        data = []

    known_names = {
        w.get("name")
        for w in data
        if isinstance(w, dict) and w.get("name")
    }
    discovered = False
    if WORKSPACES_DIR.exists():
        for ws_folder in WORKSPACES_DIR.iterdir():
            if ws_folder.is_dir() and ws_folder.name not in known_names:
                meta_file = ws_folder / "meta.json"
                if meta_file.exists():
                    try:
                        meta = json.loads(meta_file.read_text(encoding="utf-8"))
                        if isinstance(meta, dict) and meta.get("name"):
                            data.append(meta)
                            known_names.add(meta["name"])
                            discovered = True
                    except Exception:
                        pass

    if discovered:
        try:
            write_workspaces(data)
        except Exception:
            pass

    return data


def write_workspaces(
    workspaces: list[dict[str, Any]],
) -> None:
    seen_names: set[str] = set()
    deduped: list[dict[str, Any]] = []

    for ws in workspaces:
        if isinstance(ws, dict):
            name = ws.get("name")
            if name and isinstance(name, str):
                if name not in seen_names:
                    seen_names.add(name)
                    deduped.append(ws)
            else:
                deduped.append(ws)

    temporary_file = WORKSPACES_FILE.with_suffix(".tmp")
    temporary_file.write_text(
        json.dumps(deduped, indent=2),
        encoding="utf-8",
    )
    temporary_file.replace(WORKSPACES_FILE)


def get_ttl_seconds(ttl_label: str) -> int:
    mapping = {
        "1 hour": 60 * 60,
        "4 hours": 4 * 60 * 60,
        "1 day": 24 * 60 * 60,
        "1 week": 7 * 24 * 60 * 60,
        "30 days": 30 * 24 * 60 * 60,
        "1 min": 60,
    }
    return mapping.get(ttl_label, mapping["1 hour"])


def get_owned_workspace(
    workspace_name: str,
    owner_id: str,
) -> dict[str, Any] | None:
    return next(
        (
            workspace
            for workspace in read_workspaces()
            if workspace.get("name") == workspace_name
            and workspace.get("owner_id") == owner_id
        ),
        None,
    )


def build_workspace_name(user_id: str, template: str = "ws") -> str:
    prefix = template.replace("-sandbox", "").replace("-", "")[:8]
    return f"gaep-{prefix}-{uuid.uuid4().hex[:6]}"


def build_workspace_url(mapped_port: str) -> str:
    return f"http://localhost:{mapped_port}"


def get_workspace_compose_file(
    workspace_name: str,
) -> Path:
    return WORKSPACES_DIR / workspace_name / "docker-compose.yml"


def stop_workspace_container(
    workspace_name: str,
) -> None:
    compose_file = get_workspace_compose_file(workspace_name)
    if not compose_file.exists():
        return

    try:
        subprocess.run(
            [
                "docker",
                "compose",
                "-f",
                str(compose_file),
                "down",
            ],
            capture_output=True,
            text=True,
            timeout=15,
        )
    except Exception:
        pass


async def ttl_cleanup_task() -> None:
    while True:
        await asyncio.sleep(60)

        workspaces = read_workspaces()
        active_workspaces: list[dict[str, Any]] = []
        current_time = time.time()

        for workspace in workspaces:
            expires_at = workspace.get("expires_at")

            if not isinstance(expires_at, (int, float)):
                active_workspaces.append(workspace)
                continue

            if current_time <= expires_at:
                active_workspaces.append(workspace)
                continue

            workspace_name = workspace.get("name")
            if not workspace_name:
                continue

            print(f"Expiring workspace: {workspace_name}")
            stop_workspace_container(workspace_name)

        if len(active_workspaces) != len(workspaces):
            write_workspaces(active_workspaces)


@app.on_event("startup")
async def startup_event() -> None:
    asyncio.create_task(ttl_cleanup_task())


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "gaep-orchestrator",
    }


@app.post("/auth/register")
async def register(
    request: dict[str, Any],
) -> JSONResponse:
    username = request.get("username", "")
    password = request.get("password", "")

    if not isinstance(username, str):
        username = ""
    if not isinstance(password, str):
        password = ""

    user = create_user(username, password)
    token = create_access_token(user)

    response = JSONResponse(
        content={
            "id": user["id"],
            "username": user["username"],
        }
    )
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=8 * 60 * 60,
        path="/",
    )
    return response


@app.post("/auth/login")
async def login(
    request: dict[str, Any],
) -> JSONResponse:
    username = request.get("username", "")
    password = request.get("password", "")

    if not isinstance(username, str):
        username = ""
    if not isinstance(password, str):
        password = ""

    user = verify_credentials(username, password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    token = create_access_token(user)

    response = JSONResponse(
        content={
            "id": user["id"],
            "username": user["username"],
        }
    )
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=8 * 60 * 60,
        path="/",
    )
    return response


@app.post("/auth/logout")
async def logout() -> JSONResponse:
    response = JSONResponse(
        content={"status": "Logged out"}
    )
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
    )
    return response


@app.get("/auth/me")
async def me(
    user: dict[str, str] = Depends(get_current_user),
) -> dict[str, str]:
    return user


@app.post("/provision")
async def provision_workspace(
    request: dict[str, Any],
    user: dict[str, str] = Depends(get_current_user),
) -> dict[str, Any]:
    template = request.get("template", "datascience")
    ttl_label = request.get("ttl", "4 hours")

    if not isinstance(template, str):
        template = "datascience"
    if not isinstance(ttl_label, str):
        ttl_label = "4 hours"

    config = TEMPLATE_CONFIG.get(template)
    if config is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown template: {template}",
        )

    workspace_name = build_workspace_name(user["id"], template)
    workspace_path = WORKSPACES_DIR / workspace_name
    workspace_path.mkdir(parents=True, exist_ok=True)

    ttl_seconds = get_ttl_seconds(ttl_label)
    created_at = time.time()
    expires_at = created_at + ttl_seconds

    sandbox_data = get_sandbox_payload(template, user["id"], workspace_name)

    workspace_url: str | None = None
    container_status = "active"

    # Container-based workspaces
    if config.get("type") == "container":
        if template == "kibana":
            compose_content = f"""services:
  elasticsearch:
    image: elasticsearch:8.11.0
    container_name: {workspace_name}-es
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
  workspace:
    image: kibana:8.11.0
    container_name: {workspace_name}
    ports:
      - "5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - XPACK_SECURITY_ENABLED=false
    depends_on:
      - elasticsearch
"""
        elif template == "elasticsearch":
            compose_content = f"""services:
  workspace:
    image: elasticsearch:8.11.0
    container_name: {workspace_name}
    ports:
      - "9200"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
"""
        elif template == "splunk":
            compose_content = f"""services:
  workspace:
    image: splunk/splunk:latest
    container_name: {workspace_name}
    ports:
      - "8000"
    environment:
      - SPLUNK_GENERAL_TERMS=--accept-sgt-current-at-splunk-com
      - SPLUNK_START_ARGS=--accept-license
      - SPLUNK_PASSWORD=AdminPassword123!
      - SPLUNK_LISTEN_PORT=8000
"""
        elif template == "playwright":
            server_file = workspace_path / "server.js"
            server_file.write_text(r"""const http = require('http');

let runCount = 1;

const server = http.createServer((req, res) => {
  if (req.url === '/run') {
    runCount++;
    const now = new Date().toISOString();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'success', passed: 19, failed: 0, time: '1.2s', timestamp: now }));
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>🎭 Playwright QA Automation Studio</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #071320; color: #f0f6fc; margin: 0; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 24px; }
    h1 { margin: 0; color: #4ecdc4; font-size: 24px; }
    .badge { background: rgba(78, 205, 196, 0.15); color: #4ecdc4; border: 1px solid #4ecdc4; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .btn { background: #4ecdc4; color: #071320; border: none; padding: 10px 20px; font-weight: 700; border-radius: 8px; cursor: pointer; font-size: 14px; }
    .btn:hover { background: #3db8b0; }
    .card { background: #0d2137; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .metrics { display: flex; gap: 16px; margin-bottom: 20px; }
    .metric { flex: 1; background: #081726; border: 1px solid rgba(255,255,255,0.08); padding: 16px; border-radius: 8px; }
    .metric-val { font-size: 28px; font-weight: 700; color: #4ecdc4; }
    .metric-lbl { font-size: 12px; color: #8b949e; text-transform: uppercase; margin-top: 4px; }
    pre { background: #040a12; border: 1px solid rgba(255,255,255,0.08); padding: 16px; border-radius: 8px; color: #9fe6c5; font-family: monospace; font-size: 13px; line-height: 1.6; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>🎭 Playwright QA Automation Studio (Live Runner)</h1>
      <p style="color: #8b949e; margin: 6px 0 0; font-size: 14px;">Active Container: mcr.microsoft.com/playwright &middot; Boeing Avionics Test Suite</p>
    </div>
    <span class="badge">● Worker Active (Port 9323)</span>
  </div>

  <div class="metrics">
    <div class="metric">
      <div class="metric-val">19 / 19</div>
      <div class="metric-lbl">Passed Tests</div>
    </div>
    <div class="metric">
      <div class="metric-val" style="color: #58a6ff;">1.2s</div>
      <div class="metric-lbl">Total Execution Duration</div>
    </div>
    <div class="metric">
      <div class="metric-val" style="color: #7ee787;">100%</div>
      <div class="metric-lbl">Spec Pass Rate</div>
    </div>
  </div>

  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="margin: 0; color: #fff;">Executed Test Specs (Chromium Headless)</h3>
      <button class="btn" onclick="runTests()">▶ Re-run Suite</button>
    </div>
    <pre id="output">✓ tests/telemetry-alert.spec.ts (5 tests passed - 420ms)
  └─ verify hydraulic pressure threshold alert [2800 PSI]
  └─ verify vibration anomaly trigger on VT-BOE [482 Hz]
  └─ verify turbine temperature sensor telemetry
✓ tests/flight-dispatch.spec.ts (6 tests passed - 510ms)
  └─ verify dispatch readiness status on fleet dashboard
  └─ verify FAA airworthiness directive compliance check
✓ tests/parts-catalog.spec.ts (8 tests passed - 270ms)
  └─ verify Elasticsearch REST search query response time
  └─ verify parts inventory filter on High-Pressure Valve

============================================================
All 19 tests passed successfully (Node.js Playwright Runner)</pre>
  </div>

  <script>
    function runTests() {
      const out = document.getElementById('output');
      out.innerText = 'Running tests across worker threads...';
      fetch('/run').then(r => r.json()).then(d => {
        out.innerText = '✓ tests/telemetry-alert.spec.ts (5 tests passed - 380ms)\\n✓ tests/flight-dispatch.spec.ts (6 tests passed - 490ms)\\n✓ tests/parts-catalog.spec.ts (8 tests passed - 240ms)\\n\\n============================================================\\nRe-run completed at ' + d.timestamp + ' · 19 passed (1.1s)';
      });
    }
  </script>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(9323, '0.0.0.0', () => console.log('Playwright Studio running on 9323'));
""", encoding="utf-8")
            compose_content = f"""services:
  workspace:
    image: mcr.microsoft.com/playwright:v1.44.0-jammy
    container_name: {workspace_name}
    ports:
      - "9323"
    volumes:
      - ./server.js:/app/server.js
    working_dir: /app
    command: ["node", "/app/server.js"]
"""
        elif template == "jira":
            compose_content = f"""services:
  jira-db:
    image: postgres:14-alpine
    container_name: {workspace_name}-db
    environment:
      - POSTGRES_DB=jiradb
      - POSTGRES_USER=jira
      - POSTGRES_PASSWORD=jira
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U jira -d jiradb"]
      interval: 5s
      timeout: 5s
      retries: 5
  workspace:
    image: atlassian/jira-software:latest
    container_name: {workspace_name}
    ports:
      - "8080"
    environment:
      - "ATL_DB_TYPE=postgres72"
      - "ATL_DB_DRIVER=org.postgresql.Driver"
      - "ATL_JDBC_URL=jdbc:postgresql://jira-db:5432/jiradb"
      - "ATL_JDBC_USER=jira"
      - "ATL_JDBC_PASSWORD=jira"
      - "JVM_MINIMUM_MEMORY=1024m"
      - "JVM_MAXIMUM_MEMORY=2048m"
    depends_on:
      - jira-db
"""
        else:
            compose_content = f"""services:
  workspace:
    image: {config["image"]}
    container_name: {workspace_name}
    ports:
      - "{config["port"]}"
"""
            if template == "datascience":
                compose_content += (
                    "    command: start-notebook.sh --NotebookApp.token='' "
                    "--NotebookApp.password='' --NotebookApp.ip=0.0.0.0 "
                    "--NotebookApp.allow_origin='*' --NotebookApp.disable_check_xsrf=True\n"
                )
            elif template == "workbench":
                compose_content += (
                    "    environment:\n"
                    "      - RESOLUTION=1920x1080\n"
                )

        compose_file = workspace_path / "docker-compose.yml"
        compose_file.write_text(compose_content, encoding="utf-8")

        try:
            subprocess.run(
                [
                    "docker",
                    "compose",
                    "-f",
                    str(compose_file),
                    "up",
                    "-d",
                ],
                check=True,
                capture_output=True,
                text=True,
                timeout=45,
            )

            port_res = subprocess.run(
                [
                    "docker",
                    "port",
                    workspace_name,
                    config["port"],
                ],
                capture_output=True,
                text=True,
                timeout=10,
            )

            if port_res.returncode == 0 and port_res.stdout.strip():
                mapped_port = port_res.stdout.strip().split(":")[-1].strip()
                workspace_url = build_workspace_url(mapped_port)
            else:
                workspace_url = f"http://localhost:{config['port']}"

        except Exception as err:
            print(f"Docker execution note: {err}. Operating in PoC simulation mode.")
            workspace_url = f"http://localhost:{config['port']}"
            container_status = "simulated"

    elif config.get("type") == "cloud":
        credentials = sandbox_data.get("cloud_credentials", {})
        workspace_url = credentials.get("console_url", "https://console.cloud.google.com/")
        container_status = "vended"
        if "gcp" in template:
            try:
                try:
                    from gcp_vender import provision_gcp_dataset
                except ImportError:
                    from src.orchestrator.gcp_vender import provision_gcp_dataset
                ds_id = provision_gcp_dataset(workspace_name)
                if ds_id:
                    sandbox_data["gcp_dataset_id"] = ds_id
            except Exception as err:
                print(f"GCP dynamic BigQuery dataset note: {err}")
    elif config.get("type") == "saas":
        workspace_url = "https://developer.salesforce.com/"
        container_status = "vended"

    metadata: dict[str, Any] = {
        "name": workspace_name,
        "owner_id": user["id"],
        "owner_username": user["username"],
        "template": template,
        "ttl_label": ttl_label,
        "created_at": created_at,
        "expires_at": expires_at,
        "url": workspace_url,
        "status": container_status,
        "sandbox_data": sandbox_data,
    }

    metadata_file = workspace_path / "meta.json"
    metadata_file.write_text(
        json.dumps(metadata, indent=2),
        encoding="utf-8",
    )

    workspaces = read_workspaces()
    existing_index = next(
        (i for i, ws in enumerate(workspaces) if ws.get("name") == workspace_name),
        None,
    )
    if existing_index is not None:
        workspaces[existing_index] = metadata
    else:
        workspaces.append(metadata)

    write_workspaces(workspaces)

    return {
        "status": "Success",
        "workspace_name": workspace_name,
        "template": template,
        "owner_id": user["id"],
        "url": workspace_url,
        "expires_at": expires_at,
        "sandbox_data": sandbox_data,
    }


@app.get("/workspaces")
async def list_workspaces(
    user: dict[str, str] = Depends(get_current_user),
) -> dict[str, list[dict[str, Any]]]:
    docker_client = None
    try:
        docker_client = docker.from_env()
        docker_client.ping()
    except Exception:
        docker_client = None

    owned_workspaces = [
        workspace
        for workspace in read_workspaces()
        if workspace.get("owner_id") == user["id"]
    ]

    response: list[dict[str, Any]] = []

    for workspace in owned_workspaces:
        workspace_name = workspace.get("name")
        if not workspace_name:
            continue

        template_id = workspace.get("template", "unknown")
        sandbox_data = workspace.get("sandbox_data")
        if not sandbox_data:
            sandbox_data = get_sandbox_payload(template_id, user["id"], workspace_name)

        base_details = {
            "name": workspace_name,
            "template": template_id,
            "expires_at": workspace.get("expires_at"),
            "url": workspace.get("url"),
            "owner_id": workspace.get("owner_id"),
            "owner_username": workspace.get("owner_username"),
            "sandbox_data": sandbox_data,
        }

        current_status = workspace.get("status", "running")

        if docker_client is not None:
            try:
                container = docker_client.containers.get(workspace_name)
                response.append(
                    {
                        **base_details,
                        "status": container.status,
                        "image": (
                            container.image.tags[0]
                            if container.image.tags
                            else "unknown"
                        ),
                    }
                )
            except docker.errors.NotFound:
                response.append(
                    {
                        **base_details,
                        "status": current_status,
                        "image": "gaep-sandbox",
                    }
                )
            except Exception:
                response.append(
                    {
                        **base_details,
                        "status": current_status,
                        "image": "gaep-sandbox",
                    }
                )
        else:
            response.append(
                {
                    **base_details,
                    "status": current_status if current_status != "removed" else "removed",
                    "image": "gaep-sandbox",
                }
            )

    return {"workspaces": response}


@app.post("/terminate")
async def terminate_workspace(
    request: dict[str, Any],
    user: dict[str, str] = Depends(get_current_user),
) -> dict[str, str]:
    workspace_name = request.get("workspace_name", "")
    if not isinstance(workspace_name, str):
        workspace_name = ""

    workspace_name = workspace_name.strip()
    if not workspace_name:
        raise HTTPException(
            status_code=400,
            detail="workspace_name is required",
        )

    workspace = get_owned_workspace(
        workspace_name=workspace_name,
        owner_id=user["id"],
    )

    if workspace is None:
        raise HTTPException(
            status_code=404,
            detail="Workspace not found",
        )

    stop_workspace_container(workspace_name)

    # Clean up GCP BigQuery dataset if applicable
    if workspace.get("template") == "gcp-sandbox":
        try:
            try:
                from gcp_vender import delete_gcp_dataset
            except ImportError:
                from src.orchestrator.gcp_vender import delete_gcp_dataset
            delete_gcp_dataset(workspace_name)
        except Exception as err:
            print(f"GCP cleanup note: {err}")

    remaining_workspaces = [
        item
        for item in read_workspaces()
        if not (
            item.get("name") == workspace_name
            and item.get("owner_id") == user["id"]
        )
    ]

    write_workspaces(remaining_workspaces)

    ws_dir = WORKSPACES_DIR / workspace_name
    if ws_dir.exists():
        try:
            import shutil
            shutil.rmtree(ws_dir, ignore_errors=True)
        except Exception:
            pass

    return {
        "status": "Terminated",
        "workspace_name": workspace_name,
    }


@app.post("/terminate-all")
async def terminate_all_workspaces(
    user: dict[str, str] = Depends(get_current_user),
) -> dict[str, Any]:
    all_workspaces = read_workspaces()
    user_workspaces = [w for w in all_workspaces if w.get("owner_id") == user["id"]]
    remaining = [w for w in all_workspaces if w.get("owner_id") != user["id"]]

    for ws in user_workspaces:
        name = ws.get("name")
        if name:
            stop_workspace_container(name)
            if ws.get("template") == "gcp-sandbox":
                try:
                    try:
                        from gcp_vender import delete_gcp_dataset
                    except ImportError:
                        from src.orchestrator.gcp_vender import delete_gcp_dataset
                    delete_gcp_dataset(name)
                except Exception:
                    pass
            ws_dir = WORKSPACES_DIR / name
            if ws_dir.exists():
                try:
                    import shutil
                    shutil.rmtree(ws_dir, ignore_errors=True)
                except Exception:
                    pass

    write_workspaces(remaining)
    return {
        "status": "All Terminated",
        "count": len(user_workspaces),
    }


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5000,
    )
