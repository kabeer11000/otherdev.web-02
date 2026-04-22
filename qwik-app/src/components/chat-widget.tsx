import { component$, useSignal } from "@builder.io/qwik";

const otherDevAiIcon = "https://www.figma.com/api/mcp/asset/df9adcaa-09e9-4d0d-9430-32c01cbcd09a";

export const ChatWidget = component$(() => {
  const isOpen = useSignal(false);

  return (
    <div class="fixed bottom-[577px] right-[1331px] z-50">
      {isOpen.value && (
        <div class="absolute bottom-14 right-0 w-80 h-96 bg-white rounded-lg shadow-lg border border-stone-200 p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-[var(--twk-lausanne)] text-sm text-stone-900">
              Chat with Other Dev
            </h3>
            <button
              onClick$={() => (isOpen.value = false)}
              class="text-stone-400 hover:text-stone-600 transition-colors"
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
        class="w-[48px] h-[48px] bg-white border border-stone-200 rounded-full shadow-md flex items-center justify-center hover:bg-stone-100 transition-colors"
        aria-label="Open chat"
      >
        <img
          src={otherDevAiIcon}
          alt="Other Dev AI"
          class="w-4 h-4 object-contain"
        />
      </button>
    </div>
  );
});