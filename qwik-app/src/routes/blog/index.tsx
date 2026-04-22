import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import { Navigation } from "~/components/navigation";
import { Footer } from "~/components/footer";
import { ChatWidget } from "~/components/chat-widget";

interface CanvasDocument {
  id: number;
  title: string;
  created_at: string;
  content: string;
}

export const useBlogPosts = routeLoader$(async (requestEvent) => {
  const CANVAS_API_URL = requestEvent.env.get("CANVAS_API_URL");
  const CANVAS_API_KEY = requestEvent.env.get("CANVAS_API_KEY");
  const CANVAS_PROJECT_ID = requestEvent.env.get("CANVAS_PROJECT_ID") || "4";

  if (!CANVAS_API_URL || !CANVAS_API_KEY) {
    console.error("Missing Canvas API configuration");
    return [];
  }

  try {
    const { CanvasClient } = await import("@od-canvas/sdk");
    const canvas = new CanvasClient({
      baseUrl: CANVAS_API_URL,
      apiKey: CANVAS_API_KEY,
    });

    const documents = await canvas.getPublicDocuments(parseInt(CANVAS_PROJECT_ID, 10)) ?? [];
    return documents.sort(
      (a: CanvasDocument, b: CanvasDocument) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ) as CanvasDocument[];
  } catch {
    return [];
  }
});

export default component$(() => {
  const posts = useBlogPosts();

  if (!posts.value || posts.value.length === 0) {
    return (
      <main class="min-h-screen bg-white">
        <Navigation />

        <section class="px-4 py-12 max-w-6xl mx-auto">
          <h1 class="font-[var(--queens-compressed)] text-5xl text-stone-900 mb-4">
            Blog
          </h1>
          <p class="font-[var(--twk-lausanne)] text-lg text-stone-500">
            No blog posts found.
          </p>
        </section>

        <Footer />
        <ChatWidget />
      </main>
    );
  }

  return (
    <main class="min-h-screen bg-white">
      <Navigation />

      {/* Header */}
      <section class="px-4 py-12 max-w-6xl mx-auto">
        <div class="flex sticky top-0">
          <h1 class="text-sm mb-2 bg-stone-200 rounded-md p-2 cursor-pointer hover:bg-stone-300">
            <span class="font-bold">OD</span> / Blog
          </h1>
        </div>
        <p class="text-stone-500 text-xs mt-2 mb-8">
          {posts.value.length} {posts.value.length === 1 ? "post" : "posts"} - Powered by{" "}
          <a href="https://canvas.otherdev.com" class="text-blue-600 hover:underline">
            Canvas
          </a>
        </p>
      </section>

      {/* Posts Grid */}
      <section class="px-4 pb-12 max-w-6xl mx-auto">
        <div class="grid gap-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {posts.value.map((post) => {
            const postDescription = post.content.replace(/<[^>]*>/g, "").substring(0, 200);
            const formattedDate = new Date(post.created_at).toLocaleDateString();

            return (
              <article
                key={post.id}
                class="md:border duration-300 hover:bg-stone-200 rounded-md hover:rounded-xl md:p-4 hover:shadow-lg transition-shadow"
              >
                <h2 class="text-sm font-bold mb-2">
                  <Link
                    href={`/blog/${post.id}`}
                    class="text-stone-900 hover:text-blue-600"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p class="text-sm text-stone-600 mb-4">{formattedDate}</p>
                <p class="text-stone-700 line-clamp-2">{postDescription}...</p>
                <Link
                  href={`/blog/${post.id}`}
                  class="inline-block mt-4 text-stone-600 hover:text-stone-800 text-xs font-medium"
                >
                  Read More
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <Footer />
      <ChatWidget />
    </main>
  );
});

export const head: DocumentHead = {
  title: "Blog | Other Dev",
  meta: [
    {
      name: "description",
      content:
        "Thoughts, insights, and updates from the Other Dev studio on web development, design, and digital platforms.",
    },
    {
      property: "og:title",
      content: "Blog | Other Dev",
    },
    {
      property: "og:description",
      content:
        "Thoughts, insights, and updates from the Other Dev studio on web development, design, and digital platforms.",
    },
    {
      property: "og:type",
      content: "website",
    },
  ],
};