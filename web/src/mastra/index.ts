import { Mastra } from "@mastra/core";
import { PostgresStore } from "@mastra/core/storage";
import { otherDevAgent } from "./agents/otherdev-agent";

const storage = new PostgresStore({
  connectionString: process.env.MASTRA_POSTGRES_CONNECTION_STRING!,
});

export const mastra = new Mastra({
  agents: {
    otherDevAgent,
  },
  storage,
  logger: {
    level: (process.env.MASTRA_LOG_LEVEL as any) || "info",
    type: "json",
  },
});

export { otherDevAgent };
