import { normalizeQuery } from '../chat-cache-store'

describe('chat-cache-store', () => {
  it('normalizes query casing and whitespace', () => {
    expect(normalizeQuery('  Who   Founded   OtherDev?  ')).toBe('who founded otherdev?')
  })
})
