/**
 * Navigation UI state.
 * $mobileMenuOpen: persisted to sessionStorage so menu stays open on page refresh
 * $contactDialogOpen: ephemeral, not persisted
 */

import { atom } from 'nanostores'

export const $mobileMenuOpen = atom(false)
export const $contactDialogOpen = atom(false)
