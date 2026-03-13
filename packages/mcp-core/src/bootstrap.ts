import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { buildServer } from "./buildServer.js";
import { attachHttpTransport } from "./transport/startHttpServer.js";
import { attachStdioTransport } from "./transport/startStdioServer.js";
import { type ToolRegistrar } from "./register.js";

export type BootstrapOptions = {
  configPath?: string;
  /** Base directory for resolving relative configPath. */
  configBasePath?: string;
  /** Extra registrar run after the default one (e.g. Workday tools). */
  registerTools?: ToolRegistrar;
};

export type BootstrapHandle = {
  server: McpServer;
  /** Present when transport is HTTP. */
  url?: string;
  close: () => Promise<void>;
};

export async function bootstrap(
  options: BootstrapOptions = {}
): Promise<BootstrapHandle> {
  const { server, services, config } = await buildServer({
    configPath: options.configPath,
    configBasePath: options.configBasePath,
    registerTools: options.registerTools,
  });

  if (config.transport === "stdio") {
    return attachStdioTransport({ server });
  }

  const httpConfig = config.http ?? {
    port: 8787,
    host: "127.0.0.1",
    path: "/mcp",
  };
  return attachHttpTransport({
    server,
    httpConfig,
    logger: services.logger,
  });
}
