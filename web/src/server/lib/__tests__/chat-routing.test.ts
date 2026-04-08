import { classifyChatRoute, detectQueryQuality, shouldUseRagFromDecision } from '../chat-routing'

describe('chat-routing', () => {
  it('does not use RAG for non-domain geopolitical queries', () => {
    const query = 'what about iran us war in 2026'
    const decision = classifyChatRoute(query, detectQueryQuality(query))

    expect(decision.route).toBe('general_chat')
    expect(shouldUseRagFromDecision(decision)).toBe(false)
  })

  it('uses RAG for strong OtherDev domain questions', () => {
    const query = 'Tell me about OtherDev SaaS projects and services in Karachi'
    const decision = classifyChatRoute(query, detectQueryQuality(query))

    expect(decision.route).toBe('otherdev_rag')
    expect(shouldUseRagFromDecision(decision)).toBe(true)
  })

  it('uses RAG for weak OtherDev domain signals', () => {
    const query = 'What services do you offer?'
    const decision = classifyChatRoute(query, detectQueryQuality(query))

    expect(decision.route).toBe('otherdev_no_rag')
    expect(shouldUseRagFromDecision(decision)).toBe(true)
  })

  it('asks for clarification on mixed domain + non-domain prompts', () => {
    const query = 'Can OtherDev build a SaaS app and what is the latest update on Iran war news?'
    const decision = classifyChatRoute(query, detectQueryQuality(query))

    expect(decision.route).toBe('clarify')
    expect(shouldUseRagFromDecision(decision)).toBe(false)
  })

  it('does not trigger RAG when query is a non-domain question followed by pasted assistant text', () => {
    const query = `what about iran us war in 2026

I'm focused on helping you with web development, design, and technology solutions from Other Dev.`
    const decision = classifyChatRoute(query, detectQueryQuality(query))

    expect(shouldUseRagFromDecision(decision)).toBe(false)
  })
})
