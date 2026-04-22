import { component$, type PropFunction } from "@builder.io/qwik";
import { MarkdownRenderer } from "~/components/markdown-renderer";
import { CopyButton } from "~/components/copy-button";
import { ReasoningCollapsible } from "~/components/reasoning-collapsible";
import { cleanSuggestionMarkers } from "~/lib/utils";
import { cn } from "~/lib/utils";
import ImgOtherdevChatLogo32 from "~/media/otherdev-chat-logo-32.webp?jsx";

interface ArtifactToolCall {
  toolCallId: string;
  toolName: "createArtifact";
  state: "output-available";
  result: {
    title: string;
    code: string;
    description: string;
    success?: boolean;
  };
}

interface AssistantMessageProps {
  content: string;
  reasoning?: string;
  artifact?: ArtifactToolCall;
  setArtifact$?: PropFunction<(artifact: ArtifactToolCall | null) => void>;
}

export const AssistantMessage = component$<AssistantMessageProps>((props) => {
  const cleanedText = cleanSuggestionMarkers(props.content);
  const hasArtifact = Boolean(props.artifact);

  return (
    <div class="flex justify-start items-start gap-2 mt-12">
      <ImgOtherdevChatLogo32
        alt="OtherDev Loom"
        width={32}
        height={32}
        class="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8 object-contain"
      />
      <div class="w-full max-w-full gap-2 sm:gap-3 lg:max-w-5xl flex flex-col">
        <div class="flex-1 space-y-3 min-w-0">
          {props.reasoning && <ReasoningCollapsible reasoning={props.reasoning} />}
          {cleanedText && (
            <div>
              <div class="max-w-none rounded-lg bg-transparent p-0">
                <MarkdownRenderer content={cleanedText} />
              </div>
            </div>
          )}
          {hasArtifact && props.artifact && (
            <div
              class={cn(
                "w-full max-w-md cursor-pointer border border-border/60 bg-card/50 transition-all duration-200 hover:border-foreground/20 hover:bg-card/80 hover:shadow-sm active:scale-[0.99]"
              )}
              onClick$={() => {
                if (props.setArtifact$) {
                  props.setArtifact$(props.artifact ?? null);
                }
              }}
            >
              <div class="flex flex-row items-center justify-between gap-4 p-3.5">
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted/50">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="text-muted-foreground"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium leading-tight">
                      {props.artifact.result.title || "View Artifact"}
                    </p>
                    <p class="mt-1 text-xs text-muted-foreground">Artifact · HTML</p>
                  </div>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4 flex-shrink-0 text-muted-foreground/60"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          )}
          {cleanedText && !hasArtifact && (
            <CopyButton content={cleanedText} class="self-start" />
          )}
        </div>
      </div>
    </div>
  );
});
