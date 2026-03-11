import type { Auth } from "./types.js";
import type { ServerConfig } from "../config/schema.js";

export function createAuth(config: ServerConfig): Auth {
  const { auth: authConfig } = config;
  return {
    async validate(token: string | undefined): Promise<boolean> {
      if (authConfig.type === "none") return true;
      if (authConfig.type === "apiKey") {
        return token === authConfig.apiKey;
      }
      return false;
    },
  };
}
