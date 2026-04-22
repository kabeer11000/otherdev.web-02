import { component$, $ } from "@builder.io/qwik";
import { marked } from "marked";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

// Configure marked with plugins
marked.use({
  gfm: true,
  breaks: true,
});

export const MarkdownRenderer = component$<{ content: string }>(({ content }) => {
  const htmlContent = marked.parse(content) as string;

  return (
    <div
      class="font-[var(--twk-lausanne)] text-sm whitespace-pre-wrap"
      dangerouslySetInnerHTML={htmlContent}
    />
  );
});
