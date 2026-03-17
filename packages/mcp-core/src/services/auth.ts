import type { Auth, HttpClient, Logger } from "./types.js";
import type { ServerConfig } from "../config/schema.js";

export function createAuth(config: ServerConfig): Auth {
  const { auth: authConfig } = config;
  return {
    async validate(): Promise<boolean> {
      if (authConfig.type === "basic") return true;
      if (authConfig.type === "oauthClientCredentials") {
        // Outbound-only auth: we validate by successfully fetching an access token when needed.
        return true;
      }
      return false;
    },
  };
}

let cachedAccessToken: string | undefined;
let cachedExpiresAt = 0;
const TOKEN_EXPIRY_SKEW_MS = 30_000;

export async function fetchAccessToken(
  config: ServerConfig,
  httpClient: HttpClient,
  logger: Logger
): Promise<string> {
  const auth = config.auth;
  const now = Date.now();
  if (cachedAccessToken && cachedExpiresAt - TOKEN_EXPIRY_SKEW_MS > now) {
    return cachedAccessToken;
  }

  if (!auth.tokenUrl) {
    throw new Error("auth.tokenUrl is required for oauthClientCredentials");
  }
  if (!auth.clientId || !auth.clientSecret) {
    throw new Error(
      "auth.clientId and auth.clientSecret are required for oauthClientCredentials"
    );
  }

  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");
  body.set("client_id", auth.clientId);
  body.set("client_secret", auth.clientSecret);

  logger.debug("Requesting OAuth access token from %s", auth.tokenUrl);

  const res = await httpClient.fetch(auth.tokenUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${auth.clientId}:${auth.clientSecret}`
      ).toString("base64")}`,
    },
    body: body.toString(),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch (err) {
    logger.error("Failed to parse OAuth token response JSON", err);
    throw new Error("Failed to parse OAuth token response JSON");
  }

  const token = (json as { access_token?: string }).access_token;
  if (!res.ok || !token) {
    logger.warn(
      "OAuth token request failed: %s %s",
      res.status,
      res.statusText
    );
    throw new Error("OAuth token request failed");
  }

  const expiresInSeconds =
    (json as { expires_in?: number }).expires_in &&
    Number.isFinite((json as { expires_in?: number }).expires_in)
      ? (json as { expires_in?: number }).expires_in!
      : 3600;
  cachedAccessToken = token;
  cachedExpiresAt = now + expiresInSeconds * 1000;

  return token;
}
