import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Navigation } from "~/components/navigation";
import { ChatWidget } from "~/components/chat-widget";

const suggestions = [
  {
    icon: "services",
    text: "What services does Other Dev offer?",
  },
  {
    icon: "story",
    text: "Who are the founders and what's the company story?",
  },
  {
    icon: "tech",
    text: "What technologies do you use?",
  },
  {
    icon: "news",
    text: "Get live AI news from the web",
  },
];

export default component$(() => {
  const message = useSignal("");
  const messages = useSignal<string[]>([]);

  return (
    <main class="min-h-screen bg-white">
      <Navigation />

      {/* Header */}
      <section class="px-4 py-12 max-w-2xl mx-auto text-center">
        <div class="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h1 class="font-[var(--queens-compressed)] text-3xl text-stone-900 mb-4">
          Loom
        </h1>
        <p class="font-[var(--twk-lausanne)] text-stone-500">
          Ask me anything about Other Dev
        </p>
      </section>

      {/* Chat Interface */}
      <section class="px-4 pb-32 max-w-2xl mx-auto">
        {/* Suggestions Grid */}
        {messages.value.length === 0 && (
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                class="p-4 bg-stone-100 hover:bg-stone-200 rounded-lg text-left transition-colors"
                onClick$={() => {
                  messages.value = [...messages.value, suggestion.text];
                }}
              >
                <span class="font-[var(--twk-lausanne)] text-sm text-stone-700">
                  {suggestion.text}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div class="space-y-4 mb-6">
          {messages.value.map((msg, i) => (
            <div key={i} class="flex gap-3">
              <div class="w-8 h-8 bg-stone-900 rounded-full flex-shrink-0" />
              <div class="bg-stone-100 rounded-2xl rounded-tl-none px-4 py-3 flex-1">
                <p class="font-[var(--twk-lausanne)] text-sm text-stone-700">
                  {msg}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div class="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent p-4">
          <div class="max-w-2xl mx-auto bg-white border border-stone-200 rounded-2xl p-3 shadow-lg">
            <div class="flex items-center gap-2">
              <button class="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-stone-400"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <button class="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-stone-400"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
              <input
                type="text"
                placeholder="Type your message..."
                class="flex-1 bg-transparent border-none outline-none font-[var(--twk-lausanne)] text-sm text-stone-900 placeholder:text-stone-400"
                value={message.value}
                onInput$={(e) => {
                  message.value = (e.target as HTMLInputElement).value;
                }}
              />
              <button
                class="p-2 bg-stone-900 hover:bg-stone-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!message.value.trim()}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <ChatWidget />
    </main>
  );
});

export const head: DocumentHead = {
  title: "Loom | otherdev | AI Assistant",
  meta: [
    {
      name: "description",
      content:
        "Chat with Other Dev's AI assistant. Ask anything about our services, technologies, and company.",
    },
  ],
};
