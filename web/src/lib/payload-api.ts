/**
 * Payload CMS API Client
 * Fetches blog content from Canvas (Payload CMS) API
 */

// Type definitions based on Payload collections
export interface BlogPost {
  id: number
  title: string
  slug: string
  content: string
  excerpt?: string
  status: 'draft' | 'published'
  author: {
    id: number
    email: string
  }
  featuredImage?: {
    id: number
    url: string
    alt: string
    filename: string
  }
  categories?: Category[]
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
}

export interface PayloadResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

class PayloadAPIClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.PAYLOAD_API_URL || 'http://localhost:3000'
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const res = await fetch(url, {
      next: { revalidate: 60 }, // Cache for 60 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Payload API error (${res.status}): ${error}`)
    }

    return res.json()
  }

  /**
   * Get all blog posts for a domain
   */
  async getBlogPosts(
    domain: string,
    options: { limit?: number; page?: number } = {}
  ): Promise<PayloadResponse<BlogPost>> {
    const { limit = 10, page = 1 } = options
    const params = new URLSearchParams({
      domain,
      limit: String(limit),
      page: String(page),
    })

    return this.fetch<PayloadResponse<BlogPost>>(`/api/public/blogs?${params}`)
  }

  /**
   * Get a single blog post by slug
   */
  async getBlogPost(slug: string, domain: string): Promise<BlogPost | null> {
    try {
      const params = new URLSearchParams({ domain })
      return await this.fetch<BlogPost>(`/api/public/blogs/${slug}?${params}`)
    } catch (error) {
      console.error('Error fetching blog post:', error)
      return null
    }
  }

  /**
   * Get all categories for a domain
   */
  async getCategories(domain: string): Promise<PayloadResponse<Category>> {
    const params = new URLSearchParams({ domain })
    return this.fetch<PayloadResponse<Category>>(`/api/public/categories?${params}`)
  }
}

export const payloadAPI = new PayloadAPIClient()
