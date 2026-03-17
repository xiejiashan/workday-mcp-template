import type { HttpClient } from "./types.js";

export function createHttpClient(): HttpClient {
  return {
    fetch: (url: string, init?: RequestInit) => fetch(url, init),
  };
}
