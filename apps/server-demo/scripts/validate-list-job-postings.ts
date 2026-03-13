/**
 * Validates the listJobPostings tool by connecting to the running demo MCP server
 * and calling the tool. Run the server first: pnpm --filter @workday-mcp/server-demo dev
 *
 * Usage (from repo root): pnpm --filter @workday-mcp/server-demo exec tsx scripts/validate-list-job-postings.ts
 * Or with custom URL: MCP_SERVER_URL=http://127.0.0.1:8787/mcp pnpm ...
 */

import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const baseUrl = new URL(
  process.env.MCP_SERVER_URL ?? "http://127.0.0.1:8787/mcp"
);
const client = new Client({
  name: "validate-list-job-postings",
  version: "0.0.1",
});
const transport = new StreamableHTTPClientTransport(baseUrl);

await client.connect(transport);

const { tools } = await client.listTools();
const names = tools.map((t) => t.name);
console.log("Tools:", names.join(", "));
if (!names.includes("listJobPostings")) {
  console.error("Expected tool listJobPostings not found.");
  process.exit(1);
}

const result = await client.callTool({
  name: "listJobPostings",
  arguments: { limit: 5 },
});
console.log("listJobPostings result isError:", result.isError);
console.log(
  "listJobPostings content:",
  JSON.stringify(result.content, null, 2)
);

await transport.terminateSession();
await client.close();
console.log("Done.");
