// Extracted Company and Founder Information
// This file contains all extracted data structured for the knowledge base
// Following the pattern analysis from the Plan agent

import type { KnowledgeDocument } from '../src/lib/knowledge-base'

export const extractedData: KnowledgeDocument[] = [
  // ===== COMPANY DOCUMENTS (type: 'about') =====

  // Company Facts
  {
    content: `COMPANY: Other Dev
FOUNDED: 2021
LOCATION: Karachi, Pakistan
FOUNDERS: Kabeer Jaffri, Ossaid Qadri
TEAM SIZE: 2 co-founders with specialized expertise
INDUSTRIES: Fashion, Real Estate, Legal Tech, SaaS, E-commerce, EdTech
SERVICES: Web Development, Digital Marketing, Branding, SEO
PHILOSOPHY: Zero unnecessary fluff, no drag-and-drop builders, clean code only
STACK: Next.js 15/16, React 19, Astro, TypeScript, Go, Shopify
EXPERTISE: AI-powered platforms, multi-tenant systems, real-time collaboration
TOTAL REACH: Over 1,020,155 accounts across digital campaigns
AD SPEND MANAGED: Over Rs 217,000+ optimized for ROI
AVERAGE COST PER PURCHASE: Rs 211.30`,
    metadata: {
      source: 'about',
      title: 'Other Dev - Company Facts',
      type: 'about',
      category: 'company',
      subtype: 'facts',
      year: '2025',
    },
  },

  // Company Overview
  {
    content:
      'Other Dev is a Karachi-based software and design studio that produces digital platforms for pioneering creatives. Founded in 2021 by Kabeer Jaffri and Ossaid Qadri, the agency operates at the intersection of high-performance engineering and data-driven growth. The company specializes in full-stack web development, AI-powered applications, and strategic digital marketing across fashion, real estate, legal tech, SaaS, and e-commerce sectors. Other Dev serves clients by building scalable systems with clean code while ensuring measurable revenue through targeted advertising campaigns.',
    metadata: {
      source: 'about',
      title: 'Other Dev - Company Overview',
      type: 'about',
      category: 'company',
      subtype: 'overview',
      year: '2025',
    },
  },

  // Company Philosophy
  {
    content:
      'Other Dev operates under a rigorous philosophy of zero unnecessary fluff. The agency rejects drag-and-drop builders, WordPress plugins, and shortcuts, choosing instead to ship scalable, full-stack systems built on clean code. The team believes that good design is as little design as possible, focusing on shipping systems that work and prioritizing performance metrics and scalability over aesthetic trends that do not convert. Every project emphasizes measurable outcomes, technical excellence, and long-term maintainability over quick fixes or temporary solutions.',
    metadata: {
      source: 'about',
      title: 'Other Dev - Philosophy and Approach',
      type: 'about',
      category: 'company',
      subtype: 'overview',
      year: '2025',
    },
  },

  // Company Expertise
  {
    content:
      'Other Dev delivers comprehensive digital solutions across multiple domains. Web development expertise includes AI-powered legal assistants with real-time document analysis, multi-tenant CMS platforms for scalable content management, real estate systems with Google Sheets and WhatsApp integration, and complex e-commerce platforms with advanced Shopify customization. Digital marketing capabilities encompass Facebook and Meta advertising with proven ROI, strategic campaign management across substantial budgets, advanced pixel implementation for conversion tracking, and data-driven optimization using A/B testing and dynamic budgeting. The team combines technical architecture knowledge with growth strategy execution.',
    metadata: {
      source: 'about',
      title: 'Other Dev - Expertise and Capabilities',
      type: 'about',
      category: 'company',
      subtype: 'overview',
      year: '2025',
    },
  },

  // ===== FOUNDER DOCUMENTS (type: 'about', category: 'team') =====

  // Kabeer Jaffri Profile
  {
    content: `Kabeer Jaffri serves as the Founder and Technical Lead of Other Dev, bringing over 8 years of experience in full-stack web and application development. A Computer Science major at the Institute of Business Administration (IBA), Kabeer specializes in solving complex architectural problems and building scalable infrastructure. Beyond Other Dev, he serves as Technical Director for the non-profit Ek Qadam Aur, where he manages services handling 3,000 daily requests. His research on cloud IDEs and messaging solutions has been published on ResearchGate. Kabeer's expertise spans AI and Machine Learning, cloud deployment, backend architecture, and high-performance system design.`,
    metadata: {
      source: 'about',
      title: 'Kabeer Jaffri - Founder Profile',
      type: 'about',
      category: 'team',
      subtype: 'overview',
      year: '2025',
    },
  },

  // Ossaid Qadri Profile
  {
    content: `Ossaid Qadri serves as Co-Founder, Frontend Architect, and Growth Lead at Other Dev, occupying a dual role that bridges technical engineering and commercial strategy. As a frontend-focused developer, he specializes in building high-performance interfaces using Next.js, React, and Headless CMS architectures. Currently pursuing a BS in Accounting and Finance to strengthen the company's financial and business acumen, Ossaid leads the agency's digital marketing division. He handles end-to-end project execution from client acquisition and budgeting to DevOps workflows on Vercel and GitHub. His proven track record includes delivering 40 percent sales increases and scaling revenue by over Rs 5 million for clients through strategic growth campaigns.`,
    metadata: {
      source: 'about',
      title: 'Ossaid Qadri - Founder Profile',
      type: 'about',
      category: 'team',
      subtype: 'overview',
      year: '2025',
    },
  },

  // Team Facts
  {
    content: `FOUNDERS: Kabeer Jaffri and Ossaid Qadri
MET AT: Habib Public School, Karachi
KABEER ROLE: Founder and Technical Lead
KABEER EDUCATION: Computer Science, Institute of Business Administration (IBA)
KABEER EXPERIENCE: 8+ years in full-stack development
KABEER OTHER ROLE: Technical Director at Ek Qadam Aur non-profit
KABEER EXPERTISE: AI/ML, cloud deployment, backend architecture, scalable infrastructure
OSSAID ROLE: Co-Founder, Frontend Architect, and Growth Lead
OSSAID EDUCATION: BS Accounting and Finance (in progress)
OSSAID EXPERTISE: Next.js, React, Headless CMS, digital marketing, growth strategy
TEAM APPROACH: Combined technical excellence with data-driven growth strategy`,
    metadata: {
      source: 'about',
      title: 'Other Dev - Team Facts',
      type: 'about',
      category: 'team',
      subtype: 'facts',
      year: '2025',
    },
  },

  // ===== SERVICE DOCUMENTS (type: 'service') =====

  // Web Development Service - Overview
  {
    content:
      'Other Dev provides full-stack web development services specializing in scalable, high-performance digital platforms. The agency builds AI-powered applications including legal assistants with real-time document analysis and WebSocket-based chat, multi-tenant CMS platforms allowing independent client content management, real estate systems with automated lead routing through Google Sheets and WhatsApp integration, and custom e-commerce solutions with advanced Shopify Liquid development. Every project prioritizes clean code architecture, performance optimization, and long-term maintainability over quick fixes or temporary solutions.',
    metadata: {
      source: 'services',
      title: 'Web Development Service - Overview',
      type: 'service',
      category: 'web-development',
      subtype: 'overview',
      year: '2025',
    },
  },

  // Web Development Service - Tech Stack
  {
    content:
      'Other Dev utilizes a modern, performance-oriented tech stack for web development. Frontend technologies include Next.js 15 and 16, React 19, Astro, TypeScript 5.x, and Eleventy for static site generation. Styling and UI employ Tailwind CSS 4, GSAP for animations, Framer Motion for interactions, and Radix UI for accessible component primitives. Backend and infrastructure leverage Go for high-performance services, MySQL, PostgreSQL, and MongoDB for databases, and real-time technologies like YJS and WebSockets for collaborative features. E-commerce development uses advanced Shopify Liquid customization and custom storefronts. Development tools include Bun for package management, Vercel for deployment, TinaCMS for content management, and Turbopack for rapid builds.',
    metadata: {
      source: 'services',
      title: 'Web Development Service - Tech Stack',
      type: 'service',
      category: 'web-development',
      subtype: 'tech',
      year: '2025',
    },
  },

  // Web Development Service - Process
  {
    content:
      'Other Dev follows a rigorous development process focused on scalability and clean architecture. Projects begin with technical discovery to understand requirements and existing systems. Architecture planning establishes scalable patterns and technology selection based on project needs. Development emphasizes clean code practices, type safety with TypeScript, and comprehensive testing. The team implements CI/CD pipelines for automated deployment, conducts code reviews for quality assurance, and provides ongoing optimization and maintenance. Every project includes DevOps setup on platforms like Vercel and GitHub, performance monitoring, and documentation for future development teams.',
    metadata: {
      source: 'services',
      title: 'Web Development Service - Process',
      type: 'service',
      category: 'web-development',
      subtype: 'process',
      year: '2025',
    },
  },

  // Digital Marketing Service - Overview
  {
    content:
      'Other Dev provides comprehensive digital marketing services designed to facilitate measurable growth through data-driven advertising campaigns. The agency functions as an experienced Facebook and Meta advertising specialist, managing substantial budgets to deliver consistent returns on investment. Services include strategic campaign planning and execution, advanced pixel setup for conversion tracking, A/B testing of headlines, creatives, and call-to-action buttons, dynamic budgeting with real-time reallocation based on performance data, and audience targeting using custom and lookalike audiences. Every campaign focuses on reducing customer acquisition costs while maximizing conversion rates and revenue.',
    metadata: {
      source: 'services',
      title: 'Digital Marketing Service - Overview',
      type: 'service',
      category: 'digital-marketing',
      subtype: 'overview',
      year: '2025',
    },
  },

  // Digital Marketing Service - Tech and Tools
  {
    content:
      'Other Dev digital marketing campaigns leverage advanced technical implementation. The team uses Meta Business Suite and Ads Manager for campaign management, implements custom Facebook Pixel events including Add to Cart, Initiate Checkout, and Purchase tracking, and deploys Conversion API for server-side tracking to improve data accuracy. Audience tools include Custom Audiences from website visitors and customer lists, Lookalike Audiences based on high-value customer behaviors, and geographic and demographic targeting aligned with delivery logistics. Creative optimization involves Dynamic Product Ads for automated retargeting, carousel and collection ad formats for e-commerce, and video content for engagement campaigns.',
    metadata: {
      source: 'services',
      title: 'Digital Marketing Service - Tech and Tools',
      type: 'service',
      category: 'digital-marketing',
      subtype: 'tech',
      year: '2025',
    },
  },

  // Digital Marketing Service - Performance Results
  {
    content:
      'Other Dev digital marketing campaigns have achieved substantial verified results across client portfolios. Cumulative performance metrics include over 1,020,155 distinct accounts reached across the Facebook ecosystem, over Rs 217,000 in ad spend effectively allocated and optimized for maximum ROI, and an average cost per purchase of Rs 211.30 reflecting highly efficient customer acquisition. Client-specific outcomes include 1,031 website purchases for Wish Apparels between November 2024 and May 2025 at Rs 190.61 per purchase, threefold revenue increase for Blinget Gifts during seasonal campaigns, and 40 percent sales increases with over Rs 5 million revenue scaling for multiple e-commerce clients.',
    metadata: {
      source: 'services',
      title: 'Digital Marketing Service - Performance Results',
      type: 'service',
      category: 'digital-marketing',
      subtype: 'results',
      year: '2025',
    },
  },

  // Digital Marketing Service - Facts
  {
    content: `SERVICE: Digital Marketing and Growth Strategy
PLATFORMS: Facebook, Instagram, Meta Ads Manager
TOTAL REACH: 1,020,155+ accounts engaged
AD SPEND MANAGED: Rs 217,000+ optimized
AVERAGE COST PER PURCHASE: Rs 211.30
ENGAGEMENT: 111,000+ accounts actively interacting
TOOLS: Meta Business Suite, Facebook Pixel, Conversion API, Custom Audiences, Lookalike Audiences
SERVICES: Campaign strategy, A/B testing, conversion tracking, dynamic budgeting, audience targeting
SPECIALIZATION: E-commerce, Fashion, Real Estate, SaaS lead generation
PROVEN RESULTS: 40% sales increases, 3x revenue growth, Rs 5M+ revenue scaling`,
    metadata: {
      source: 'services',
      title: 'Digital Marketing Service - Facts',
      type: 'service',
      category: 'digital-marketing',
      subtype: 'facts',
      year: '2025',
    },
  },

  // Branding Service - Overview
  {
    content:
      'Other Dev provides comprehensive branding services that establish distinct visual identities for businesses across industries. Branding projects include complete brand identity systems with logo design, typography selection, and color palette development, brand guidelines documentation for consistent application across touchpoints, and visual storytelling that communicates brand values and positioning. The agency creates cohesive brand experiences from initial concept through digital implementation, ensuring design systems translate effectively to web platforms and marketing materials. Every branding project prioritizes memorability, sophistication, and alignment with target audience expectations.',
    metadata: {
      source: 'services',
      title: 'Branding Service - Overview',
      type: 'service',
      category: 'branding',
      subtype: 'overview',
      year: '2025',
    },
  },

  // Branding Service - Process
  {
    content:
      'Other Dev branding projects follow a strategic process combining research, design, and implementation. Discovery phase includes competitor analysis, target audience research, and brand positioning development. Design exploration creates multiple concepts with iteration based on client feedback and market fit. Brand system development produces comprehensive guidelines covering logo usage, typography, color systems, and visual elements. Implementation phase translates brand identity to digital platforms including websites, social media, and marketing materials. The process ensures brand consistency across all customer touchpoints while maintaining flexibility for future growth and market evolution.',
    metadata: {
      source: 'services',
      title: 'Branding Service - Process',
      type: 'service',
      category: 'branding',
      subtype: 'process',
      year: '2025',
    },
  },

  // Branding Service - Results
  {
    content:
      'Other Dev branding projects have delivered measurable impact for clients across industries. Wish Apparels achieved increased brand recognition across channels with sophisticated visual identity contributing to substantial sales performance improvements. Parcheh81 strengthened brand perception through craft-focused storytelling and premium textile presentation now used as primary brand showcase. Finlit established trustworthy brand presence for financial literacy SaaS platform supporting market positioning and user acquisition. Multiple clients report improved customer engagement and conversion rates following brand system implementation, with cohesive visual identity strengthening market positioning against competitors.',
    metadata: {
      source: 'services',
      title: 'Branding Service - Results',
      type: 'service',
      category: 'branding',
      subtype: 'results',
      year: '2025',
    },
  },

  // ===== CONTACT AND GENERAL DOCUMENTS (type: 'general') =====

  // Contact Information
  {
    content: `COMPANY: Other Dev
WEBSITE: https://www.otherdev.com
LOCATION: Karachi, Sindh, Pakistan
GENERAL EMAIL: hello@otherdev.com
PHONE: +92 315 689 3331
KABEER JAFFRI EMAIL: kabeer@otherdev.com
KABEER LINKEDIN: https://www.linkedin.com/in/kabeerjaffri/
OSSAID QADRI EMAIL: ossaid@otherdev.com
OSSAID LINKEDIN: https://www.linkedin.com/in/imossaidqadri/
INSTAGRAM: @ossaidqadri
FOUNDED: 2021
INDUSTRIES SERVED: Fashion, Real Estate, Legal Tech, SaaS, E-commerce, EdTech`,
    metadata: {
      source: 'general',
      title: 'Other Dev - Contact Information',
      type: 'general',
      category: 'contact',
      subtype: 'facts',
      year: '2025',
    },
  },

  // Technical Capabilities
  {
    content:
      'Other Dev technical capabilities span full-stack development with specialized expertise in multiple domains. Frontend development includes Next.js 15 and 16, React 19, Astro, TypeScript 5.x, Eleventy, Tailwind CSS 4, GSAP, Framer Motion, and Radix UI. Backend technologies encompass Go for high-performance services, Node.js for API development, MySQL, PostgreSQL, and MongoDB databases, and real-time features using YJS and WebSockets. E-commerce expertise includes advanced Shopify Liquid development and custom storefront architecture. Infrastructure and deployment utilize Vercel for hosting, GitHub for version control, Bun for package management, TinaCMS for content management, and Turbopack for build optimization. Specialized capabilities include AI and Machine Learning integration, multi-tenant architecture, real-time collaborative editing, API development and integration, cloud deployment and scaling, and performance optimization.',
    metadata: {
      source: 'general',
      title: 'Other Dev - Technical Capabilities',
      type: 'general',
      category: 'capabilities',
      subtype: 'tech',
      year: '2025',
    },
  },

  // ===== NEW PROJECT: BLINGET GIFTS =====

  // Blinget Gifts - Facts
  {
    content: `PROJECT: Blinget Gifts
YEAR: 2024-2025
SERVICE: E-commerce platform and digital marketing
INDUSTRY: Gifts and seasonal products
STACK: Shopify, Facebook Ads, Dynamic Product Ads, Custom Audiences, Lookalike Audiences
FEATURES: Event-specific campaigns, urgent messaging, geographic targeting, influencer partnerships
RESULTS: 3x revenue increase during peak seasons, predictable seasonal revenue streams
CHALLENGE: Seasonal business model with short sales windows (Mother's Day, Eid)
MARKETING APPROACH: Event calendars, limited-time offers, location-based targeting
OUTCOME: Transformed volatile seasonal sales into dependable revenue`,
    metadata: {
      source: 'projects',
      title: 'Blinget Gifts - Facts',
      type: 'project',
      category: 'seasonal-ecommerce',
      subtype: 'facts',
      project: 'blinget-gifts',
      year: '2024',
    },
  },

  // Blinget Gifts - Overview
  {
    content: `Blinget Gifts operates in the seasonal gifting market with a business model inherently dependent on short sales windows around events like Mother's Day, Eid, and other celebrations. The company faced significant challenges from last-minute campaign activations, broad and inefficient audience targeting, and unpredictable revenue patterns that made business planning difficult. Previous marketing efforts suffered from generic messaging that failed to create urgency and poor timing that missed peak shopping periods. The primary challenge was transforming volatile seasonal sales into predictable revenue streams while maximizing return on investment during critical event windows when customers actively search for gifts.`,
    metadata: {
      source: 'projects',
      title: 'Blinget Gifts - Overview',
      type: 'project',
      category: 'seasonal-ecommerce',
      subtype: 'overview',
      project: 'blinget-gifts',
      year: '2024',
    },
  },

  // Blinget Gifts - Tech Stack
  {
    content:
      'Blinget Gifts marketing and e-commerce infrastructure utilized Shopify as the commerce platform foundation providing inventory management and checkout. Facebook Ads Manager served as the primary advertising platform with advanced campaign configuration. Dynamic Product Ads automated retargeting for cart abandoners and product viewers. Custom Audiences targeted previous purchasers and website visitors for repeat sales. Lookalike Audiences expanded reach to customers matching high-value buyer profiles. Facebook Pixel tracked conversion events including Add to Cart, Initiate Checkout, and Purchase. Geographic targeting aligned campaigns with delivery logistics and regional event calendars. The technical stack prioritized rapid campaign deployment and real-time optimization during short seasonal windows.',
    metadata: {
      source: 'projects',
      title: 'Blinget Gifts - Tech Stack',
      type: 'project',
      category: 'seasonal-ecommerce',
      subtype: 'stack',
      project: 'blinget-gifts',
      year: '2024',
    },
  },

  // Blinget Gifts - Implementation
  {
    content:
      'Other Dev developed comprehensive event-specific campaign calendars planning activations weeks before each seasonal event. Urgent messaging and limited-time offers created scarcity psychology driving immediate purchases. Geographic targeting ensured ads reached customers within delivery range for time-sensitive gifting. The team implemented Dynamic Product Ads to automatically retarget customers who viewed products or abandoned carts with relevant gift recommendations. Custom Audiences from previous purchasers received early access campaigns and loyalty incentives. Lookalike Audiences expanded market reach to new customers matching high-value buyer behaviors. Influencer partnerships amplified brand reach and provided social proof during peak shopping periods. Real-time budget optimization shifted spending to top-performing ad sets during critical event windows.',
    metadata: {
      source: 'projects',
      title: 'Blinget Gifts - Implementation',
      type: 'project',
      category: 'seasonal-ecommerce',
      subtype: 'implementation',
      project: 'blinget-gifts',
      year: '2024',
    },
  },

  // Blinget Gifts - Results
  {
    content:
      'The strategic seasonal marketing approach delivered a threefold revenue increase during peak seasons compared to previous years. Volatile seasonal sales transformed into predictable revenue streams allowing better business planning and inventory management. Early campaign activation captured customers during research phase before competitors saturated the market. Geographic and audience targeting reduced wasted ad spend and improved return on investment. Urgent messaging and limited-time offers increased conversion rates and average order values. The client gained repeatable playbooks for each seasonal event enabling efficient year-over-year scaling. Post-campaign analysis provided insights for continuous optimization of targeting, creative, and timing strategies.',
    metadata: {
      source: 'projects',
      title: 'Blinget Gifts - Results',
      type: 'project',
      category: 'seasonal-ecommerce',
      subtype: 'results',
      project: 'blinget-gifts',
      year: '2024',
    },
  },
]
