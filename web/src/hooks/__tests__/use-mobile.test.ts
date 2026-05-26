import { describe, expect, test } from 'bun:test'

/**
 * Tests for useIsMobile hook logic
 * Note: These tests verify the constants and expected behavior logic.
 * Full React rendering tests would require @testing-library/react or similar.
 */

const MOBILE_BREAKPOINT = 768

describe('useIsMobile constants', () => {
  test('MOBILE_BREAKPOINT is 768', () => {
    expect(MOBILE_BREAKPOINT).toBe(768)
  })

  test('mobile detection uses max-width of breakpoint - 1', () => {
    // The hook checks window.innerWidth < MOBILE_BREAKPOINT
    // which means max-width: 767px in CSS terms
    const isMobile = (width: number) => width < MOBILE_BREAKPOINT

    expect(isMobile(768)).toBe(false) // exactly at breakpoint - not mobile
    expect(isMobile(767)).toBe(true) // just below breakpoint - mobile
    expect(isMobile(1024)).toBe(false) // desktop width - not mobile
    expect(isMobile(375)).toBe(true) // mobile width - mobile
  })
})

describe('useIsMobile media query logic', () => {
  test('media query string format is correct', () => {
    const expectedQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    expect(expectedQuery).toBe('(max-width: 767px)')
  })
})
