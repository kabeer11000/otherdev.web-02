// ─── Text Models ────────────────────────────────────────────────────────────────
// MiniMax-M3:           Primary — MiniMax direct (200k context, multimodal: text + image)
// @cf/moonshotai/kimi-k2.7-code: Fallback — Cloudflare Workers AI (256k ctx, reasoning, tools)

export const TEXT_MODEL = 'minimax/MiniMax-M3'
export const CF_FALLBACK_MODEL = '@cf/moonshotai/kimi-k2.7-code'
