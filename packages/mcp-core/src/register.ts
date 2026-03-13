import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Services } from "./services/types.js";

export type ToolRegistrar = (
  server: McpServer,
  services: Services
) => void | Promise<void>;
