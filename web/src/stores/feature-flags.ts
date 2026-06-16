/**
 * Feature flags with URL override support.
 *
 * Usage:
 *   isFeatureEnabled('USE_AI_SDK_CHAT')    // boolean
 *   setFeatureFlag('USE_AI_SDK_CHAT', true) // persists to URL params
 *
 * URL overrides: ?flag_USE_AI_SDK_CHAT=true
 */

import { atom } from 'nanostores'
import { map, type MapStore } from 'nanostores'

const FEATURE_FLAGS = {
  USE_AI_SDK_CHAT: false,
  USE_AI_SDK_ATTACHMENTS: false,
  USE_AI_SDK_TOOLS: false,
} as const

export type FeatureFlag = keyof typeof FEATURE_FLAGS

type FeatureFlagsMap = {
  [K in FeatureFlag]: boolean
}

// Atom-based map for fast synchronous reads
export const $featureFlags: MapStore<FeatureFlagsMap> = map(
  Object.fromEntries(Object.entries(FEATURE_FLAGS).map(([k, v]) => [k, v])) as FeatureFlagsMap
)

/** Sync URL overrides into the store on first client load. */
export function syncFeatureFlagsFromUrl(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  for (const key of Object.keys(FEATURE_FLAGS) as FeatureFlag[]) {
    const override = params.get(`flag_${key}`)
    if (override !== null) {
      $featureFlags.setKey(key, override === 'true')
    }
  }
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  // Check URL override first (only on client)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const override = params.get(`flag_${flag}`)
    if (override !== null) return override === 'true'
  }
  return $featureFlags.get()[flag]
}

export function setFeatureFlag(flag: FeatureFlag, enabled: boolean): void {
  if (typeof window === 'undefined') return
  $featureFlags.setKey(flag, enabled)
  const params = new URLSearchParams(window.location.search)
  params.set(`flag_${flag}`, enabled.toString())
  window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
}
