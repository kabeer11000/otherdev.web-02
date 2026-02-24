/**
 * Site configuration constants
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://otherdev.com";

/**
 * Generate absolute URL from path
 */
export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${SITE_URL}/${cleanPath}`;
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
} as const;

/**
 * Suggested prompts for the chat widget
 */
export const SUGGESTED_PROMPTS = [
  {
    label: "Our Services",
    prompt: "What services does OtherDev offer?",
  },
  {
    label: "Projects",
    prompt: "Tell me about your recent projects",
  },
  {
    label: "Team",
    prompt: "Who are the founders of OtherDev?",
  },
  {
    label: "Contact",
    prompt: "How can I get in touch?",
  },
] as const;
