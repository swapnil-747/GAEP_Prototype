"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { parseWorkspaceQuery } from "@/gaep/workspaceContext";
import { getTemplateById } from "@/gaep/data/templates";
import { getStarter } from "@/gaep/data/content";
import { ROUTES } from "@/gaep/navigation";
import {
  getCurrentUser,
  listWorkspaces,
  type Workspace,
} from "@/platform/api";

function WorkspaceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [workspaces, setWorkspaces] = useState<
    Workspace[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null,
  );

  const selectedWorkspaceName =
    searchParams.get("workspace_name");

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
        router.push(ROUTES.login);
        return;
      }

      const userWorkspaces = await listWorkspaces();

      setWorkspaces(
        Array.isArray(userWorkspaces)
          ? userWorkspaces
          : [],
      );
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
      return workspaces.find(
        (workspace) =>
          workspace.name === selectedWorkspaceName,
      );
    }

    if (queryUrl) {
      return workspaces.find(
        (workspace) => workspace.url === queryUrl,
      );
    }

    if (selection.template) {
      return workspaces.find(
        (workspace) =>
          workspace.template === selection.template,
      );
    }

    return workspaces[0];
  }, [
    workspaces,
    selectedWorkspaceName,
    queryUrl,
    selection.template,
  ]);

  const workspaceUrl =
    selectedWorkspace?.url ?? queryUrl;

  const templateId =
    selectedWorkspace?.template ??
    selection.template ??
    "aiml";

  const template =
    getTemplateById(templateId) ??
    getTemplateById("aiml")!;

  const starter = getStarter(template.id);

  const expiryText = selectedWorkspace?.expires_at
    ? `expires in ${formatExpiry(
        selectedWorkspace.expires_at,
      )}`
    : `expires in ${selection.ttl ?? "1 day"}`;

  const subtitle = [
    template.name,
    selection.dataset ?? "Parts catalog",
    expiryText,
  ].join(" · ");

  function selectWorkspace(workspace: Workspace) {
    const params = new URLSearchParams(
      searchParams.toString(),
    );

    params.set("workspace_name", workspace.name);

    if (workspace.url) {
      params.set("url", workspace.url);
    }

    router.push(
      `${ROUTES.workspace}?${params.toString()}`,
    );
  }

  if (loading) {
    return (
      <div className="fade">
        <h2 className="section-title">
          Loading your workspaces…
        </h2>

        <p className="section-sub">
          Retrieving workspaces tied to your account.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade">
        <h2 className="section-title">
          Unable to load workspaces
        </h2>

        <p
          className="section-sub"
          role="alert"
          style={{ color: "#ff4d4f" }}
        >
          {error}
        </p>

        <button
          className="btn"
          type="button"
          onClick={() => void loadWorkspaces()}
        >
          Try again
        </button>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="fade">
        <h2 className="section-title">
          No workspaces yet
        </h2>

        <p className="section-sub">
          Provision a workspace to see it here.
        </p>

        <Link
          className="btn"
          href={ROUTES.catalog}
        >
          Browse catalog →
        </Link>
      </div>
    );
  }

  return (
    <div className="fade">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 className="section-title">
            My workspaces
          </h2>

          <p className="section-sub">
            Workspaces associated with your account.
          </p>
        </div>

        <Link
          className="btn"
          href={ROUTES.catalog}
        >
          Provision another →
        </Link>
      </div>

      <div
        className="grid"
        style={{ marginBottom: 28 }}
      >
        {workspaces.map((workspace) => {
          const selected =
            selectedWorkspace?.name === workspace.name;

          return (
            <button
              key={workspace.name}
              type="button"
              onClick={() =>
                selectWorkspace(workspace)
              }
              style={{
                textAlign: "left",
                cursor: "pointer",
                border: selected
                  ? "1px solid var(--teal)"
                  : "1px solid transparent",
                background: "transparent",
                color: "inherit",
                padding: 18,
                borderRadius: 8,
              }}
            >
              <strong>{workspace.name}</strong>

              <div
                className="muted"
                style={{ marginTop: 8 }}
              >
                {workspace.template}
                {" · "}
                {workspace.status}
              </div>

              {workspace.url && (
                <div
                  className="muted"
                  style={{
                    marginTop: 8,
                    wordBreak: "break-all",
                    fontSize: 12,
                  }}
                >
                  {workspace.url}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedWorkspace && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 className="section-title">
                Your workspace is live 🎉
              </h2>

              <p className="section-sub">
                {subtitle}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span className="pill">
                ● {selectedWorkspace.status}
              </span>

              {workspaceUrl && (
                <a
                  className="btn"
                  href={workspaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Launch in New Tab ↗
                </a>
              )}

              <Link
                className="btn purple"
                href={ROUTES.graduate}
              >
                Graduate to production →
              </Link>
            </div>
          </div>

          <div className="ws">
            {workspaceUrl &&
            selectedWorkspace.status !== "removed" ? (
              <div
                className="nb"
                style={{
                  height: "70vh",
                  border: "1px solid #ccc",
                }}
              >
                <iframe
                  src={workspaceUrl}
                  width="100%"
                  height="100%"
                  title="Interactive workspace"
                  style={{ border: 0 }}
                />
              </div>
            ) : (
              <div className="nb">
                <div className="nb-bar">
                  <div>
                    ● ● ● {starter.title}.ipynb
                  </div>
                </div>

                <div className="cell">
                  <pre>
                    {`# This workspace is unavailable.
# Its container may have expired or been removed.`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatExpiry(expiresAt: number): string {
  const secondsRemaining = Math.max(
    0,
    Math.floor(expiresAt - Date.now() / 1000),
  );

  const hoursRemaining = Math.floor(
    secondsRemaining / 3600,
  );

  if (hoursRemaining >= 24) {
    return `${Math.floor(
      hoursRemaining / 24,
    )} days`;
  }

  if (hoursRemaining > 0) {
    return `${hoursRemaining} hours`;
  }

  return `${Math.max(
    1,
    Math.floor(secondsRemaining / 60),
  )} minutes`;
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