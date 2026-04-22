import { component$ } from "@builder.io/qwik";
import { Collapsible } from "~/components/ui/collapsible/collapsible";

interface ReasoningCollapsibleProps {
  reasoning: string;
}

export const ReasoningCollapsible = component$<ReasoningCollapsibleProps>((props) => {
  return (
    <Collapsible.Root class="mt-2">
      <Collapsible.Trigger
        class="flex items-center gap-1 font-[var(--twk-lausanne)] text-xs text-muted-foreground transition-colors hover:text-foreground group cursor-pointer"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="transition-transform group-data-[state=open]:rotate-90"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span class="text-[10px] sm:text-xs">View thinking process</span>
      </Collapsible.Trigger>
      <Collapsible.Content class="mt-2">
        <div class="prose prose-sm max-w-none break-words rounded-xl border border-border bg-muted/50 p-3 font-[var(--twk-lausanne)] text-xs leading-relaxed text-muted-foreground sm:p-4 sm:text-sm">
          {props.reasoning}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
});
