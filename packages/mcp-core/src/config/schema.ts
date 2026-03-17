import { z } from "zod";

export const transportSchema = z.enum(["stdio", "http"]);
export type Transport = z.infer<typeof transportSchema>;

export const authConfigSchema = z.object({
  type: z.enum(["basic", "oauthClientCredentials"]).default("basic"),
  /** OAuth2 client_credentials token endpoint URL. Required when type is oauthClientCredentials. */
  tokenUrl: z.string().url().optional(),
  /** OAuth2 client id. */
  clientId: z.string().optional(),
  /** OAuth2 client secret. */
  clientSecret: z.string().optional(),
  /** Basic username. */
  username: z.string().optional(),
  /** Basic password. */
  password: z.string().optional(),
});
export type AuthConfig = z.infer<typeof authConfigSchema>;

export const workdayConfigSchema = z.object({
  tenantId: z.string().optional(),
  /** Base URL for Workday/OpenAPI-backed tools. When unset, derived from tenantId when set. */
  baseUrl: z.string().url().optional(),
});
export type WorkdayConfig = z.infer<typeof workdayConfigSchema>;

export const httpTransportConfigSchema = z.object({
  port: z.coerce.number().int().min(1).max(65535).default(8787),
  host: z.string().default("127.0.0.1"),
  path: z.string().default("/mcp"),
});
export type HttpTransportConfig = z.infer<typeof httpTransportConfigSchema>;

export const serverConfigSchema = z.object({
  name: z.string().default("@workday-mcp/server"),
  version: z.string().default("0.0.1"),
  transport: transportSchema.default("http"),
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  auth: authConfigSchema.default({ type: "basic" }),
  workday: workdayConfigSchema.default({}),
  http: httpTransportConfigSchema.optional(),
});
export type ServerConfig = z.infer<typeof serverConfigSchema>;
