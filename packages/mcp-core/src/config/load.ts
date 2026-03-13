import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { resolve } from "node:path";

import { serverConfigSchema, type ServerConfig } from "./schema.js";

const ENV_PREFIX = "MCP_";

function fromEnv(): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  if (process.env[`${ENV_PREFIX}TRANSPORT`] != null)
    raw.transport = process.env[`${ENV_PREFIX}TRANSPORT`];
  if (process.env.LOG_LEVEL != null) raw.logLevel = process.env.LOG_LEVEL;
  if (process.env.PORT != null || process.env.HOST != null) {
    raw.http = {
      ...(process.env.PORT != null && { port: process.env.PORT }),
      ...(process.env.HOST != null && { host: process.env.HOST }),
    };
  }
  if (process.env[`${ENV_PREFIX}AUTH_API_KEY`] != null) {
    raw.auth = {
      type: "apiKey",
      apiKey: process.env[`${ENV_PREFIX}AUTH_API_KEY`],
    };
  }
  if (
    process.env[`${ENV_PREFIX}WORKDAY_BASE_URL`] != null ||
    process.env[`${ENV_PREFIX}WORKDAY_TENANT_ID`] != null
  ) {
    raw.workday = {
      ...((raw.workday as Record<string, unknown>) ?? {}),
      ...(process.env[`${ENV_PREFIX}WORKDAY_BASE_URL`] != null && {
        baseUrl: process.env[`${ENV_PREFIX}WORKDAY_BASE_URL`],
      }),
      ...(process.env[`${ENV_PREFIX}WORKDAY_TENANT_ID`] != null && {
        tenantId: process.env[`${ENV_PREFIX}WORKDAY_TENANT_ID`],
      }),
    };
  }
  return raw;
}

function parseConfigFile(path: string): unknown {
  const content = readFileSync(path, "utf-8");
  const ext = path.slice(path.lastIndexOf("."));
  if (ext === ".json") {
    return JSON.parse(content) as unknown;
  }
  throw new Error(`Unsupported config file extension: ${ext}`);
}

export type LoadConfigOptions = {
  configPath?: string;
  /**
   * Base directory for resolving relative `configPath`.
   * If omitted, uses `process.cwd()`. Ignored when `configPath` is absolute.
   */
  configBasePath?: string;
};

export function loadConfig(options: LoadConfigOptions = {}): ServerConfig {
  const envRaw = fromEnv();

  let fileRaw: unknown = {};
  if (options.configPath) {
    const base = options.configBasePath ?? process.cwd();
    const resolved = isAbsolute(options.configPath)
      ? options.configPath
      : resolve(base, options.configPath);
    fileRaw = parseConfigFile(resolved);
  }

  const merged = deepMerge(
    defaultConfigObject(),
    typeof fileRaw === "object" && fileRaw !== null
      ? (fileRaw as Record<string, unknown>)
      : {},
    envRaw as Record<string, unknown>
  );

  deriveWorkdayBaseUrlFromTenant(merged);

  return serverConfigSchema.parse(merged);
}

const DEFAULT_WORKDAY_API_HOST = "wd2-impl-services1.workday.com";

/** When workday.baseUrl is missing and workday.tenantId is set, set baseUrl to the Recruiting API URL. */
function deriveWorkdayBaseUrlFromTenant(merged: Record<string, unknown>): void {
  const workday = merged.workday as Record<string, unknown> | undefined;
  if (!workday) return;
  const baseUrl = workday.baseUrl as string | undefined;
  if (baseUrl != null && baseUrl !== "") return;
  const tenantId = workday.tenantId as string | undefined;
  if (tenantId == null || tenantId === "") return;
  (merged.workday as Record<string, unknown>).baseUrl =
    `https://${DEFAULT_WORKDAY_API_HOST}/ccx/api/v1/${tenantId}`;
}

function defaultConfigObject(): Record<string, unknown> {
  return {
    name: "@workday-mcp/server",
    version: "0.0.1",
    transport: "http",
    logLevel: "info",
    auth: { type: "none" },
    workday: {},
    http: { port: 8787, host: "127.0.0.1", path: "/mcp" },
  };
}

function deepMerge(
  target: Record<string, unknown>,
  ...sources: Record<string, unknown>[]
): Record<string, unknown> {
  const out = { ...target };
  for (const src of sources) {
    for (const key of Object.keys(src)) {
      const srcVal = src[key];
      if (srcVal === undefined) continue;
      const outVal = out[key];
      if (
        typeof outVal === "object" &&
        outVal !== null &&
        typeof srcVal === "object" &&
        srcVal !== null &&
        !Array.isArray(outVal) &&
        !Array.isArray(srcVal)
      ) {
        (out as Record<string, unknown>)[key] = deepMerge(
          outVal as Record<string, unknown>,
          srcVal as Record<string, unknown>
        );
      } else {
        (out as Record<string, unknown>)[key] = srcVal;
      }
    }
  }
  return out;
}
