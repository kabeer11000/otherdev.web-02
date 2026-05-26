export interface MatchedDocument {
  id: string
  content: string
  metadata: {
    source: string
    title: string
    type: string
    category?: string
    subtype?: string
    project?: string
    year?: string
  }
  similarity: number
}

export interface SearchFilter {
  type?: string
  category?: string
  subtype?: string
  project?: string
  year?: string
}
