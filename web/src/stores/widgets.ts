import { atom, computed } from 'nanostores'

/**
 * Shared widget visibility state.
 * Use $activeWidget to coordinate mutual-exclusion between chat and agent widgets.
 * Only one widget can be open at a time ('none' | 'chat' | 'agent').
 */
export type ActiveWidget = 'none' | 'chat' | 'agent'

export const $activeWidget = atom<ActiveWidget>('none')

/** True when the chat widget is open */
export const $chatOpen = computed($activeWidget, (w: ActiveWidget) => w === 'chat')

/** True when the agent widget is open */
export const $agentOpen = computed($activeWidget, (w: ActiveWidget) => w === 'agent')

export function openChat() {
  $activeWidget.set('chat')
}

export function openAgent() {
  $activeWidget.set('agent')
}

export function closeActiveWidget() {
  $activeWidget.set('none')
}
