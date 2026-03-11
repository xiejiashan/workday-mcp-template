import type { HttpClient } from "./types.js";
import type { Json } from "../utils/json-helpers.js";

export function createHttpClient(): HttpClient {
  return {
    fetch: (url: string, init?: RequestInit) => fetch(url, init),
  };
}

export type GetResult = {
  ok: boolean;
  status: number;
  statusText: string;
  contentType: string;
  text: string;
  json?: Json;
};

const DEFAULT_HEADERS: Record<string, string> = {
  accept: "application/json, text/plain;q=0.9, */*;q=0.8",
  "user-agent": "@workday-mcp/server",
};

export async function fetchGet(
  client: HttpClient,
  url: string,
  headers: Record<string, string> = {}
): Promise<GetResult> {
  const res = await client.fetch(url, {
    method: "GET",
    headers: { ...DEFAULT_HEADERS, ...headers },
  });
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();
  let json: Json | undefined;
  if (contentType.includes("application/json")) {
    try {
      json = JSON.parse(text) as Json;
    } catch {
      json = undefined;
    }
  }
  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    contentType,
    text,
    json,
  };
}
