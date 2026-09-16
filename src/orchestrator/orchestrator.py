from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import os
import uvicorn
import asyncio
import time
import json


app = FastAPI()

# THIS IS CRITICAL: Allows Next.js (localhost:3000) to talk to FastAPI (localhost:5000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_ttl_seconds(ttl_label: str) -> int:
    mapping = {
        "4 hours": 4 * 3600, 
        "1 day": 24 * 3600,
        "1 week": 7 * 24 * 3600,
        "30 days": 30 * 24 * 3600,
        "1 min": 60 # Added for easy testing
    }
    
    return mapping.get(ttl_label, 3600) # Default to 1 hour if not found

# 1. Background Task: Check for Expired Workspaces
async def ttl_cleanup_task():
    while True:
        await asyncio.sleep(60) # Run check every 10 secs
        if not os.path.exists("./workspaces"): continue
        
        for folder in os.listdir("./workspaces"):
            meta_path = f"./workspaces/{folder}/meta.json"
            if os.path.exists(meta_path):
                with open(meta_path, 'r') as f:
                    meta = json.load(f)
                    if time.time() > meta['expires_at']:
                        print(f"DEBUG: Expiring workspace {folder}")
                        subprocess.run(["docker", "compose", "-f", f"./workspaces/{folder}/docker-compose.yml", "down"], capture_output=True)


# 2. Add this to your FastAPI startup
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(ttl_cleanup_task())

@app.post("/terminate")
async def terminate_workspace(request: dict):
    workspace_name = request.get('workspace_name')
    path = f"./workspaces/{workspace_name}"
    if os.path.exists(f"{path}/docker-compose.yml"):
        subprocess.run(["docker", "compose", "-f", f"{path}/docker-compose.yml", "down"], capture_output=True)
    return {"status": "Terminated"}

@app.get("/workspaces")
async def list_workspaces():
    import docker
    client = docker.from_env()
    # List containers, filtering for our naming convention
    containers = client.containers.list(all=True)
    active_workspaces = [
        {"name": c.name, "status": c.status, "image": c.image.tags[0] if c.image.tags else "unknown"} 
        for c in containers if c.name.startswith("poc-")
    ]
    return {"workspaces": active_workspaces}

@app.post("/provision")
async def provision_workspace(request: dict):
    template = request.get('template', 'nginx')
    workspace_name = request.get('workspace_name', 'poc-123')
    ttl_label = request.get('ttl', '1 hour')
    path = f"./workspaces/{workspace_name}"
    os.makedirs(path, exist_ok=True)
    

    templates = {
        "nginx": {"image": "nginx:alpine", "port": "80"},
        "datascience": {"image": "jupyter/datascience-notebook:latest", "port": "8888"},
        "workbench": {"image": "dorowu/ubuntu-desktop-lxde-vnc:latest", "port": "80"}
    }
    
    config = templates.get(template, templates["nginx"])
    
    # REMOVED hardcoded 8081:
    compose_content = f"""
services:
  workspace:
    image: {config['image']}
    container_name: {workspace_name}
    ports:
      - "{config['port']}"
"""
    # Template-specific injections
    if template == "datascience":
        compose_content += '    command: "start-notebook.sh --NotebookApp.token=\'\' --NotebookApp.password=\'\' --NotebookApp.ip=0.0.0.0 --NotebookApp.allow_origin=\'*\' --NotebookApp.disable_check_xsrf=True"\n'
    
    if template == "workbench":
        # Force a professional resolution
        compose_content += '    environment:\n      - RESOLUTION=1920x1080\n'

    with open(f"{path}/docker-compose.yml", "w") as f:
        f.write(compose_content)
    
    # After generating compose_content:
    
    # Calculate expiry
    ttl_seconds = get_ttl_seconds(ttl_label)
    expires_at = time.time() + ttl_seconds
    
    # Write to meta.json
    with open(f"{path}/meta.json", "w") as f:
        json.dump({"expires_at": expires_at, "ttl_label": ttl_label}, f)
    
    subprocess.run(["docker", "compose", "-f", f"{path}/docker-compose.yml", "up", "-d"])
    
    # DYNAMIC PORT RETRIEVAL
    # Ask Docker which port it mapped to
    result = subprocess.run(
        ["docker", "port", workspace_name, str(config['port'])], 
        capture_output=True, text=True
    )
    # Output is usually "0.0.0.0:32768"
    mapped_port = result.stdout.strip().split(":")[-1]
    
    return {"status": "Success", "url": f"http://localhost:{mapped_port}"}

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=5000)