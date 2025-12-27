export interface KnowledgeDocument {
  content: string;
  metadata: {
    source: string;
    title: string;
    type: 'project' | 'service' | 'about' | 'general';
    category?: string;
  };
}

export const knowledgeBase: KnowledgeDocument[] = [
  {
    content: "OtherDev is a full-service web development and design studio based in Karachi City, Pakistan. The company was founded in 2021 by Kabeer Jaffri and Ossaid Qadri, who met while studying at Habib Public School. OtherDev produces digital platforms for pioneering creatives, with a special focus on the fashion and design industries. The studio combines technical expertise with thoughtful design to bring ideas to life.",
    metadata: {
      source: "about-page",
      title: "About OtherDev - Company Overview",
      type: "about"
    }
  },
  {
    content: "OtherDev's team consists of two co-founders: Kabeer Jaffri and Ossaid Qadri. They are childhood friends who attended Habib Public School together in Karachi. Their partnership combines expertise in web development, design, and business strategy. The team is based in Karachi City, Pakistan, and works with clients globally, particularly in the fashion, design, and enterprise sectors.",
    metadata: {
      source: "about-page",
      title: "OtherDev Team and Founders",
      type: "about"
    }
  },
  {
    content: "OtherDev has worked with a diverse range of clients including: Narkins Builders (real estate), Bin Yousuf Group (real estate), Lexa (legal tech), Olly Shinder (fashion designer from London), Wish Apparels (clothing brand), Groovy Pakistan (e-commerce), Parcheh81 (textiles and fabrics), Tiny Footprint Coffee (carbon-negative coffee company), Finlit (financial literacy SaaS), Ek Qadam Aur (NGO), Kiswa Noir (Pakistani children's brand), BLVD, Cultured Legacy, and NTL Exchange (trading platform).",
    metadata: {
      source: "about-page",
      title: "OtherDev Client List",
      type: "about"
    }
  },
  {
    content: "OtherDev specializes in comprehensive web development services including: custom website design and development, e-commerce platform creation (Shopify and custom solutions), branding and visual identity design, SaaS platform development, SEO optimization and technical improvements, enterprise infrastructure solutions, payment system integration and migration, mobile application development, and ongoing technical partnership and support. The studio uses modern technologies including Next.js, React, TypeScript, Tailwind CSS, and various CMS platforms.",
    metadata: {
      source: "services",
      title: "OtherDev Services and Expertise",
      type: "service",
      category: "general-services"
    }
  },
  {
    content: "OtherDev's technical stack includes: Next.js 16 with App Router for server-side rendering, React 19 for UI components, TypeScript for type safety, Tailwind CSS 4 for styling, tRPC for type-safe APIs, Radix UI for accessible component primitives, Framer Motion for animations, Zod for schema validation, Bun runtime and package manager, Biome for linting and formatting, and various modern web technologies. The studio follows industry best practices for performance, accessibility, and SEO.",
    metadata: {
      source: "technology",
      title: "OtherDev Technology Stack",
      type: "service",
      category: "technology"
    }
  },
  {
    content: "SEO Implementation & Technical Optimization for Narkins Builders (2025): OtherDev completed a comprehensive SEO transformation for Narkins Builders featuring technical optimization, schema markup implementation, and MDX blog migration. The project achieved a 30% traffic improvement and elevated their rankings to compete with industry giants in Pakistan's real estate market. Services included comprehensive technical SEO, structured data markup, blog content migration to MDX format, and performance optimization. Visit: narkinsbuilders.com/blog",
    metadata: {
      source: "projects",
      title: "Narkins Builders SEO Project",
      type: "project",
      category: "seo"
    }
  },
  {
    content: "Real Estate Platform Development for Bin Yousuf Group (2025): OtherDev developed a sophisticated real estate platform for Bin Yousuf Group showcasing premium waterfront properties in Karachi. The platform features interactive galleries, Google Sheets lead integration for automated lead management, and optimized user experience for marketing Emaar Oceanfront and HMR Waterfront luxury investments. The website provides an elegant browsing experience for high-end real estate buyers. Visit: binyousufgroup.com",
    metadata: {
      source: "projects",
      title: "Bin Yousuf Group Real Estate Platform",
      type: "project",
      category: "real-estate"
    }
  },
  {
    content: "AI Legal Assistant Platform for Lexa (2025): OtherDev built an intelligent AI legal assistant platform designed for law firms and SMEs. The platform features real-time contract analysis, automated document generation, and collaborative editing capabilities. It combines advanced natural language processing with user-friendly interfaces for legal professionals across Asia and the Middle East. The platform helps streamline legal workflows and improve efficiency in document processing. Visit: lexa.deployments.otherdev.com",
    metadata: {
      source: "projects",
      title: "Lexa AI Legal Platform",
      type: "project",
      category: "legal-tech"
    }
  },
  {
    content: "E-commerce Platform for Olly Shinder (2025): OtherDev designed and developed a minimal, grid-based e-commerce platform for Olly Shinder, a menswear designer from London who is part of the Fashion East and Dover Street Market incubators. The platform unifies his collections and e-commerce content with a clean, sophisticated aesthetic that reflects the designer's minimalist approach to fashion. The website features product galleries, collection pages, and seamless shopping experience. Visit: olly-shinder.com",
    metadata: {
      source: "projects",
      title: "Olly Shinder Fashion E-commerce",
      type: "project",
      category: "fashion"
    }
  },
  {
    content: "Branding & Website Development for Wish Apparels (2024): OtherDev provided complete branding and e-commerce platform development for Wish Apparels. The project included brand identity design, visual direction, and a custom e-commerce website showcasing their clothing line with high-quality visuals. The intuitive design creates a seamless shopping experience that communicates the brand's ethos and drives customer engagement. The platform features product catalogs, shopping cart functionality, and brand storytelling elements. Visit: wishapparels.com",
    metadata: {
      source: "projects",
      title: "Wish Apparels Branding and E-commerce",
      type: "project",
      category: "fashion-branding"
    }
  },
  {
    content: "Website Infrastructure for Narkins Builders (2025): In addition to SEO work, OtherDev created the complete website infrastructure for Narkins Builders, a construction company. The robust platform showcases their construction portfolio, ongoing projects, and services. The user-friendly website is designed to facilitate client inquiries and enhance digital communication with stakeholders in Pakistan's construction industry. Visit: narkinsbuilders.com",
    metadata: {
      source: "projects",
      title: "Narkins Builders Website Infrastructure",
      type: "project",
      category: "construction"
    }
  },
  {
    content: "Branding & SaaS Platform for Finlit (2025): OtherDev developed a comprehensive SaaS platform for Finlit, including complete branding, visual identity, and full-stack learning application. The platform focuses on financial literacy education with a minimalist design that empowers users to confidently navigate the world of finance. Features include course management, interactive learning modules, team collaboration, and trading simulations. The clean, modern interface makes complex financial concepts accessible. Visit: finlit.deployments.otherdev.com",
    metadata: {
      source: "projects",
      title: "Finlit Financial Literacy SaaS",
      type: "project",
      category: "saas-education"
    }
  },
  {
    content: "Website Development for Groovy Pakistan (2024): OtherDev created a strategic e-commerce website for Groovy Pakistan that mirrors the brand's dynamic spirit. The straightforward and engaging digital space provides an intuitive pathway for customers to explore and purchase products. The platform features product catalogs, mobile-responsive design, and smooth shopping experience that reflects the brand's energetic personality.",
    metadata: {
      source: "projects",
      title: "Groovy Pakistan E-commerce",
      type: "project",
      category: "e-commerce"
    }
  },
  {
    content: "Branding & Website for Parcheh81 (2024): OtherDev developed a tailored e-commerce platform for Parcheh that translates the texture and artistry of their premium textiles into a digital experience. The elegant and intuitive design offers an immersive journey into the brand's world of premium fabrics. The platform features high-quality product photography, detailed fabric information, and sophisticated browsing experience for discerning customers. Visit: parcheh81.com",
    metadata: {
      source: "projects",
      title: "Parcheh81 Textiles E-commerce",
      type: "project",
      category: "fashion-textiles"
    }
  },
  {
    content: "Payment Infrastructure Migration for Tiny Footprint Coffee: OtherDev executed a strategic subscription migration from Recharge to Shopify Payments for Tiny Footprint Coffee, the world's first carbon-negative coffee company. The seamless transition maintained complete data integrity and ensured uninterrupted service for subscribers who support the company's environmental mission. The migration involved careful planning, data transfer, and testing to prevent service disruption. Visit: tinyfootprintcoffee.com",
    metadata: {
      source: "projects",
      title: "Tiny Footprint Coffee Payment Migration",
      type: "project",
      category: "e-commerce-migration"
    }
  },
  {
    content: "Website Development for Cultured Legacy (2025): OtherDev created a strategic e-commerce website for Cultured Legacy (CLTRD Legacy) that honors the brand's refined heritage. The sophisticated yet accessible digital space guides customers through a curated journey of exploration and discovery. The platform combines elegant design with intuitive navigation to showcase the brand's premium products. Visit: culturedlegacy.shop",
    metadata: {
      source: "projects",
      title: "Cultured Legacy E-commerce",
      type: "project",
      category: "e-commerce"
    }
  },
  {
    content: "Enterprise Infrastructure for Ek Qadam Aur (2024): OtherDev serves as the core technology team for Ek Qadam Aur NGO in a long-term technical partnership. The comprehensive engagement includes website design, development, hosting infrastructure, and ongoing technical support. From inception to present day, OtherDev has been their dedicated technology partner, ensuring seamless digital operations for their social impact initiatives. This demonstrates OtherDev's capability in providing sustained technical support and infrastructure management. Visit: ekqadamaur.org",
    metadata: {
      source: "projects",
      title: "Ek Qadam Aur NGO Partnership",
      type: "project",
      category: "ngo-enterprise"
    }
  },
  {
    content: "Enterprise Infrastructure for NTL Exchange (2024): OtherDev completed a comprehensive digital transformation for NTL Exchange, a trading platform. The project encompassed complete brand identity creation, custom mobile application development for seamless on-the-go trading, responsive website design and development, and robust enterprise infrastructure solutions. The unified ecosystem delivers secure, efficient, and user-friendly exchange services across all platforms. Visit: ntlex.com",
    metadata: {
      source: "projects",
      title: "NTL Exchange Digital Transformation",
      type: "project",
      category: "fintech-enterprise"
    }
  },
  {
    content: "OtherDev specializes in e-commerce development with expertise in both Shopify and custom solutions. Services include: complete e-commerce platform development, Shopify store setup and customization, custom shopping cart implementation, payment gateway integration (Stripe, PayPal, Shopify Payments), subscription system setup, product catalog management, inventory systems, order processing workflows, and payment infrastructure migrations. The studio has successfully delivered e-commerce solutions for fashion brands, coffee companies, textile businesses, and retail stores.",
    metadata: {
      source: "services",
      title: "E-commerce Development Services",
      type: "service",
      category: "e-commerce"
    }
  },
  {
    content: "OtherDev provides comprehensive branding services including: brand identity design, logo creation, visual identity systems, color palette development, typography selection, brand guidelines documentation, marketing material design, and brand strategy consulting. The studio has created successful brand identities for companies like Wish Apparels, Finlit, Parcheh81, and NTL Exchange, combining strategic thinking with creative execution.",
    metadata: {
      source: "services",
      title: "Branding and Visual Identity Services",
      type: "service",
      category: "branding"
    }
  },
  {
    content: "OtherDev offers specialized SEO and technical optimization services including: comprehensive technical SEO audits, schema markup implementation, structured data optimization, page speed optimization, mobile responsiveness improvements, blog migration and content management, MDX blog setup, search engine ranking improvements, Google Search Console optimization, and ongoing SEO monitoring. The Narkins Builders project achieved 30% traffic improvement through these services.",
    metadata: {
      source: "services",
      title: "SEO and Technical Optimization",
      type: "service",
      category: "seo"
    }
  },
  {
    content: "OtherDev develops SaaS platforms with full-stack capabilities including: custom application development, user authentication systems, database architecture, API development, subscription management, payment integration, admin dashboards, analytics implementation, and scalable infrastructure. Examples include Lexa (legal tech platform) and Finlit (financial literacy platform), demonstrating expertise in complex application development.",
    metadata: {
      source: "services",
      title: "SaaS Platform Development",
      type: "service",
      category: "saas"
    }
  },
  {
    content: "OtherDev provides enterprise infrastructure services for large-scale projects including: custom mobile application development, responsive web design, hosting infrastructure setup and management, ongoing technical support and maintenance, technology team augmentation, long-term technical partnerships, system architecture planning, and scalable solution design. The studio serves as the dedicated technology team for organizations like Ek Qadam Aur NGO.",
    metadata: {
      source: "services",
      title: "Enterprise Infrastructure Solutions",
      type: "service",
      category: "enterprise"
    }
  },
  {
    content: "OtherDev has particular expertise in the fashion and design industries, having worked with multiple fashion brands and designers. Clients include Olly Shinder (London-based menswear designer), Wish Apparels (clothing brand), Parcheh81 (premium textiles), Groovy Pakistan (fashion e-commerce), and Kiswa Noir (Pakistani children's brand). The studio understands the unique needs of fashion businesses including high-quality visual presentation, seasonal collection management, and brand storytelling.",
    metadata: {
      source: "services",
      title: "Fashion Industry Specialization",
      type: "service",
      category: "fashion"
    }
  },
  {
    content: "OtherDev serves clients in the real estate sector with specialized solutions for property marketing and lead generation. Projects include Bin Yousuf Group (luxury waterfront properties in Karachi) and Narkins Builders (construction company). Services for real estate clients include property showcase websites, interactive image galleries, Google Sheets integration for lead management, project portfolio displays, and SEO optimization to compete with major players in Pakistan's real estate market.",
    metadata: {
      source: "services",
      title: "Real Estate Web Solutions",
      type: "service",
      category: "real-estate"
    }
  },
  {
    content: "OtherDev is based in Karachi City, Pakistan, and has been operating since 2021. The company's location in Karachi provides expertise in the Pakistani market while serving international clients. The studio works remotely with clients globally, particularly in Pakistan, the Middle East, Asia, Europe (including London), and North America. Time zone coverage allows for effective communication with clients across different regions.",
    metadata: {
      source: "about",
      title: "OtherDev Location and Market Reach",
      type: "about"
    }
  },
  {
    content: "Contact OtherDev: The studio is based in Karachi City, Pakistan. Website: otherdev.com. For inquiries about projects, partnerships, or services, users can visit the website's contact form. OtherDev works with clients globally and responds to inquiries promptly. The team specializes in fashion, design, real estate, SaaS, and enterprise solutions.",
    metadata: {
      source: "contact",
      title: "How to Contact OtherDev",
      type: "general"
    }
  },
  {
    content: "OtherDev's approach to web development emphasizes: thoughtful design that brings ideas to life, modern technology stacks for performance and scalability, user-centered design focusing on intuitive experiences, mobile-first responsive design, accessibility best practices using Radix UI, SEO optimization from the ground up, and ongoing support and maintenance. The studio combines technical excellence with design sensibility to create platforms that serve both business goals and user needs.",
    metadata: {
      source: "approach",
      title: "OtherDev Development Philosophy",
      type: "general"
    }
  },
  {
    content: "OtherDev's portfolio demonstrates versatility across multiple industries: Fashion and Design (Olly Shinder, Wish Apparels, Parcheh81, Groovy Pakistan), Real Estate (Bin Yousuf Group, Narkins Builders), Technology and SaaS (Lexa legal tech, Finlit financial literacy), E-commerce (various Shopify and custom platforms), Enterprise Solutions (NTL Exchange, Ek Qadam Aur NGO), and specialized services like payment migrations (Tiny Footprint Coffee) and SEO optimization. This range showcases the studio's ability to adapt to different business needs and technical requirements.",
    metadata: {
      source: "portfolio",
      title: "OtherDev Portfolio Overview",
      type: "general"
    }
  },
  {
    content: "OtherDev has experience with multiple platforms and technologies including: Next.js and React for modern web applications, Shopify for e-commerce solutions, custom CMS platforms, Google Sheets integration for lead management, various payment gateways (Stripe, PayPal, Shopify Payments), mobile application development frameworks, MDX for blog content, and modern deployment platforms. This technical versatility allows the studio to recommend and implement the best solution for each client's specific needs.",
    metadata: {
      source: "technology",
      title: "Platform and Integration Expertise",
      type: "service",
      category: "technology"
    }
  }
];
