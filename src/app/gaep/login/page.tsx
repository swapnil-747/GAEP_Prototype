"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/gaep/navigation";
import { isValidLogin } from "@/gaep/login";
import { login } from "@/platform/api";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!isValidLogin(username, password)) {
      setError("Enter a username and password.");
      return;
    }

    setLoading(true);

    try {
      await login(username, password);
      router.push(ROUTES.catalog);
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
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
            <small>
              Global Analytics Experimentation Platform
            </small>
          </div>
        </Link>
      </div>

      <div className="wrap" style={{ maxWidth: 460 }}>
        <h2
          className="section-title"
          style={{ marginTop: 40 }}
        >
          Sign in to the lab
        </h2>

        <p className="section-sub">
          Sign in to provision and manage your workspaces.
        </p>

        <form
          className="form-card"
          onSubmit={submit}
        >
          <div className="field">
            <label htmlFor="username">
              Username or email
            </label>

            <input
              id="username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="you@company.com"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="field">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && (
            <p
              role="alert"
              style={{
                color: "#e88",
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              {error}
            </p>
          )}

          <button
            className="btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>
      </div>
    </div>
  );
}