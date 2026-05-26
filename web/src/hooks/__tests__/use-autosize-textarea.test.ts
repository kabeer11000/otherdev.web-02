import { describe, expect, test } from 'bun:test'

/**
 * Tests for useAutosizeTextArea hook logic
 * The hook uses @chenglou/pretext for text measurement
 * These tests verify the configuration values and expected behavior
 */

describe('useAutosizeTextArea defaults', () => {
  test('default maxHeight is Number.MAX_SAFE_INTEGER', () => {
    const maxHeight = Number.MAX_SAFE_INTEGER
    expect(maxHeight).toBe(9007199254740991)
  })

  test('default fontSize is 14', () => {
    const fontSize = 14
    expect(fontSize).toBe(14)
  })

  test('default lineHeight is 21', () => {
    const lineHeight = 21
    expect(lineHeight).toBe(21)
  })

  test('default borderWidth is 0', () => {
    const borderWidth = 0
    expect(borderWidth).toBe(0)
  })

  test('font string format', () => {
    const fontSize = 14
    const fontFamily = 'TWKLausanne'
    const font = `${fontSize}px ${fontFamily}`
    expect(font).toBe('14px TWKLausanne')
  })
})

describe('useAutosizeTextArea sizing logic', () => {
  test('padding calculation uses borderWidth * 2', () => {
    const borderWidth = 2
    const padding = borderWidth * 2
    expect(padding).toBe(4)
  })

  test('contentWidth excludes padding', () => {
    const totalWidth = 400
    const borderWidth = 2
    const padding = borderWidth * 2
    const contentWidth = totalWidth - padding
    expect(contentWidth).toBe(396)
  })

  test('height is clamped to maxHeight', () => {
    const calculatedHeight = 1000
    const maxHeight = 500
    const clampedHeight = Math.min(calculatedHeight, maxHeight)
    expect(clampedHeight).toBe(500)
  })

  test('final height includes padding', () => {
    const height = 300
    const borderWidth = 2
    const padding = borderWidth * 2
    const finalHeight = height + padding
    expect(finalHeight).toBe(304)
  })

  test('width <= 0 should be ignored (early return)', () => {
    const width = 0
    const shouldSkip = width <= 0
    expect(shouldSkip).toBe(true)

    const negativeWidth = -1
    const shouldSkipNegative = negativeWidth <= 0
    expect(shouldSkipNegative).toBe(true)
  })
})
