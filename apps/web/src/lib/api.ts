const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export interface Session {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    familyId: string;
    role: string;
  };
}

export async function api<T>(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("kidcal_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(body.error ?? "Request failed");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function login(email = "alex.rivera@example.com", password = "password123") {
  const session = await api<Session>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  localStorage.setItem("kidcal_token", session.token);
  return session;
}

export function calendarExportUrl(scope: "family" | "child" | "carpool", childId?: string) {
  const params = new URLSearchParams({ scope });
  const token = localStorage.getItem("kidcal_token");
  if (childId) params.set("childId", childId);
  if (token) params.set("token", token);
  return `${API_URL}/export/ics?${params.toString()}`;
}
