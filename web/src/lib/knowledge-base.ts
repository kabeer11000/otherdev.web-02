export interface KnowledgeDocument {
  content: string;
  metadata: {
    source: string;
    title: string;
    type: 'project' | 'service' | 'about' | 'general' | 'testimonial';
    category?: string;
    subtype?: 'overview' | 'tech' | 'stack' | 'results' | 'facts' | 'challenge' | 'process' | 'benefits' | 'implementation';
    project?: string;
    year?: string;
  };
}

export const knowledgeBase: KnowledgeDocument[] = [
  {
    "content": "PROJECT: Narkins Builders\nYEAR: 2025\nSERVICE: SEO & Technical Optimization\nINDUSTRY: Real Estate\nSTACK: Google Analytics 4, Google Search Console, Schema.org, WordPress to MDX Migration, XML Sitemap, Canonical Tags\nRESULTS: 30% traffic increase in first month, enhanced search indexing, first-page ranking positioning\nCOMPETITORS: Zameen.com, OLX.com\nURL: https://narkinsbuilders.com",
    "metadata": {
      "source": "projects",
      "title": "Narkins Builders - Facts",
      "type": "project",
      "category": "seo",
      "subtype": "facts",
      "project": "narkins-builders",
      "year": "2025"
    }
  },
  {
    "content": "Narkins Builders is a real estate construction company in Pakistan facing a critical digital visibility problem. Despite 30 years of market experience, they had zero ranking against major competitors Zameen.com and OLX.com. Their WordPress website lacked technical SEO foundation, proper analytics tracking, and structured data implementation. The challenge was transforming their non-existent digital presence into a competitive platform that could attract organic real estate leads in Pakistan's highly competitive market.",
    "metadata": {
      "source": "projects",
      "title": "Narkins Builders - Overview",
      "type": "project",
      "category": "seo",
      "subtype": "overview",
      "project": "narkins-builders",
      "year": "2025"
    }
  },
  {
    "content": "Core technologies: Google Analytics 4 with advanced event tracking, Google Search Console for indexing verification, XML sitemap generation, canonical tag implementation. Schema markup: Organization schema, Property schema, BlogPosting schema, LocalBusiness schema, Review schemas for rich snippets and knowledge panel eligibility. Custom components: SEOImage component with automatic alt text generation and context-aware optimization. Performance: Core Web Vitals optimization, mobile-first indexing, lazy loading implementation.",
    "metadata": {
      "source": "projects",
      "title": "Narkins Builders - Tech Stack",
      "type": "project",
      "category": "seo",
      "subtype": "stack",
      "project": "narkins-builders",
      "year": "2025"
    }
  },
  {
    "content": "Technical SEO foundation: Implemented GA4 with event tracking, verified Google Search Console, generated XML sitemaps, deployed canonical tags across all pages. Schema deployment: Added Organization, Property, BlogPosting, LocalBusiness, and Review schemas. Blog migration: Transformed WordPress blog to custom MDX-based publishing platform supporting React components, automatic meta tag generation, and integrated contact optimization. Content strategy: Researched high-value search opportunities, developed competitive positioning targeting portal weaknesses, emphasized local expertise and 30-year experience. Internal linking structure and meta tag optimization completed for proper indexing.",
    "metadata": {
      "source": "projects",
      "title": "Narkins Builders - Implementation",
      "type": "project",
      "category": "seo",
      "subtype": "implementation",
      "project": "narkins-builders",
      "year": "2025"
    }
  },
  {
    "content": "Immediate impact: 30% traffic improvement within first month of technical optimizations. Indexing: Enhanced search engine indexing with proper sitemap and canonical structure. Ranking: Positioned for first-page rankings in target real estate market. Mobile performance: Improved mobile-first optimization and Core Web Vitals scores. Lead generation: Conversion tracking enabled for analyzing real estate lead sources. Rich snippets: Properties now appearing in search results with structured data. Long-term positioning: Scalable content marketing foundation established for competitive growth against Zameen.com and OLX.com.",
    "metadata": {
      "source": "projects",
      "title": "Narkins Builders - Results",
      "type": "project",
      "category": "seo",
      "subtype": "results",
      "project": "narkins-builders",
      "year": "2025"
    }
  },
  {
    "content": "Other Dev transformed our digital presence from invisible to competitive against Zameen.com and OLX.com. We saw a 30% traffic increase within the first month of implementation. The WordPress to MDX migration and schema markup now have our properties appearing in rich snippets, positioning us perfectly for long-term growth. - Sarim Nara, Managing Director, Narkins Builders",
    "metadata": {
      "source": "testimonials",
      "title": "Narkins Builders - Client Testimonial",
      "type": "testimonial",
      "category": "seo",
      "project": "narkins-builders",
      "year": "2025"
    }
  },
  {
    "content": "PROJECT: Bin Yousuf Group\nYEAR: 2025\nSERVICE: Real Estate Platform Development\nINDUSTRY: Luxury Real Estate\nSTACK: Astro 5.10.0, React, TypeScript, GSAP Animations, Google Sheets API, WhatsApp Integration\nFEATURES: Interactive property galleries, real-time lead tracking, location-based filtering\nPARTNERS: Official sales partners of Emaar Oceanfront, HMR Waterfront\nURL: https://binyousufgroup.com",
    "metadata": {
      "source": "projects",
      "title": "Bin Yousuf Group - Facts",
      "type": "project",
      "category": "real-estate",
      "subtype": "facts",
      "project": "bin-yousuf-group",
      "year": "2025"
    }
  },
  {
    "content": "Bin Yousuf Group is the official sales partner for Emaar Oceanfront and HMR Waterfront, two of Karachi's most exclusive waterfront developments. They needed a premium real estate platform that showcases luxury oceanfront properties while matching their high-end market positioning. The challenge was balancing sophisticated visual aesthetics with advanced lead management functionality. They required real-time lead tracking, zero lead loss, instant sales team notifications, and seamless multi-device experience for qualified luxury property prospects.",
    "metadata": {
      "source": "projects",
      "title": "Bin Yousuf Group - Overview",
      "type": "project",
      "category": "real-estate",
      "subtype": "overview",
      "project": "bin-yousuf-group",
      "year": "2025"
    }
  },
  {
    "content": "Framework: Astro 5.10.0 with React components for dynamic interactions. Language: TypeScript for scalability and maintainability. Animations: GSAP for engaging property showcases and interactive slideshows. Lead management: Google Sheets API integration for real-time lead capture with data security. Communication: WhatsApp integration for immediate client contact. SEO: Structured data markup for real estate properties, location-based filtering. Forms: Optional fields design to maximize conversion rates. Performance: Optimized architecture for fast loading and smooth user experience.",
    "metadata": {
      "source": "projects",
      "title": "Bin Yousuf Group - Tech Stack",
      "type": "project",
      "category": "real-estate",
      "subtype": "stack",
      "project": "bin-yousuf-group",
      "year": "2025"
    }
  },
  {
    "content": "Platform architecture: Built with Astro 5.10.0 and React for optimal performance and SEO. Interactive features: Implemented GSAP animations for property galleries and slideshows showcasing luxury waterfront lifestyle. Lead system: Integrated Google Sheets API for real-time lead capture, handling simultaneous inquiries with instant notifications. Form optimization: All fields designed as optional to maximize conversion rates. Communication: Added WhatsApp integration for immediate client communication. Property filtering: Implemented location-based filtering for Emaar and HMR properties. SEO implementation: Deployed structured data markup for maximum search visibility.",
    "metadata": {
      "source": "projects",
      "title": "Bin Yousuf Group - Implementation",
      "type": "project",
      "category": "real-estate",
      "subtype": "implementation",
      "project": "bin-yousuf-group",
      "year": "2025"
    }
  },
  {
    "content": "Lead generation: Significant increase in qualified luxury property inquiries after launch. Sales process: Google Sheets integration streamlined entire sales workflow with real-time tracking. Credibility: Enhanced market positioning as official Emaar and HMR partners through professional design. User experience: Smooth navigation and interactive property galleries improved prospect engagement. Lead tracking: Zero lead loss achieved with robust API integration and instant notifications. Conversion: Optional form fields maximized conversion rates from visitors to prospects.",
    "metadata": {
      "source": "projects",
      "title": "Bin Yousuf Group - Results",
      "type": "project",
      "category": "real-estate",
      "subtype": "results",
      "project": "bin-yousuf-group",
      "year": "2025"
    }
  },
  {
    "content": "Other Dev transformed our digital presence in the luxury real estate market. The platform they created perfectly captures the premium nature of our waterfront properties while providing us with powerful lead management tools. Since launch, we've experienced a significant increase in qualified inquiries and the Google Sheets integration has streamlined our entire sales process. The website's professional design and smooth user experience have significantly enhanced our credibility as official Emaar and HMR partners. We couldn't be happier with the results. - Wahib Yousuf, Managing Director, Bin Yousuf Group",
    "metadata": {
      "source": "testimonials",
      "title": "Bin Yousuf Group - Client Testimonial",
      "type": "testimonial",
      "category": "real-estate",
      "project": "bin-yousuf-group",
      "year": "2025"
    }
  },
  {
    "content": "PROJECT: Lexa\nYEAR: 2025\nSERVICE: AI Legal Assistant Platform\nINDUSTRY: Legal Tech / SaaS\nSTACK: Astro 5.13, React 19, Y.js, WebSocket, TipTap Extensions, Nanostores, AI/NLP Integration\nFEATURES: Real-time collaborative editing, AI contract analysis, automated document generation, digital signatures, GDPR compliance\nMARKETS: Asia, Middle East\nURL: https://lexa.deployments.otherdev.com",
    "metadata": {
      "source": "projects",
      "title": "Lexa - Facts",
      "type": "project",
      "category": "legal-tech",
      "subtype": "facts",
      "project": "lexa",
      "year": "2025"
    }
  },
  {
    "content": "Lexa is an AI-powered legal assistant platform transforming contract drafting and document management for law firms and SMEs across Asia and the Middle East. The platform combines advanced natural language processing with real-time collaborative editing, enabling legal professionals to draft, review, and manage contracts with AI-driven insights. Key challenges included building simultaneous multi-user editing without conflicts, maintaining professional legal document formatting, and implementing enterprise-grade security for sensitive legal documents while ensuring GDPR compliance and maintaining highest accuracy standards.",
    "metadata": {
      "source": "projects",
      "title": "Lexa - Overview",
      "type": "project",
      "category": "legal-tech",
      "subtype": "overview",
      "project": "lexa",
      "year": "2025"
    }
  },
  {
    "content": "Framework: Astro 5.13 with React 19 components for high performance and scalability. Real-time collaboration: Y.js with WebSocket connections for simultaneous multi-user editing. Document engine: Custom TipTap extensions for pagination, headers, footers, and professional legal formatting. State management: Nanostores for advanced state handling. AI features: Natural language processing for contract intelligence and automated recommendations. Security: GDPR-compliant data handling, encrypted document storage, secure digital signatures. Document management: Comprehensive vault with audit trails, version control, and access management. Authentication: Enterprise-grade auth systems for legal industry compliance.",
    "metadata": {
      "source": "projects",
      "title": "Lexa - Tech Stack",
      "type": "project",
      "category": "legal-tech",
      "subtype": "stack",
      "project": "lexa",
      "year": "2025"
    }
  },
  {
    "content": "Platform architecture: Built full-stack legal SaaS using Astro 5.13 and React 19 for performance. Collaborative editing: Implemented Y.js with WebSocket for conflict-free simultaneous editing by multiple users. Document engine: Developed custom TipTap extensions handling multi-page layouts, pagination, headers, footers, and precise legal formatting. Real-time sync: Maintained formatting integrity during collaborative sessions across all connected clients. AI integration: Added natural language processing for contract analysis and intelligent legal recommendations. Security implementation: Deployed GDPR-compliant systems with encrypted storage and digital signature capabilities. Compliance features: Built audit trails, version control, and access management meeting legal industry requirements. Multi-language support included for international markets.",
    "metadata": {
      "source": "projects",
      "title": "Lexa - Implementation",
      "type": "project",
      "category": "legal-tech",
      "subtype": "implementation",
      "project": "lexa",
      "year": "2025"
    }
  },
  {
    "content": "Workflow transformation: AI-powered analysis and automated recommendations revolutionized legal document processing. Collaboration: Real-time editing features achieved perfect team synchronization. AI capabilities: Intelligent legal context understanding and suggestions proved game-changing. Processing efficiency: Dramatic improvement in document processing speed and accuracy. Client satisfaction: Clients amazed by AI-driven insights and recommendations. Security: Enterprise-grade measures met strict legal industry compliance requirements. Document management: Seamless export capabilities and formatting preservation across all editing sessions.",
    "metadata": {
      "source": "projects",
      "title": "Lexa - Results",
      "type": "project",
      "category": "legal-tech",
      "subtype": "results",
      "project": "lexa",
      "year": "2025"
    }
  },
  {
    "content": "Other Dev delivered exactly what we envisioned for Lexa - an intelligent AI legal assistant that transforms how we approach contract drafting and legal document management. The AI-powered analysis and automated recommendations have revolutionized our workflow, while the real-time collaboration features keep our team perfectly synchronized. Having an AI assistant that understands legal context and provides intelligent suggestions has been game-changing for our firm. Since launch, we've dramatically improved our document processing efficiency and our clients are amazed by the AI-driven insights. The team's deep understanding of legal AI requirements and technical expertise made this project a tremendous success. - Team Lexa",
    "metadata": {
      "source": "testimonials",
      "title": "Lexa - Client Testimonial",
      "type": "testimonial",
      "category": "legal-tech",
      "project": "lexa",
      "year": "2025"
    }
  },
  {
    "content": "PROJECT: Kiswa Noire\nYEAR: 2025\nSERVICE: E-commerce Platform Development\nINDUSTRY: Premium Children's Fashion\nBRAND: Danish children's lifestyle brand\nSTACK: Shopify Custom Theme, CSS Variables, JavaScript, Geolocation API, Multi-currency, Multilingual\nLANGUAGES: English, German, French, Danish\nPAYMENTS: Apple Pay, Google Pay, PayPal\nMARKETS: European markets\nURL: https://kiswanoire.com",
    "metadata": {
      "source": "projects",
      "title": "Kiswa Noire - Facts",
      "type": "project",
      "category": "fashion-ecommerce",
      "subtype": "facts",
      "project": "kiswa-noire",
      "year": "2025"
    }
  },
  {
    "content": "Kiswa Noire is a premium Danish children's lifestyle brand requiring a sophisticated e-commerce platform embodying Scandinavian minimalism. The challenge was translating their Danish design philosophy into a digital experience for European parents seeking quality, sustainable children's products. Key requirements included multilingual support across EN, DE, FR, DK markets, geolocation-based personalization for different European regions, seamless shopping across all touchpoints, and maintaining premium brand positioning while ensuring accessibility and usability for parent shoppers.",
    "metadata": {
      "source": "projects",
      "title": "Kiswa Noire - Overview",
      "type": "project",
      "category": "fashion-ecommerce",
      "subtype": "overview",
      "project": "kiswa-noire",
      "year": "2025"
    }
  },
  {
    "content": "Platform: Custom Shopify theme for international e-commerce. Languages: Multilingual support for English, German, French, Danish. Geolocation: Automatic content and pricing adaptation for European markets. Payments: Apple Pay, Google Pay, PayPal integration. Styling: Advanced CSS variable management for responsive behavior across devices. Navigation: Sophisticated mega menu system with visual category blocks. Performance: Lazy-loaded assets, performance tracking, comprehensive analytics. Features: Dynamic product recommendations, comprehensive filtering, seamless search. Compliance: GDPR-compliant systems for European data protection. Inventory: International inventory management across multiple markets.",
    "metadata": {
      "source": "projects",
      "title": "Kiswa Noire - Tech Stack",
      "type": "project",
      "category": "fashion-ecommerce",
      "subtype": "stack",
      "project": "kiswa-noire",
      "year": "2025"
    }
  },
  {
    "content": "Design approach: Crafted Scandinavian minimalist visual experience reflecting Danish heritage with clean lines, neutral palettes, generous white space. Product photography: Lifestyle imagery showcasing products in real family contexts for emotional parent connection. Navigation system: Built mega menu with visual category blocks for shopping by child's developmental stage or product category. Technical implementation: Custom Shopify theme with CSS variables for consistent responsive behavior. Multilingual setup: Implemented EN, DE, FR, DK language support with geolocation personalization. Payment integration: Added Apple Pay, Google Pay, PayPal for European market preferences. Performance optimization: Lazy-loaded assets, custom JavaScript interactions, performance tracking. Compliance: Deployed GDPR-compliant systems for European data protection. Inventory management: Configured multi-market inventory synchronization.",
    "metadata": {
      "source": "projects",
      "title": "Kiswa Noire - Implementation",
      "type": "project",
      "category": "fashion-ecommerce",
      "subtype": "implementation",
      "project": "kiswa-noire",
      "year": "2025"
    }
  },
  {
    "content": "Online engagement: Remarkable growth after launch across European markets. Customer feedback: Consistent praise for intuitive shopping experience and Scandinavian aesthetic. European expansion: Multilingual capabilities and performance crucial for market growth. Brand representation: Platform perfectly captures premium brand essence and Danish design philosophy. Technical quality: Exceptional attention to detail in design and technical implementation. User experience: Seamless shopping across all touchpoints and devices. International reach: Successful multi-market operations with automatic localization.",
    "metadata": {
      "source": "projects",
      "title": "Kiswa Noire - Results",
      "type": "project",
      "category": "fashion-ecommerce",
      "subtype": "results",
      "project": "kiswa-noire",
      "year": "2025"
    }
  },
  {
    "content": "Other Dev understood our vision for bringing Scandinavian design principles to the digital space. The e-commerce platform they created perfectly captures our brand essence while delivering the sophisticated functionality we needed for international markets. The attention to detail in both design and technical implementation has been exceptional. Since launch, we've experienced remarkable growth in online engagement and our customers consistently praise the intuitive shopping experience. The platform's multilingual capabilities and performance have been crucial to our European expansion. - Kiswa Noire Team",
    "metadata": {
      "source": "testimonials",
      "title": "Kiswa Noire - Client Testimonial",
      "type": "testimonial",
      "category": "fashion-ecommerce",
      "project": "kiswa-noire",
      "year": "2025"
    }
  },
  // Wish Apparels
  {
    content: `PROJECT: Wish Apparels
YEAR: 2025
SERVICE: Branding and website development
INDUSTRY: Fashion e commerce
STACK: Shopify, Custom theme, Responsive CSS, Performance tracking
FEATURES: Brand identity, product catalog, secure checkout, visual storytelling
RESULTS: Significant increase in sales performance after launch
URL: https://wishapparels.com/`,
    metadata: {
      source: "projects",
      title: "Wish Facts",
      type: "project",
      category: "fashion-ecommerce",
      subtype: "facts",
      project: "wish",
      year: "2025"
    }
  },
  {
    content: `Overview. Wish needed a distinct brand identity and a scalable e commerce platform. The challenge was building a cohesive visual language while enabling growth in product range and traffic. This mattered because a new brand must convert first time visitors into customers while communicating quality and positioning.`,
    metadata: {
      source: "projects",
      title: "Wish Overview",
      type: "project",
      category: "fashion-ecommerce",
      subtype: "overview",
      project: "wish",
      year: "2025"
    }
  },
  {
    content: `Tech Stack. Shopify served as the commerce platform with a custom theme for pixel perfect layouts. Responsive CSS and modern asset loading ensured fast pages. Analytics and performance tracking measured conversion and page speed. These components worked together to deliver a stable store that is easy to manage and optimize.`,
    metadata: {
      source: "projects",
      title: "Wish Tech Stack",
      type: "project",
      category: "fashion-ecommerce",
      subtype: "stack",
      project: "wish",
      year: "2025"
    }
  },
  {
    content: `Implementation. We created a full branding system including logo, typography and color palette. The Shopify theme prioritized product imagery and streamlined checkout flows. Navigation and search were tuned for quick discovery. Inventory and payment integrations were configured to support launch scale while keeping operations simple for the client.`,
    metadata: {
      source: "projects",
      title: "Wish Implementation",
      type: "project",
      category: "fashion-ecommerce",
      subtype: "implementation",
      project: "wish",
      year: "2025"
    }
  },
  {
    content: `Results. Post launch metrics showed improved engagement and a measurable uplift in sales. The brand identity increased recognition across channels and the optimized checkout reduced abandonment. The platform now supports future expansion in product lines and markets.`,
    metadata: {
      source: "projects",
      title: "Wish Results",
      type: "project",
      category: "fashion-ecommerce",
      subtype: "results",
      project: "wish",
      year: "2025"
    }
  },
  {
    content: `Working with Other Dev was a game-changer for Wish Apparels. Their holistic approach to website development and branding delivered results far beyond our expectations. The new website's user-friendly design and compelling presentation directly contributed to a substantial increase in sales performance. The branding they crafted is sophisticated, memorable, and perfectly reflects our brand identity. - Talha, Founder of Wish`,
    metadata: {
      source: "testimonials",
      title: "Wish Testimonial",
      type: "testimonial",
      project: "wish",
      year: "2025"
    }
  },

  // Parcheh81
  {
    content: `PROJECT: Parcheh81
YEAR: 2024
SERVICE: Branding and e commerce website
INDUSTRY: Textile and fashion e commerce
STACK: Shopify, High fidelity imagery, Zoom features, Responsive UI
FEATURES: High resolution product presentation, cultural storytelling, checkout optimization
RESULTS: Dramatic boost in sales and stronger brand presence
URL: https://parcheh81.com/`,
    metadata: {
      source: "projects",
      title: "Parcheh81 Facts",
      type: "project",
      category: "fashion-ecommerce",
      subtype: "facts",
      project: "parcheh81",
      year: "2024"
    }
  },
  {
    content: `Overview. Parcheh required a digital experience that communicates craft and tactile quality. The challenge was translating fabric texture and heritage into digital product pages without losing usability. This mattered because customers rely on visuals and narrative to make purchase decisions for premium textiles.`,
    metadata: {
      source: "projects",
      title: "Parcheh81 Overview",
      type: "project",
      category: "fashion-ecommerce",
      subtype: "overview",
      project: "parcheh81",
      year: "2024"
    }
  },
  {
    content: `Tech Stack. Shopify was used for commerce with a custom front end to support high fidelity imagery and zoom. Image optimization and lazy loading balanced visual quality with performance. Theme components provided reusable product presentation patterns for consistent UX.`,
    metadata: {
      source: "projects",
      title: "Parcheh81 Tech Stack",
      type: "project",
      category: "fashion-ecommerce",
      subtype: "stack",
      project: "parcheh81",
      year: "2024"
    }
  },
  {
    content: `Implementation. We designed gallery style product pages with zoom and progressive image loading. The UI emphasized curated storytelling sections and clear purchase flows. Checkout and inventory management were implemented to support seasonal drops and high resolution assets without performance regression.`,
    metadata: {
      source: "projects",
      title: "Parcheh81 Implementation",
      type: "project",
      category: "fashion-ecommerce",
      subtype: "implementation",
      project: "parcheh81",
      year: "2024"
    }
  },
  {
    content: `Results. The site improved conversion and average order value through better product presentation and narrative. Brand perception strengthened and sales rose notably after launch. The platform is now used as the primary sales channel and brand showcase.`,
    metadata: {
      source: "projects",
      title: "Parcheh81 Results",
      type: "project",
      category: "fashion-ecommerce",
      subtype: "results",
      project: "parcheh81",
      year: "2024"
    }
  },
  {
    content: `Working with Other Dev transformed Parcheh. Their combined web and branding expertise delivered results beyond expectations. The user friendly site achieved a dramatic boost in sales. The sophisticated branding reflects our identity perfectly and is now used everywhere. We highly recommend Other Dev to any brand needing impactful digital results. - Nasir, Founder of Parcheh`,
    metadata: {
      source: "testimonials",
      title: "Parcheh Testimonial",
      type: "testimonial",
      project: "parcheh81",
      year: "2024"
    }
  },

  // Tiny Footprint Coffee
  {
    content: `PROJECT: Tiny Footprint Coffee
YEAR: 2024
SERVICE: Payment infrastructure migration and subscriptions
INDUSTRY: E commerce, subscription
STACK: Shopify Payments, Recharge migration scripts, Data migration tools, Secure token handling
FEATURES: Subscription migration, zero downtime transition, integrated customer portal
RESULTS: Zero subscriber disruption, simplified subscription management inside Shopify
URL: https://www.tinyfootprintcoffee.com/`,
    metadata: {
      source: "projects",
      title: "Tiny Footprint Facts",
      type: "project",
      category: "migration",
      subtype: "facts",
      project: "tiny-footprint-coffee",
      year: "2024"
    }
  },
  {
    content: `Overview. Tiny Footprint Coffee needed to migrate subscriptions from Recharge to Shopify Payments without disrupting paying subscribers. The key challenge was securely transferring subscription data and ensuring uninterrupted renewals. This was vital given the brand's mission and the trust of its supporter community.`,
    metadata: {
      source: "projects",
      title: "Tiny Footprint Overview",
      type: "project",
      category: "migration",
      subtype: "overview",
      project: "tiny-footprint-coffee",
      year: "2024"
    }
  },
  {
    content: `Tech Stack. Shopify Payments replaced Recharge. Migration scripts handled mapping of subscriber records and payment tokens while preserving billing cycles. Data validation and test migrations were used to confirm integrity. The stack prioritized security and auditable transfers.`,
    metadata: {
      source: "projects",
      title: "Tiny Footprint Tech Stack",
      type: "project",
      category: "migration",
      subtype: "stack",
      project: "tiny-footprint-coffee",
      year: "2024"
    }
  },
  {
    content: `Implementation. We planned phased test migrations, validated token mapping and ensured webhooks maintained subscription lifecycle events. The storefront and customer portal were adapted to Shopify native subscription flows. Contingency plans and rollback tests ensured zero downtime for active subscribers.`,
    metadata: {
      source: "projects",
      title: "Tiny Footprint Implementation",
      type: "project",
      category: "migration",
      subtype: "implementation",
      project: "tiny-footprint-coffee",
      year: "2024"
    }
  },
  {
    content: `Results. The migration completed with zero subscriber disruption. Subscription management is now native to Shopify which simplified operations and reduced maintenance overhead. The client regained time to focus on mission activities and subscriber engagement.`,
    metadata: {
      source: "projects",
      title: "Tiny Footprint Results",
      type: "project",
      category: "migration",
      subtype: "results",
      project: "tiny-footprint-coffee",
      year: "2024"
    }
  },
  {
    content: `Other Dev expertly handled our complex subscription migration from Recharge to Shopify Payments. The transition was remarkably smooth, with zero disruption to our subscribers who support our reforestation mission. Managing subscriptions is now much simpler within Shopify, freeing up valuable time for our team to focus on our coffee quality and environmental impact. - Alan, Operations Manager at Tiny Footprint Coffee`,
    metadata: {
      source: "testimonials",
      title: "Tiny Footprint Testimonial",
      type: "testimonial",
      project: "tiny-footprint-coffee",
      year: "2024"
    }
  },

  // Ek Qadam Aur
  {
    content: `PROJECT: Ek Qadam Aur
YEAR: 2023
SERVICE: Enterprise infrastructure development and website
INDUSTRY: Enterprise, NGO
STACK: Web platform, CMS, Scalable hosting, Backup and security tooling
FEATURES: Robust site, infrastructure for project data and content, link to enterprise resources
RESULTS: Stable enterprise platform supporting organizational objectives
URL: http://ekqadamaur.kabeers.network/`,
    metadata: {
      source: "projects",
      title: "Ek Qadam Aur Facts",
      type: "project",
      category: "enterprise",
      subtype: "facts",
      project: "ek-qadam-aur",
      year: "2023"
    }
  },
  {
    content: `Overview. Ek Qadam Aur needed enterprise grade web infrastructure to present programs and manage project content. The challenge was delivering reliability and secure content workflows for an organization with complex information requirements. This mattered to sustain stakeholder trust and operational continuity.`,
    metadata: {
      source: "projects",
      title: "Ek Qadam Aur Overview",
      type: "project",
      category: "enterprise",
      subtype: "overview",
      project: "ek-qadam-aur",
      year: "2023"
    }
  },
  {
    content: `Tech Stack. The solution used a CMS back end integrated with static or server rendered front ends depending on use case. Hosting was configured for high availability with backups and standard security controls. API endpoints supported integrations with project management tools.`,
    metadata: {
      source: "projects",
      title: "Ek Qadam Aur Tech Stack",
      type: "project",
      category: "enterprise",
      subtype: "stack",
      project: "ek-qadam-aur",
      year: "2023"
    }
  },
  {
    content: `Implementation. We delivered a modular infrastructure with content workflows, role based access controls and automated backups. Performance optimizations and caching ensured responsive pages across devices. Integrations were built to allow program updates and document sharing between stakeholders.`,
    metadata: {
      source: "projects",
      title: "Ek Qadam Aur Implementation",
      type: "project",
      category: "enterprise",
      subtype: "implementation",
      project: "ek-qadam-aur",
      year: "2023"
    }
  },
  {
    content: `Results. The platform provided a robust public presence and internal content management for program teams. System reliability improved communications with stakeholders and supported program scaling without infrastructure bottlenecks.`,
    metadata: {
      source: "projects",
      title: "Ek Qadam Aur Results",
      type: "project",
      category: "enterprise",
      subtype: "results",
      project: "ek-qadam-aur",
      year: "2023"
    }
  },
  {
    content: `Enterprise infrastructure development for Ek Qadam Aur. Visit: http://ekqadamaur.kabeers.network/`,
    metadata: {
      source: "testimonials",
      title: "Ek Qadam Aur Testimonial",
      type: "testimonial",
      project: "ek-qadam-aur",
      year: "2023"
    }
  },

  // Groovy Pakistan
  {
    content: `PROJECT: Groovy Pakistan
YEAR: 2024
SERVICE: E commerce website development and Shopify integrations
INDUSTRY: Retail, E commerce
STACK: Shopify, Custom storefront, Search and filters, Payment gateways
FEATURES: Product showcases, advanced search and filtering, secure checkout
RESULTS: Improved online sales channel and scalable storefront
URL: https://groovypakistan.com/`,
    metadata: {
      source: "projects",
      title: "Groovy Facts",
      type: "project",
      category: "retail-ecommerce",
      subtype: "facts",
      project: "groovy-pakistan",
      year: "2024"
    }
  },
  {
    content: `Overview. Groovy Pakistan required a cohesive e commerce experience that matches their brand energy and handles diverse products. The challenge included building a cohesive catalog, search and filtering, and reliable payment flows. This was critical to scale online sales and reach their target customers.`,
    metadata: {
      source: "projects",
      title: "Groovy Overview",
      type: "project",
      category: "retail-ecommerce",
      subtype: "overview",
      project: "groovy-pakistan",
      year: "2024"
    }
  },
  {
    content: `Tech Stack. Shopify provided the commerce core. A custom storefront enabled advanced filtering and search to handle product complexity. Multiple payment gateways and account features supported conversions and repeat purchases. Performance and scale considerations guided asset strategies.`,
    metadata: {
      source: "projects",
      title: "Groovy Tech Stack",
      type: "project",
      category: "retail-ecommerce",
      subtype: "stack",
      project: "groovy-pakistan",
      year: "2024"
    }
  },
  {
    content: `Implementation. We built an intuitive product discovery flow with robust search, filters and category navigation. Product pages used rich media and clear specifications to reduce purchase friction. Checkout was simplified and payment integrations were tested for reliability.`,
    metadata: {
      source: "projects",
      title: "Groovy Implementation",
      type: "project",
      category: "retail-ecommerce",
      subtype: "implementation",
      project: "groovy-pakistan",
      year: "2024"
    }
  },
  {
    content: `Results. The website improved customer journeys and created a dependable online sales channel for the brand. The client gained a scalable storefront and better operational workflows for order and inventory management.`,
    metadata: {
      source: "projects",
      title: "Groovy Results",
      type: "project",
      category: "retail-ecommerce",
      subtype: "results",
      project: "groovy-pakistan",
      year: "2024"
    }
  },
  {
    content: `Working with Groovy Pakistan on their e commerce development was a rewarding experience for our team at Other Dev. We focused on understanding their brand ethos and translating that into a functional and visually engaging online platform. - Kabeer, Founder of Other Dev`,
    metadata: {
      source: "testimonials",
      title: "Groovy Testimonial",
      type: "testimonial",
      project: "groovy-pakistan",
      year: "2024"
    }
  },

  // Finlit
  {
    content: `PROJECT: Finlit
YEAR: 2025
SERVICE: Branding and SaaS platform development
INDUSTRY: Edtech, Financial literacy
STACK: Astro, Next.js, Vercel, Interactive learning modules, Progress tracking
FEATURES: Structured courses, quizzes, progress tracking, multilingual support
RESULTS: Launched scalable SaaS learning platform with clear UX for finance education
URL: https://finlit.deployments.otherdev.com/`,
    metadata: {
      source: "projects",
      title: "Finlit Facts",
      type: "project",
      category: "edtech-saas",
      subtype: "facts",
      project: "finlit",
      year: "2025"
    }
  },
  {
    content: `Overview. Finlit required a trustworthy brand and a SaaS product that simplifies financial concepts. The challenge was blending pedagogical design with scalable engineering to host interactive courses. This mattered because accessible finance education requires clear structure and measurable learner progress.`,
    metadata: {
      source: "projects",
      title: "Finlit Overview",
      type: "project",
      category: "edtech-saas",
      subtype: "overview",
      project: "finlit",
      year: "2025"
    }
  },
  {
    content: `Tech Stack. The platform used Astro and Next.js for front end performance. Vercel hosted the application for scalable deployments. Interactive modules, quizzes and progress tracking were implemented to create a course flow. The tech stack prioritized fast load times and low operational overhead.`,
    metadata: {
      source: "projects",
      title: "Finlit Tech Stack",
      type: "project",
      category: "edtech-saas",
      subtype: "stack",
      project: "finlit",
      year: "2025"
    }
  },
  {
    content: `Implementation. We built a minimal and focused UI to reduce cognitive load. Courses were structured into progressive lessons with interactive checks and analytics for completion. The architecture supports future course expansion and localization while keeping performance optimized.`,
    metadata: {
      source: "projects",
      title: "Finlit Implementation",
      type: "project",
      category: "edtech-saas",
      subtype: "implementation",
      project: "finlit",
      year: "2025"
    }
  },
  {
    content: `Results. Finlit launched as a scalable SaaS with clear progress tracking and an accessible curriculum. The platform is positioned to onboard learners with measurable outcomes and to scale course offerings across markets.`,
    metadata: {
      source: "projects",
      title: "Finlit Results",
      type: "project",
      category: "edtech-saas",
      subtype: "results",
      project: "finlit",
      year: "2025"
    }
  },
  {
    content: `Developing Finlit from the ground up was an exciting and rewarding project for our team at Other Dev. We embraced the challenge of creating a comprehensive SaaS platform that simplifies financial literacy through thoughtful branding and intuitive design. - Kabeer, Founder of Other Dev`,
    metadata: {
      source: "testimonials",
      title: "Finlit Testimonial",
      type: "testimonial",
      project: "finlit",
      year: "2025"
    }
  }
];
