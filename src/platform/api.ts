import { PLATFORM_API_URL } from "./config";

const API_URL =
  typeof process !== "undefined" && process.env?.NEXT_PUBLIC_PLATFORM_API_URL
    ? process.env.NEXT_PUBLIC_PLATFORM_API_URL
    : PLATFORM_API_URL;

export type CurrentUser = {
  id: string;
  username: string;
};

export type ProvisionRequest = {
  workspace_name?: string;
  template: string;
  ttl: string;
};

export type ProvisionResponse = {
  status: string;
  workspace_name: string;
  template: string;
  owner_id: string;
  url: string;
  expires_at: number;
};

export type Workspace = {
  name: string;
  status: string;
  image: string;
  template: string;
  expires_at: number;
  url: string | null;
  owner_id: string;
  owner_username?: string;
};

type WorkspaceListResponse = {
  workspaces?: Workspace[];
};

async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const body = await response.json().catch(() => null);

  if (
    body &&
    typeof body === "object" &&
    "detail" in body &&
    typeof body.detail === "string"
  ) {
    return body.detail;
  }

  return fallback;
}

async function ensureSuccess(
  response: Response,
  fallback: string,
): Promise<void> {
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, fallback),
    );
  }
}

export async function login(
  username: string,
  password: string,
): Promise<CurrentUser> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      username: username.trim(),
      password,
    }),
  });

  await ensureSuccess(
    response,
    "Invalid username or password",
  );

  return (await response.json()) as CurrentUser;
}

export async function register(
  username: string,
  password: string,
): Promise<CurrentUser> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      username: username.trim(),
      password,
    }),
  });

  await ensureSuccess(response, "Registration failed");

  return (await response.json()) as CurrentUser;
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  await ensureSuccess(response, "Logout failed");
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  await ensureSuccess(
    response,
    "Unable to retrieve current user",
  );

  return (await response.json()) as CurrentUser;
}

export async function provisionWorkspace(
  input: ProvisionRequest,
): Promise<ProvisionResponse> {
  const response = await fetch(`${API_URL}/provision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (response.status === 401) {
    throw new Error(
      "You must be logged in to provision a workspace.",
    );
  }

  await ensureSuccess(response, "Provisioning failed");

  return (await response.json()) as ProvisionResponse;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const response = await fetch(`${API_URL}/workspaces`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("Authentication required");
  }

  await ensureSuccess(
    response,
    "Unable to load workspaces",
  );

  const data =
    (await response.json()) as WorkspaceListResponse;

  return Array.isArray(data.workspaces)
    ? data.workspaces
    : [];
}

export async function terminateWorkspace(
  workspaceName: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/terminate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      workspace_name: workspaceName,
    }),
  });

  if (response.status === 401) {
    throw new Error("Authentication required");
  }

  await ensureSuccess(
    response,
    "Unable to terminate workspace",
  );
}