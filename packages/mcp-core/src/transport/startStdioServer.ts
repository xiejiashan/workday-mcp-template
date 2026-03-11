import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Internal: attaches stdio transport to an existing MCP server.
 * Called by bootstrap when config.transport === "stdio".
 */
export type AttachStdioTransportOptions = {
  server: McpServer;
};

export type AttachStdioTransportResult = {
  server: McpServer;
  close: () => Promise<void>;
};

export async function attachStdioTransport(
  options: AttachStdioTransportOptions
): Promise<AttachStdioTransportResult> {
  const { server } = options;
  const transport = new StdioServerTransport();
  await server.connect(transport);

  return {
    server,
    close: async () => {
      await Promise.allSettled([server.close(), transport.close()]);
    },
  };
}
