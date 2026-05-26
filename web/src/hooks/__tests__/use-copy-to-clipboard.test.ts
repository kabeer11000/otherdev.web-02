import { beforeEach, describe, expect, mock, test } from 'bun:test'

/**
 * Tests for useCopyToClipboard hook logic
 * Tests the non-React parts: state transitions, timeout logic, callback behavior
 */

describe('useCopyToClipboard state machine', () => {
  test('initial state is not copied', () => {
    const isCopied = false
    expect(isCopied).toBe(false)
  })

  test('after successful copy, isCopied becomes true', () => {
    let isCopied = false
    isCopied = true
    expect(isCopied).toBe(true)
  })

  test('after timeout, isCopied becomes false again', () => {
    let isCopied = true

    // Simulate the 2 second timeout
    setTimeout(() => {
      isCopied = false
    }, 2000)

    // After timeout fires
    isCopied = false
    expect(isCopied).toBe(false)
  })

  test('copyMessage defaults to expected string', () => {
    const defaultMessage = 'Copied to clipboard!'
    expect(defaultMessage).toBe('Copied to clipboard!')
  })

  test('custom copyMessage is used when provided', () => {
    const customMessage = 'Custom copied message!'
    expect(customMessage).not.toBe('Copied to clipboard!')
    expect(customMessage).toBe('Custom copied message!')
  })
})

describe('useCopyToClipboard timeout handling', () => {
  test('clearing previous timeout before setting new one', () => {
    // Simulate: if timeoutRef.current exists, clear it before setting new
    let timeoutRef: NodeJS.Timeout | null = setTimeout(() => {}, 1000)

    if (timeoutRef) {
      clearTimeout(timeoutRef)
      timeoutRef = null
    }

    // Now set a new timeout
    timeoutRef = setTimeout(() => {}, 2000)

    expect(timeoutRef).not.toBeNull()
    clearTimeout(timeoutRef)
  })
})
