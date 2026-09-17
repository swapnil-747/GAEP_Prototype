"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ROUTES } from "@/gaep/navigation";

function SalesforceConsoleInner() {
  const searchParams = useSearchParams();
  const workspaceName = searchParams.get("workspace") ?? "salesforce-dev";

  const [activeTab, setActiveTab] = useState<"accounts" | "contracts" | "rest" | "audit">("accounts");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [accounts, setAccounts] = useState([
    { id: "0015e000003kLmA", name: "Air India TechOps Fleet", industry: "Commercial Aviation", fleet: 128, tier: "Platinum AOG", status: "Active" },
    { id: "0015e000003kLmB", name: "United Airlines Maintenance", industry: "Commercial Aviation", fleet: 340, tier: "Enterprise Gold", status: "Active" },
    { id: "0015e000003kLmC", name: "Singapore Airlines Engineering", industry: "Commercial Aviation", fleet: 96, tier: "24/7 Priority", status: "Active" },
  ]);

  const [restEndpoint, setRestEndpoint] = useState("GET /services/data/v59.0/sobjects/Account");
  const [restResponse, setRestResponse] = useState<string | null>(null);

  function copyText(text: string, id: string) {
    void navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function handleSendRest() {
    setRestResponse(
      JSON.stringify(
        {
          totalSize: accounts.length,
          done: true,
          records: accounts.map((a) => ({
            attributes: { type: "Account", url: `/services/data/v59.0/sobjects/Account/${a.id}` },
            Id: a.id,
            Name: a.name,
            Industry: a.industry,
            Fleet_Size__c: a.fleet,
            SLA_Tier__c: a.tier,
          })),
        },
        null,
        2,
      ),
    );
  }

  return (
    <div className="fade">
      {/* Top Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="pill" style={{ background: "rgba(0, 161, 224, 0.15)", color: "#00a1e0" }}>
              ☁️ Salesforce Lightning Console
            </span>
            <span className="pill">● Developer Scratch Org</span>
          </div>
          <h2 className="section-title" style={{ marginTop: 6 }}>
            Boeing Customer 360 & Fleet Maintenance Org
          </h2>
          <p className="section-sub">
            Org ID: <code>00D5e000001aBCdEAM</code> &middot; Instance: <code>boeing-sandbox-dev-ed</code> &middot; Workspace: <code>{workspaceName}</code>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <a
            href="https://developer.salesforce.com/"
            target="_blank"
            rel="noreferrer"
            className="btn ghost"
            style={{ padding: "8px 14px", fontSize: 13 }}
          >
            Salesforce Developer Portal ↗
          </a>
          <Link href={ROUTES.workspace} className="btn" style={{ padding: "8px 14px", fontSize: 13, textDecoration: "none" }}>
            ← Back to GAEP Hub
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 20 }}>
        <button
          type="button"
          className={`btn ghost ${activeTab === "accounts" ? "on" : ""}`}
          onClick={() => setActiveTab("accounts")}
        >
          🏢 Airline Accounts ({accounts.length})
        </button>
        <button
          type="button"
          className={`btn ghost ${activeTab === "contracts" ? "on" : ""}`}
          onClick={() => setActiveTab("contracts")}
        >
          📜 Maintenance Contracts (2)
        </button>
        <button
          type="button"
          className={`btn ghost ${activeTab === "rest" ? "on" : ""}`}
          onClick={() => setActiveTab("rest")}
        >
          ⚡ REST SObjects API Console
        </button>
      </div>

      {/* Tab 1: Accounts */}
      {activeTab === "accounts" && (
        <div className="nb" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h4 style={{ margin: 0, color: "#fff" }}>Airline Customer Accounts</h4>
            <span className="pill" style={{ fontSize: 12 }}>3 Managed Fleets</span>
          </div>

          <table className="telemetry-feed" style={{ background: "#06111d", borderRadius: 10 }}>
            <thead>
              <tr>
                <th>Account ID</th>
                <th>Airline Name</th>
                <th>Industry</th>
                <th>Active Fleet</th>
                <th>SLA Response</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td className="muted"><code>{a.id}</code></td>
                  <td><b>{a.name}</b></td>
                  <td className="muted">{a.industry}</td>
                  <td>{a.fleet} Aircraft</td>
                  <td>
                    <span className="pill" style={{ fontSize: 11, background: "rgba(78, 205, 196, 0.15)", color: "var(--teal)" }}>
                      ● {a.tier}
                    </span>
                  </td>
                  <td><span className="gaepc">● {a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Maintenance Contracts */}
      {activeTab === "contracts" && (
        <div className="nb" style={{ padding: 24 }}>
          <h4 style={{ margin: "0 0 16px 0", color: "#fff" }}>Active Fleet Maintenance Contracts</h4>
          <table className="telemetry-feed" style={{ background: "#06111d", borderRadius: 10 }}>
            <thead>
              <tr>
                <th>Contract #</th>
                <th>Aircraft Family</th>
                <th>Coverage Scope</th>
                <th>Guaranteed Response</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>CTR-787-88219</code></td>
                <td><b>Boeing 787-9 Dreamliner</b></td>
                <td>Full Avionics + Hydraulic Actuators</td>
                <td><span className="gaepc">4 Hours AOG Response</span></td>
                <td><span className="pill">● Active Platinum</span></td>
              </tr>
              <tr>
                <td><code>CTR-777-44012</code></td>
                <td><b>Boeing 777X</b></td>
                <td>Turbine Telemetry + Flight Control Units</td>
                <td><span className="gaepc">2 Hours AOG Response</span></td>
                <td><span className="pill">● Active Enterprise</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: REST SObjects API */}
      {activeTab === "rest" && (
        <div className="nb" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h4 style={{ margin: 0, color: "#fff" }}>Salesforce REST SObjects Explorer</h4>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                Query mock customer and contract records via standard Salesforce REST API v59.0.
              </p>
            </div>
            <button
              type="button"
              className="btn"
              style={{ padding: "8px 16px", fontSize: 13 }}
              onClick={handleSendRest}
            >
              Send Request
            </button>
          </div>

          <div style={{ background: "#06111d", border: "1px solid var(--line)", borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <input
                type="text"
                value={restEndpoint}
                onChange={(e) => setRestEndpoint(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", background: "#0a1a2b", border: "1px solid var(--line)", color: "#fff", borderRadius: 8, fontFamily: "monospace", fontSize: 13 }}
              />
            </div>

            <pre style={{ margin: 0, maxHeight: 280 }}>
              {restResponse || `// Click "Send Request" to execute Salesforce REST query`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SalesforceConsolePage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: "var(--muted)" }}>Loading Salesforce Console…</div>}>
      <SalesforceConsoleInner />
    </Suspense>
  );
}
