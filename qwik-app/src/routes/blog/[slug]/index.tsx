import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import sanitizeHtml from "sanitize-html";
import { Navigation } from "~/components/navigation";
import { Footer } from "~/components/footer";
import { ChatWidget } from "~/components/chat-widget";

interface CanvasDocument {
  id: number;
  title: string;
  created_at: string;
  content: string;
}

export const useBlogPost = routeLoader$(async (requestEvent) => {
  const slug = requestEvent.params.slug;
  const postId = parseInt(slug, 10);

  if (isNaN(postId)) {
    return null;
  }

  // Check for required environment variables
  const CANVAS_API_URL = requestEvent.env.get("CANVAS_API_URL");
  const CANVAS_API_KEY = requestEvent.env.get("CANVAS_API_KEY");

  if (!CANVAS_API_URL || !CANVAS_API_KEY) {
    console.error("Missing Canvas API configuration");
    return null;
  }

  try {
    const { CanvasClient } = await import("@od-canvas/sdk");
    const canvas = new CanvasClient({
      baseUrl: CANVAS_API_URL,
      apiKey: CANVAS_API_KEY,
    });

    const post = await canvas.getPublicDocument(postId);
    return post as CanvasDocument | null;
  } catch {
    return null;
  }
});

export default component$(() => {
  const post = useBlogPost();

  if (!post.value) {
    return (
      <main class="min-h-screen bg-white">
        <Navigation />
        <section class="px-4 py-12 max-w-3xl mx-auto">
          <div class="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 class="text-red-800 font-semibold mb-2">Blog post not found</h2>
            <p class="text-red-600 mb-4">
              The blog post you are looking for does not exist or has been removed.
            </p>
            <Link href="/blog" class="text-blue-600 hover:underline">
              Back to blog
            </Link>
          </div>
        </section>
        <Footer />
        <ChatWidget />
      </main>
    );
  }

  const formattedDate = new Date(post.value.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main class="min-h-screen bg-white">
      <Navigation />

      <article class="max-w-2xl mx-auto px-4 py-12">
        <header class="mb-8">
          <h1 class="font-[var(--queens-compressed)] text-4xl text-stone-900 mb-4">
            {post.value.title}
          </h1>
          <p class="font-[var(--twk-lausanne)] text-sm text-stone-500">
            {formattedDate}
          </p>
        </header>

        <div
          class="prose prose-lg prose-stone max-w-none font-[var(--twk-lausanne)]"
          dangerouslySetInnerHTML={sanitizeHtml(post.value.content)}
        />

        <footer class="mt-12 pt-8 border-t border-stone-200">
          <Link href="/blog" class="text-blue-600 hover:text-blue-800 font-medium">
            Back to all posts
          </Link>
        </footer>
      </article>

      <Footer />
      <ChatWidget />
    </main>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const post = resolveValue(useBlogPost);

  if (!post) {
    return {
      title: "Blog Post Not Found | Other Dev",
    };
  }

  const desc = post.content.replace(/<[^>]*>/g, "").substring(0, 160);

  return {
    title: `${post.title} | Other Dev Blog`,
    meta: [
      {
        name: "description",
        content: desc,
      },
      {
        property: "og:title",
        content: `${post.title} | Other Dev Blog`,
      },
      {
        property: "og:description",
        content: desc,
      },
      {
        property: "og:type",
        content: "article",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  };
};