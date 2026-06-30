// ─── Text Models ────────────────────────────────────────────────────────────────
// MiniMax-M3:           Primary — MiniMax BYOK (200k context, multimodal: text + image)
// groq/gpt-oss-120b:   First fallback — Groq BYOK
// cerebras/qwen-3-235b: Second fallback — Cerebras BYOK
// cohere/command-a:     Third fallback — Cohere BYOK

export const TEXT_MODEL = 'minimax/MiniMax-M3'
export const TEXT_MODEL_FALLBACK = 'groq/gpt-oss-120b'
export const TEXT_MODEL_FALLBACK_2 = 'cerebras/qwen-3-235b'
export const TEXT_MODEL_FALLBACK_3 = 'cohere/command-a'
