import { z } from "zod";

export const transportSchema = z.enum(["stdio", "http"]);
export type Transport = z.infer<typeof transportSchema>;

export const authConfigSchema = z.object({
  type: z.enum(["none", "apiKey"]).default("none"),
  apiKey: z.string().optional(),
});
export type AuthConfig = z.infer<typeof authConfigSchema>;

export const workdayConfigSchema = z.object({
  tenantId: z.string().optional(),
  baseUrl: z.string().url().optional(),
});
export type WorkdayConfig = z.infer<typeof workdayConfigSchema>;

export const httpTransportConfigSchema = z.object({
  port: z.coerce.number().int().min(1).max(65535).default(8787),
  host: z.string().default("127.0.0.1"),
  path: z.string().default("/mcp"),
});
export type HttpTransportConfig = z.infer<typeof httpTransportConfigSchema>;

export const openapiConfigSchema = z.object({
  /** Base URL for OpenAPI-backed tools (e.g. https://api.example.com). */
  baseUrl: z.string().url().optional(),
});
export type OpenapiConfig = z.infer<typeof openapiConfigSchema>;

export const serverConfigSchema = z.object({
  name: z.string().default("@workday-mcp/server"),
  version: z.string().default("0.0.1"),
  transport: transportSchema.default("http"),
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  auth: authConfigSchema.default({ type: "none" }),
  workday: workdayConfigSchema.default({}),
  openapi: openapiConfigSchema.default({}),
  http: httpTransportConfigSchema.optional(),
});
export type ServerConfig = z.infer<typeof serverConfigSchema>;
