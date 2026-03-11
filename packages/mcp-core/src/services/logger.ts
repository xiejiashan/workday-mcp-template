import type { Logger } from "./types.js";
import type { ServerConfig } from "../config/schema.js";

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;

export function createLogger(config: ServerConfig): Logger {
  const level = LEVELS[config.logLevel];
  const log =
    (name: keyof Logger) =>
    (message: string, ...args: unknown[]) => {
      if (LEVELS[name as keyof typeof LEVELS] >= level) {
        const fn = name === "error" ? console.error : console.log;
        fn(`[${name}]`, message, ...args);
      }
    };
  return {
    debug: log("debug"),
    info: log("info"),
    warn: log("warn"),
    error: log("error"),
  };
}
