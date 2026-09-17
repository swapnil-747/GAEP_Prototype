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
except ImportError:
    from src.orchestrator.auth import (
        AUTH_COOKIE_NAME,
        create_access_token,
        create_user,
        get_current_user,
        verify_credentials,
    )


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

    # Automatically discover workspaces from WORKSPACES_DIR that contain meta.json
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

    temporary_file = WORKSPACES_FILE.with_suffix(
        ".tmp",
    )

    temporary_file.write_text(
        json.dumps(
            deduped,
            indent=2,
        ),
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

    return mapping.get(
        ttl_label,
        mapping["1 hour"],
    )


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


def build_workspace_name(user_id: str) -> str:
    return (
        f"poc-{user_id[:8]}-"
        f"{uuid.uuid4().hex[:8]}"
    )


def build_workspace_url(mapped_port: str) -> str:
    return f"http://localhost:{mapped_port}"


def get_workspace_compose_file(
    workspace_name: str,
) -> Path:
    return (
        WORKSPACES_DIR
        / workspace_name
        / "docker-compose.yml"
    )


def stop_workspace_container(
    workspace_name: str,
) -> None:
    compose_file = get_workspace_compose_file(
        workspace_name,
    )

    if not compose_file.exists():
        return

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
    )


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

            print(
                f"Expiring workspace: {workspace_name}",
            )

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

    user = create_user(
        username,
        password,
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

    user = verify_credentials(
        username,
        password,
    )

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
        content={
            "status": "Logged out",
        }
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
    user: dict[str, str] = Depends(
        get_current_user,
    ),
) -> dict[str, str]:
    return user


@app.post("/provision")
async def provision_workspace(
    request: dict[str, Any],
    user: dict[str, str] = Depends(
        get_current_user,
    ),
) -> dict[str, Any]:
    template = request.get(
        "template",
        "nginx",
    )

    ttl_label = request.get(
        "ttl",
        "1 hour",
    )

    if not isinstance(template, str):
        template = "nginx"

    if not isinstance(ttl_label, str):
        ttl_label = "1 hour"

    templates: dict[str, dict[str, str]] = {
        "nginx": {
            "image": "nginx:alpine",
            "port": "80",
        },
        "datascience": {
            "image": (
                "jupyter/"
                "datascience-notebook:latest"
            ),
            "port": "8888",
        },
        "workbench": {
            "image": (
                "dorowu/"
                "ubuntu-desktop-lxde-vnc:latest"
            ),
            "port": "80",
        },
    }

    config = templates.get(template)

    if config is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown template: {template}",
        )

    workspace_name = build_workspace_name(
        user["id"],
    )

    workspace_path = (
        WORKSPACES_DIR / workspace_name
    )

    workspace_path.mkdir(
        parents=True,
        exist_ok=True,
    )

    compose_content = f"""services:
  workspace:
    image: {config["image"]}
    container_name: {workspace_name}
    ports:
      - "{config["port"]}"
"""

    if template == "datascience":
        compose_content += (
            "    command: "
            "\"start-notebook.sh "
            "--NotebookApp.token='' "
            "--NotebookApp.password='' "
            "--NotebookApp.ip=0.0.0.0 "
            "--NotebookApp.allow_origin='*' "
            "--NotebookApp.disable_check_xsrf=True\"\n"
        )

    if template == "workbench":
        compose_content += (
            "    environment:\n"
            "      - RESOLUTION=1920x1080\n"
        )

    compose_file = (
        workspace_path / "docker-compose.yml"
    )

    compose_file.write_text(
        compose_content,
        encoding="utf-8",
    )

    ttl_seconds = get_ttl_seconds(
        ttl_label,
    )

    created_at = time.time()
    expires_at = created_at + ttl_seconds

    metadata: dict[str, Any] = {
        "name": workspace_name,
        "owner_id": user["id"],
        "owner_username": user["username"],
        "template": template,
        "ttl_label": ttl_label,
        "created_at": created_at,
        "expires_at": expires_at,
        "url": None,
    }

    metadata_file = workspace_path / "meta.json"

    metadata_file.write_text(
        json.dumps(
            metadata,
            indent=2,
        ),
        encoding="utf-8",
    )

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
        )
    except FileNotFoundError as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Docker was not found. "
                "Make sure Docker Desktop is running."
            ),
        ) from error
    except subprocess.CalledProcessError as error:
        stop_workspace_container(
            workspace_name,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                error.stderr
                or "Docker provisioning failed"
            ),
        ) from error

    result = subprocess.run(
        [
            "docker",
            "port",
            workspace_name,
            config["port"],
        ],
        capture_output=True,
        text=True,
    )

    if (
        result.returncode != 0
        or not result.stdout.strip()
    ):
        stop_workspace_container(
            workspace_name,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to determine mapped "
                "Docker port"
            ),
        )

    mapped_port = (
        result.stdout.strip()
        .split(":")[-1]
        .strip()
    )

    workspace_url = build_workspace_url(
        mapped_port,
    )

    metadata["url"] = workspace_url

    metadata_file.write_text(
        json.dumps(
            metadata,
            indent=2,
        ),
        encoding="utf-8",
    )

    workspaces = read_workspaces()
    existing_index = next(
        (
            i
            for i, ws in enumerate(workspaces)
            if ws.get("name") == workspace_name
        ),
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
    }


@app.get("/workspaces")
async def list_workspaces(
    user: dict[str, str] = Depends(
        get_current_user,
    ),
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

        base_details = {
            "name": workspace_name,
            "template": workspace.get(
                "template",
                "unknown",
            ),
            "expires_at": workspace.get(
                "expires_at",
            ),
            "url": workspace.get("url"),
            "owner_id": workspace.get(
                "owner_id",
            ),
            "owner_username": workspace.get(
                "owner_username",
            ),
        }

        if docker_client is not None:
            try:
                container = docker_client.containers.get(
                    workspace_name,
                )

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
                        "status": "removed",
                        "image": "unknown",
                    }
                )
            except Exception:
                response.append(
                    {
                        **base_details,
                        "status": "unknown",
                        "image": "unknown",
                    }
                )
        else:
            response.append(
                {
                    **base_details,
                    "status": "offline",
                    "image": "unknown",
                }
            )

    return {
        "workspaces": response,
    }


@app.post("/terminate")
async def terminate_workspace(
    request: dict[str, Any],
    user: dict[str, str] = Depends(
        get_current_user,
    ),
) -> dict[str, str]:
    workspace_name = request.get(
        "workspace_name",
        "",
    )

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

    stop_workspace_container(
        workspace_name,
    )

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
        meta_file = ws_dir / "meta.json"
        if meta_file.exists():
            try:
                meta_file.unlink()
            except Exception:
                pass

    return {
        "status": "Terminated",
        "workspace_name": workspace_name,
    }


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5000,
    )