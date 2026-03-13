import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { loadConfig } from "./config/load.js";
import type { ServerConfig } from "./config/schema.js";
import { createMcpServer } from "./mcpServer.js";
import { createServices } from "./services/index.js";
import type { Services } from "./services/types.js";
import { type ToolRegistrar } from "./register.js";

export type BuildServerOptions = {
  configPath?: string;
  configBasePath?: string;
  registerTools?: ToolRegistrar;
};

export type BuildServerResult = {
  server: McpServer;
  services: Services;
  config: ServerConfig;
};

/**
 * Loads config, creates services, creates a bare MCP server, and registers tools when registerTools is provided.
 * Used by bootstrap; tools are passed in (e.g. from server-demo via bootstrap({ registerTools })).
 */
export async function buildServer(
  options: BuildServerOptions = {}
): Promise<BuildServerResult> {
  const config = loadConfig({
    configPath: options.configPath,
    configBasePath: options.configBasePath,
  });
  const services = createServices(config);
  const server = createMcpServer({
    name: config.name,
    version: config.version,
  });

  if (options.registerTools) {
    await Promise.resolve(options.registerTools(server, services));
  }
  return { server, services, config };
}
