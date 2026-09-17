"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import {
  METRICS,
  ACTIVITY,
  GEO_USAGE,
  DLAB,
} from "@/gaep/data/content";
import { ROUTES } from "@/gaep/navigation";
import {
  listWorkspaces,
  terminateWorkspace,
  terminateAllWorkspaces,
  type Workspace,
} from "@/platform/api";

export default function DashboardPage() {
  const [activeWorkspaces, setActiveWorkspaces] = useState<
    Workspace[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminating, setTerminating] = useState<string | null>(
    null,
  );

  const loadWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const workspaces = await listWorkspaces();

      setActiveWorkspaces(
        Array.isArray(workspaces) ? workspaces : [],
      );
    } catch (loadError) {
      console.error("Failed to fetch workspaces", loadError);

      setActiveWorkspaces([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load workspaces.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  async function handleTerminate(workspaceName: string) {
    const confirmed = window.confirm(
      `Stop workspace "${workspaceName}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setTerminating(workspaceName);
      setError(null);

      await terminateWorkspace(workspaceName);
      await loadWorkspaces();
    } catch (terminateError) {
      console.error(
        "Failed to terminate workspace",
        terminateError,
      );

      setError(
        terminateError instanceof Error
          ? terminateError.message
          : "Unable to terminate workspace.",
      );
    } finally {
      setTerminating(null);
    }
  }

  async function handleTerminateAll() {
    const confirmed = window.confirm(
      "Stop and purge ALL active and exited workspaces?",
    );
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await terminateAllWorkspaces();
      await loadWorkspaces();
    } catch (terminateError) {
      setError(
        terminateError instanceof Error
          ? terminateError.message
          : "Unable to terminate all workspaces.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade">
      <h2 className="section-title">Dashboard</h2>

      <p className="section-sub">
        Platform adoption, cross-geo usage, and the proven value
        behind GAEP.
      </p>

      <div
        className="stats"
        style={{ justifyContent: "flex-start" }}
      >
        {METRICS.map((metric) => (
          <div
            key={metric.key}
            className="stat"
          >
            <div className="num">{metric.value}</div>
            <div className="lbl">{metric.label}</div>
          </div>
        ))}
      </div>

      <div
        className="grid2"
        style={{ marginTop: 32 }}
      >
        <div>
          <h3
            className="section-title"
            style={{ fontSize: 20 }}
          >
            India + US usage
          </h3>

          <p className="section-sub">
            Follow-the-sun experimentation across geographies.
          </p>

          {GEO_USAGE.map((geo) => (
            <div
              key={geo.geo}
              style={{ marginBottom: 14 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 14,
                }}
              >
                <span>{geo.geo} team</span>

                <span className="muted">
                  {geo.workspaces} workspaces &middot;{" "}
                  {geo.share}%
                </span>
              </div>

              <div className="geobar">
                <span
                  style={{
                    width: PCT(geo.share),
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3
              className="section-title"
              style={{ fontSize: 20, margin: 0 }}
            >
              Active workspaces
            </h3>

            {activeWorkspaces.length > 0 && (
              <button
                type="button"
                className="btn ghost"
                style={{ padding: "4px 10px", fontSize: 11, borderColor: "rgba(238,136,136,0.5)", color: "#e88" }}
                onClick={handleTerminateAll}
              >
                Purge All Workspaces ✕
              </button>
            )}
          </div>

          {loading && (
            <p className="muted">
              Loading workspaces...
            </p>
          )}

          {!loading && error && (
            <div
              role="alert"
              style={{
                color: "#ff4d4f",
                marginBottom: 14,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            activeWorkspaces.length === 0 && (
              <p className="muted">
                No active workspaces found.
              </p>
            )}

          {!loading &&
            activeWorkspaces.length > 0 && (
              <div>
                {activeWorkspaces.map((workspace) => (
                  <div
                    key={workspace.name}
                    className="row"
                    style={{ alignItems: "center", gap: 10 }}
                  >
                    <div>
                      <Link
                        href={`${ROUTES.workspace}?workspace_name=${workspace.name}&template=${workspace.template}`}
                        style={{ color: "#fff", fontWeight: 600, textDecoration: "none" }}
                      >
                        {workspace.name}
                      </Link>{" "}
                      <span className="muted" style={{ fontSize: 12 }}>
                        &middot; {workspace.template}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="pill" style={{ fontSize: 11 }}>
                        ● {workspace.status}
                      </span>
                      {workspace.url && (
                        <a
                          href={workspace.url}
                          target="_blank"
                          rel="noreferrer"
                          className="gaepc"
                          style={{ fontSize: 12, textDecoration: "none" }}
                        >
                          Launch ↗
                        </a>
                      )}
                      <button
                        className="btn-small"
                        type="button"
                        style={{ padding: "3px 8px", fontSize: 11, background: "transparent", color: "#e88", border: "1px solid rgba(238,136,136,0.3)", borderRadius: 6, cursor: "pointer" }}
                        disabled={terminating === workspace.name}
                        onClick={() => handleTerminate(workspace.name)}
                      >
                        {terminating === workspace.name ? "Stopping…" : "Stop"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <h3
          className="section-title"
          style={{ fontSize: 20 }}
        >
          Recent activity
        </h3>

        {ACTIVITY.map((activity) => (
          <div
            key={activity.id}
            className="row"
          >
            <span>
              <b>{activity.who}</b>{" "}
              {activity.action}
            </span>

            <span className="muted">
              {activity.when}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40 }}>
        <h3
          className="section-title"
          style={{ fontSize: 20 }}
        >
          This model already delivered
        </h3>

        <p className="section-sub">
          GAEP is not a bet on an untested idea. A predecessor lab
          powered 15+ real initiatives.
        </p>

        <div className="grid">
          {DLAB.map((item) => (
            <div
              key={item.id}
              className="card"
            >
              <h3
                style={{
                  color: "var(--teal)",
                  fontSize: 15,
                }}
              >
                {item.title}
              </h3>

              <p>{item.summary}</p>
            </div>
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 24,
          }}
        >
          <Link
            className="btn"
            href={ROUTES.catalog}
          >
            Start experimenting
          </Link>
        </div>
      </div>
    </div>
  );
}

function PCT(value: number): string {
  return `${value}%`;
}