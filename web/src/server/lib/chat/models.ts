// ─── Text Models ──────────────────────────────────────────────────────────────
// groq/gpt-oss-120b:   Primary — Groq via Cloudflare AI Gateway
// cerebras/qwen-3-235b: First fallback — Cerebras via Cloudflare AI Gateway
// cohere/command-a:     Second fallback — Cohere via Cloudflare AI Gateway

export {
  groqTextModel as TEXT_MODEL,
  cerebrasTextModel as TEXT_MODEL_FALLBACK,
  cohereTextModel as TEXT_MODEL_FALLBACK_2,
} from "@/lib/cloudflare-gateway"

// ─── Vision Models ────────────────────────────────────────────────────────────
// mistral/pixtral-large: Primary — Mistral via Cloudflare AI Gateway
// groq/llama-4-scout:    Fallback — Groq via Cloudflare AI Gateway

export {
  mistralVisionModel as VISION_MODEL,
  groqVisionModel as VISION_MODEL_FALLBACK,
} from "@/lib/cloudflare-gateway"
