"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { ChatCore } from "@/components/chat-core";
import { cn } from "@/lib/utils";
import { Z_INDEX } from "@/lib/constants";

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
      {!isOpen ? (
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
      ) : null}

      {isOpen ? (
        <Card
          ref={cardRef}
          className={cn(
            "fixed flex flex-col",
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
              "flex-shrink-0 flex items-center justify-between border-b p-4",
            )}
          >
            <div className="flex items-center gap-2">
              <Image
                src="/otherdev-chat-logo.svg"
                alt="Other Dev AI"
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
              <h3 className="text-sm font-medium text-foreground">
                Other Dev AI
              </h3>
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

          <div className="flex-1 flex relative overflow-hidden">
            <ChatCore
              showGreeting={true}
              className="w-full"
            />
          </div>
        </Card>
      ) : null}
    </>
  );
}
