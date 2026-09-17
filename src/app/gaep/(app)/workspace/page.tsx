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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Interactive playground states
  const [activeSplunkFilter, setActiveSplunkFilter] = useState("all");
  const [testRunnerState, setTestRunnerState] = useState<"idle" | "running" | "done">("idle");
  const [esQueryInput, setEsQueryInput] = useState("GET /aircraft-parts-catalog/_search?q=hydraulic");
  const [esQueryResult, setEsQueryResult] = useState<string | null>(null);
  const [cloudUploadedFiles, setCloudUploadedFiles] = useState<string[]>([
    "telemetry-2026-09-17-787.parquet",
    "hydraulics_baseline_v2.json",
  ]);

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

  const templateId =
    selectedWorkspace?.template ?? selection.template ?? "datascience";

  const template =
    getTemplateById(templateId) ?? getTemplateById("datascience")!;

  const starter = getStarter(template.id);
  const selectedDataset = selection.dataset ?? "Parts catalog & specifications";
  const workspaceUrl = selectedWorkspace?.url ?? queryUrl ?? "http://localhost:3000";
  const sandboxData = selectedWorkspace?.sandbox_data ?? {};

  const expiryText = selectedWorkspace?.expires_at
    ? `expires in ${formatExpiry(selectedWorkspace.expires_at)}`
    : `expires in ${selection.ttl ?? "4 hours"}`;

  const subtitle = [
    template.name,
    selectedDataset,
    expiryText,
  ].join(" · ");

  function selectWorkspace(workspace: Workspace) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("workspace_name", workspace.name);
    if (workspace.url) params.set("url", workspace.url);
    if (workspace.template) params.set("template", workspace.template);
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
      router.push(ROUTES.workspace);
    } catch (termError) {
      setError(
        termError instanceof Error
          ? termError.message
          : "Failed to terminate workspace.",
      );
    } finally {
      setTerminating(null);
    }
  }

  function copyToClipboard(text: string, keyName: string) {
    void navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function handleRunEsSearch() {
    setEsQueryResult(
      JSON.stringify(
        {
          took: 4,
          timed_out: false,
          hits: {
            total: { value: 12, relation: "eq" },
            hits: [
              {
                _index: "aircraft-parts-catalog",
                _id: "PN-88219-A",
                _score: 2.84,
                _source: {
                  part_number: "PN-88219-A",
                  description: "High-Pressure Hydraulic Actuator Valve (Boeing 787)",
                  facility: "BLR-01 (India Tech Center)",
                  inventory_status: "ALLOCATED",
                  certification: "FAA Form 8130-3",
                },
              },
              {
                _index: "aircraft-parts-catalog",
                _id: "PN-44012-C",
                _score: 2.15,
                _source: {
                  part_number: "PN-44012-C",
                  description: "Hydraulic Return Line Filter Element",
                  facility: "SEA-03 (Seattle Delivery Center)",
                  inventory_status: "ACTIVE",
                  certification: "EASA Form 1",
                },
              },
            ],
          },
        },
        null,
        2,
      ),
    );
  }

  function handleTriggerPlaywright() {
    setTestRunnerState("running");
    setTimeout(() => {
      setTestRunnerState("done");
    }, 1200);
  }

  return (
    <div className="fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 className="section-title">
            {selectedWorkspace?.name ?? template.name}
          </h2>
          <p className="section-sub">{subtitle}</p>
        </div>

        {selectedWorkspace && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="pill">
              ● {selectedWorkspace.status}
            </span>
            <button
              type="button"
              className="btn ghost"
              style={{ padding: "8px 14px", fontSize: 13 }}
              onClick={() => void handleTerminate(selectedWorkspace.name)}
              disabled={terminating === selectedWorkspace.name}
            >
              {terminating === selectedWorkspace.name ? "Stopping…" : "Terminate"}
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ margin: "20px 0", color: "var(--muted)" }}>
          Refreshing workspaces…
        </div>
      )}

      {error && (
        <div className="note" style={{ margin: "16px 0", borderColor: "#e88" }}>
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

      {/* Active Workspaces Switcher */}
      {workspaces.length > 0 && (
        <div className="grid" style={{ marginBottom: 24 }}>
          {workspaces.map((ws) => {
            const isSelected = selectedWorkspace?.name === ws.name;
            return (
              <div
                key={ws.name}
                className={`card click`}
                onClick={() => selectWorkspace(ws)}
                style={{
                  borderColor: isSelected ? "var(--teal)" : undefined,
                }}
              >
                {isSelected && <div className="tag-top">Active View</div>}
                <div className="icon">
                  {getTemplateById(ws.template)?.icon ?? "📦"}
                </div>
                <h3>{ws.name}</h3>
                <p className="muted">
                  {getTemplateById(ws.template)?.name ?? ws.template} &middot; {ws.status}
                </p>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="pill" style={{ fontSize: 11 }}>● {ws.status}</span>
                  <a
                    href={ws.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="gaepc"
                    style={{ fontSize: 12, textDecoration: "none" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open Tab ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="ws">
        {/* Left Navigation & Metadata Sidebar */}
        <aside className="ws-side">
          <h4>Template Type</h4>
          <div className="item">{template.icon} {template.name}</div>

          <h4>Curated Dataset</h4>
          <div className="item">📁 {selectedDataset}</div>

          <h4>Lifecycle TTL</h4>
          <div className="item">⏳ {expiryText}</div>

          <h4>Running Services</h4>
          {RUNNING_SERVICES.slice(0, 3).map((service) => (
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

          <h4>Quick Links</h4>
          <div className="item">
            <Link href={ROUTES.catalog} className="muted" style={{ textDecoration: "none" }}>
              + Add another tool →
            </Link>
          </div>
          <div className="item">
            <Link href={ROUTES.dashboard} className="muted" style={{ textDecoration: "none" }}>
              View all workspaces →
            </Link>
          </div>
        </aside>

        {/* Right Main Specialized Control Center */}
        <div className="ws-main">
          {/* Top Launch Banner */}
          <div className="launch-banner">
            <div>
              <div className="title">
                {template.icon} {template.name} Environment
              </div>
              <div className="sub">
                Target URL: <code style={{ color: "var(--teal)" }}>{workspaceUrl}</code>
              </div>
            </div>
            <a
              href={workspaceUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-action"
            >
              Launch in New Tab ↗
            </a>
          </div>

          {/* 1. AWS / Azure / GCP Cloud Sandbox Hub */}
          {(template.id === "aws-sandbox" || template.id === "azure-sandbox" || template.id === "gcp-sandbox") && (
            <div className="nb" style={{ padding: 24 }}>
              <div className="guardrail-card">
                <div>
                  <h4 style={{ margin: "0 0 6px 0", color: "var(--teal)" }}>
                    🛡️ Enterprise Cloud Governance Active
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                    Protected sandbox with automated budget enforcement and IAM least-privilege policies.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span className="guardrail-pill">💰 Budget Cap: $50.00</span>
                  <span className="guardrail-pill">⚡ Spend: $0.00</span>
                  <span className="guardrail-pill">⏳ Auto-kill in 4h</span>
                </div>
              </div>

              {/* AWS Ephemeral Credentials */}
              {template.id === "aws-sandbox" && (
                <div>
                  <h4 style={{ color: "#fff", marginBottom: 12 }}>🔑 Temporary AWS STS Credentials</h4>
                  <div className="cred-box">
                    <button
                      className="copy-btn"
                      type="button"
                      onClick={() => copyToClipboard(sandboxData.cloud_credentials?.cli_config ?? "", "aws")}
                    >
                      {copiedKey === "aws" ? "Copied ✓" : "Copy CLI Config"}
                    </button>
                    <div><b>Account ID:</b> {sandboxData.cloud_credentials?.account_id ?? "184920491823"} (GovCloud-Sandbox)</div>
                    <div><b>IAM Role:</b> {sandboxData.cloud_credentials?.role_arn ?? "arn:aws:iam::184920491823:role/GAEP-Sandbox-Role"}</div>
                    <div><b>AWS_ACCESS_KEY_ID:</b> {sandboxData.cloud_credentials?.access_key_id ?? "AKIAIOSFODNN7EXAMPLE"}</div>
                    <div><b>AWS_SECRET_ACCESS_KEY:</b> {sandboxData.cloud_credentials?.secret_access_key ?? "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"}</div>
                    <div><b>AWS_SESSION_TOKEN:</b> {sandboxData.cloud_credentials?.session_token?.slice(0, 32) ?? "AQoDYXdzEEoa8..."}…</div>
                    <div><b>Region:</b> {sandboxData.cloud_credentials?.region ?? "us-west-2"}</div>
                  </div>

                  {/* S3 Storage Playground */}
                  <div style={{ marginTop: 20 }}>
                    <h4 style={{ color: "#fff", marginBottom: 10 }}>📦 Interactive S3 Bucket Playground</h4>
                    <div style={{ background: "#06111d", border: "1px solid var(--line)", borderRadius: 10, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <span className="muted" style={{ fontSize: 13 }}>Bucket: <b>s3://boeing-flightops-telemetry-uswest2/</b></span>
                        <button
                          type="button"
                          className="btn ghost"
                          style={{ padding: "4px 12px", fontSize: 12 }}
                          onClick={() => setCloudUploadedFiles((prev) => [...prev, `flight-log-manual-${Date.now().toString().slice(-4)}.json`])}
                        >
                          + Upload Test Telemetry Object
                        </button>
                      </div>
                      <table className="telemetry-feed">
                        <thead>
                          <tr>
                            <th>Object Key</th>
                            <th>Status</th>
                            <th>Encryption</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cloudUploadedFiles.map((file) => (
                            <tr key={file}>
                              <td>{file}</td>
                              <td><span className="pill" style={{ fontSize: 11 }}>● Encrypted</span></td>
                              <td className="muted">AES-256 (KMS)</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Azure Subscription Sandbox */}
              {template.id === "azure-sandbox" && (
                <div>
                  <h4 style={{ color: "#fff", marginBottom: 12 }}>🔑 Azure Service Principal & Subscription</h4>
                  <div className="cred-box">
                    <button
                      className="copy-btn"
                      type="button"
                      onClick={() => copyToClipboard(sandboxData.cloud_credentials?.cli_config ?? "", "azure")}
                    >
                      {copiedKey === "azure" ? "Copied ✓" : "Copy Az CLI Login"}
                    </button>
                    <div><b>Subscription:</b> {sandboxData.cloud_credentials?.subscription_id ?? "9a8b7c6d-e5f4-4321-abcd-0987654321fe"}</div>
                    <div><b>Tenant ID:</b> {sandboxData.cloud_credentials?.tenant_id ?? "3b4a5c6d-7e8f-9012-3456-7890abcdef12"}</div>
                    <div><b>Client ID:</b> {sandboxData.cloud_credentials?.client_id ?? "01234567-89ab-cdef-0123-456789abcdef"}</div>
                    <div><b>Client Secret:</b> {sandboxData.cloud_credentials?.client_secret ?? "~GAEP_secret_key"}</div>
                    <div><b>Resource Group:</b> {sandboxData.cloud_credentials?.resource_group ?? "rg-gaep-sandbox-dev"}</div>
                    <div><b>Location:</b> centralus</div>
                  </div>
                </div>
              )}

              {/* GCP Project Sandbox */}
              {template.id === "gcp-sandbox" && (
                <div>
                  <h4 style={{ color: "#fff", marginBottom: 12 }}>🔑 Google Cloud Service Account</h4>
                  <div className="cred-box">
                    <button
                      className="copy-btn"
                      type="button"
                      onClick={() => copyToClipboard(sandboxData.cloud_credentials?.cli_config ?? "", "gcp")}
                    >
                      {copiedKey === "gcp" ? "Copied ✓" : "Copy gcloud Auth"}
                    </button>
                    <div><b>Project ID:</b> {sandboxData.cloud_credentials?.project_id ?? "boeing-gaep-sandbox-dev"}</div>
                    <div><b>Service Account:</b> {sandboxData.cloud_credentials?.service_account ?? "sa-engineer@boeing-gaep-sandbox-dev.iam.gserviceaccount.com"}</div>
                    <div><b>Region:</b> us-central1</div>
                    <div><b>BigQuery Sandbox:</b> Enabled (1TB query quota)</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Observability Hub (Kibana & Splunk) */}
          {(template.id === "splunk" || template.id === "kibana") && (
            <div className="nb" style={{ padding: 24 }}>
              {template.id === "splunk" && (
                <div className="guardrail-card" style={{ background: "rgba(255, 170, 0, 0.08)", borderColor: "var(--orange)", marginBottom: 16 }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", color: "var(--orange)" }}>
                      🔐 Splunk Enterprise Login Credentials
                    </h4>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      Username: <b style={{ color: "#fff" }}>admin</b> &nbsp;|&nbsp; Password: <b style={{ color: "#fff" }}>AdminPassword123!</b>
                    </p>
                  </div>
                  <button
                    className="btn ghost"
                    type="button"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                    onClick={() => copyToClipboard("AdminPassword123!", "splunk_pass")}
                  >
                    {copiedKey === "splunk_pass" ? "Copied ✓" : "Copy Password"}
                  </button>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h4 style={{ margin: 0, color: "var(--teal)" }}>
                    📡 Live Aerospace Telemetry Stream (Boeing 787 Fleet)
                  </h4>
                  <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                    Indexed real-time sensor streams parsed from aircraft FDR (Flight Data Recorder).
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className={`btn ghost ${activeSplunkFilter === "all" ? "on" : ""}`}
                    style={{ padding: "4px 10px", fontSize: 12 }}
                    onClick={() => setActiveSplunkFilter("all")}
                  >
                    All Sensors
                  </button>
                  <button
                    type="button"
                    className={`btn ghost ${activeSplunkFilter === "anomalies" ? "on" : ""}`}
                    style={{ padding: "4px 10px", fontSize: 12 }}
                    onClick={() => setActiveSplunkFilter("anomalies")}
                  >
                    🚨 Anomalies Only
                  </button>
                </div>
              </div>

              <table className="telemetry-feed" style={{ background: "#06111d", borderRadius: 10 }}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Tail #</th>
                    <th>Subsystem</th>
                    <th>Metric Reading</th>
                    <th>Health Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(sandboxData.splunk_data?.telemetry_samples ?? [
                    { timestamp: "2026-09-17T11:40:12Z", tail_num: "N787BA", component: "hydraulics", pressure_psi: 3020, status: "OPTIMAL" },
                    { timestamp: "2026-09-17T11:40:14Z", tail_num: "N787BA", component: "hydraulics", pressure_psi: 2995, status: "OPTIMAL" },
                    { timestamp: "2026-09-17T11:40:16Z", tail_num: "VT-BOE", component: "vibration", frequency_hz: 482, status: "ELEVATED_ANOMALY" },
                    { timestamp: "2026-09-17T11:40:18Z", tail_num: "VT-BOE", component: "engine_egt", temp_celsius: 645, status: "OPTIMAL" },
                  ])
                    .filter((s: any) => (activeSplunkFilter === "anomalies" ? s.status.includes("ANOMALY") : true))
                    .map((sample: any, idx: number) => (
                      <tr key={idx}>
                        <td className="muted">{sample.timestamp}</td>
                        <td><b>{sample.tail_num}</b></td>
                        <td>{sample.component}</td>
                        <td>
                          {sample.pressure_psi ? `${sample.pressure_psi} PSI` : sample.frequency_hz ? `${sample.frequency_hz} Hz` : `${sample.temp_celsius} °C`}
                        </td>
                        <td>
                          <span
                            className="pill"
                            style={{
                              background: sample.status.includes("ANOMALY") ? "rgba(238,136,136,.15)" : undefined,
                              color: sample.status.includes("ANOMALY") ? "#e88" : undefined,
                              borderColor: sample.status.includes("ANOMALY") ? "#e88" : undefined,
                              fontSize: 11,
                            }}
                          >
                            ● {sample.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <div style={{ marginTop: 20 }}>
                <h5 style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: 11 }}>Saved Search Queries</h5>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {(sandboxData.splunk_data?.sample_queries ?? [
                    "index=avionics component=hydraulics | stats avg(pressure_psi) by aircraft_tail",
                    "index=vibration-sensors frequency_hz > 450 | table timestamp, tail_num, sensor_id",
                  ]).map((q: string, i: number) => (
                    <div key={i} className="cred-box" style={{ margin: 0, fontSize: 12, padding: "8px 12px" }}>
                      <code>{q}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. Elasticsearch Search Engine Console */}
          {template.id === "elasticsearch" && (
            <div className="nb" style={{ padding: 24 }}>
              <div className="guardrail-card" style={{ background: "rgba(78, 205, 196, 0.08)", borderColor: "var(--teal)", marginBottom: 16 }}>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", color: "var(--teal)" }}>
                    ℹ️ API-First Search Engine Backend (Port 9200)
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                    Elasticsearch is a REST API engine. Opening port 9200 directly in a browser outputs the cluster JSON (<code>&quot;You Know, for Search&quot;</code>). For visual telemetry dashboards, open <b>Kibana (port 5601)</b> or execute REST queries below.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h4 style={{ margin: 0, color: "var(--teal)" }}>
                    ⚡ Elasticsearch Cluster Inspector & REST Explorer
                  </h4>
                  <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                    Cluster: <b>boeing-gaep-search-cluster</b> &middot; Health: <span className="gaepc">Green (1 Node, 3 Indices)</span>
                  </p>
                </div>
                <span className="pill">148,200 Documents</span>
              </div>

              <div style={{ background: "#06111d", border: "1px solid var(--line)", borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <input
                    type="text"
                    value={esQueryInput}
                    onChange={(e) => setEsQueryInput(e.target.value)}
                    style={{ flex: 1, padding: "8px 12px", background: "#0a1a2b", border: "1px solid var(--line)", color: "#fff", borderRadius: 8, fontFamily: "monospace" }}
                  />
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: "8px 18px", fontSize: 13 }}
                    onClick={handleRunEsSearch}
                  >
                    Send Query
                  </button>
                </div>

                <pre style={{ margin: 0, maxHeight: 280 }}>
                  {esQueryResult ||
                    `// Click "Send Query" to execute REST search query against pre-seeded aerospace catalog
{
  "cluster_status": "green",
  "indices": ["aircraft-parts-catalog", "faa-airworthiness-directives", "maintenance-work-orders"]
}`}
                </pre>
              </div>
            </div>
          )}

          {/* 4. Playwright QA Automation Studio */}
          {template.id === "playwright" && (
            <div className="nb" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h4 style={{ margin: 0, color: "var(--teal)" }}>
                    🎭 Playwright End-to-End Test Suite Runner
                  </h4>
                  <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                    Framework: Playwright v1.44 (TypeScript) &middot; Target: GAEP Self-Service Portal & Flight Dispatch
                  </p>
                </div>
                <button
                  type="button"
                  className="btn"
                  style={{ padding: "8px 16px", fontSize: 13 }}
                  disabled={testRunnerState === "running"}
                  onClick={handleTriggerPlaywright}
                >
                  {testRunnerState === "running" ? "Running E2E Suite…" : "▶ Run Test Suite"}
                </button>
              </div>

              <div style={{ background: "#06111d", border: "1px solid var(--line)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13 }}>
                  <span><b>Test Files:</b> 3 specs</span>
                  <span className="gaepc">
                    {testRunnerState === "running"
                      ? "⏳ Executing chromium workers…"
                      : testRunnerState === "done"
                        ? "✓ 19 tests passed (1.2s)"
                        : "● Ready"}
                  </span>
                </div>
                <div className="geobar">
                  <span style={{ width: testRunnerState === "running" ? "65%" : "100%" }} />
                </div>
              </div>

              <h5 style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: 11, marginBottom: 8 }}>
                Sample Spec: <code>tests/telemetry-alert.spec.ts</code>
              </h5>
              <pre style={{ margin: 0, maxHeight: 220 }}>
{`import { test, expect } from '@playwright/test';

test('verify real-time hydraulic sensor telemetry alert', async ({ page }) => {
  await page.goto('http://localhost:3000/gaep/workspace');
  await expect(page.getByText('Hydraulic Sensor Telemetry')).toBeVisible();
  
  // Verify threshold warning trigger
  const pressureVal = await page.locator('.telemetry-metric').innerText();
  expect(parseInt(pressureVal)).toBeGreaterThan(2800);
});`}
              </pre>
            </div>
          )}

          {/* 5. Jira Agile & Sprint Board */}
          {template.id === "jira" && (
            <div className="nb" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: 0, color: "var(--teal)" }}>
                    📋 Jira Agile Board: Boeing 787 Avionics Modernization
                  </h4>
                  <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                    Active Sprint: <b>Sprint 42 - Hydraulic Telemetry & RAG Pipeline</b>
                  </p>
                </div>
                <span className="pill">Project Key: AVION</span>
              </div>

              <div className="kanban-grid">
                {(sandboxData.jira_data?.columns ?? [
                  {
                    title: "To Do",
                    tickets: [
                      { id: "AVION-112", title: "Benchmark API latency on edge gateway during turbulence events", priority: "Medium", assignee: "Swapnil P." },
                      { id: "AVION-114", title: "Integrate FAA Airworthiness directive embedding pipeline", priority: "High", assignee: "Unassigned" },
                    ],
                  },
                  {
                    title: "In Progress",
                    tickets: [
                      { id: "AVION-104", title: "Stream real-time hydraulic telemetry to cockpit warning display", priority: "Highest", assignee: "Lead Engineer" },
                      { id: "AVION-108", title: "Validate parts degradation baseline model", priority: "High", assignee: "Data Scientist" },
                    ],
                  },
                  {
                    title: "In Review",
                    tickets: [
                      { id: "AVION-105", title: "High-frequency vibration stream parser for flight data recorder", priority: "Medium", assignee: "Senior Dev" },
                    ],
                  },
                  {
                    title: "Done",
                    tickets: [
                      { id: "AVION-101", title: "Provision GAEP ephemeral test sandbox architecture", priority: "Highest", assignee: "Core Team" },
                      { id: "AVION-102", title: "Implement JWT session cookie authentication layer", priority: "High", assignee: "Core Team" },
                    ],
                  },
                ]).map((col: any) => (
                  <div key={col.title} className="kanban-col">
                    <h5>
                      <span>{col.title}</span>
                      <span className="muted">({col.tickets.length})</span>
                    </h5>
                    {col.tickets.map((t: any) => (
                      <div key={t.id} className="kanban-ticket">
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: "var(--teal)", fontWeight: 700 }}>{t.id}</span>
                          <span style={{ fontSize: 10, color: t.priority === "Highest" ? "#e88" : "var(--orange)" }}>
                            {t.priority}
                          </span>
                        </div>
                        <div style={{ marginBottom: 6 }}>{t.title}</div>
                        <div className="muted" style={{ fontSize: 11 }}>👤 {t.assignee}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Salesforce Customer 360 / Dev Org */}
          {template.id === "salesforce" && (
            <div className="nb" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h4 style={{ margin: 0, color: "var(--teal)" }}>
                    ☁️ Salesforce Developer Scratch Org (Aerospace Fleet Edition)
                  </h4>
                  <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                    Org ID: <b>00D5e000001aBCdEAM</b> &middot; Instance: <code>boeing-sandbox-dev-ed.salesforce.com</code>
                  </p>
                </div>
                <a
                  href={workspaceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn ghost"
                  style={{ padding: "6px 14px", fontSize: 13 }}
                >
                  Launch Lightning Experience ↗
                </a>
              </div>

              <h5 style={{ color: "#fff", marginBottom: 10 }}>Airline Fleet Accounts</h5>
              <table className="telemetry-feed" style={{ background: "#06111d", borderRadius: 10, marginBottom: 20 }}>
                <thead>
                  <tr>
                    <th>Account Name</th>
                    <th>Industry</th>
                    <th>Fleet Size</th>
                    <th>SLA Tier</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Air India TechOps Fleet</b></td>
                    <td>Aviation / Commercial</td>
                    <td>128 Aircraft</td>
                    <td><span className="pill" style={{ fontSize: 11 }}>● Platinum AOG</span></td>
                  </tr>
                  <tr>
                    <td><b>United Airlines Maintenance</b></td>
                    <td>Aviation / Commercial</td>
                    <td>340 Aircraft</td>
                    <td><span className="pill" style={{ fontSize: 11 }}>● Enterprise Gold</span></td>
                  </tr>
                  <tr>
                    <td><b>Singapore Airlines Engineering</b></td>
                    <td>Aviation / Commercial</td>
                    <td>96 Aircraft</td>
                    <td><span className="pill" style={{ fontSize: 11 }}>● 24/7 Priority</span></td>
                  </tr>
                </tbody>
              </table>

              <h5 style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: 11, marginBottom: 8 }}>
                REST API Integration Endpoint: <code>/services/data/v59.0/sobjects/Account</code>
              </h5>
              <div className="cred-box">
                <button
                  className="copy-btn"
                  type="button"
                  onClick={() => copyToClipboard('curl https://boeing-sandbox-dev-ed.salesforce.com/services/data/v59.0/sobjects/Account -H "Authorization: Bearer 00D5e000001aBCd..."', "sf")}
                >
                  {copiedKey === "sf" ? "Copied ✓" : "Copy cURL Request"}
                </button>
                <code>curl https://boeing-sandbox-dev-ed.salesforce.com/services/data/v59.0/sobjects/Account -H &quot;Authorization: Bearer 00D5e000001aBCd...&quot;</code>
              </div>
            </div>
          )}

          {/* 7. Jupyter Lab & Linux VNC / Default Notebook Studio */}
          {(template.id === "datascience" || template.id === "workbench" || template.id === "aiml" || template.id === "genai" || template.id === "stream" || template.id === "bi" || template.id === "db" || template.id === "data") && (
            <div className="nb">
              <div className="nb-bar">
                <div>● ● ● {starter.title}.ipynb</div>
                <span className="pill">
                  ● {selectedWorkspace?.status ?? "active"}
                </span>
              </div>

              <div>
                <div className="cell">
                  <div className="clbl">In [1]:</div>
                  <pre>
                    {`import gaep.curated as curated

# Mount curated dataset into Pandas DataFrame
df = curated.load("${selectedDataset}")
df.head()`}
                  </pre>
                </div>

                <div className="cell">
                  <div className="clbl">Out [1]:</div>
                  <pre className="out">
                    {`✓ Dataset mounted successfully (148,200 rows, 14 columns)
   part_number   spec_rev   facility   demand_qty   status
0  PN-88219-A    REV-04     BLR-01     1,420        ALLOCATED
1  PN-44012-C    REV-02     SEA-03     850          ACTIVE
2  PN-10928-F    REV-09     BLR-02     3,100        DISPATCHED`}
                  </pre>
                </div>

                <div className="cell">
                  <div className="clbl">In [2]:</div>
                  <pre>
                    {`# Train prototype model
from sklearn.ensemble import GradientBoostingRegressor
model = GradientBoostingRegressor()
model.fit(X_train, y_train)
print(f"MAPE: {calculate_mape(model):.1%}")`}
                  </pre>
                </div>

                <div className="cell">
                  <div className="clbl">Out [2]:</div>
                  <pre className="out">
                    {`MAPE: 6.8% (Beats current production baseline 11.2% by 4.4 points)
Model ready to graduate to production pipeline.`}
                  </pre>
                </div>
              </div>
            </div>
          )}
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
