from __future__ import annotations

import json
import urllib.request
import urllib.error
from pathlib import Path
from typing import Any

from google.oauth2 import service_account
from google.auth.transport.requests import Request


def get_master_key_path() -> Path | None:
    root_dir = Path(__file__).resolve().parent.parent.parent
    for f in root_dir.glob("*.json"):
        if "gaep" in f.name or "prototype" in f.name or "gcp" in f.name:
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                if data.get("type") == "service_account" and data.get("project_id"):
                    return f
            except Exception:
                pass
    return None


def get_gcp_credentials() -> tuple[service_account.Credentials | None, str | None]:
    key_path = get_master_key_path()
    if not key_path:
        return None, None
    try:
        creds = service_account.Credentials.from_service_account_file(
            str(key_path),
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        creds.refresh(Request())
        return creds, creds.project_id
    except Exception as err:
        print(f"Failed to authenticate master GCP key: {err}")
        return None, None


def sanitize_dataset_id(workspace_name: str) -> str:
    cleaned = workspace_name.replace("-", "_").lower()
    return f"boeing_gaep_{cleaned}"[:1024]


def provision_gcp_dataset(workspace_name: str) -> str | None:
    creds, project_id = get_gcp_credentials()
    if not creds or not project_id:
        return None

    dataset_id = sanitize_dataset_id(workspace_name)
    url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{project_id}/datasets"
    payload = {
        "datasetReference": {"datasetId": dataset_id, "projectId": project_id},
        "friendlyName": f"Boeing 787 Telemetry Sandbox ({workspace_name})",
        "location": "US",
        "description": "Ephemeral GAEP sandbox dataset pre-seeded for Boeing avionics analysis.",
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {creds.token}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"Created BigQuery dataset: {data.get('id')}")
            return dataset_id
    except urllib.error.HTTPError as err:
        if err.code == 409:
            print(f"BigQuery dataset {dataset_id} already exists.")
            return dataset_id
        print(f"BigQuery dataset create error: {err.code} {err.read().decode('utf-8')}")
        return None
    except Exception as e:
        print(f"BigQuery dataset error: {e}")
        return None


def delete_gcp_dataset(workspace_name: str) -> bool:
    creds, project_id = get_gcp_credentials()
    if not creds or not project_id:
        return False

    dataset_id = sanitize_dataset_id(workspace_name)
    url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{project_id}/datasets/{dataset_id}?deleteContents=true"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {creds.token}"},
        method="DELETE",
    )

    try:
        with urllib.request.urlopen(req) as _:
            print(f"Deleted BigQuery dataset: {dataset_id}")
            return True
    except Exception as e:
        print(f"BigQuery dataset delete note: {e}")
        return False
