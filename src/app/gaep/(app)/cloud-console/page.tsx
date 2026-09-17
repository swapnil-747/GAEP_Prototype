"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ROUTES } from "@/gaep/navigation";

function CloudConsoleInner() {
  const searchParams = useSearchParams();
  const providerParam = (searchParams.get("provider") ?? "aws").toLowerCase();
  const workspaceName = searchParams.get("workspace") ?? "gaep-sandbox";

  const [activeTab, setActiveTab] = useState<"storage" | "compute" | "iam" | "analytics">("storage");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Storage simulator state
  const [s3Files, setS3Files] = useState([
    { key: "telemetry-2026-09-17-787.parquet", size: "4.2 MB", modified: "2026-09-17 11:40", encryption: "SSE-KMS" },
    { key: "hydraulics_baseline_v2.json", size: "184 KB", modified: "2026-09-17 11:35", encryption: "SSE-KMS" },
    { key: "vibration_sensor_stream.csv", size: "12.8 MB", modified: "2026-09-17 11:20", encryption: "SSE-KMS" },
  ]);

  // Lambda / Serverless execution state
  const [lambdaResult, setLambdaResult] = useState<string | null>(null);
  const [lambdaRunning, setLambdaRunning] = useState(false);

  // BigQuery SQL query state
  const [bqQuery, setBqQuery] = useState("SELECT tail_num, AVG(pressure_psi) as avg_psi, MAX(temp_celsius) as peak_temp FROM `boeing_787_fleet.telemetry_logs` GROUP BY tail_num");
  const [bqResults, setBqResults] = useState<any[] | null>([
    { tail_num: "N787BA", avg_psi: "3007.5 PSI", peak_temp: "645 °C", status: "OPTIMAL" },
    { tail_num: "VT-BOE", avg_psi: "2980.2 PSI", peak_temp: "662 °C", status: "WARNING (Vibration 482Hz)" },
  ]);

  const provider = useMemo(() => {
    if (providerParam === "azure") {
      return {
        id: "azure",
        name: "Microsoft Azure",
        badge: "🔷 Azure Innovation Sandbox",
        accountLabel: "Subscription: Boeing-Avionics-Sandbox",
        subId: "3b4a5c6d-7e8f-9012-3456-7890abcdef12",
        publicUrl: "https://portal.azure.com/",
        region: "centralus",
        cliCopy: `az login --service-principal -u gaep-sp-01 -p ~secret --tenant 3b4a5c6d\naz account set --subscription 3b4a5c6d`,
      };
    }
    if (providerParam === "gcp") {
      return {
        id: "gcp",
        name: "Google Cloud Platform",
        badge: "☁️ GCP Project Sandbox",
        accountLabel: "Project: boeing-gaep-sandbox-dev",
        subId: "boeing-gaep-sandbox-dev",
        publicUrl: "https://console.cloud.google.com/",
        region: "us-central1",
        cliCopy: `gcloud auth activate-service-account sa-engineer@boeing-gaep-sandbox-dev.iam.gserviceaccount.com --key-file=sa-key.json\ngcloud config set project boeing-gaep-sandbox-dev`,
      };
    }
    return {
      id: "aws",
      name: "AWS (Amazon Web Services)",
      badge: "🟧 AWS GovCloud Sandbox",
      accountLabel: "Account ID: 184920491823 (GovCloud-Sandbox)",
      subId: "184920491823",
      publicUrl: "https://us-west-2.console.aws.amazon.com/",
      region: "us-west-2",
      cliCopy: `export AWS_ACCESS_KEY_ID=AKIA184920491823\nexport AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCY\nexport AWS_DEFAULT_REGION=us-west-2`,
    };
  }, [providerParam]);

  function copyText(text: string, id: string) {
    void navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function handleUploadFile() {
    const newName = `telemetry-chunk-${Date.now().toString().slice(-4)}.parquet`;
    setS3Files((prev) => [
      { key: newName, size: "1.4 MB", modified: "Just now", encryption: "SSE-KMS" },
      ...prev,
    ]);
  }

  function handleExecuteLambda() {
    setLambdaRunning(true);
    setLambdaResult(null);
    setTimeout(() => {
      setLambdaRunning(false);
      setLambdaResult(
        JSON.stringify(
          {
            statusCode: 200,
            executionId: "exec-9921b8fa-4402",
            duration: "84ms",
            memoryUsed: "48 MB",
            payload: {
              status: "PROCESSED",
              recordsEvaluated: 1420,
              anomaliesDetected: 1,
              anomalyDetails: {
                tailNum: "VT-BOE",
                sensor: "vibration_sensor_3",
                frequency: "482 Hz (Threshold: 450 Hz)",
                action: "Alert dispatched to Cockpit Warning Queue",
              },
            },
          },
          null,
          2,
        ),
      );
    }, 800);
  }

  return (
    <div className="fade">
      {/* Top Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="pill" style={{ background: "rgba(78, 205, 196, 0.15)", color: "var(--teal)" }}>
              {provider.badge}
            </span>
            <span className="pill">● Active Sandbox</span>
          </div>
          <h2 className="section-title" style={{ marginTop: 6 }}>
            {provider.name} Management Console
          </h2>
          <p className="section-sub">
            {provider.accountLabel} &middot; Region: <b>{provider.region}</b> &middot; Workspace: <code>{workspaceName}</code>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <a
            href={provider.publicUrl}
            target="_blank"
            rel="noreferrer"
            className="btn ghost"
            style={{ padding: "8px 14px", fontSize: 13 }}
          >
            Open Public Portal ↗
          </a>
          <Link href={ROUTES.workspace} className="btn" style={{ padding: "8px 14px", fontSize: 13, textDecoration: "none" }}>
            ← Back to GAEP Hub
          </Link>
        </div>
      </div>

      {/* Governance & Budget Guardrails Banner */}
      <div className="guardrail-card" style={{ marginBottom: 24 }}>
        <div>
          <h4 style={{ margin: "0 0 4px 0", color: "var(--teal)" }}>
            🛡️ Ephemeral Sandbox Governance Active
          </h4>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            Pre-scoped enterprise sandbox with automated budget enforcement, least-privilege IAM, and automated 4-hour teardown.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="guardrail-pill">💰 Budget Cap: $50.00 USD</span>
          <span className="guardrail-pill">⚡ Current Spend: $0.00</span>
          <span className="guardrail-pill">⏳ Auto-kill: 3h 58m remaining</span>
        </div>
      </div>

      {/* Cloud Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 20 }}>
        <button
          type="button"
          className={`btn ghost ${activeTab === "storage" ? "on" : ""}`}
          onClick={() => setActiveTab("storage")}
        >
          📦 Storage ({provider.id === "aws" ? "S3 Buckets" : provider.id === "azure" ? "Blob Storage" : "Cloud Storage"})
        </button>
        <button
          type="button"
          className={`btn ghost ${activeTab === "compute" ? "on" : ""}`}
          onClick={() => setActiveTab("compute")}
        >
          ⚡ Serverless Compute ({provider.id === "aws" ? "Lambda" : provider.id === "azure" ? "Functions" : "Cloud Run"})
        </button>
        <button
          type="button"
          className={`btn ghost ${activeTab === "analytics" ? "on" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          📊 Analytics & AI ({provider.id === "aws" ? "Athena / Bedrock" : provider.id === "azure" ? "Azure OpenAI" : "BigQuery / Vertex AI"})
        </button>
        <button
          type="button"
          className={`btn ghost ${activeTab === "iam" ? "on" : ""}`}
          onClick={() => setActiveTab("iam")}
        >
          🔑 IAM & Credentials
        </button>
      </div>

      {/* Tab 1: Storage (S3 / Blob / GCS) */}
      {activeTab === "storage" && (
        <div className="nb" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h4 style={{ margin: 0, color: "#fff" }}>
                {provider.id === "aws" ? "Bucket: s3://boeing-flightops-telemetry-uswest2/" : provider.id === "azure" ? "Container: avionics-telemetry-blob" : "Bucket: gs://boeing-flightops-telemetry-uscentral1/"}
              </h4>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                Multi-region encrypted object storage for Boeing 787 FDR flight data records.
              </p>
            </div>
            <button
              type="button"
              className="btn"
              style={{ padding: "8px 16px", fontSize: 13 }}
              onClick={handleUploadFile}
            >
              + Upload Telemetry Object
            </button>
          </div>

          <table className="telemetry-feed" style={{ background: "#06111d", borderRadius: 10 }}>
            <thead>
              <tr>
                <th>Object Key</th>
                <th>Size</th>
                <th>Last Modified</th>
                <th>Encryption</th>
                <th>Storage Class</th>
              </tr>
            </thead>
            <tbody>
              {s3Files.map((file) => (
                <tr key={file.key}>
                  <td><b>{file.key}</b></td>
                  <td className="muted">{file.size}</td>
                  <td className="muted">{file.modified}</td>
                  <td>
                    <span className="pill" style={{ fontSize: 11, background: "rgba(78, 205, 196, 0.15)", color: "var(--teal)" }}>
                      ● {file.encryption}
                    </span>
                  </td>
                  <td className="muted">Standard (Hot)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Serverless Compute */}
      {activeTab === "compute" && (
        <div className="nb" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h4 style={{ margin: 0, color: "#fff" }}>
                Function: <code>process-hydraulic-telemetry</code> (Python 3.11)
              </h4>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                Trigger: S3/Blob Object Created &middot; Timeout: 15s &middot; Memory: 128MB
              </p>
            </div>
            <button
              type="button"
              className="btn"
              style={{ padding: "8px 16px", fontSize: 13 }}
              disabled={lambdaRunning}
              onClick={handleExecuteLambda}
            >
              {lambdaRunning ? "Executing…" : "▶ Test Execute Function"}
            </button>
          </div>

          <div style={{ background: "#06111d", border: "1px solid var(--line)", borderRadius: 10, padding: 16 }}>
            <h5 style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: 11, margin: "0 0 10px 0" }}>
              Execution Response Payload
            </h5>
            <pre style={{ margin: 0, maxHeight: 300 }}>
              {lambdaResult || `// Click "Test Execute Function" to trigger serverless telemetry stream processing`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Analytics & AI */}
      {activeTab === "analytics" && (
        <div className="nb" style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: "0 0 6px 0", color: "#fff" }}>
              {provider.id === "gcp" ? "BigQuery SQL Workspace" : provider.id === "azure" ? "Azure OpenAI & Synapse Studio" : "Amazon Athena Interactive Query"}
            </h4>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Petabyte-scale analytics and AI model endpoints over Boeing fleet telemetry tables.
            </p>
          </div>

          <div style={{ background: "#06111d", border: "1px solid var(--line)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <input
                type="text"
                value={bqQuery}
                onChange={(e) => setBqQuery(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", background: "#0a1a2b", border: "1px solid var(--line)", color: "#fff", borderRadius: 8, fontFamily: "monospace", fontSize: 13 }}
              />
              <button
                type="button"
                className="btn"
                style={{ padding: "8px 16px", fontSize: 13 }}
                onClick={() => setBqResults([...(bqResults ?? [])])}
              >
                Run Query
              </button>
            </div>

            <table className="telemetry-feed">
              <thead>
                <tr>
                  <th>Tail #</th>
                  <th>Avg Hydraulic PSI</th>
                  <th>Peak Turbine Temp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bqResults?.map((r, i) => (
                  <tr key={i}>
                    <td><b>{r.tail_num}</b></td>
                    <td>{r.avg_psi}</td>
                    <td>{r.peak_temp}</td>
                    <td>
                      <span className="pill" style={{ fontSize: 11, color: r.status.includes("WARNING") ? "#e88" : "var(--teal)" }}>
                        ● {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: IAM & Credentials */}
      {activeTab === "iam" && (
        <div className="nb" style={{ padding: 24 }}>
          <h4 style={{ color: "#fff", marginBottom: 12 }}>🔑 Ephemeral IAM Access Keys & CLI Configuration</h4>
          <div className="cred-box">
            <button
              className="copy-btn"
              type="button"
              onClick={() => copyText(provider.cliCopy, "cli")}
            >
              {copiedKey === "cli" ? "Copied ✓" : "Copy CLI Setup"}
            </button>
            <pre style={{ background: "transparent", border: "none", margin: 0, padding: 0 }}>
              {provider.cliCopy}
            </pre>
          </div>

          <div style={{ marginTop: 20 }}>
            <h5 style={{ color: "#fff", marginBottom: 8 }}>Attached Least-Privilege Policies</h5>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="guardrail-pill">AmazonS3ReadOnlyAccess</span>
              <span className="guardrail-pill">AWSLambdaBasicExecutionRole</span>
              <span className="guardrail-pill">AmazonAthenaQueryUser</span>
              <span className="guardrail-pill">BudgetSpendingCeilingEnforcement</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CloudConsolePage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: "var(--muted)" }}>Loading Cloud Console…</div>}>
      <CloudConsoleInner />
    </Suspense>
  );
}
