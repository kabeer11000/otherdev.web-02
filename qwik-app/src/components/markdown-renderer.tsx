import { component$ } from "@builder.io/qwik";
import { marked } from "marked";

// Configure marked with plugins
marked.use({
  gfm: true,
  breaks: true,
});

export const MarkdownRenderer = component$<{ content: string }>(({ content }) => {
  const htmlContent = marked.parse(content) as string;

  return (
    <div
      class="prose prose-sm prose-stone max-w-none"
      dangerouslySetInnerHTML={htmlContent}
    />
  );
});
