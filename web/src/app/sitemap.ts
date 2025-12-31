import type { MetadataRoute } from "next";
import { projects } from "@/lib/projects";
import { CanvasClient } from "@od-canvas/sdk";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: "https://otherdev.com",
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: "https://otherdev.com/about",
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: "https://otherdev.com/work",
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: "https://otherdev.com/blog",
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://otherdev.com/loom",
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `https://otherdev.com/work/${project.slug}`,
    lastModified: currentDate,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const canvas = new CanvasClient({
      baseUrl: process.env.CANVAS_API_URL,
      apiKey: process.env.CANVAS_API_KEY,
    });

    const posts =
      (await canvas.getPublicDocuments(
        parseInt(process.env.CANVAS_PROJECT_ID || "4"),
      )) ?? [];

    blogRoutes = posts.map((post) => ({
      url: `https://otherdev.com/blog/${post.id}`,
      lastModified: new Date(post.updated_at || post.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  } catch (error) {
    console.error("Failed to fetch blog posts for sitemap:", error);
  }

  return [...staticRoutes, ...projectRoutes, ...blogRoutes];
}
