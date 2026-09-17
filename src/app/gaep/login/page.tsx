"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/gaep/navigation";
import { isValidLogin } from "@/gaep/login";
import { login, register } from "@/platform/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? ROUTES.catalog;

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!isValidLogin(username, password)) {
      setError("Please enter both a username and a password.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "register") {
        await register(username, password);
      } else {
        await login(username, password);
      }
      router.push(redirectTo);
      router.refresh();
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : mode === "register"
            ? "Registration failed."
            : "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade">
      <div className="topbar">
        <Link className="brand" href={ROUTES.landing}>
          <div className="logo">G</div>
          <div className="name">
            GAEP
            <small>Global Analytics Experimentation Platform</small>
          </div>
        </Link>
        <div className="nav">
          <Link href={ROUTES.landing}>Home</Link>
        </div>
      </div>

      <div className="wrap" style={{ maxWidth: 460 }}>
        <h2 className="section-title" style={{ marginTop: 40 }}>
          {mode === "login" ? "Sign in to the lab" : "Create your GAEP account"}
        </h2>

        <p className="section-sub">
          {mode === "login"
            ? "Sign in to provision and manage your workspaces."
            : "Register to explore tools, provision sandboxes, and graduate prototypes."}
        </p>

        <div className="toolbar-tabs">
          <button
            type="button"
            className={`btn ${mode === "login" ? "" : "ghost"}`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`btn ${mode === "register" ? "" : "ghost"}`}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Create account
          </button>
        </div>

        <form className="form-card" onSubmit={submit}>
          <div className="field">
            <label htmlFor="username">Username or email</label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="you@company.com"
              autoComplete="username"
              disabled={loading}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              disabled={loading}
              required
            />
          </div>

          {error && (
            <p
              role="alert"
              className="trad"
              style={{
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              {error}
            </p>
          )}

          <button className="btn" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading
              ? mode === "login"
                ? "Signing in…"
                : "Creating account…"
              : mode === "login"
                ? "Sign in →"
                : "Create account →"}
          </button>
        </form>

        <div className="note" style={{ marginTop: 24, padding: "14px 18px" }}>
          <div className="emoji">💡</div>
          <p style={{ margin: 0, fontSize: 13 }}>
            Demo account: <b>engineer@example.com</b> &middot; Password: <b>password123</b>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="wrap">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}