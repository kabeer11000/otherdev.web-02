"use client";

import { ArrowDown, ChevronDown, ChevronRight, Send } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CopyButton } from "@/components/ui/copy-button";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { PromptSuggestions } from "@/components/ui/prompt-suggestions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { useAutosizeTextArea } from "@/hooks/use-autosize-textarea";
import { useLocalStorageMessages } from "@/hooks/use-local-storage-messages";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { SUGGESTED_PROMPTS, Z_INDEX } from "@/lib/constants";
import type { WidgetMessage as Message } from "@/lib/content-types";
import { parseSSEStream } from "@/lib/sse";
import { LoomPageClient } from "./otherdev-loom-thread";
import { cn } from "@/lib/utils";

const MAX_INPUT_LENGTH = 500;
const CHAT_WIDGET_STORAGE_KEY = "otherdev-chat-widget-messages";


export function ChatWidget() {


  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };
  if (pathname?.startsWith("/loom")) {
    return null;
  }
  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed",
            "bottom-4 right-4",
            "sm:bottom-6 sm:right-6",
            "md:bottom-8 md:right-8",
            "h-14 w-14",
            "md:h-12 md:w-12",
            "flex border items-center justify-center",
            "rounded-full shadow-sm",
            "bg-background",
            "hover:opacity-80 hover:scale-110",
            "transition-all focus:outline-none",
          )}
          style={{ zIndex: Z_INDEX.chatButton }}
          aria-label="Open chat"
        >
          <Image
            src="/otherdev-chat-logo.svg"
            alt="Other Dev AI"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
        </button>
      )}

      {isOpen && (
        <Card
          ref={cardRef}
          className={cn(
            "fixed flex flex-col ",
            "shadow-2xl border overflow-hidden",
            "p-0 gap-0 bg-background",
            "animate-[slideInFromBottom_0.5s_ease-out_forwards]",
            "inset-0 rounded-none",
            "sm:inset-4 sm:rounded-2xl sm:max-w-[90vw] sm:max-h-[calc(100vh-2rem)]",
            "md:[inset:unset] md:bottom-8 md:right-8 md:w-[32rem] md:h-[600px] md:max-h-[calc(100vh-4rem)]",
            "lg:h-[650px] lg:max-h-[calc(100vh-5rem)]",
            "xl:h-[700px] xl:max-h-[calc(100vh-6rem)]",
          )}
          style={{ zIndex: Z_INDEX.chatWidget }}
          onWheel={handleWheel}
        >
          <div
            className={cn(
              "flex-shrink-0 flex items-center justify-between -border-b p-4",
            )}
          >
            <div className="flex items-center gap-2">
              {/* <h3 className="text-xs md:text-xs text-foreground">
                Other Dev AI
              </h3> */}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-transparent border-none hover:opacity-80 transition-all cursor-pointer p-0"
              aria-label="Close chat"
            >
              <ChevronDown className="h-5 w-5 text-primary" strokeWidth={2} />
            </button>
          </div>

          <div className="flex-1 flex relative">
              <LoomPageClient noNavigation={true} />
          </div>
        </Card>
      )}
    </>
  );
}
