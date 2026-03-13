import type { Services } from "@workday-mcp/mcp-core";
import { stringifyJson, fetchAccessToken } from "@workday-mcp/mcp-core";

export type ExecuteOpenApiRequestOptions = {
  baseUrl: string;
  method: string;
  path: string;
  pathParams?: Record<string, string>;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
};

export type McpToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

/**
 * Builds the request URL, injects auth from config, and calls the API.
 * Used by generated OpenAPI tool handlers so auth lives in one place.
 */
export async function executeOpenApiRequest(
  services: Services,
  options: ExecuteOpenApiRequestOptions
): Promise<McpToolResult> {
  const {
    baseUrl,
    path,
    pathParams = {},
    query = {},
    headers = {},
    body,
  } = options;
  const method = options.method.toUpperCase();

  let resolvedPath = path;
  for (const [key, value] of Object.entries(pathParams)) {
    resolvedPath = resolvedPath.replace(`{${key}}`, encodeURIComponent(value));
  }
  const url = new URL(resolvedPath, baseUrl.replace(/\/$/, "") + "/");
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  const fullUrl = url.toString();

  const authHeaders: Record<string, string> = {};
  const { auth: authConfig } = services.config;
  if (authConfig.type === "oauthClientCredentials") {
    try {
      const accessToken = await fetchAccessToken(
        services.config,
        services.httpClient,
        services.logger
      );
      authHeaders["Authorization"] = `Bearer ${accessToken}`;
    } catch (err) {
      services.logger.error("OAuth token fetch failed", err);
      return {
        content: [
          {
            type: "text",
            text: stringifyJson({
              error: "OAuth token fetch failed",
            }),
          },
        ],
        isError: true,
      };
    }
  }

  const mergedHeaders: Record<string, string> = {
    accept: "application/json, text/plain;q=0.9, */*;q=0.8",
    "content-type": "application/json",
    "user-agent": "@workday-mcp/server",
    ...authHeaders,
    ...headers,
  };

  const init: RequestInit = {
    method,
    headers: mergedHeaders,
  };
  if (body !== undefined && method !== "GET") {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  services.logger.debug(`OpenAPI request: ${init.method} ${fullUrl}`);

  try {
    const res = await services.httpClient.fetch(fullUrl, init);
    const text = await res.text();
    let out: string;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json") && text) {
      try {
        const parsed = JSON.parse(text) as unknown;
        out = stringifyJson(parsed);
      } catch {
        out = text;
      }
    } else {
      out = text;
    }

    if (!res.ok) {
      services.logger.warn(`OpenAPI request failed: ${res.status} ${fullUrl}`);
      return {
        content: [
          {
            type: "text",
            text: stringifyJson({
              status: res.status,
              statusText: res.statusText,
              body: out,
            }),
          },
        ],
        isError: true,
      };
    }

    return { content: [{ type: "text", text: out }] };
  } catch (err) {
    services.logger.error("OpenAPI request error", err);
    return {
      content: [{ type: "text", text: stringifyJson({ error: String(err) }) }],
      isError: true,
    };
  }
}
