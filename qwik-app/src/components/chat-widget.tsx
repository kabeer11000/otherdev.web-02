import { component$, useSignal } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";

const otherDevAiIcon = "https://www.figma.com/api/mcp/asset/df9adcaa-09e9-4d0d-9430-32c01cbcd09a";

export const ChatWidget = component$(() => {
  const location = useLocation();
  const isOpen = useSignal(false);

  // Hide on /loom pages
  if (location.url.pathname.startsWith("/loom")) {
    return null;
  }

  return (
    <div class="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {isOpen.value && (
        <div class="absolute bottom-16 right-0 w-80 h-96 bg-white rounded-lg shadow-lg border border-stone-200 p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-[var(--twk-lausanne)] text-sm text-stone-900">
              Chat with Other Dev
            </h3>
            <button
              onClick$={() => (isOpen.value = false)}
              class="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer bg-transparent border-none"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
          <div class="h-full flex items-center justify-center text-stone-400 text-sm">
            Chat interface coming soon
          </div>
        </div>
      )}
      <button
        onClick$={() => (isOpen.value = !isOpen.value)}
        class="w-14 h-14 bg-white border border-stone-200 rounded-full shadow-md flex items-center justify-center hover:bg-stone-100 transition-colors cursor-pointer"
        aria-label="Open chat"
      >
        <img
          src={otherDevAiIcon}
          alt="Other Dev AI"
          class="w-8 h-8 object-contain"
          loading="eager"
        />
      </button>
    </div>
  );
});