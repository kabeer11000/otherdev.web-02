"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BundledLanguage, codeToHtml } from "shiki";
import { CopyButton } from "./copy-button";

interface CodeBlockProps {
  children: string;
  className?: string;
}

function CodeBlock({ children, className }: CodeBlockProps) {
  const [highlightedCode, setHighlightedCode] = React.useState<string>("");
  const language =
    (className?.replace("language-", "") as BundledLanguage) || "plaintext";

  React.useEffect(() => {
    const highlightCode = async () => {
      try {
        const html = await codeToHtml(children.trim(), {
          lang: language,
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
        });
        setHighlightedCode(html);
      } catch (error) {
        console.error("Error highlighting code:", error);
        setHighlightedCode(`<pre><code>${children}</code></pre>`);
      }
    };

    highlightCode();
  }, [children, language]);

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <CopyButton
          content={children.trim()}
          copyMessage="Code copied to clipboard"
        />
      </div>
      {highlightedCode ? (
        <div
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
          className="[&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:text-sm [&>pre]:leading-relaxed"
        />
      ) : (
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
          <code>{children}</code>
        </pre>
      )}
    </div>
  );
}

interface MarkdownRendererProps {
  children: string;
}

function autoLinkPhoneNumbers(text: string): string {
  const phoneRegex = /(\+?\d{1,3}[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{4})/g;
  return text.replace(phoneRegex, (match) => {
    const cleanNumber = match.replace(/[\s-]/g, '');
    return `[${match}](tel:${cleanNumber})`;
  });
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  const processedContent = autoLinkPhoneNumbers(children);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }: any) {
          const content = String(children).replace(/\n$/, "");
          const isInline = !className;

          if (isInline) {
            return (
              <code
                className="bg-muted/50 px-1.5 py-0.5 rounded text-[0.875em] font-mono border border-border/50"
                {...props}
              >
                {content}
              </code>
            );
          }

          return <CodeBlock className={className}>{content}</CodeBlock>;
        },
        p({ children }) {
          return <p className="my-2 leading-relaxed">{children}</p>;
        },
        h1({ children }) {
          return <h1 className="text-2xl font-bold mt-6 mb-3">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-xl font-bold mt-5 mb-2">{children}</h2>;
        },
        h3({ children }) {
          return (
            <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
          );
        },
        ul({ children }) {
          return (
            <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
          );
        },
        ol({ children }) {
          return (
            <ol className="list-decimal list-inside my-2 space-y-1">
              {children}
            </ol>
          );
        },
        li({ children }) {
          return <li className="ml-4">{children}</li>;
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-muted-foreground/30 pl-4 my-3 italic">
              {children}
            </blockquote>
          );
        },
        a({ href, children }) {
          const isTelLink = href?.startsWith('tel:');
          return (
            <a
              href={href}
              target={isTelLink ? undefined : "_blank"}
              rel={isTelLink ? undefined : "noopener noreferrer"}
              className={isTelLink ? "text-foreground hover:underline" : undefined}
            >
              {children}
            </a>
          );
        },
        strong({ children }) {
          return <strong className="font-semibold">{children}</strong>;
        },
        em({ children }) {
          return <em className="italic">{children}</em>;
        },
        hr() {
          return <hr className="my-4 border-border" />;
        },
        table({ children }) {
          return (
            <div className="my-4 overflow-x-auto">
              <table className="min-w-full border-collapse border border-border">
                {children}
              </table>
            </div>
          );
        },
        thead({ children }) {
          return <thead className="bg-muted">{children}</thead>;
        },
        tbody({ children }) {
          return <tbody>{children}</tbody>;
        },
        tr({ children }) {
          return <tr className="border-b border-border">{children}</tr>;
        },
        th({ children }) {
          return (
            <th className="px-4 py-2 text-left font-semibold border border-border">
              {children}
            </th>
          );
        },
        td({ children }) {
          return <td className="px-4 py-2 border border-border">{children}</td>;
        },
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
}
