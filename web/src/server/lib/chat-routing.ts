const CONVERSATIONAL_PHRASES = new Set([
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
]);

const ARTIFACT_INTENT_PATTERN =
  /\b(build|create|make|generate|write|design|code|demo|example|template|prototype|app|website|calculator|game|form|dashboard|visualization|chart|component|widget)\b/;

const DOMAIN_KEYWORD_PATTERNS = [
  /\bother\s*dev\b/i,
  /\botherdev\b/i,
  /\bfounder(s)?\b/i,
  /\bossaid\b/i,
  /\bkabeer\b/i,
  /\bkarachi\b/i,
  /\bservice(s)?\b/i,
  /\bcase stud(y|ies)\b/i,
  /\bportfolio\b/i,
  /\bproject(s)?\b/i,
  /\bagency\b/i,
  /\bstudio\b/i,
  /\bcontact\b/i,
  /\bweb(site)?\b/i,
  /\be-?commerce\b/i,
  /\bsaas\b/i,
  /\blegal tech\b/i,
  /\breal estate\b/i,
];

const NON_DOMAIN_KEYWORD_PATTERNS = [
  /\bwar\b/i,
  /\bnews\b/i,
  /\bpolitics?\b/i,
  /\belection(s)?\b/i,
  /\bpresident\b/i,
  /\bprime minister\b/i,
  /\bstock(s)?\b/i,
  /\bcrypto\b/i,
  /\bbitcoin\b/i,
  /\bweather\b/i,
  /\bsports?\b/i,
  /\biran\b/i,
  /\busa?\b/i,
  /\bisrael\b/i,
  /\brukraine\b/i,
  /\brussia\b/i,
  /\bgaza\b/i,
];

export interface QueryQuality {
  isLowQuality: boolean;
  isConversational: boolean;
  tokenCount: number;
  hasRepeatedWords: boolean;
  needsArtifact: boolean;
}

export type ChatRoute =
  | "otherdev_rag"
  | "otherdev_no_rag"
  | "general_chat"
  | "clarify";

export interface ChatRouteDecision {
  route: ChatRoute;
  confidence: number;
  reason: string;
  domainHits: number;
  nonDomainHits: number;
}

function countPatternHits(input: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => {
    if (pattern.test(input)) return count + 1;
    return count;
  }, 0);
}

export function detectQueryQuality(query: string): QueryQuality {
  const normalized = query.toLowerCase().trim();
  const tokens = normalized.split(/\s+/).filter((token) => token.length > 0);
  const uniqueTokens = new Set(tokens);

  const isConversational =
    CONVERSATIONAL_PHRASES.has(normalized) ||
    (tokens.length > 0 && tokens.every((token) => CONVERSATIONAL_PHRASES.has(token)));

  const hasRepeatedWords =
    tokens.length > 0 && uniqueTokens.size < tokens.length * 0.6;
  const isLowQuality = tokens.length < 3 || hasRepeatedWords || isConversational;

  return {
    isLowQuality,
    isConversational,
    tokenCount: tokens.length,
    hasRepeatedWords,
    needsArtifact: ARTIFACT_INTENT_PATTERN.test(normalized),
  };
}

export function classifyChatRoute(
  rawQuery: string,
  queryQuality: QueryQuality,
): ChatRouteDecision {
  const query = rawQuery.trim();

  if (query.length === 0) {
    return {
      route: "clarify",
      confidence: 1,
      reason: "empty-query",
      domainHits: 0,
      nonDomainHits: 0,
    };
  }

  if (queryQuality.isConversational) {
    return {
      route: "general_chat",
      confidence: 0.95,
      reason: "conversational-input",
      domainHits: 0,
      nonDomainHits: 0,
    };
  }

  const domainHits = countPatternHits(query, DOMAIN_KEYWORD_PATTERNS);
  const nonDomainHits = countPatternHits(query, NON_DOMAIN_KEYWORD_PATTERNS);
  const hasOtherDevBrand = /\bother\s*dev\b|\botherdev\b/i.test(query);

  if (nonDomainHits > 0 && domainHits === 0) {
    return {
      route: "general_chat",
      confidence: 0.95,
      reason: "non-domain-topic",
      domainHits,
      nonDomainHits,
    };
  }

  if (domainHits >= 2 && nonDomainHits === 0) {
    return {
      route: "otherdev_rag",
      confidence: 0.95,
      reason: "strong-domain-signal",
      domainHits,
      nonDomainHits,
    };
  }

  if (domainHits >= 1 && nonDomainHits === 0) {
    return {
      route: "otherdev_no_rag",
      confidence: 0.8,
      reason: "weak-domain-signal",
      domainHits,
      nonDomainHits,
    };
  }

  if (domainHits >= 2 && nonDomainHits > 0 && hasOtherDevBrand) {
    return {
      route: "clarify",
      confidence: 0.75,
      reason: "mixed-domain-and-non-domain",
      domainHits,
      nonDomainHits,
    };
  }

  return {
    route: "general_chat",
    confidence: 0.7,
    reason: "default-general",
    domainHits,
    nonDomainHits,
  };
}

export function shouldUseRagFromDecision(decision: ChatRouteDecision): boolean {
  return decision.route === "otherdev_rag";
}
