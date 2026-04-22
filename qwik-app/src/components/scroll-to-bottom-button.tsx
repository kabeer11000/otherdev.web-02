import { component$, type PropFunction } from "@builder.io/qwik";

interface ScrollToBottomButtonProps {
  visible: boolean;
  onScroll$: PropFunction<() => void>;
}

export const ScrollToBottomButton = component$<ScrollToBottomButtonProps>((props) => {
  if (!props.visible) return null;

  return (
    <button
      type="button"
      onClick$={props.onScroll$}
      class="absolute bottom-28 sm:bottom-32 right-4 sm:right-6 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
      aria-label="Scroll to bottom"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
});
