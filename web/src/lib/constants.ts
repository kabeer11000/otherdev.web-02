export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  header: 1700,
  mobileMenu: 1800,
  chatButton: 1900,
  chatWidget: 2000,
  toast: 2100,
} as const;

export const SUGGESTED_PROMPTS = [
  {
    display: "What services does OtherDev offer?",
    prompt:
      "Provide a comprehensive overview of OtherDev's services and capabilities. Include:\n- Core service offerings (web development, design, e-commerce, etc.)\n- Industries and sectors you specialize in\n- Key differentiators and unique value propositions\n- Types of projects you typically handle\n- Technologies and methodologies used in service delivery\nFormat the response in a clear, structured way that's easy to understand for potential clients.",
  },
  {
    display: "Who are the founders and what's the company story?",
    prompt:
      "Tell me about OtherDev's founding story and the people behind the company. Please include:\n- Founders' names, backgrounds, and expertise\n- The inspiration and motivation for starting OtherDev\n- Company mission, vision, and core values\n- Key milestones and achievements since founding\n- Team culture and what makes OtherDev unique as an organization\nProvide a compelling narrative that showcases the human side of the business.",
  },
  {
    display: "What technologies do you use?",
    prompt:
      "Provide a detailed breakdown of OtherDev's technology stack and development approach. Include:\n- Frontend technologies and frameworks (React, Next.js, TypeScript, etc.)\n- Backend technologies and infrastructure\n- Design and prototyping tools\n- Development workflows and methodologies\n- Quality assurance and testing approaches\n- Deployment and DevOps practices\nExplain why these technologies were chosen and how they benefit clients' projects.",
  },
  {
    display: "Build a portfolio website",
    prompt:
      "Build me a complete, interactive portfolio website using React and Tailwind CSS. Create:\n- A stunning hero section with animated introduction and gradient backgrounds\n- An about section with animated skill cards\n- A projects showcase with interactive hover effects and modal previews\n- A working contact form with validation\n- Smooth scroll animations and modern transitions\n- Glass morphism effects and modern UI design\n- Fully responsive layout that works beautifully on all devices\nUse React from CDN with Babel standalone for JSX, and Tailwind CSS from CDN. Make it visually impressive and production-ready.",
  },
];
