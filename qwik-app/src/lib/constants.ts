/**
 * Site configuration constants
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://otherdev.com'

/**
 * Generate absolute URL from path
 */
export function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${SITE_URL}/${cleanPath}`
}

/**
 * Z-index values for consistent layering across the application
 */
export const Z_INDEX = {
  /** Navigation bar */
  navigation: 40,
  /** Chat widget button (bottom right) */
  chatButton: 50,
  /** Chat widget dialog */
  chatWidget: 60,
  /** Contact dialog */
  contactDialog: 70,
} as const

/**
 * Suggested prompts for the chat widget
 */
export const SUGGESTED_PROMPTS = [
  {
    label: 'What services does Other Dev offer?',
    icon: 'briefcase',
    prompt:
      "Provide a comprehensive overview of Other Dev's services and capabilities. Include:\n- Core service offerings (web development, design, e-commerce, etc.)\n- Industries and sectors you specialize in\n- Key differentiators and unique value propositions\n- Types of projects you typically handle\n- Technologies and methodologies used in service delivery\nFormat the response in a clear, structured way that's easy to understand for potential clients.",
  },
  {
    label: "Who are the founders and what's the company story?",
    icon: 'users',
    prompt:
      "Tell me about Other Dev's founding story and the people behind the company. Please include:\n- Founders' names, backgrounds, and expertise\n- The inspiration and motivation for starting Other Dev\n- Company mission, vision, and core values\n- Key milestones and achievements since founding\n- Team culture and what makes Other Dev unique as an organization\nProvide a compelling narrative that showcases the human side of the business.",
  },
  {
    label: 'What technologies do you use?',
    icon: 'code',
    prompt:
      "Provide a detailed breakdown of Other Dev's technology stack and development approach. Include:\n- Frontend technologies and frameworks (React, Next.js, TypeScript, etc.)\n- Backend technologies and infrastructure\n- Design and prototyping tools\n- Development workflows and methodologies\n- Quality assurance and testing approaches\n- Deployment and DevOps practices\nExplain why these technologies were chosen and how they benefit clients' projects.",
  },
  {
    label: 'Get live AI news from the web',
    icon: 'globe',
    prompt:
      'Search the web for the latest AI news, product launches, and breakthroughs from the past 7 days. Include company names, product details, dates, and links to source articles. Focus on news that would matter to someone tracking the AI industry.',
  },
] as const
