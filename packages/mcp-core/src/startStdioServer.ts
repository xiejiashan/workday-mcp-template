import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { createMcpServer } from "./mcpServer.ts";

export type StartStdioServerOptions = {
  /**
   * Provide an already-configured McpServer. If omitted, `createMcpServer()` is used.
   */
  server?: McpServer;
};

export type StartedStdioServer = {
  server: McpServer;
  transport: StdioServerTransport;
  close: () => Promise<void>;
};

export async function startStdioServer(
  options: StartStdioServerOptions = {}
): Promise<StartedStdioServer> {
  const mcpServer = options.server ?? createMcpServer();
  const transport = new StdioServerTransport();

  await mcpServer.connect(transport);

  return {
    server: mcpServer,
    transport,
    close: async () => {
      await Promise.allSettled([mcpServer.close(), transport.close()]);
    },
  };
}
