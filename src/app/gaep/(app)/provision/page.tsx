"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  DATASETS,
  DURATIONS,
  PROVISION_STEPS,
} from "@/gaep/data/content";
import { getTemplateById } from "@/gaep/data/templates";
import { ROUTES } from "@/gaep/navigation";
import { buildWorkspaceQuery } from "@/gaep/workspaceContext";
import {
  advanceProvisioning,
  initialProvision,
  isProvisionComplete,
} from "@/gaep/provisioning";
import {
  getCurrentUser,
  provisionWorkspace,
} from "@/platform/api";

type WorkspaceSize = "small" | "medium" | "large";

const SIZES: Array<{
  id: WorkspaceSize;
  label: string;
}> = [
  {
    id: "small",
    label: "Small · 2 vCPU / 8 GB",
  },
  {
    id: "medium",
    label: "Medium · 4 vCPU / 16 GB",
  },
  {
    id: "large",
    label: "Large · 8 vCPU / 32 GB + GPU",
  },
];

function ProvisionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const templateId =
    searchParams.get("template") ?? "aiml";

  const template =
    getTemplateById(templateId) ??
    getTemplateById("aiml")!;

  const workspaceUrlRef = useRef("");
  const workspaceNameRef = useRef("");

  const timerRef = useRef<
    ReturnType<typeof setInterval> | null
  >(null);

  const redirectTimerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [authenticated, setAuthenticated] =
    useState(false);

  const [dataset, setDataset] = useState(
    DATASETS[0]?.name ?? "",
  );

  const [size, setSize] =
    useState<WorkspaceSize>("small");

  const [ttl, setTtl] = useState(
    DURATIONS[1]?.label ??
      DURATIONS[0]?.label ??
      "1 hour",
  );

  const [provisioning, setProvisioning] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [provisionState, setProvisionState] =
    useState(initialProvision);

  useEffect(() => {
    let mounted = true;

    async function checkAuthentication() {
      try {
        const user = await getCurrentUser();

        if (!mounted) {
          return;
        }

        setAuthenticated(Boolean(user));
      } catch {
        if (!mounted) {
          return;
        }

        setAuthenticated(false);
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    void checkAuthentication();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!provisioning) {
      return;
    }

    timerRef.current = setInterval(() => {
      setProvisionState((currentState) => {
        const nextState =
          advanceProvisioning(currentState);

        if (isProvisionComplete(nextState)) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          const query = buildWorkspaceQuery({
            template: template.id,
            dataset,
            size,
            ttl,
          });

          const workspaceQuery =
            new URLSearchParams(query);

          const workspaceUrl =
            workspaceUrlRef.current;

          const workspaceName =
            workspaceNameRef.current;

          if (workspaceUrl) {
            workspaceQuery.set(
              "url",
              workspaceUrl,
            );
          }

          if (workspaceName) {
            workspaceQuery.set(
              "workspace_name",
              workspaceName,
            );
          }

          redirectTimerRef.current = setTimeout(() => {
            router.push(
              `${ROUTES.workspace}?${workspaceQuery.toString()}`,
            );
          }, 500);
        }

        return nextState;
      });
    }, 650);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    provisioning,
    template.id,
    dataset,
    size,
    ttl,
    router,
  ]);

  async function handleProvision() {
    if (provisioning) {
      return;
    }

    setError(null);
    setProvisioning(true);
    setProvisionState(initialProvision);

    workspaceUrlRef.current = "";
    workspaceNameRef.current = "";

    try {
      const result = await provisionWorkspace({
        template: template.id,
        ttl,
      });

      if (result.status !== "Success") {
        throw new Error(
          "The orchestrator did not create the workspace.",
        );
      }

      workspaceUrlRef.current = result.url;
      workspaceNameRef.current =
        result.workspace_name;

      setProvisionState((currentState) =>
        advanceProvisioning(currentState),
      );
    } catch (provisionError) {
      setProvisioning(false);
      setProvisionState(initialProvision);

      if (
        provisionError instanceof Error &&
        provisionError.message
      ) {
        setError(provisionError.message);
      } else {
        setError(
          "Failed to reach the platform orchestrator.",
        );
      }
    }
  }

  function handleSignIn() {
    router.push(ROUTES.login);
  }

  if (authLoading) {
    return (
      <div className="fade">
        <h2 className="section-title">
          Checking authentication…
        </h2>

        <p className="section-sub">
          Verifying your GAEP session.
        </p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="fade">
        <h2 className="section-title">
          Sign in required
        </h2>

        <p className="section-sub">
          You must sign in before provisioning a
          workspace.
        </p>

        <button
          className="btn"
          type="button"
          onClick={handleSignIn}
        >
          Go to sign in →
        </button>
      </div>
    );
  }

  if (provisioning) {
    return (
      <div
        className="fade"
        style={{
          textAlign: "center",
          maxWidth: 620,
          margin: "60px auto",
        }}
      >
        <div className="ring" />

        <h2
          className="section-title"
          style={{ textAlign: "center" }}
        >
          Spinning up your workspace…
        </h2>

        <p
          className="section-sub"
          style={{ textAlign: "center" }}
        >
          This is the part that used to take weeks.
        </p>

        <div
          className="steps"
          style={{ margin: "26px auto 0" }}
        >
          {PROVISION_STEPS.map((step, index) => {
            const completed =
              index < provisionState.completed;

            return (
              <div
                key={step.id}
                className={`step ${
                  completed ? "done" : ""
                }`}
              >
                <span className="dot">
                  {completed ? "✓" : ""}
                </span>

                {step.label}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="fade">
      <h2 className="section-title">
        Provision:{" "}
        <span style={{ color: "var(--teal)" }}>
          {template.name}
        </span>
      </h2>

      <p className="section-sub">
        Configure your governed, transient workspace.
        Nothing here needs a ticket.
      </p>

      <div className="form-card">
        <div className="field">
          <label htmlFor="dataset">
            Curated dataset
          </label>

          <select
            id="dataset"
            value={dataset}
            onChange={(event) =>
              setDataset(event.target.value)
            }
          >
            {DATASETS.map((item) => (
              <option
                key={item.id}
                value={item.name}
              >
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <span className="field-label">
            Workspace size
          </span>

          <div
            className="opts"
            role="radiogroup"
            aria-label="Workspace size"
          >
            {SIZES.map((item) => {
              const selected = size === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`opt ${
                    selected ? "sel" : ""
                  }`}
                  onClick={() => setSize(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <span className="field-label">
            Transient access duration{" "}
            <small>
              auto-expires — keeps us governed
            </small>
          </span>

          <div
            className="opts"
            role="radiogroup"
            aria-label="Transient access duration"
          >
            {DURATIONS.map((duration) => {
              const selected =
                ttl === duration.label;

              return (
                <button
                  key={duration.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`opt ${
                    selected ? "sel" : ""
                  }`}
                  onClick={() =>
                    setTtl(duration.label)
                  }
                >
                  {duration.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="gov">
          <span className="g">
            🔒 Time-boxed access
          </span>

          <span className="g">
            ⏳ Auto-expiry
          </span>

          <span className="g">
            🏷️ Data classification respected
          </span>

          <span className="g">
            📝 Audit trail
          </span>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              color: "#ff4d4f",
              marginBottom: "10px",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        <button
          className="btn"
          type="button"
          onClick={() => void handleProvision()}
          disabled={provisioning}
        >
          {provisioning
            ? "🚀 Provisioning..."
            : "🚀 Provision now — one click, no approval"}
        </button>
      </div>
    </div>
  );
}

export default function ProvisionPage() {
  return (
    <Suspense
      fallback={
        <div className="wrap">
          Loading…
        </div>
      }
    >
      <ProvisionInner />
    </Suspense>
  );
}