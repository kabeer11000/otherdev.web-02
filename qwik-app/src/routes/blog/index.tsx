import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Navigation } from "~/components/navigation";
import { Footer } from "~/components/footer";
import { ChatWidget } from "~/components/chat-widget";

export default component$(() => {
  return (
    <main class="min-h-screen bg-white">
      <Navigation />

      {/* Header */}
      <section class="px-4 py-12 max-w-6xl mx-auto">
        <h1 class="font-[var(--queens-compressed)] text-5xl text-stone-900 mb-4">
          Blog
        </h1>
        <p class="font-[var(--twk-lausanne)] text-lg text-stone-500">
          Thoughts, insights, and updates from the Other Dev studio.
        </p>
      </section>

      {/* Content */}
      <section class="px-4 pb-12 max-w-6xl mx-auto">
        <div class="py-24 text-center">
          <p class="font-[var(--twk-lausanne)] text-stone-400">
            No blog posts found.
          </p>
        </div>
      </section>

      <Footer />
      <ChatWidget />
    </main>
  );
});

export const head: DocumentHead = {
  title: "Blog | otherdev | Digital Platforms for Pioneering Creatives",
  meta: [
    {
      name: "description",
      content:
        "Thoughts, insights, and updates from the Other Dev studio on web development, design, and technology.",
    },
  ],
};
