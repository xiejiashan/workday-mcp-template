/**
 * Simple MCP client for the server-demo (HTTP Streamable transport).
 *
 * Usage:
 * - List tools:
 *   pnpm --filter @workday-mcp/server-demo exec tsx scripts/mcp-client.ts -- --list-tools
 *
 * - Call a tool:
 *   pnpm --filter @workday-mcp/server-demo exec tsx scripts/mcp-client.ts -- --call listJobPostings --args '{"limit":5}'
 *
 * - Default smoke test (calls listJobPostings with { limit: 5 }):
 *   pnpm --filter @workday-mcp/server-demo exec tsx scripts/mcp-client.ts
 *
 * Environment:
 * - MCP_SERVER_URL (default http://127.0.0.1:8787/mcp)
 */
import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

type ParsedArgs = {
  baseUrl: URL;
  listTools: boolean;
  callName?: string;
  callArgs?: Record<string, unknown>;
};

function usage(exitCode: number): never {
  // Keep output minimal and script-friendly.
  console.error(
    [
      "Usage:",
      "  --list-tools",
      "  --call <toolName> [--args <json>]",
      "",
      "Examples:",
      "  --list-tools",
      "  --call listJobPostings --args '{\"limit\":5}'",
      "",
      "Env:",
      "  MCP_SERVER_URL=http://127.0.0.1:8787/mcp",
    ].join("\n")
  );
  process.exit(exitCode);
}

function parseCli(argv: string[]): ParsedArgs {
  const baseUrl = new URL(
    process.env.MCP_SERVER_URL ?? "http://127.0.0.1:8787/mcp"
  );

  let listTools = false;
  let callName: string | undefined;
  let argsJson: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") continue;
    if (a === "--help" || a === "-h") usage(0);
    if (a === "--list-tools") {
      listTools = true;
      continue;
    }
    if (a === "--call") {
      const next = argv[i + 1];
      if (!next || next.startsWith("-")) usage(2);
      callName = next;
      i++;
      continue;
    }
    if (a === "--args") {
      const next = argv[i + 1];
      if (!next) usage(2);
      argsJson = next;
      i++;
      continue;
    }
    // Unknown flag/arg
    usage(2);
  }

  let callArgs: Record<string, unknown> | undefined;
  if (argsJson != null) {
    try {
      const parsed = JSON.parse(argsJson) as unknown;
      if (
        parsed == null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        throw new Error("--args must be a JSON object");
      }
      callArgs = parsed as Record<string, unknown>;
    } catch (err) {
      console.error(
        JSON.stringify(
          { error: "Failed to parse --args JSON", details: String(err) },
          null,
          2
        )
      );
      process.exit(2);
    }
  }

  return { baseUrl, listTools, callName, callArgs };
}

const parsed = parseCli(process.argv.slice(2));

const client = new Client({ name: "server-demo-client", version: "0.0.1" });
const transport = new StreamableHTTPClientTransport(parsed.baseUrl);

await client.connect(transport);

try {
  if (parsed.listTools) {
    const { tools } = await client.listTools();
    console.log(JSON.stringify({ tools }, null, 2));
  }

  if (parsed.callName != null || !parsed.listTools) {
    const toolName = parsed.callName ?? "listJobPostings";
    const toolArgs = parsed.callArgs ?? { limit: 5 };

    const result = await client.callTool({
      name: toolName,
      arguments: toolArgs,
    });
    console.log(JSON.stringify({ tool: toolName, result }, null, 2));
  }
} finally {
  await transport.terminateSession();
  await client.close();
}
