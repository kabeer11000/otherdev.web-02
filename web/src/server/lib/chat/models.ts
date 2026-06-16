// ─── Text Models ────────────────────────────────────────────────────────────────
// MiniMax-M2.7:         Primary — MiniMax BYOK (200k context, fast)
// groq/gpt-oss-120b:   First fallback — Groq BYOK
// cerebras/qwen-3-235b: Second fallback — Cerebras BYOK
// cohere/command-a:     Third fallback — Cohere BYOK

export const TEXT_MODEL = 'minimax/MiniMax-M2.7'
export const TEXT_MODEL_FALLBACK = 'groq/gpt-oss-120b'
export const TEXT_MODEL_FALLBACK_2 = 'cerebras/qwen-3-235b'
export const TEXT_MODEL_FALLBACK_3 = 'cohere/command-a'

// ─── Vision Models ────────────────────────────────────────────────────────────
// mistral/pixtral-large: Primary — Mistral BYOK
// groq/llama-4-scout:    Fallback — Groq BYOK

export const VISION_MODEL = 'mistral/pixtral-large'
export const VISION_MODEL_FALLBACK = 'groq/llama-4-scout-17b-16e-instruct'
