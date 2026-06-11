// ─── Text Models ────────────────────────────────────────────────────────────────
// groq/gpt-oss-120b:   Primary — Groq BYOK
// cerebras/qwen-3-235b: First fallback — Cerebras BYOK
// cohere/command-a:     Second fallback — Cohere BYOK

export const TEXT_MODEL = 'groq/gpt-oss-120b'
export const TEXT_MODEL_FALLBACK = 'cerebras/qwen-3-235b'
export const TEXT_MODEL_FALLBACK_2 = 'cohere/command-a'

// ─── Vision Models ────────────────────────────────────────────────────────────
// mistral/pixtral-large: Primary — Mistral BYOK
// groq/llama-4-scout:    Fallback — Groq BYOK

export const VISION_MODEL = 'mistral/pixtral-large'
export const VISION_MODEL_FALLBACK = 'groq/llama-4-scout-17b-16e-instruct'