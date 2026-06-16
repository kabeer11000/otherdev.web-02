/**
 * Contact dialog state.
 * $contactStep: 'intro' | 'form' — wizard step
 * $contactPending: whether a submission is in-flight
 */

import { atom } from 'nanostores'

export type ContactStep = 'intro' | 'form'

export const $contactStep = atom<ContactStep>('intro')
export const $contactPending = atom(false)
