/**
 * Extract knowledge base from otherdev-web (v1) JSON files
 * Converts detailed project and service data into RAG-optimized chunks
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

interface KnowledgeDocument {
  content: string
  metadata: {
    source: string
    title: string
    type: 'project' | 'service' | 'about' | 'general'
    category?: string
  }
}

interface ProjectData {
  id: number
  title: string
  company: string
  year: string
  description: string
  url?: string
  page?: {
    excerpt?: string
    splitSections?: Array<{
      heading: string
      content: string
      tags?: string[]
    }>
    testimonial?: {
      content: string
      author: string
      role?: string
    }
  }
}

interface ServiceData {
  id: string
  title: string
  description: string
  excerpt: string
  keywords: string
  startingPrice?: number
  pricingTiers?: Array<{
    name: string
    price: number
    features: string[]
  }>
  processSteps?: Array<{
    title: string
    description: string
  }>
  benefits?: string[]
  page?: {
    splitSections?: Array<{
      heading: string
      content: string
    }>
    testimonials?: Array<{
      content: string
      author: string
    }>
  }
}

const V1_PATH = 'D:\\work\\otherdev-web\\src\\data\\en'
const OUTPUT_PATH = join(__dirname, '..', 'src', 'lib', 'knowledge-base.ts')

function extractProjectDocuments(projects: ProjectData[]): KnowledgeDocument[] {
  const documents: KnowledgeDocument[] = []

  for (const project of projects) {
    // 1. Main project overview
    documents.push({
      content: `${project.title} (${project.year}): ${project.description}${
        project.page?.excerpt ? ` ${project.page.excerpt}` : ''
      }${project.url ? ` Visit: ${project.url}` : ''}`,
      metadata: {
        source: 'projects',
        title: project.title,
        type: 'project',
        category: deriveProjectCategory(project.title),
      },
    })

    // 2. Detailed sections (if available)
    if (project.page?.splitSections) {
      for (const section of project.page.splitSections) {
        if (!section.content || section.content.trim().length < 50) continue

        const tags = section.tags ? ` Technologies: ${section.tags.join(', ')}.` : ''

        documents.push({
          content: `${project.title} - ${section.heading}: ${section.content}${tags}`,
          metadata: {
            source: 'projects',
            title: `${project.company} - ${section.heading}`,
            type: 'project',
            category: deriveProjectCategory(project.title),
          },
        })
      }
    }

    // 3. Client testimonial (if available)
    if (project.page?.testimonial?.content) {
      const testimonial = project.page.testimonial
      documents.push({
        content: `Client testimonial for ${project.title}: "${testimonial.content}" - ${testimonial.author}${
          testimonial.role ? `, ${testimonial.role}` : ''
        }`,
        metadata: {
          source: 'testimonials',
          title: `${project.company} Testimonial`,
          type: 'project',
          category: 'testimonial',
        },
      })
    }
  }

  return documents
}

function extractServiceDocuments(services: ServiceData[]): KnowledgeDocument[] {
  const documents: KnowledgeDocument[] = []

  for (const service of services) {
    // 1. Service overview
    documents.push({
      content: `${service.title}: ${service.description} ${service.excerpt} Keywords: ${service.keywords}.${
        service.startingPrice ? ` Starting price: $${service.startingPrice}` : ''
      }`,
      metadata: {
        source: 'services',
        title: service.title,
        type: 'service',
        category: deriveServiceCategory(service.title),
      },
    })

    // 2. Service process/methodology
    if (service.processSteps && service.processSteps.length > 0) {
      const processContent = service.processSteps
        .map(step => `${step.title}: ${step.description}`)
        .join(' ')

      documents.push({
        content: `${service.title} Process: ${processContent}`,
        metadata: {
          source: 'services',
          title: `${service.title} - Process & Methodology`,
          type: 'service',
          category: 'methodology',
        },
      })
    }

    // 3. Service benefits
    if (service.benefits && service.benefits.length > 0) {
      documents.push({
        content: `${service.title} Benefits: ${service.benefits.join('. ')}.`,
        metadata: {
          source: 'services',
          title: `${service.title} - Benefits`,
          type: 'service',
          category: deriveServiceCategory(service.title),
        },
      })
    }

    // 4. Detailed sections (if available)
    if (service.page?.splitSections) {
      for (const section of service.page.splitSections) {
        if (!section.content || section.content.trim().length < 50) continue

        documents.push({
          content: `${service.title} - ${section.heading}: ${section.content}`,
          metadata: {
            source: 'services',
            title: `${service.title} - ${section.heading}`,
            type: 'service',
            category: deriveServiceCategory(service.title),
          },
        })
      }
    }

    // 5. Service testimonials
    if (service.page?.testimonials) {
      for (const testimonial of service.page.testimonials) {
        documents.push({
          content: `Client testimonial for ${service.title}: "${testimonial.content}" - ${testimonial.author}`,
          metadata: {
            source: 'testimonials',
            title: `${service.title} Testimonial`,
            type: 'service',
            category: 'testimonial',
          },
        })
      }
    }
  }

  return documents
}

function deriveProjectCategory(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes('seo')) return 'seo'
  if (lower.includes('real estate') || lower.includes('property')) return 'real-estate'
  if (lower.includes('legal') || lower.includes('ai')) return 'legal-tech'
  if (lower.includes('fashion') || lower.includes('e-commerce') || lower.includes('branding'))
    return 'fashion-ecommerce'
  if (lower.includes('saas') || lower.includes('platform')) return 'saas'
  if (lower.includes('payment') || lower.includes('migration')) return 'migration'
  if (lower.includes('ngo') || lower.includes('enterprise')) return 'enterprise'
  return 'general'
}

function deriveServiceCategory(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes('web') || lower.includes('app') || lower.includes('mobile'))
    return 'development'
  if (lower.includes('ar') || lower.includes('vr') || lower.includes('xr')) return 'ar-vr'
  if (lower.includes('cloud') || lower.includes('devops')) return 'cloud'
  if (lower.includes('simulation') || lower.includes('industrial')) return 'simulation'
  return 'general'
}

function extractCompanyInfo(): KnowledgeDocument[] {
  try {
    const seoData = JSON.parse(readFileSync(join(V1_PATH, 'seo.json'), 'utf-8'))

    return [
      {
        content: `${seoData.name || 'Other Dev'} is a ${
          seoData.business?.type || 'creative software agency'
        } based in ${seoData.business?.address || 'Karachi, Pakistan'}. Contact: ${
          seoData.business?.phone || '+92 315 6893331'
        } | ${seoData.business?.email || 'hello@otherdev.com'}. Website: ${
          seoData.url || 'https://www.otherdev.com'
        }. Service areas: ${
          seoData.business?.serviceArea?.join(', ') ||
          'US, Canada, UK, Australia, Pakistan, Germany'
        }. Languages: ${seoData.business?.languages?.join(', ') || 'English, German, Urdu'}.`,
        metadata: {
          source: 'company',
          title: 'Company Information',
          type: 'about',
        },
      },
    ]
  } catch (error) {
    console.warn('Could not extract company info:', error)
    return []
  }
}

function generateKnowledgeBaseFile(documents: KnowledgeDocument[]): void {
  const fileContent = `export interface KnowledgeDocument {
  content: string;
  metadata: {
    source: string;
    title: string;
    type: 'project' | 'service' | 'about' | 'general';
    category?: string;
  };
}

export const knowledgeBase: KnowledgeDocument[] = ${JSON.stringify(documents, null, 2)};
`

  writeFileSync(OUTPUT_PATH, fileContent, 'utf-8')
}

async function main() {
  try {
    // Read source files
    const projects: ProjectData[] = JSON.parse(
      readFileSync(join(V1_PATH, 'projects.json'), 'utf-8')
    )
    const services: ServiceData[] = JSON.parse(
      readFileSync(join(V1_PATH, 'services.json'), 'utf-8')
    )

    // Extract documents
    const projectDocs = extractProjectDocuments(projects)
    const serviceDocs = extractServiceDocuments(services)
    const companyDocs = extractCompanyInfo()

    const allDocuments = [...projectDocs, ...serviceDocs, ...companyDocs]

    // Generate output file
    generateKnowledgeBaseFile(allDocuments)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
