"use client";

import { useState, useRef, useEffect } from "react";
import type { ToolCallMessagePart } from "@assistant-ui/react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Copy, Check } from "lucide-react";

interface ArtifactRendererProps {
  toolCall: ToolCallMessagePart;
}

export function ArtifactRenderer({ toolCall }: ArtifactRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { title, code, description } = toolCall.args as {
    title: string;
    code: string;
    description: string;
  };

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-sm font-medium text-foreground sm:text-base">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 truncate font-serif text-xs text-muted-foreground sm:text-sm">
              {description}
            </p>
          )}
        </div>
        <div className="ml-3 flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 w-7 p-0 hover:bg-muted sm:h-8 sm:w-8"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-600 sm:h-4 sm:w-4" />
            ) : (
              <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 p-0 hover:bg-muted sm:h-8 sm:w-8"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? (
              <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
      </div>

      <div
        className={`bg-background transition-all duration-300 ${
          isExpanded ? "h-[70vh]" : "h-[400px] sm:h-[500px]"
        }`}
      >
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
          className="h-full w-full"
          title={title}
        />
      </div>
    </div>
  );
}
