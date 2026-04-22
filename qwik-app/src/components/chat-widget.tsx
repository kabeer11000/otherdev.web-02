import { component$, useSignal } from "@builder.io/qwik";

export const ChatWidget = component$(() => {
  const isOpen = useSignal(false);

  return (
    <div class="fixed bottom-6 right-6 z-50">
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
        class="w-12 h-12 bg-stone-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-stone-800 transition-colors"
        aria-label="Open chat"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  );
});
