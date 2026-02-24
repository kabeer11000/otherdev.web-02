import Link from "next/link";
import { CanvasClient } from "@od-canvas/sdk";

// @ts-ignore
export async function generateMetadata({ params }) {
  const slug = (await params).slug as string;
  const canvas = new CanvasClient({
    baseUrl: process.env.CANVAS_API_URL,
    apiKey: process.env.CANVAS_API_KEY,
  });
  let post = null;
  try {
    post = await canvas.getPublicDocument(parseInt(slug));
  } catch (e) {}

  if (!post) {
    return {
      title: "Blog Post Not Found | OtherDev",
    };
  }

  return {
    title: `${post.title} | OtherDev Blog`,
    description: post.content.replace(/<[^>]*>/g, "").substring(0, 160),
  };
}

// @ts-ignore
export default async function BlogPostPage({ params }) {
  const slug = (await params).slug as string;
  const canvas = new CanvasClient({
    baseUrl: process.env.CANVAS_API_URL,
    apiKey: process.env.CANVAS_API_KEY,
  });
  let post = null;
  try {
    post = await canvas.getPublicDocument(parseInt(slug));
  } catch (e) {}
  console.log(post);

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold mb-2">
            Blog post not found
          </h2>
          <p className="text-red-600 mb-4">
            The blog post you are looking for does not exist or has been
            removed.
          </p>
          <Link href="/blog" className="text-blue-600 hover:underline">
            ← Back to blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-2xl mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">
          {post.title}
        </h1>
        <p className="text-sm text-neutral-600">
          {new Date(post.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      <div
        className="prose prose-lg w-full content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <footer className="mt-12 pt-8 border-t border-neutral-200">
        <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">
          ← Back to all posts
        </a>
      </footer>
    </article>
  );
}
