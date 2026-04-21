// Groq models
// openai/gpt-oss-120b supports tool calling with parallelToolCalls
export const CHAT_MODEL = 'openai/gpt-oss-120b'
export const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

// MiniMax models (primary provider, text-only via AI SDK)
// M-series blocks image/document input on both Anthropic and OpenAI compatible endpoints.
// MiniMax-Text-01 supports vision but requires a higher plan tier — use Groq for vision.
export const MINIMAX_CHAT_MODEL = 'MiniMax-M2.7'
