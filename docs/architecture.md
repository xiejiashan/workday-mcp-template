# High-Level Architecture

The architecture separates MCP infrastructure from business adapters.

AI Client / Agent
│
▼
MCP Server
│
▼
Tool Registry
│
▼
Policy + Validation Layer
│
▼
Tenant Adapter
│
▼
Workday tenant

## MCP Server Bootstrap

The recommended way to run the MCP server is via **bootstrap**: a single entry point that loads config, initializes services, creates the server, registers tools/resources/prompts, and attaches the transport.

**Flow:** Load config → Initialize services (logger, auth, http client, Workday clients) → Create MCP server instance → Register tools/resources/prompts → Attach transport (stdio or HTTP) → Start listening.

**Usage:** Call `bootstrap({ configPath?: string, registerTools?: ToolRegistrar })` from `@workday-mcp/mcp-core`. The demo app uses it for both HTTP (`pnpm --filter @workday-mcp/server-demo dev`) and stdio (`pnpm --filter @workday-mcp/server-demo dev:stdio`).

**Config:** Env vars (e.g. `PORT`, `HOST`, `MCP_TRANSPORT`, `LOG_LEVEL`) with optional JSON config file. Validated with Zod.

- **transport:** `"stdio"` or `"http"` (default `"http"`).
- **http:** When transport is HTTP: `port` (default 8787), `host` (default 127.0.0.1), `path` (default `/mcp`).
- **logLevel:** `"debug"` | `"info"` | `"warn"` | `"error"` (default `"info"`).
- **auth:** Placeholder: `{ type: "none" }` or `{ type: "apiKey", apiKey?: string }`.
- **workday:** Placeholder: `{ tenantId?: string, baseUrl?: string }` for future tenant wiring.
