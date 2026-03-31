import { cache } from "react";

const MODEL = "mistral-embed";
const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 1000;

// Cache embedding generation per-request to avoid duplicate API calls
// for the same text within a single request (e.g., retry logic)
export const generateEmbedding = cache(async function generateEmbedding(
  text: string,
): Promise<number[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch("https://api.mistral.ai/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: MODEL, input: [text] }),
        signal: controller.signal,
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const waitMs = retryAfter
          ? parseInt(retryAfter) * 1000
          : INITIAL_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000;

        console.log(
          `  Rate limited. Retrying in ${Math.round(waitMs)}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`,
        );

        if (attempt === MAX_RETRIES) {
          throw new Error(
            `Mistral API rate limit exceeded after ${MAX_RETRIES} retries`,
          );
        }

        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "unknown");
        throw new Error(`Mistral API error: ${response.status} - ${errorBody}`);
      }

      const data = (await response.json()) as {
        data: { embedding: number[] }[];
      };
      return data.data[0].embedding;
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES) {
        const waitMs = INITIAL_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(
          `  Error: ${lastError.message}. Retrying in ${Math.round(waitMs)}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  throw new Error("Failed to generate embedding", { cause: lastError });
});
