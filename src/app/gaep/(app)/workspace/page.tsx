"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { parseWorkspaceQuery } from "@/gaep/workspaceContext";
import { getTemplateById } from "@/gaep/data/templates";
import {
  getStarter,
  RUNNING_SERVICES,
  REUSABLE_ASSETS,
} from "@/gaep/data/content";
import { ROUTES } from "@/gaep/navigation";
import {
  getCurrentUser,
  listWorkspaces,
  terminateWorkspace,
  type Workspace,
} from "@/platform/api";

function formatExpiry(expiresAt: number): string {
  const secondsRemaining = Math.max(
    0,
    Math.floor(expiresAt - Date.now() / 1000),
  );

  const hoursRemaining = Math.floor(secondsRemaining / 3600);

  if (hoursRemaining >= 24) {
    return `${Math.floor(hoursRemaining / 24)} days`;
  }

  if (hoursRemaining > 0) {
    return `${hoursRemaining} hours`;
  }

  return `${Math.max(1, Math.floor(secondsRemaining / 60))} minutes`;
}

function WorkspaceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminating, setTerminating] = useState<string | null>(null);

  const selectedWorkspaceName = searchParams.get("workspace_name");
  const queryUrl = searchParams.get("url");

  const selection = useMemo(
    () => parseWorkspaceQuery(searchParams.toString()),
    [searchParams],
  );

  const loadWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await getCurrentUser();

      if (!user) {
        router.push(`${ROUTES.login}?redirect=${encodeURIComponent(ROUTES.workspace)}`);
        return;
      }

      const userWorkspaces = await listWorkspaces();
      setWorkspaces(Array.isArray(userWorkspaces) ? userWorkspaces : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load your workspaces.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  const selectedWorkspace = useMemo(() => {
    if (selectedWorkspaceName) {
      const found = workspaces.find((w) => w.name === selectedWorkspaceName);
      if (found) return found;
    }

    if (queryUrl) {
      const found = workspaces.find((w) => w.url === queryUrl);
      if (found) return found;
    }

    if (selection.template) {
      const found = workspaces.find((w) => w.template === selection.template);
      if (found) return found;
    }

    return workspaces[0] ?? null;
  }, [workspaces, selectedWorkspaceName, queryUrl, selection.template]);

  const workspaceUrl = selectedWorkspace?.url ?? queryUrl ?? null;

  const templateId =
    selectedWorkspace?.template ?? selection.template ?? "aiml";

  const template =
    getTemplateById(templateId) ?? getTemplateById("aiml")!;

  const starter = getStarter(template.id);
  const selectedDataset = selection.dataset ?? "Parts catalog & specifications";

  const expiryText = selectedWorkspace?.expires_at
    ? `expires in ${formatExpiry(selectedWorkspace.expires_at)}`
    : `expires in ${selection.ttl ?? "1 day"}`;

  const subtitle = [
    template.name,
    selectedDataset,
    expiryText,
  ].join(" · ");

  function selectWorkspace(workspace: Workspace) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("workspace_name", workspace.name);
    if (workspace.url) {
      params.set("url", workspace.url);
    }
    if (workspace.template) {
      params.set("template", workspace.template);
    }
    router.push(`${ROUTES.workspace}?${params.toString()}`);
  }

  async function handleTerminate(workspaceName: string) {
    const confirmed = window.confirm(
      `Stop and terminate workspace "${workspaceName}"?`,
    );
    if (!confirmed) return;

    try {
      setTerminating(workspaceName);
      await terminateWorkspace(workspaceName);
      await loadWorkspaces();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Unable to terminate workspace.",
      );
    } finally {
      setTerminating(null);
    }
  }

  if (loading) {
    return (
      <div className="fade">
        <h2 className="section-title">Loading your workspaces…</h2>
        <p className="section-sub">Retrieving active environments tied to your account.</p>
      </div>
    );
  }

  return (
    <div className="fade">
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 className="section-title">
            {selectedWorkspace
              ? "Your workspace is live 🎉"
              : "Workspace Workbench"}
          </h2>
          <p className="section-sub">{subtitle}</p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {selectedWorkspace && (
            <span className="pill">
              ● {selectedWorkspace.status}
            </span>
          )}

          {workspaceUrl && selectedWorkspace?.status !== "removed" && (
            <a
              className="btn"
              href={workspaceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Launch in New Tab ↗
            </a>
          )}

          <Link className="btn purple" href={ROUTES.graduate}>
            Graduate to production →
          </Link>

          <Link className="btn ghost" href={ROUTES.catalog}>
            Provision new →
          </Link>
        </div>
      </div>

      {error && (
        <div className="note" style={{ marginBottom: 24, borderColor: "rgba(238,136,136,.3)" }}>
          <div className="emoji">⚠️</div>
          <p style={{ margin: 0 }}>
            {error}{" "}
            <button
              type="button"
              className="btn ghost"
              style={{ padding: "4px 10px", fontSize: 12, marginLeft: 12 }}
              onClick={() => void loadWorkspaces()}
            >
              Retry
            </button>
          </p>
        </div>
      )}

      {/* Workspaces Selector List */}
      {workspaces.length > 0 && (
        <>
          <div className="grid" style={{ marginBottom: 24 }}>
            {workspaces.map((workspace) => {
              const selected = selectedWorkspace?.name === workspace.name;
              return (
                <div
                  key={workspace.name}
                  className={`card click`}
                  onClick={() => selectWorkspace(workspace)}
                  style={{
                    borderColor: selected ? "var(--teal)" : undefined,
                  }}
                >
                  {selected && <div className="tag-top">Selected</div>}
                  <div className="icon">📦</div>
                  <h3>{workspace.name}</h3>
                  <p className="muted">
                    {workspace.template} &middot; {workspace.status}
                  </p>
                  {workspace.url && (
                    <p className="muted" style={{ fontSize: 12, marginTop: 6, wordBreak: "break-all" }}>
                      {workspace.url}
                    </p>
                  )}
                  <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="pill">● {workspace.status}</span>
                    <button
                      type="button"
                      className="btn ghost"
                      style={{ padding: "4px 10px", fontSize: 11, marginLeft: "auto" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleTerminate(workspace.name);
                      }}
                      disabled={terminating === workspace.name}
                    >
                      {terminating === workspace.name ? "Stopping…" : "Terminate"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="divider" style={{ marginBottom: 24 }} />
        </>
      )}

      {/* Main Two-Column Workspace Layout defined in gaep.css */}
      <div className="ws">
        {/* Left Sidebar */}
        <aside className="ws-side">
          <h4>Curated Dataset</h4>
          <div className="item">{selectedDataset}</div>

          <h4>Active Template</h4>
          <div className="item">{template.name}</div>

          <h4>Status</h4>
          <div className="item">
            ● {selectedWorkspace?.status ?? "preview mode"}
          </div>

          <h4>Running Services</h4>
          {RUNNING_SERVICES.map((service) => (
            <div key={service} className="item">
              ● {service}
            </div>
          ))}

          <h4>Reusable Assets</h4>
          {REUSABLE_ASSETS.map((asset) => (
            <div key={asset.id} className="item">
              📄 {asset.name}
            </div>
          ))}

          <h4>Actions</h4>
          <div className="item">
            <Link href={ROUTES.graduate} className="muted" style={{ textDecoration: "none" }}>
              Graduate model →
            </Link>
          </div>
          <div className="item">
            <Link href={ROUTES.catalog} className="muted" style={{ textDecoration: "none" }}>
              Browse catalog →
            </Link>
          </div>
          {selectedWorkspace && (
            <div className="item">
              <a
                role="button"
                tabIndex={0}
                className="trad"
                style={{ cursor: "pointer", fontSize: 13 }}
                onClick={() => void handleTerminate(selectedWorkspace.name)}
              >
                Terminate workspace ✕
              </a>
            </div>
          )}
        </aside>

        {/* Right Main Area */}
        <div className="ws-main">
          {/* Guided Starter */}
          <div className="quick">
            <h3>{starter.title}</h3>
            <ol>
              {starter.steps.map((step, index) => (
                <li key={index}>
                  <b>{step.title}</b> — {step.detail}
                </li>
              ))}
            </ol>
          </div>

          {/* Workbench / Notebook Container */}
          <div className="nb">
            <div className="nb-bar">
              <div>● ● ● {starter.title}.ipynb</div>
              <span className="pill">
                ● {selectedWorkspace?.status ?? "preview"}
              </span>
            </div>

            {workspaceUrl &&
            selectedWorkspace?.status !== "removed" &&
            selectedWorkspace?.status !== "offline" ? (
              <iframe
                src={workspaceUrl}
                width="100%"
                height="640px"
                title="Interactive workspace"
                style={{ border: 0, display: "block", background: "#0a1a2b" }}
              />
            ) : (
              <div>
                <div className="cell">
                  <div className="clbl">In [1]:</div>
                  <pre>
                    {`import gaep.curated as curated\n\n# Mount curated dataset into Pandas DataFrame\ndf = curated.load("${selectedDataset}")\ndf.head()`}
                  </pre>
                </div>

                <div className="cell">
                  <div className="clbl">Out [1]:</div>
                  <pre className="out">
                    {`✓ Dataset mounted successfully (148,200 rows, 14 columns)\n   part_number   spec_rev   facility   demand_qty   status\n0  PN-88219-A    REV-04     BLR-01     1,420        ALLOCATED\n1  PN-44012-C    REV-02     SEA-03     850          ACTIVE\n2  PN-10928-F    REV-09     BLR-02     3,100        DISPATCHED`}
                  </pre>
                </div>

                <div className="cell">
                  <div className="clbl">In [2]:</div>
                  <pre>
                    {`# Train prototype model\nfrom sklearn.ensemble import GradientBoostingRegressor\nmodel = GradientBoostingRegressor()\nmodel.fit(X_train, y_train)\nprint(f"MAPE: {calculate_mape(model):.1%}")`}
                  </pre>
                </div>

                <div className="cell">
                  <div className="clbl">Out [2]:</div>
                  <pre className="out">
                    {`MAPE: 6.8% (Beats current production baseline 11.2% by 4.4 points)\nModel ready to graduate to production pipeline.`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="wrap">
          Loading…
        </div>
      }
    >
      <WorkspaceInner />
    </Suspense>
  );
}