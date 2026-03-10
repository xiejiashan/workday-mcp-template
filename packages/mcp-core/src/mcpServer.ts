import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export type CreateMcpServerOptions = {
  name?: string;
  version?: string;
};

export function createMcpServer(
  options: CreateMcpServerOptions = {}
): McpServer {
  const server = new McpServer({
    name: options.name ?? "@workday-mcp/server",
    version: options.version ?? "0.0.1",
  });

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

  return server;
}
