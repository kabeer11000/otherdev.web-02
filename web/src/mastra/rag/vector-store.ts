import { PgVector } from "@mastra/pg";

export const vectorStore = new PgVector({
  connectionString: process.env.MASTRA_POSTGRES_CONNECTION_STRING!,
});
