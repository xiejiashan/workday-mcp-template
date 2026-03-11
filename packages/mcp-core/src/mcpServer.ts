import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export type CreateMcpServerOptions = {
  name?: string;
  version?: string;
};

/** Creates an MCP server with no tools/resources/prompts (for use with bootstrap + registrar). */
export function createBareMcpServer(
  options: CreateMcpServerOptions = {}
): McpServer {
  return new McpServer({
    name: options.name ?? "@workday-mcp/server",
    version: options.version ?? "0.0.1",
  });
}

export function createMcpServer(
  options: CreateMcpServerOptions = {}
): McpServer {
  const server = createBareMcpServer(options);
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
