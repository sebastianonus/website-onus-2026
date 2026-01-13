import { projectId, publicAnonKey } from "./supabase/info";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-372a0974`;

export async function callEdge(path: string, init: RequestInit = {}) {
  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    apikey: publicAnonKey,
    authorization: `Bearer ${publicAnonKey}`,
    ...(init.headers as Record<string, string> | undefined),
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, { ...init, headers, signal: controller.signal });
    const text = await res.text();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(t);
  }
}
