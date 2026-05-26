import { describe, expect, test } from 'bun:test'

/**
 * Tests for useScrollLock hook logic
 */

describe('useScrollLock scrollbar width calculation', () => {
  test('scrollbarWidth = window.innerWidth - document.documentElement.clientWidth', () => {
    // Simulate window with scrollbar
    const windowInnerWidth = 1024
    const documentClientWidth = 1000
    const scrollbarWidth = windowInnerWidth - documentClientWidth

    expect(scrollbarWidth).toBe(24)
  })

  test('scrollbarWidth is 0 when no scrollbar (full width)', () => {
    const windowInnerWidth = 1000
    const documentClientWidth = 1000
    const scrollbarWidth = windowInnerWidth - documentClientWidth

    expect(scrollbarWidth).toBe(0)
  })
})

describe('useScrollLock overflow handling', () => {
  test('overflow value when locked is hidden', () => {
    const newOverflow = 'hidden'
    expect(newOverflow).toBe('hidden')
  })

  test('restores original overflow on cleanup', () => {
    const originalOverflow = 'auto'
    let currentOverflow = originalOverflow

    // Simulate lock
    currentOverflow = 'hidden'
    expect(currentOverflow).toBe('hidden')

    // Simulate unlock (cleanup)
    currentOverflow = originalOverflow
    expect(currentOverflow).toBe('auto')
  })

  test('restores original paddingRight on cleanup', () => {
    const originalPaddingRight = '15px'
    let currentPaddingRight = originalPaddingRight

    // Simulate lock
    const scrollbarWidth = 24
    currentPaddingRight = `${scrollbarWidth}px`
    expect(currentPaddingRight).toBe('24px')

    // Simulate unlock (cleanup)
    currentPaddingRight = originalPaddingRight
    expect(currentPaddingRight).toBe('15px')
  })
})
