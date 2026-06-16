/**
 * Shared artifact state for the Loom page.
 * Allows ChatCore and ArtifactRenderer to coordinate
 * without prop-drilling through multiple component layers.
 */

import { atom } from 'nanostores'
import type { ArtifactToolCall } from '@/components/artifact-renderer'

export const $activeArtifact = atom<ArtifactToolCall | null>(null)
