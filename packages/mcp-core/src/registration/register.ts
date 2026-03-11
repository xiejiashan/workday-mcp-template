import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Services } from "../services/types.js";

export type ToolRegistrar = (
  server: McpServer,
  services: Services
) => void | Promise<void>;

export async function registerDefault(
  server: McpServer,
  _services: Services // reserved for future use (e.g. Workday tools)
): Promise<void> {
  void _services;
  server.registerTool(
    "ping",
    {
      title: "Ping",
      description: "Health check tool (returns pong).",
    },
    async () => ({
      content: [{ type: "text", text: "pong" }],
    })
  );
}
