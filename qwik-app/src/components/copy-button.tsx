import { component$, useSignal, $ } from "@builder.io/qwik";
import { LuCopy, LuCheck } from "@qwikest/icons/lucide";
import { cn } from "~/lib/utils";
import { stripMarkdown } from "~/lib/utils";

interface CopyButtonProps {
  content: string;
  htmlContent?: string;
  class?: string;
}

export const CopyButton = component$<CopyButtonProps>((props) => {
  const copied = useSignal(false);

  const handleCopy = $(async () => {
    const plainText = stripMarkdown(props.content);

    try {
      if (props.htmlContent && navigator.clipboard.write) {
        try {
          const blob = new Blob([props.htmlContent], { type: "text/html" });
          const textBlob = new Blob([plainText], { type: "text/plain" });
          await navigator.clipboard.write([
            new ClipboardItem({ "text/html": blob, "text/plain": textBlob }),
          ]);
        } catch {
          await navigator.clipboard.writeText(plainText);
        }
      } else {
        await navigator.clipboard.writeText(plainText);
      }
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    } catch {
      // clipboard write failed silently
    }
  });

  return (
    <button
      type="button"
      onClick$={handleCopy}
      class={cn(
        "inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-stone-100 transition-colors cursor-pointer",
        props.class
      )}
      aria-label={copied.value ? "Copied" : "Copy to clipboard"}
    >
      {copied.value ? (
        <LuCheck width="14" height="14" class="text-green-600" />
      ) : (
        <LuCopy width="14" height="14" class="text-stone-500" />
      )}
    </button>
  );
});
