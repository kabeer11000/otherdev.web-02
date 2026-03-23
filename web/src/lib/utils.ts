import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/^[*-]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .trim();
}

// Source - https://stackoverflow.com/a/2450976
// Posted by ChristopheD, modified by community. See post 'Timeline' for change history
// Retrieved 2025-11-12, License - CC BY-SA 4.0
export function cleanSuggestionMarkers(content: string): string {
  return content.replace(/\s*SUGGESTION:[\s\S]*$/i, "").trim();
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  let currentIndex = result.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [result[currentIndex], result[randomIndex]] = [
      result[randomIndex],
      result[currentIndex],
    ];
  }
  return result;
}
