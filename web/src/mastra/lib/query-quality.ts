export interface QueryQuality {
  isLowQuality: boolean;
  isConversational: boolean;
  tokenCount: number;
  hasRepeatedWords: boolean;
}

export function detectQueryQuality(query: string): QueryQuality {
  const normalized = query.toLowerCase().trim();
  const tokens = normalized.split(/\s+/).filter((t) => t.length > 0);
  const uniqueTokens = new Set(tokens);

  const conversationalPhrases = [
    "ok",
    "okay",
    "sure",
    "thanks",
    "thank you",
    "yes",
    "no",
    "yeah",
    "yep",
    "nope",
    "cool",
    "nice",
    "great",
    "good",
    "alright",
    "hi",
    "hello",
    "hey",
  ];

  const isConversational =
    conversationalPhrases.includes(normalized) ||
    tokens.every((t) => conversationalPhrases.includes(t));

  const hasRepeatedWords =
    tokens.length > 0 && uniqueTokens.size < tokens.length * 0.6;

  const isLowQuality =
    tokens.length < 3 || hasRepeatedWords || isConversational;

  return {
    isLowQuality,
    isConversational,
    tokenCount: tokens.length,
    hasRepeatedWords,
  };
}

export function getAdaptiveThreshold(queryQuality: QueryQuality): number {
  const baseThreshold = Number.parseFloat(
    process.env.RAG_SIMILARITY_THRESHOLD || "0.1",
  );

  if (queryQuality.isConversational) return baseThreshold * 0.5;
  if (queryQuality.isLowQuality || queryQuality.hasRepeatedWords)
    return baseThreshold * 0.7;
  if (queryQuality.tokenCount < 5) return baseThreshold * 0.8;

  return baseThreshold;
}
