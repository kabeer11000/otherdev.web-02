export type ChatRoute =
  | 'otherdev_rag'
  | 'otherdev_no_rag'
  | 'general_chat'
  | 'clarify'

export interface QueryQuality {
  isConversational: boolean
  isLowQuality: boolean
  hasRepeatedWords: boolean
  tokenCount: number
  needsArtifact: boolean
}

const KEYWORDS_OTHERDEV = [
  'other dev',
  'otherdev',
  'website',
  'web development',
  'web design',
  'design studio',
  'agency',
  'portfolio',
  'ecommerce',
  'e-commerce',
  ' Karachi',
  'Pakistan',
  'project',
  'service',
  'capability',
  'technology',
  'tech stack',
  'team',
  'founder',
  'founder',
  'founder',
  'contact',
  'price',
  'cost',
  'quote',
  'hire',
  'developer',
  'designer',
]

const LOW_QUALITY_PATTERNS = [
  /^[.\s]*$/,
  /^(\w+)\s+\1{2,}$/i,
  /^[^a-zA-Z]*$/,
]

export function detectQueryQuality(query: string): QueryQuality {
  const trimmed = query.trim()
  const tokenCount = trimmed.split(/\s+/).filter(Boolean).length

  const isConversational =
    /^(hi|hello|hey|thanks?|thank you|ok|okay|sure|yes|no|bye|bye|greetings?\s*)/i.test(
      trimmed
    ) || tokenCount <= 3

  const hasRepeatedWords = /^(\w+)\s+\1{2,}$/i.test(trimmed)

  const isLowQuality =
    LOW_QUALITY_PATTERNS.some(pattern => pattern.test(trimmed)) || tokenCount === 0

  const needsArtifact =
    /\b(build|create|make|generate|design|develop|coding|programming|web\s*page|app|website)\b/i.test(
      trimmed
    ) && tokenCount >= 3

  return {
    isConversational,
    isLowQuality,
    hasRepeatedWords,
    tokenCount,
    needsArtifact,
  }
}

export function classifyChatRoute(
  query: string,
  quality: QueryQuality
): { route: ChatRoute; confidence: number } {
  const lowerQuery = query.toLowerCase()

  if (quality.isLowQuality || quality.tokenCount === 0) {
    return { route: 'clarify', confidence: 1.0 }
  }

  const otherdevKeywordCount = KEYWORDS_OTHERDEV.filter(keyword =>
    lowerQuery.includes(keyword.toLowerCase())
  ).length

  if (otherdevKeywordCount >= 1) {
    return { route: 'otherdev_rag', confidence: 0.9 }
  }

  if (quality.isConversational) {
    const conversationalScore = quality.tokenCount <= 2 ? 0.7 : 0.5
    return { route: 'otherdev_no_rag', confidence: conversationalScore }
  }

  if (otherdevKeywordCount === 0 && !quality.isConversational) {
    return { route: 'general_chat', confidence: 0.8 }
  }

  return { route: 'otherdev_no_rag', confidence: 0.6 }
}

export function shouldUseRagFromDecision(decision: { route: ChatRoute }): boolean {
  return decision.route === 'otherdev_rag'
}
