export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== "") {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // When running on Vercel, custom domain, or any non-localhost host
    if (host !== "localhost" && host !== "127.0.0.1" && !host.startsWith("192.168.") && !host.startsWith("10.")) {
      return "https://nexus-pi-backend.onrender.com";
    }
  }
  return "http://localhost:8000";
}

export const API_BASE_URL = getApiBaseUrl();

const STORAGE_KEY = "nexus_workspace_id";

/**
 * Returns the unique, isolated Workspace ID for this browser / device.
 * If this is the first visit on this device, it generates a fresh private ID.
 */
export function getWorkspaceId(): string {
  if (typeof window === "undefined") {
    return "default";
  }

  let wsId = localStorage.getItem(STORAGE_KEY);
  if (!wsId || wsId.trim() === "") {
    // Generate a secure, unique workspace ID for this device
    const randomHex = Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(4);
    wsId = `ws_${randomHex}`;
    localStorage.setItem(STORAGE_KEY, wsId);
  }
  return wsId;
}

/**
 * Switches the active workspace on this device.
 */
export function setWorkspaceId(newWsId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, newWsId.trim() || "default");
    window.dispatchEvent(new Event("workspace-changed"));
  }
}

/**
 * Generates and switches to a brand new private workspace.
 */
export function createNewWorkspace(): string {
  const randomHex = Math.random().toString(36).substring(2, 10) + Date.now().toString(36).substring(4);
  const newWsId = `ws_${randomHex}`;
  setWorkspaceId(newWsId);
  return newWsId;
}

/**
 * Enhanced fetch wrapper that automatically routes to API_BASE_URL and injects the private X-Workspace-Id header.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
  const wsId = getWorkspaceId();

  const headers = new Headers(options.headers || {});
  if (!headers.has("X-Workspace-Id")) {
    headers.set("X-Workspace-Id", wsId);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
