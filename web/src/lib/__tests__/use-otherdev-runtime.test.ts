// Tests for the pure mapping logic used inside onNew.

type AssistantUiImage = { type: 'image'; image: string }
type AssistantUiText = { type: 'text'; text: string }
type AttachmentContent = AssistantUiImage | AssistantUiText

type GroqImage = { type: 'image_url'; image_url: { url: string } }
type GroqText = { type: 'text'; text: string }

function mapAttachmentContentToGroq(content: AttachmentContent[]): (GroqImage | GroqText)[] {
  return content.map(c => {
    if (c.type === 'image') {
      return { type: 'image_url', image_url: { url: c.image } } as GroqImage
    }
    return c as GroqText
  })
}

function extractAttachmentData(attachments: Array<{ content?: AttachmentContent[] }>) {
  const allContent = attachments.flatMap(a => a.content ?? [])
  const hasImages = allContent.some(c => c.type === 'image')
  const imageUrls = allContent
    .filter((c): c is AssistantUiImage => c.type === 'image')
    .map(c => ({ url: c.image }))
  const fileTexts = allContent
    .filter((c): c is AssistantUiText => c.type === 'text')
    .map(c => c.text)
  return { hasImages, imageUrls, fileTexts }
}

describe('attachment content to Groq API format mapping', () => {
  it('maps image content to image_url format', () => {
    const result = mapAttachmentContentToGroq([
      { type: 'image', image: 'data:image/png;base64,abc' },
    ])
    expect(result[0].type).toBe('image_url')
    expect((result[0] as GroqImage).image_url.url).toBe('data:image/png;base64,abc')
  })

  it('passes text content through unchanged', () => {
    const result = mapAttachmentContentToGroq([{ type: 'text', text: '[File: doc.pdf]\ncontent' }])
    expect(result[0].type).toBe('text')
    expect((result[0] as GroqText).text).toBe('[File: doc.pdf]\ncontent')
  })

  it('maps mixed image and text correctly', () => {
    const result = mapAttachmentContentToGroq([
      { type: 'image', image: 'data:image/png;base64,img1' },
      { type: 'text', text: 'notes' },
    ])
    expect(result[0].type).toBe('image_url')
    expect(result[1].type).toBe('text')
  })

  it('returns empty array for empty input', () => {
    expect(mapAttachmentContentToGroq([])).toEqual([])
  })
})

describe('extractAttachmentData', () => {
  it('sets hasImages true when image content present', () => {
    const { hasImages } = extractAttachmentData([
      { content: [{ type: 'image', image: 'data:image/png;base64,x' }] },
    ])
    expect(hasImages).toBe(true)
  })

  it('sets hasImages false when no image content', () => {
    const { hasImages } = extractAttachmentData([{ content: [{ type: 'text', text: 'content' }] }])
    expect(hasImages).toBe(false)
  })

  it('extracts imageUrls as { url } objects', () => {
    const { imageUrls } = extractAttachmentData([
      { content: [{ type: 'image', image: 'data:image/jpeg;base64,y' }] },
    ])
    expect(imageUrls).toEqual([{ url: 'data:image/jpeg;base64,y' }])
  })

  it('extracts fileTexts across multiple attachments', () => {
    const { fileTexts } = extractAttachmentData([
      { content: [{ type: 'text', text: '[File: a.txt]\nhello' }] },
      { content: [{ type: 'text', text: '[File: b.pdf]\nworld' }] },
    ])
    expect(fileTexts).toEqual(['[File: a.txt]\nhello', '[File: b.pdf]\nworld'])
  })

  it('handles attachments with undefined content', () => {
    const { hasImages, imageUrls, fileTexts } = extractAttachmentData([{ content: undefined }])
    expect(hasImages).toBe(false)
    expect(imageUrls).toEqual([])
    expect(fileTexts).toEqual([])
  })

  it('collects multiple images across attachments', () => {
    const { imageUrls } = extractAttachmentData([
      { content: [{ type: 'image', image: 'data:image/png;base64,img1' }] },
      { content: [{ type: 'image', image: 'data:image/jpeg;base64,img2' }] },
    ])
    expect(imageUrls).toHaveLength(2)
  })
})
