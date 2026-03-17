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
Workday tenant

## MCP Server Bootstrap

The recommended way to run the MCP server is via **bootstrap**: a single entry point that loads config, initializes services, creates the server, registers tools/resources/prompts, and attaches the transport.

**Flow:** Load config → Initialize services (logger, auth, http client, Workday clients) → Create MCP server instance → Register tools/resources/prompts → Attach transport (stdio or HTTP) → Start listening.

**Usage:** Call `bootstrap({ configPath?: string, registerTools?: ToolRegistrar })` from `@workday-mcp/mcp-core`. The demo app uses it for both HTTP (`pnpm --filter @workday-mcp/server-demo dev`) and stdio (`pnpm --filter @workday-mcp/server-demo dev:stdio`).

**Config:** Env vars (e.g. `PORT`, `HOST`, `MCP_TRANSPORT`, `LOG_LEVEL`) with optional JSON config file. Validated with Zod.

- **transport:** `"stdio"` or `"http"` (default `"http"`).
- **http:** When transport is HTTP: `port` (default 8787), `host` (default 127.0.0.1), `path` (default `/mcp`).
- **logLevel:** `"debug"` | `"info"` | `"warn"` | `"error"` (default `"info"`).
- **auth:** Supports `{ type: "basic", username?: string, password?: string }` or `{ type: "oauthClientCredentials", tokenUrl?: string, clientId?: string, clientSecret?: string }`. For `oauthClientCredentials`, you can set values in config or via env (**`MCP_AUTH_TYPE=oauthClientCredentials`**, `MCP_AUTH_TOKEN_URL`, `MCP_AUTH_CLIENT_ID`, `MCP_AUTH_CLIENT_SECRET`). Tokens are fetched from `tokenUrl`, cached until `expires_in`, and injected as `Authorization: Bearer <token>` on outbound HTTP calls.
- **workday:** `{ tenantId?: string, baseUrl?: string }`. **baseUrl** is the base URL used for Workday/OpenAPI-backed tools (one URL for both).

## Validation

To confirm the demo server and the **listJobPostings** tool work:

1. **Start the server** (from repo root):  
   `pnpm --filter @workday-mcp/server-demo dev`  
   The server listens at `http://127.0.0.1:8787/mcp` (or the configured host/port/path).

2. **Call the tool** in one of these ways:
   - **Cursor:** Add an MCP server in Cursor settings pointing at the demo app (e.g. `http://127.0.0.1:8787/mcp`). In a chat, ask to list job postings; the **listJobPostings** tool should be used and return a response (or a clear error if `workday.baseUrl` is not configured or the API returns 401/404).
   - **Validation script:** With the server running, from repo root run:  
     `pnpm --filter @workday-mcp/server-demo validate:listJobPostings`  
     The script connects to the server, lists tools, calls **listJobPostings** with `{ limit: 5 }`, and prints the result.

Without valid **workday.baseUrl** (or tenant-derived URL) you get a tool error: `"workday.baseUrl not configured"`. Without valid auth for the Workday API (for example, misconfigured OAuth client credentials), the tool may return an HTTP error (e.g. 401). Use **config.example.json** as a reference for auth and tenant config and prefer env vars (for example, `MCP_AUTH_CLIENT_SECRET`) instead of putting secrets in the config file.
